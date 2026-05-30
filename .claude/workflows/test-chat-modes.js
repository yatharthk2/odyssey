
export const meta = {
  name: 'test-chat-modes',
  description: 'End-to-end test suite for the Inpersona chat — runs every (question × routing-mode) pair against the production WebSocket, then adversarially judges each response for factual accuracy + HTML format compliance + relevance, then synthesizes a per-mode quality report.',
  phases: [
    { title: 'Test',   detail: '4 routing modes × 4 questions = 16 live WebSocket queries to wss://api.yatharthk.com/chat, fanned out in parallel' },
    { title: 'Judge',  detail: 'Adversarial LLM judge per response: factual accuracy + HTML compliance + relevance' },
    { title: 'Report', detail: 'Synthesize per-mode summary with averages, regressions, and recommendations' },
  ],
}

const BACKEND_URL = 'wss://api.yatharthk.com/chat'
const PYTHON = '/Users/yatharth/Desktop/code/odyssey/backend/.venv/bin/python'

// 4 questions chosen to exercise different retrieval shapes
const QUESTIONS = [
  { id: 'factual',   text: 'What is your current role?' },
  { id: 'multifact', text: 'What projects have you worked on?' },
  { id: 'relational', text: 'Who did you work with at Outspeed and what did you build there?' },
  { id: 'concise',   text: 'Give me a one-sentence bio.' },
]

// The 4 routing modes the chat exposes — same matrix as the KG/HyDE toggles in the UI
const MODES = [
  { id: 'plain',    label: 'plain vector',         vector_store: 'vector', query_transformation: null },
  { id: 'kg',       label: 'knowledge graph',      vector_store: 'KG',     query_transformation: null },
  { id: 'hyde',     label: 'HyDE + vector',        vector_store: 'vector', query_transformation: 'HyDE' },
  { id: 'kg-hyde',  label: 'KG + HyDE',            vector_store: 'KG',     query_transformation: 'HyDE' },
]

// Ground truth facts the responses should reflect (resume contents)
const GROUND_TRUTH = `
- Yatharth Kapadia, MS in Computer Science from Indiana University Bloomington, graduated May 2025, GPA 3.66/4.0
- Available for 2026 onboarding
- Current role: Founding Engineer (Core Team) at Moss, San Francisco, USA, October 2025 to present
  - Built hybrid search engine, BM25 keyword ranking fused with semantic retrieval via alpha blending
  - 4ms P99 latency, Rust-to-Python core, 300k+ SDK downloads
  - SIMD + Rayon parallelization in Rust core
  - moss-vitepress plugin, @moss-tools/md-indexer npm package
- Software Developer at Haldune, Chicago, USA, June 2025 to October 2025
  - ChromaDB retrieval + re-ranking on Kubernetes, sub-100ms
  - Multi-agent workflow on Azure AI Foundry with AutoGen
- Research Assistant at Kelley School of Business (DSAIL lab), Bloomington, USA, March 2024 to December 2024
  - LLM safety: Nvidia Garak, Microsoft Counterfit, Purple Llama
  - Nvidia NeMo guardrails, cut attack success rate 60%
- Software Engineer Intern at Outspeed, San Francisco, USA, June 2024 to August 2024
  - GPU speech-to-speech stack: Whisper -> Llama 3.1 -> Parler on AWS EKS, 50 connections/min
  - p95 800ms latency, vLLM + TensorRT, A10G GPUs, 30% cost cut
- Software Developer Intern at IDeaS, Pune, India, July 2022 to January 2023
  - Spark/Airflow ETL, Plotly/FastAPI, 5 hospitality clients, 15+ KPIs
- Software Engineer Intern at Quidich Innovation Labs, Mumbai, India, May 2022 to June 2022
  - YOLOv4 + ByteTrack player tracking, 70-100ms inference on AWS Lambda, 97% pose-estimation accuracy
- Software Developer Intern at Azodha, New York, USA, September 2021 to April 2022
  - BERT NLP for Ringisho app (phrase suggestion + profanity), 98% accuracy
- Project: INpersona LLM (this chatbot) — LLaMA 3.2 11B + LlamaIndex + LangChain + ChromaDB + Next.js, Redis cache cut latency 2000ms -> 50ms
- Honors: co-led + judged two 200-person hackathons at Y Combinator HQ (2025, 2026); SIH 2022 Grand Finale winner (Dell); 87/3300 in Amazon ML Challenge; Graduate TA at IU (Aug 2024)
`.trim()

