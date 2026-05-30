# Odyssey

<p align="center">
  <a href="https://www.yatharthk.com">
    <img src="ivg/inpersona_img.png" alt="Inpersona AI banner" width="1080">
  </a>
</p>

Odyssey is the source for **[yatharthk.com](https://www.yatharthk.com)** — Yatharth Kapadia's personal site — plus **Inpersona AI**, an in-browser chat agent that answers questions about Yatharth in first person, grounded in a private RAG index over his resume, projects, and notes. The repo is a two-package monorepo: a Next.js frontend on Vercel and a FastAPI + LlamaIndex backend on a Hetzner box, talking to each other over a single WebSocket.

## Live

| Surface | URL | Hosted on |
| --- | --- | --- |
| Portfolio | https://www.yatharthk.com | Vercel |
| Inpersona chat backend | wss://api.yatharthk.com/chat | Hetzner CX23 (Docker) |

## Architecture

```
                    ┌─────────────────────────────┐
   Browser ───────▶ │  Next.js (Vercel)           │
                    │  yatharthk.com              │
                    └──────────────┬──────────────┘
                                   │  WSS  /chat
                                   ▼
                    ┌─────────────────────────────┐
                    │  Caddy (TLS, :443)          │
                    │  api.yatharthk.com          │
                    └──────────────┬──────────────┘
                                   │  ws://backend:8000
                                   ▼
                    ┌─────────────────────────────┐      ┌──────────────┐
                    │  FastAPI + LlamaIndex       │ ───▶ │  Redis       │
                    │  (Groq | Gemini | OpenAI)   │      │  (cache)     │
                    │  ChromaDB on disk           │      └──────────────┘
                    └─────────────────────────────┘
                                   │
                                   ▼
                         ./documents/*.pdf
                         ./storage/, ./chroma_db/
```

Per-query path: WebSocket frame → `ChatManager` → `{KG | vector} × {plain | HyDE}` query engine → streamed LlamaIndex response → JSON-per-frame chunks back to the browser, which renders the HTML the prompt instructs the model to emit.

## Repo layout

```
odyssey/
├── frontend/            Next.js 16, Pages Router, React 19, Tailwind
├── backend/             FastAPI + LlamaIndex + ChromaDB, managed by uv
├── deploy/              docker-compose.yml, Caddyfile, Hetzner runbook
├── .claude/             Skills (playbooks) + workflows (chat test suite)
├── .github/workflows/   CI: frontend build, backend import, daily smoke test
├── CLAUDE.md            Guide for future Claude Code sessions in this repo
├── CHANGELOG.md         Release-by-release walkthrough
└── readme.md            You are here
```

## Quick start

### Frontend

```bash
npm --prefix frontend install --legacy-peer-deps
npm --prefix frontend run dev
# → http://localhost:3000
```

`legacy-peer-deps=true` is pinned in `frontend/.npmrc` — React 19 ships ahead of some peer ranges (`react-markdown`, `@formspree/react`). Don't remove it.

By default the chat client connects to `wss://api.yatharthk.com/chat`. To point it at a local backend, set `NEXT_PUBLIC_INPERSONA_WS_URL=ws://localhost:8000/chat` in `frontend/.env.local`.

### Backend

```bash
cd backend
uv sync
cp .env.example .env       # paste GROQ_API_KEY + Google_Gemini_API_KEY (and OPENAI_API_KEY if using gpt-4o-mini)
.venv/bin/python -m uvicorn server:app --port 8000
```

First boot builds the knowledge graph and vector index from `./documents/*.pdf` into `./storage/` and `./chroma_db/`. Subsequent boots reuse the cached indices.

End-to-end: with both servers running, open http://localhost:3000/inpersona.

For a single command that starts both, see [`.claude/skills/start-local-stack.md`](.claude/skills/start-local-stack.md).

## Production

- **Frontend** auto-deploys to Vercel on every push to `main`. The only required project env var is `NEXT_PUBLIC_INPERSONA_WS_URL=wss://api.yatharthk.com/chat`.
- **Backend** is manual: SSH into the Hetzner box, `git pull`, `docker compose up -d --build backend`. The full provisioning runbook (DNS, TLS, firewall, swap, log rotation) lives in [`deploy/README.md`](deploy/README.md).

Production today runs the OpenAI provider (`gpt-4o-mini`) via `DEFAULT_MODEL_PROVIDER=openai` — Groq and Gemini remain selectable per-request.

## CI

Three GitHub Actions workflows live in [`.github/workflows/`](.github/workflows/):

| Workflow | Trigger | What it does |
| --- | --- | --- |
| `frontend.yml` | push / PR touching `frontend/**` | `npm ci --legacy-peer-deps`, lint, build |
| `backend.yml` | push / PR touching `backend/**` | `uv sync`, import-smoke (`python -c "import server"`) |
| `chat-smoke.yml` | daily cron | Runs `.claude/workflows/test-chat-modes.js` against production wss endpoint |

The repo is public, so Actions minutes are unlimited.

## Doing common things

The `.claude/skills/` directory holds the operational playbooks. They're written for Claude Code but readable as plain markdown:

| Task | Skill |
| --- | --- |
| Add or replace a document in the RAG index | [`update-inpersona-kb.md`](.claude/skills/update-inpersona-kb.md) |
| Push a backend change to production | [`redeploy-backend.md`](.claude/skills/redeploy-backend.md) |
| Push a frontend change to production | [`redeploy-frontend.md`](.claude/skills/redeploy-frontend.md) |
| Debug a broken chat session | [`diagnose-inpersona.md`](.claude/skills/diagnose-inpersona.md) |
| Improve retrieval quality / tune the prompt | [`tune-rag-quality.md`](.claude/skills/tune-rag-quality.md) |
| Change DNS records at IONOS | [`manage-ionos-dns.md`](.claude/skills/manage-ionos-dns.md) |
| Run the 16-combo chat test suite | [`run-chat-test-suite.md`](.claude/skills/run-chat-test-suite.md) |
| Boot frontend + backend together locally | [`start-local-stack.md`](.claude/skills/start-local-stack.md) |

For deeper architectural context — composition order, the load-bearing system prompt, the frontend/backend WebSocket contract — see [`CLAUDE.md`](CLAUDE.md).

## How Inpersona retrieves

Inpersona supports two retrieval paths over the same indexed corpus, plus a query-rewrite layer that can be applied to either. The UI exposes both as toggles; the backend picks the matching `QueryEngine` per request.

### Knowledge Graph search

The KG path is extremely accurate and handles multi-hop reasoning well. On ingest, the LLM extracts entities and their relations from each document and stores them as a JSON-formatted property graph (persisted in ChromaDB locally). At query time we walk the graph from the question's entities and return their connected properties. Slower than vector search but much more precise for relational questions.

<p align="center">
  <img src="ivg/kg_im.png" alt="Knowledge Graph retrieval diagram" width="1080">
</p>

### HyDE query transformation

HyDE ("Hypothetical Document Embeddings", from [*Precise Zero-Shot Dense Retrieval without Relevance Labels*](https://arxiv.org/abs/2212.10496)) flips retrieval on its head: instead of embedding the user's question and searching the index for similar chunks, we first ask the LLM to *generate a hypothetical answer*, embed THAT, and search for chunks similar to the generated answer. Tends to produce more fluid, natural responses with higher confidence on phrasing — but is also more prone to over-sharing or hallucinating, since the hypothetical answer biases retrieval.

<p align="center">
  <img src="ivg/hyde.png" alt="HyDE query transformation diagram" width="1080">
</p>

The two paths are orthogonal — the frontend's two toggles (`Use Knowledge Graph`, `Use HyDE Query`) produce all four combinations: plain-vector, plain-KG, HyDE-vector, HyDE-KG. See [`.claude/skills/tune-rag-quality.md`](.claude/skills/tune-rag-quality.md) for when each is the right tool.

## Tech stack

| Frontend | Backend |
| --- | --- |
| Next.js 16 (Pages Router) | FastAPI + Uvicorn |
| React 19 | LlamaIndex 0.11.x (pinned) |
| TypeScript | ChromaDB (persistent, on disk) |
| Tailwind CSS | HuggingFace `BAAI/bge-base-en-v1.5` embeddings |
| Framer Motion | Groq / Gemini / OpenAI LLMs (swappable per-request) |
| Formspree (contact form) | Redis (optional, cache) |
| Vercel hosting | uv 0.9.26 (deps) |
|  | Docker Compose + Caddy on Hetzner CX23 |

## Project history

See [`CHANGELOG.md`](CHANGELOG.md) for a release-by-release walkthrough.

## License

MIT — see [`LICENSE`](LICENSE).
