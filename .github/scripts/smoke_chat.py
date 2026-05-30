"""Graded smoke test for the live Inpersona chat at wss://api.yatharthk.com/chat.

Fires a fixed bank of probes, each with an expectation describing what a good
response should and should not contain. Scores the run as `passed/total`.
Exits 1 if the score falls below SCORE_THRESHOLD or any probe transport-fails,
so CI turns red on real regressions without flaking on a single off answer.

Design goals (in priority order):
  1. Catch the specific historical regressions we've already shipped fixes for
     (literal "TL;DR:" prefix, "AI/ML Specialist" overriding the Moss role,
     topic-filter false-positives on coworker questions, markdown bleed).
  2. Exercise all four routing modes (vector|KG x plain|HyDE).
  3. Be readable in GHA logs - every failure prints the mode, question, and
     the rule it broke.
  4. Stay dependency-light: only `websockets` (already in CI's pip install).
"""

from __future__ import annotations

import asyncio
import json
import re
import sys
import time
from typing import Callable, Optional

import websockets

# ----------------------------- config ---------------------------------------

WS_URL = "wss://api.yatharthk.com/chat"
PER_REQUEST_TIMEOUT_S = 90.0
SCORE_THRESHOLD = 0.85  # CI fails if (passed / total) < 0.85

# Bad opener patterns - the system prompt explicitly forbids labels like
# "TL;DR:" / "Summary:" before the first sentence. If we see one, formatting
# has regressed past the prompt's case rules.
BAD_OPENER_PATTERNS = (
    re.compile(r"^\s*<p>\s*TL\s*[:;]?\s*DR", re.IGNORECASE),
    re.compile(r"^\s*<p>\s*Summary\s*:", re.IGNORECASE),
    re.compile(r"^\s*<p>\s*In\s+short", re.IGNORECASE),
    re.compile(r"^\s*<p>\s*In\s+summary", re.IGNORECASE),
)

# Substring that means the topic-filter refusal fired. Legitimate for case-C
# (off-topic) questions only - surfacing it on professional questions is a
# regression of the case A/B/C distinction we wired into the prompt.
TOPIC_REFUSAL_FRAGMENT = "I'm focused on discussing my professional background"

# Markdown bleed - the prompt mandates pure HTML; these patterns signal the
# model fell back to markdown formatting.
MARKDOWN_BLEED_PATTERNS = (
    re.compile(r"\*\*[A-Za-z]"),         # **bold** markdown (we want <strong>)
    re.compile(r"^\s*[-*]\s+\w", re.M),  # - or * bullets at line start (we want <li>)
    re.compile(r"```"),                  # markdown code fences anywhere
)


# ----------------------------- probe shapes ---------------------------------


class Probe:
    """A single (mode x question) probe with what the response should contain."""

    def __init__(
        self,
        *,
        mode_label: str,
        vector_store: str,
        query_transformation: Optional[str],
        question: str,
        must_contain: tuple[str, ...] = (),
        must_not_contain: tuple[str, ...] = (),
        custom_check: Optional[Callable[[str], Optional[str]]] = None,
    ):
        self.mode_label = mode_label
        self.vector_store = vector_store
        self.query_transformation = query_transformation
        self.question = question
        self.must_contain = must_contain
        self.must_not_contain = must_not_contain
        self.custom_check = custom_check
        # Filled in after probing:
        self.ok = False
        self.response = ""
        self.ttfb_s: Optional[float] = None
        self.total_s: Optional[float] = None
        self.failures: list[str] = []
        self.transport_error: Optional[str] = None

    def grade(self) -> bool:
        """Apply rules to self.response. Populates self.failures. Returns passed."""
        if not self.ok:
            self.failures.append("transport error: " + str(self.transport_error))
            return False

        # Universal format checks
        if not self.response.lstrip().startswith("<p>"):
            self.failures.append("response does not open with a <p> tag")

        for pat in BAD_OPENER_PATTERNS:
            if pat.search(self.response[:120]):
                self.failures.append("bad opener pattern matched: " + repr(pat.pattern))
                break

        for pat in MARKDOWN_BLEED_PATTERNS:
            if pat.search(self.response):
                self.failures.append("markdown bleed: " + repr(pat.pattern))
                break

        # Per-probe expectations
        for needle in self.must_contain:
            if needle.lower() not in self.response.lower():
                self.failures.append("missing expected substring " + repr(needle))

        for forbidden in self.must_not_contain:
            if forbidden.lower() in self.response.lower():
                self.failures.append("contains forbidden substring " + repr(forbidden))

        if self.custom_check is not None:
            problem = self.custom_check(self.response)
            if problem is not None:
                self.failures.append(problem)

        return not self.failures


# ----------------------------- probe bank -----------------------------------

# 4 routing modes rotated across 5 question categories = 20 probes.
# Each mode is exercised on every category, so a single broken mode (e.g.
# KG retrieval down) surfaces as a row of failures.