const TEST_RESULT_SCHEMA = {
  type: 'object',
  required: ['ok', 'response', 'chunks', 'first_chunk_s', 'total_s'],
  properties: {
    ok:            { type: 'boolean', description: 'true if the chat returned a complete response, false on error or timeout' },
    response:      { type: 'string',  description: 'the full HTML response body, or the error message if ok=false' },
    chunks:        { type: 'integer', description: 'number of streaming chunks received' },
    first_chunk_s: { type: 'number',  description: 'seconds from request send to first chunk arrival (TTFB)' },
    total_s:       { type: 'number',  description: 'seconds from request send to complete' },
  },
  additionalProperties: false,
}

const JUDGE_SCHEMA = {
  type: 'object',
  required: ['factual_accuracy', 'format_compliance', 'relevance', 'notes'],
  properties: {
    factual_accuracy: {
      type: 'integer', minimum: 1, maximum: 5,
      description: '5 = every claim in the response is verifiable in the ground truth; 3 = mostly correct with one minor drift; 1 = significant hallucinations or wrong facts',
    },
    format_compliance: {
      type: 'integer', minimum: 1, maximum: 5,
      description: '5 = pure HTML (proper <p>/<h3>/<ul>/<li>/<strong> tags), no markdown bleed, no "TL;DR:"/"Summary:"/"In short:" prefix; 1 = markdown leakage, prefixed with TL;DR-style label, or broken tags',
    },
    relevance: {
      type: 'integer', minimum: 1, maximum: 5,
      description: '5 = directly answers the asked question; 3 = answers but with tangential content; 1 = off-topic or refuses to answer',
    },
    notes: {
      type: 'string',
      description: 'Free-form: cite SPECIFIC issues found. E.g. "opens with TL;DR:", "claims worked at Google (not in KB)", "uses **markdown** instead of <strong>", "empty response", etc. If clean, say "clean".',
    },
  },
  additionalProperties: false,
}

const REPORT_SCHEMA = {
  type: 'object',
  required: ['per_mode', 'summary', 'recommendations'],
  properties: {
    per_mode: {
      type: 'array',
      items: {
        type: 'object',
        required: ['mode', 'success_rate', 'avg_factual', 'avg_format', 'avg_relevance', 'avg_first_chunk_s', 'avg_total_s', 'observed_issues'],
        properties: {
          mode:               { type: 'string', description: 'plain | kg | hyde | kg-hyde' },
          success_rate:       { type: 'string', description: 'e.g. "4/4" — how many of the 4 questions returned a complete non-error response' },
          avg_factual:        { type: 'number', description: 'mean factual_accuracy across the 4 questions (1-5 scale)' },
          avg_format:         { type: 'number', description: 'mean format_compliance (1-5 scale)' },
          avg_relevance:      { type: 'number', description: 'mean relevance (1-5 scale)' },
          avg_first_chunk_s:  { type: 'number', description: 'mean TTFB across successful responses' },
          avg_total_s:        { type: 'number', description: 'mean total response time across successful responses' },
          observed_issues:    { type: 'array', items: { type: 'string' }, description: 'distinct issues seen across this mode (e.g. "TL;DR prefix on 2/4", "429 rate limit on relational query")' },
        },
        additionalProperties: false,
      },
    },
    summary: { type: 'string', description: '3-5 sentence overall assessment' },
    recommendations: { type: 'array', items: { type: 'string' }, description: 'Concrete actions, ordered by ROI' },
  },
  additionalProperties: false,
}

// ------------------------------- run --------------------------------

const combos = QUESTIONS.flatMap(q => MODES.map(m => ({ question: q, mode: m })))
log(`Running ${combos.length} (question × mode) combinations against ${BACKEND_URL}`)

