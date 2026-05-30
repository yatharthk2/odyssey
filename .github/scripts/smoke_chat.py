"""Live WebSocket smoke test for wss://api.yatharthk.com/chat.

Designed to be readable in GHA logs: every failure prints the routing mode,
the question, and the offending substring of the response. Exits 1 on any
failure so the workflow turns red.

Kept deliberately portable: no f-strings with backslash escapes, no third
party deps beyond `websockets`.
"""

from __future__ import annotations

import asyncio
import json
import sys
import time
from typing import List, Optional, Tuple

import websockets

WS_URL = "wss://api.yatharthk.com/chat"
PER_REQUEST_TIMEOUT_S = 90.0

# The 4 routing modes the frontend can request. Each maps to a distinct code
# path inside QueryEngine.process_query, so we exercise all of them.
ROUTING_MODES = [
    {"vector_store": "vector", "query_transformation": None},
    {"vector_store": "vector", "query_transformation": "HyDE"},
    {"vector_store": "KG",     "query_transformation": None},
    {"vector_store": "KG",     "query_transformation": "HyDE"},
]

# Bad opener patterns. The system prompt explicitly forbids these; if we see
# one, the model has regressed past the prompt's formatting rules.
BAD_OPENERS = ("TL;DR", "Summary:", "In short", "In summary")

# Probe questions that catch specific historical regressions.
ROLE_QUESTION = "What is your current role?"
OUTSPEED_QUESTION = "Who did you work with at Outspeed?"
GENERIC_QUESTION = "Tell me about your background."

# Substring that means the topic filter fired -- legitimate for off-topic
# questions, but a regression when asked about coworkers at a past employer.
TOPIC_REFUSAL_FRAGMENT = "I'm focused on discussing my professional background"


class Result:
    """One probe result, used for the summary table and assertions."""

    def __init__(self, mode_label, question):
        self.mode_label = mode_label
        self.question = question
        self.ok = False
        self.ttfb_s = None        # type: Optional[float]
        self.total_s = None       # type: Optional[float]
        self.response = ""
        self.error = None         # type: Optional[str]

    def summary_row(self):
        ttfb = "-" if self.ttfb_s is None else ("%.2f" % self.ttfb_s)
        total = "-" if self.total_s is None else ("%.2f" % self.total_s)
        return (self.mode_label, self.question[:40], str(self.ok), ttfb, total)


async def ask(mode, question):
    """Send one question, stream the response, return a Result.

    Wire format mirrors frontend/pages/components/InpersonaChat.tsx:
        request:  {"question", "vector_store", "query_transformation", "model_provider"}
        response: repeated {"type":"chunk","content":...} then {"type":"complete"}
                  or {"error":...}
    """
    mode_label = mode["vector_store"] + "+" + (mode["query_transformation"] or "plain")
    result = Result(mode_label, question)

    payload = {
        "question": question,
        "vector_store": mode["vector_store"],
        "query_transformation": mode["query_transformation"],
        "model_provider": "openai",
    }

    started = time.monotonic()
    try:
        async with websockets.connect(WS_URL, open_timeout=15, close_timeout=5) as ws:
            await ws.send(json.dumps(payload))
            chunks = []  # type: List[str]
            first_chunk_at = None  # type: Optional[float]

            while True:
                raw = await asyncio.wait_for(ws.recv(), timeout=PER_REQUEST_TIMEOUT_S)
                try:
                    msg = json.loads(raw)
                except json.JSONDecodeError:
                    result.error = "non-JSON frame: " + repr(raw[:120])
                    return result

                if "error" in msg:
                    result.error = "server error frame: " + str(msg.get("error"))
                    return result

                msg_type = msg.get("type")
                if msg_type == "chunk":
                    if first_chunk_at is None:
                        first_chunk_at = time.monotonic()
                    chunks.append(msg.get("content", ""))
                elif msg_type == "complete":
                    break
                else:
                    # Forward-compatible: unknown frame types are ignored, not
                    # treated as errors.
                    continue

            now = time.monotonic()
            result.response = "".join(chunks)
            result.ttfb_s = (first_chunk_at - started) if first_chunk_at else None
            result.total_s = now - started
            result.ok = bool(result.response.strip())
            if not result.ok:
                result.error = "empty response body"
            return result

    except asyncio.TimeoutError:
        result.error = "timeout after " + str(PER_REQUEST_TIMEOUT_S) + "s"
        return result
    except Exception as exc:  # noqa: BLE001 -- we want everything surfaced
        result.error = type(exc).__name__ + ": " + str(exc)
        return result


