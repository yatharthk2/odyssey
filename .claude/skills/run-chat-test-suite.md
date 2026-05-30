---
name: run-chat-test-suite
description: Use when the user wants to test, verify, regression-check, or measure response quality of the Inpersona chat. Especially after changing the LLM provider, the system prompt, the chunking/retrieval settings, or the underlying RAG content. Runs the live chat through every (question × routing-mode) combination and adversarially judges each response for factual accuracy + HTML format compliance + relevance.
---

# Running the Inpersona chat test suite

A workflow at [`.claude/workflows/test-chat-modes.js`](../workflows/test-chat-modes.js) fires 4 representative questions through all 4 routing modes (plain vector, KG, HyDE+vector, KG+HyDE) — that's **16 live WebSocket queries** against `wss://api.yatharthk.com/chat` — and adversarially judges each response, then synthesizes a per-mode report.

## When to run it

- After changing `groq_model` / `openai_model` / `default_model_provider` in `backend/settings.py`
- After editing `backend/chat/prompt.py` (especially the structural rules)
- After updating documents in `backend/documents/` and reindexing
- After bumping any `llama-index-*` dep
- Before / after switching LLM providers (regression check)
- Periodically — to catch silent drift in response quality

## How to invoke

```
Workflow({ name: 'test-chat-modes' })
```

Or directly via the script path:
```
Workflow({ scriptPath: '/path/to/odyssey/.claude/workflows/test-chat-modes.js' })
```

Or, to iterate on the test scenarios, edit the QUESTIONS / MODES arrays in the script and re-run.

## What it produces

A structured report with:
- **`per_mode`** — for each of the 4 modes: success rate, mean factual accuracy / format compliance / relevance scores (1–5), mean TTFB and total latency, and a list of observed issues
- **`summary`** — 3–5 sentence overall assessment
- **`recommendations`** — concrete actions ranked by ROI

Plus the raw `judged` array if you want to drill into individual question/mode pairs.

## Pre-flight requirements

- The local laptop must have `backend/.venv/bin/python` available with `websockets` installed (it does — that's our standard smoke-test venv)
- `wss://api.yatharthk.com/chat` must be reachable (i.e. the Hetzner backend container is up)
- The backend should ideally be NOT rate-limited; if Groq is the active provider, expect HyDE / KG-HyDE rows to take longer due to multiple LLM calls per query

## Cost

~32 LLM calls total per run:
- 16 calls to the backend's configured LLM (gpt-4o-mini on OpenAI as of last config — under $0.01 total)
- 16 judge calls via Claude (Anthropic) for the adversarial reviewer subagents

Wall clock: ~2–4 min depending on concurrency cap (default cap is `min(16, cpu cores - 2)`).

## Customizing

Edit the script:
- **`QUESTIONS`** — add/remove test questions. Each gets `id` (slug) + `text` (the actual question). Pick questions that exercise different retrieval shapes (factual lookup, multi-fact synthesis, relational, format-sensitive).
- **`MODES`** — the 4 routing combinations. Keep them mapped to UI-toggle states unless you're testing a hidden path.
- **`GROUND_TRUTH`** — the resume facts the judge uses to detect hallucinations. Update this whenever `backend/documents/resume.txt` changes substantively.

## Reading the output

| Mode score | Interpretation |
|---|---|
| All 4 modes >= 4 average across all axes | Quality is solid; no regressions |
| One mode regresses on `format_compliance` | Likely a prompt issue or model swap — check the `observed_issues` list |
| `factual_accuracy` low across modes | RAG content gap or a hallucination-prone model — check `update-inpersona-kb` and consider model swap |
| `kg` / `kg-hyde` slow + `429` notes | Groq rate-limit on the multi-call paths; switch to OpenAI or paid Groq tier |
| All modes fail with transport errors | Backend down — see `diagnose-inpersona` skill |