const judged = await pipeline(
  combos,

  // ---- Stage 1: fire the WebSocket query against production -------------
  (combo) => agent(
    `Run the following bash command exactly as written. It returns a single line of JSON to stdout. Parse that JSON and return it via the StructuredOutput tool. Do not modify the command, do not add commentary.

\`\`\`bash
${PYTHON} - <<'PY'
import asyncio, json, time, websockets

async def main():
    try:
        async with websockets.connect("${BACKEND_URL}") as ws:
            t0 = time.time()
            await ws.send(json.dumps({
                "question": ${JSON.stringify(combo.question.text)},
                "vector_store": ${JSON.stringify(combo.mode.vector_store)},
                "query_transformation": ${combo.mode.query_transformation === null ? 'None' : JSON.stringify(combo.mode.query_transformation)}
            }))
            out, first = [], None
            while True:
                m = json.loads(await asyncio.wait_for(ws.recv(), timeout=90))
                if "error" in m:
                    print(json.dumps({"ok": False, "response": m["error"], "chunks": 0, "first_chunk_s": 0, "total_s": time.time()-t0}))
                    return
                if m["type"] == "chunk":
                    if first is None: first = time.time()-t0
                    out.append(m["content"])
                elif m["type"] == "complete":
                    print(json.dumps({
                        "ok": True,
                        "response": "".join(out),
                        "chunks": len(out),
                        "first_chunk_s": round(first or 0, 3),
                        "total_s": round(time.time()-t0, 3),
                    }))
                    return
    except Exception as e:
        print(json.dumps({"ok": False, "response": f"{type(e).__name__}: {e}", "chunks": 0, "first_chunk_s": 0, "total_s": 0}))

asyncio.run(main())
PY
\`\`\``,
    {
      label: `test ${combo.mode.id}: ${combo.question.id}`,
      phase: 'Test',
      schema: TEST_RESULT_SCHEMA,
    }
  ).then(result => ({ ...combo, result })),

  // ---- Stage 2: adversarial judge on each response ----------------------
  (withResult, combo) => {
    if (!withResult.result?.ok) {
      // Don't waste a judge call on errors; record as zeros
      return { ...withResult, judgment: { factual_accuracy: 1, format_compliance: 1, relevance: 1, notes: `transport error: ${withResult.result?.response ?? 'unknown'}` } }
    }
    return agent(
      `You are an adversarial QA reviewer for a portfolio chatbot called Inpersona. Your job is to be skeptical and surface real problems — do not give benefit of the doubt.

QUESTION the user asked:
${combo.question.text}

ROUTING MODE used: ${combo.mode.label} (vector_store=${combo.mode.vector_store}, query_transformation=${combo.mode.query_transformation ?? 'null'})

CHATBOT RESPONSE (raw HTML):
${withResult.result.response}

GROUND TRUTH from the resume (anything not here is potential hallucination):
${GROUND_TRUTH}

Score on three dimensions (integers 1-5 — be strict, default to lower if uncertain):

1. factual_accuracy — every concrete claim should be in or trivially derivable from the ground truth. Penalize wrong dates, wrong company names, wrong technologies, made-up metrics.

2. format_compliance — the chatbot's prompt requires pure HTML with <p>, <h3>, <ul>, <li>, <strong>. SPECIFIC FAILURES to penalize hard:
   - Opens with "TL;DR:", "Summary:", "In short:", "TLDR:", "tl;dr:" or similar label → format_compliance ≤ 2
   - Uses markdown like **bold** or - bullets instead of <strong>/<li>
   - Wraps response in \`\`\`html code fences
   - Broken or unclosed tags

3. relevance — does it actually answer the asked question? Off-topic or topic-filter refusals score low. Partial answers score 3. Direct answers score 5.

In "notes", cite SPECIFIC text snippets when you penalize. If everything checks out, write "clean".`,
      {
        label: `judge ${combo.mode.id}: ${combo.question.id}`,
        phase: 'Judge',
        schema: JUDGE_SCHEMA,
      }
    ).then(judgment => ({ ...withResult, judgment }))
  }
)

// ---- Phase 3: synthesize the report -----------------------------------
phase('Report')
log(`All ${judged.length} combinations judged. Synthesizing per-mode report...`)

const report = await agent(
  `You are summarizing a test run of an Inpersona chatbot. There were 4 questions tested against 4 routing modes (16 total responses). Group the results by mode and produce a structured report.

RAW RESULTS (JSON):
${JSON.stringify(judged.filter(Boolean).map(j => ({
  question: j.question.id,
  mode: j.mode.id,
  ok: j.result?.ok,
  ttfb_s: j.result?.first_chunk_s,
  total_s: j.result?.total_s,
  chunks: j.result?.chunks,
  judgment: j.judgment,
  // first 160 chars of response for context
  response_preview: (j.result?.response ?? '').slice(0, 160),
})), null, 2)}

For each of the 4 modes (plain, kg, hyde, kg-hyde):
- success_rate as "X/4"
- avg_factual / avg_format / avg_relevance — mean of the 4 judgments
- avg_first_chunk_s / avg_total_s — mean across SUCCESSFUL (ok=true) responses only; if all errored, return 0
- observed_issues — distinct issues across the 4 responses in that mode (e.g. "opens with TL;DR: on 2/4", "rate-limit 429 on 1/4")

Then write a 3-5 sentence overall summary covering which mode performed best and where the biggest gaps are.

Then list concrete recommendations ordered by ROI — what should the maintainer fix first?`,
  { schema: REPORT_SCHEMA }
)

return { judged, report }