CATEGORIES = [
    # 1. Current role - catches the "AI/ML Specialist" / persona-leak regression.
    {
        "question": "What is your current role?",
        "must_contain": ("moss",),
        "must_not_contain": ("ai/ml specialist", "the candidate"),
    },
    # 2. Availability - catches stale dates / hardcoded years.
    {
        "question": "When are you available to start?",
        "must_contain": ("2026",),
        "must_not_contain": (),
    },
    # 3. Education - catches GPA / school regressions.
    {
        "question": "Where did you do your MS, and what's your GPA?",
        "must_contain": ("indiana",),
        "must_not_contain": ("the candidate",),
    },
    # 4. Topic-filter case-B - coworker question with no name data in KB.
    # Must NOT trigger the off-topic refusal; should give partial answer.
    {
        "question": "Who did you work with at Outspeed and what did you build there?",
        "must_contain": ("outspeed",),
        "must_not_contain": (TOPIC_REFUSAL_FRAGMENT,),
    },
    # 5. Multifact synthesis - should mention more than one company.
    {
        "question": "Tell me about your professional experience.",
        "must_contain": ("moss",),
        "must_not_contain": (),
        "custom_check": lambda r: (
            "only mentions one company"
            if sum(
                c in r.lower() for c in ("moss", "outspeed", "haldune", "ideas", "azodha", "quidich")
            )
            < 2
            else None
        ),
    },
]

MODES = [
    {"label": "vector+plain", "vector_store": "vector", "query_transformation": None},
    {"label": "vector+HyDE",  "vector_store": "vector", "query_transformation": "HyDE"},
    {"label": "KG+plain",     "vector_store": "KG",     "query_transformation": None},
    {"label": "KG+HyDE",      "vector_store": "KG",     "query_transformation": "HyDE"},
]

PROBES: list[Probe] = []
for mode in MODES:
    for cat in CATEGORIES:
        PROBES.append(
            Probe(
                mode_label=mode["label"],
                vector_store=mode["vector_store"],
                query_transformation=mode["query_transformation"],
                question=cat["question"],
                must_contain=cat.get("must_contain", ()),
                must_not_contain=cat.get("must_not_contain", ()),
                custom_check=cat.get("custom_check"),
            )
        )


# ----------------------------- WebSocket fire -------------------------------


async def fire(probe: Probe) -> None:
    t0 = time.time()
    try:
        async with websockets.connect(WS_URL) as ws:
            await ws.send(
                json.dumps(
                    {
                        "question": probe.question,
                        "vector_store": probe.vector_store,
                        "query_transformation": probe.query_transformation,
                    }
                )
            )
            chunks: list[str] = []
            while True:
                msg = json.loads(await asyncio.wait_for(ws.recv(), timeout=PER_REQUEST_TIMEOUT_S))
                if "error" in msg:
                    probe.transport_error = msg["error"]
                    return
                if msg["type"] == "chunk":
                    if probe.ttfb_s is None:
                        probe.ttfb_s = time.time() - t0
                    chunks.append(msg["content"])
                elif msg["type"] == "complete":
                    probe.total_s = time.time() - t0
                    probe.response = "".join(chunks)
                    probe.ok = True
                    return
    except Exception as e:
        probe.transport_error = type(e).__name__ + ": " + str(e)


async def fire_all(probes: list[Probe]) -> None:
    # Fire 4 at a time to be polite to the backend (matches the 4 routing modes).
    sem = asyncio.Semaphore(4)

    async def bounded(p: Probe) -> None:
        async with sem:
            await fire(p)

    await asyncio.gather(*(bounded(p) for p in probes))


# ----------------------------- reporting ------------------------------------


def truncate(s: str, n: int) -> str:
    s = s.replace("\n", " ").strip()
    return s if len(s) <= n else s[: n - 1] + "..."


def print_table(probes: list[Probe]) -> None:
    print()
    print("=" * 110)
    print("SMOKE TEST DETAIL")
    print("=" * 110)
    header = "{:<14} {:<60} {:<6} {:<8} {:<8}".format(
        "mode", "question", "pass", "ttfb_s", "total_s"
    )
    print(header)
    print("-" * 110)
    for p in probes:
        row = "{:<14} {:<60} {:<6} {:<8} {:<8}".format(
            p.mode_label,
            truncate(p.question, 58),
            "yes" if not p.failures else "NO",
            "{:.2f}".format(p.ttfb_s) if p.ttfb_s is not None else "-",
            "{:.2f}".format(p.total_s) if p.total_s is not None else "-",
        )
        print(row)
        for f in p.failures:
            print("    ! " + f)
    print("=" * 110)


def main() -> int:
    print("Smoke test against " + WS_URL)
    print("Probes: " + str(len(PROBES)) + " (" + str(len(MODES)) + " modes x "
          + str(len(CATEGORIES)) + " categories)")
    print("Pass threshold: " + "{:.0%}".format(SCORE_THRESHOLD))
    print()
    t0 = time.time()
    asyncio.run(fire_all(PROBES))

    for p in PROBES:
        p.grade()

    print_table(PROBES)

    total = len(PROBES)
    passed = sum(1 for p in PROBES if not p.failures)
    score = passed / total if total else 0.0
    elapsed = time.time() - t0

    print()
    print(
        "Result: " + str(passed) + "/" + str(total) + " passed ("
        + "{:.1%}".format(score) + ")  in " + "{:.1f}".format(elapsed) + "s"
    )

    if any(p.transport_error for p in PROBES):
        print("\nTransport errors (auto-fail):")
        for p in PROBES:
            if p.transport_error:
                print("  [" + p.mode_label + "] " + repr(p.question) + ": " + p.transport_error)
        return 1

    if score < SCORE_THRESHOLD:
        print(
            "\nFAIL: score " + "{:.1%}".format(score)
            + " is below threshold " + "{:.0%}".format(SCORE_THRESHOLD)
            + ". Inspect failure rows above; this is likely a real regression."
        )
        return 1

    print("\nOK: smoke passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