def check(condition, message, failures):
    """Append a readable failure message if condition is falsy."""
    if not condition:
        failures.append(message)


def assert_format(result, failures):
    """Format-level invariants that should hold for EVERY successful response."""
    if not result.ok:
        failures.append(
            "[" + result.mode_label + "] transport failed: " + str(result.error)
        )
        return

    body = result.response.lstrip()

    check(
        body.startswith("<p>"),
        "[" + result.mode_label + "] response does not open with <p>; got first 80 chars: "
            + repr(body[:80]),
        failures,
    )

    for bad in BAD_OPENERS:
        check(
            not body.startswith(bad),
            "[" + result.mode_label + "] response opens with banned phrase '" + bad
                + "'; got: " + repr(body[:120]),
            failures,
        )
        # Also catch the case where the model wraps the banned opener in a <p>.
        check(
            "<p>" + bad not in body[:200],
            "[" + result.mode_label + "] response opens with '<p>" + bad
                + "' inside the first paragraph",
            failures,
        )

    check(
        "```html" not in result.response and "```" not in result.response[:20],
        "[" + result.mode_label + "] response wrapped in code fences",
        failures,
    )


async def main():
    failures = []  # type: List[str]
    results = []   # type: List[Result]

    # --- 1) all 4 routing modes must return ok=True on a generic prompt -----
    for mode in ROUTING_MODES:
        r = await ask(mode, GENERIC_QUESTION)
        results.append(r)
        assert_format(r, failures)

    # --- 2) role-question regression: response must mention Moss ------------
    role_mode = {"vector_store": "vector", "query_transformation": None}
    role_result = await ask(role_mode, ROLE_QUESTION)
    results.append(role_result)
    assert_format(role_result, failures)
    if role_result.ok:
        check(
            "Moss" in role_result.response,
            "[role-question] response does not mention 'Moss' -- AI/ML Specialist"
                + " regression resurfaced. Body: " + repr(role_result.response[:240]),
            failures,
        )

    # --- 3) topic-filter false-positive regression --------------------------
    outspeed_mode = {"vector_store": "vector", "query_transformation": None}
    outspeed_result = await ask(outspeed_mode, OUTSPEED_QUESTION)
    results.append(outspeed_result)
    assert_format(outspeed_result, failures)
    if outspeed_result.ok:
        check(
            TOPIC_REFUSAL_FRAGMENT not in outspeed_result.response,
            "[outspeed-question] topic filter fired on a legitimate work-history"
                + " question. Body: " + repr(outspeed_result.response[:240]),
            failures,
        )

    # --- summary table ------------------------------------------------------
    print("")
    print("=" * 92)
    print("SMOKE TEST SUMMARY")
    print("=" * 92)
    header = ("mode", "question", "ok", "ttfb_s", "total_s")
    fmt = "{:<16}  {:<42}  {:<6}  {:>7}  {:>7}"
    print(fmt.format(*header))
    print("-" * 92)
    for r in results:
        print(fmt.format(*r.summary_row()))
        if r.error:
            print("    error: " + str(r.error))
    print("=" * 92)

    if failures:
        print("")
        print("FAILURES (" + str(len(failures)) + "):")
        for i, msg in enumerate(failures, 1):
            print("  " + str(i) + ". " + msg)
        return 1

    print("")
    print("OK: all " + str(len(results)) + " probes passed")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
