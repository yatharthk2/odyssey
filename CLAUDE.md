# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Odyssey** is Yatharth Kapadia's personal portfolio site (`yatharthk.com`) plus **Inpersona AI**, a RAG chatbot that answers as Yatharth using a knowledge base of his resume + project docs.

The repo is a two-package monorepo. Both pieces are deployed and serving real traffic:

| Piece | Where it lives | What it does |
|---|---|---|
| **Frontend** | `frontend/` (Next.js 16, Pages Router, React 19) | Static-ish portfolio + chat UI. Hosted on **Vercel** at `yatharthk.com` (apex redirects to `www`). Auto-deploys on push to `main`. |
| **Backend** | `backend/` (FastAPI + LlamaIndex + ChromaDB) | WebSocket-only RAG service. Hosted on a **Hetzner CX23** at `api.yatharthk.com`. Runs as Docker Compose (caddy + backend + redis). Manual redeploy via `git pull && docker compose up -d --build`. |
| **Deploy configs** | `deploy/` | `docker-compose.yml`, `Caddyfile`, `.env.example`, and a runbook. |

Production cost: ~$5/mo (Hetzner only — Vercel is free, domain pre-existed).

## Production architecture

```
yatharthk.com  ───────────── Vercel (Next.js)
   ↓ (307)
www.yatharthk.com  ────── Vercel (Next.js)
   ↓ wss://
api.yatharthk.com  ────── Caddy → FastAPI → ChromaDB + LlamaIndex
                              │
                              └── Redis (cache)
                          [Hetzner CX23, Falkenstein, $5/mo]
                          [SSH: ssh root@178.104.211.36]
```

The frontend's WebSocket URL is set via the Vercel env var `NEXT_PUBLIC_INPERSONA_WS_URL=wss://api.yatharthk.com/chat`. In local dev it falls back to `${ws|wss}://${window.location.hostname}:8000/chat` so `npm run dev` against a local backend just works.

## Common commands

### Frontend (`frontend/`)
```bash
npm install            # legacy-peer-deps=true via .npmrc — required for React 19 + Next 16
npm run dev            # http://localhost:3000
npm run build
npm run start
npm run lint
```

### Backend (`backend/`) — local dev
The backend uses **uv** (not Poetry anymore — `poetry.lock` is gone, `uv.lock` is canonical).
```bash
uv sync                                                   # one-time, creates .venv from uv.lock
.venv/bin/python -m uvicorn server:app --host 0.0.0.0 --port 8000   # serve on plain HTTP/WS for local dev
.venv/bin/python client.py                                # interactive CLI client (uses ws://localhost:8000)
```
Required env vars in `backend/.env` (file is gitignored, copy from `.env.example`):
- `GROQ_API_KEY` — required
- `Google_Gemini_API_KEY` — required (note the unusual mixed-case env-var name; kept for backward compat)

Optional env vars (all default to sensible values in `backend/settings.py:PropertyGraphSettings.from_env()`):
- `OPENAI_API_KEY` — only required if `DEFAULT_MODEL_PROVIDER=openai` or a client requests `model_provider=openai` at runtime
- `OPENAI_MODEL` — defaults to `gpt-4o-mini`
- `REDIS_URL`, `DEFAULT_MODEL_PROVIDER` (`groq`|`gemini`|`openai`), `ALLOWED_ORIGINS`, `HOST`, `PORT`, `WEBSOCKET_PATH`, `PDF_DIRECTORY`, `SSL_CERT_PATH`, `SSL_KEY_PATH`, `SSL_CA_PATH`

### Backend — production (Hetzner)
```bash
ssh root@178.104.211.36
cd /opt/odyssey/deploy
docker compose ps                         # container status
docker compose logs -f backend            # tail logs
docker compose up -d --build backend      # rebuild + restart after a git pull
docker compose restart backend            # quick restart (e.g. after editing documents/)
```
The deploy stack is `deploy/docker-compose.yml` — three containers (caddy, backend, redis) on a private bridge network. Caddy auto-handles Let's Encrypt for `api.yatharthk.com`. See [`deploy/README.md`](deploy/README.md) for the full runbook.

### Tests
There is no test runner. The only smoke tests are interactive CLI scripts (`backend/client.py`) and the WebSocket client at `wss://api.yatharthk.com/chat`. Verify changes by running the stack and asking the live chat a question.

## Backend architecture

The backend is a **single WebSocket endpoint** (`/chat`) backed by a layered RAG pipeline. `ChatManager` is the composition root — everything else is wired through it. `server.py` holds a single global `ChatManager` instance behind a lock; if a client requests a different `model_provider`, the singleton is swapped under that lock so concurrent clients can't tear it down mid-query.

Initialization order (in `ChatManager.initialize_system`):
1. `ModelManager` — selects one of three LLM providers: Groq (default `llama-3.1-8b-instant`), Gemini (`gemini-2.5-pro`), or OpenAI (`gpt-4o-mini`). Provider is set per-instance via the `model_provider` constructor arg; clients can also swap at runtime via the WebSocket request's `model_provider` field. Embeddings always use HuggingFace `BAAI/bge-base-en-v1.5`. Writes both into LlamaIndex global `Settings`.
2. `ChromaStoreManager` — opens persistent ChromaDB at `./chroma_db` with one shared collection (`property_graph_store`) used by **both** the KG and the plain vector index.
3. `VectorStoreManager` — builds two indices **in parallel threads**: a `PropertyGraphIndex` (KG, persisted as `./storage/docstore.json` + `graph_store.json` + an HTML viz at `./kg.html`) and a `VectorStoreIndex` (pickled to `./storage/vector_store.pkl`). Both ingest documents from `./documents/` via `SimpleDirectoryReader`. If the on-disk artifacts exist, they're loaded instead of rebuilt; corrupt KG files are auto-removed and recreated.
4. `QueryEngine` — wraps each index as a streaming `as_query_engine`, plus a HyDE-transformed variant. Four engines total: `{KG, vector} × {plain, HyDE}`.

Per-query flow (`QueryEngine.process_query`):
- Check Redis cache (keyed by lowercased question) → return immediately on hit.
- Append the question to the in-memory `Chat` deque (size 10 turns = 20 messages max).
- Concatenate system prompt + the **last 4 turns** of chat history + current question into one prompt string. Older turns stay in the deque but aren't fed to the LLM (dilutes both retrieval and synthesis).
- Pick the engine based on the request's `vector_store` + `query_transformation`; stream chunks back via a `Queue` populated from a worker `Thread` (LlamaIndex's stream is sync, bridged to the async WebSocket handler this way).
- After streaming, append the assembled response to chat history and cache it.

### Settings live in one place

[`backend/settings.py`](backend/settings.py) defines `PropertyGraphSettings` (a dataclass) with a `from_env()` classmethod. **Every tunable lives there** — chunking, models, ports, paths, CORS origins, SSL paths, cache size. Env vars override defaults; the rest comes from the dataclass literals.

Recent tunings (matter for response quality):
- `chunk_size=800`, `chunk_overlap=100` — bigger chunks keep a whole job/project together; smaller defaults shred resume bullets
- `similarity_top_k=4` — enough coverage on the small KB without bloating the prompt; higher values raise time-to-first-token (the LLM must prefill more context before it can start streaming)
- `groq_model="llama-3.1-8b-instant"` — way higher rate-limit ceiling than `llama-3.3-70b-versatile`
- `cache_size=6` — Redis LRU keeps the top-6 most-asked questions warm

### The system prompt is load-bearing

[`backend/chat/prompt.py`](backend/chat/prompt.py) defines `contextualized_query`. It instructs the model to respond *as Yatharth in first person*, in **HTML (not Markdown)**, with strict formatting rules and a topic filter that refuses off-topic queries. The frontend chat UI renders these responses with `dangerouslySetInnerHTML` — changes to the prompt's output format will break rendering, and changes to the frontend renderer must match the prompt's contract.

## Frontend architecture

### Layout quirk
Page-level routes live in `frontend/pages/` (Pages Router), but **most reusable UI components live in `frontend/pages/components/`** rather than the conventional top-level `frontend/components/`. The top-level `frontend/components/` exists too and contains only the cross-cutting `Layout`, `ThemeToggle`, animation primitives, and the `primitives/` extractions (`SectionCard`, `SectionHeading`, `InpersonaNavLink`). When adding a component, match whichever location its siblings use — don't consolidate.

### Content is data-driven via `frontend/pages/index.json`
Almost all user-facing copy — nav links, hero, about, projects, experience, skills, achievements, testimonials, footer, Inpersona suggestions / toggle copy / loading screen tiles — lives in `index.json`. Components import from `frontend/types/config.ts` (typed loader). Adding a new section means updating the JSON + the `Config` type + the component that consumes it.

### Inpersona chat component
[`frontend/pages/components/InpersonaChat.tsx`](frontend/pages/components/InpersonaChat.tsx) is the WebSocket client. Key contracts:
- Request shape: `{ question, vector_store: "KG"|"vector", query_transformation: "HyDE"|null }`
- Response stream: `{type:"chunk", content:...}` repeated, terminated by `{type:"complete"}`, or `{error:"..."}` on failure
- The WebSocket URL comes from `NEXT_PUBLIC_INPERSONA_WS_URL` if set (production), otherwise falls back to building it from `window.location.hostname` (local dev)
- On Strict Mode / HMR double-mount, both `onopen` and `onclose` guard with `if (wsRef.current !== ws) return;` so stale handlers don't clobber the active connection — losing this guard breaks chat in dev silently

### Theme / styling
Theme state is React Context ([`frontend/context/ThemeContext.tsx`](frontend/context/ThemeContext.tsx)), wrapped at `_app.tsx`. Tailwind everywhere. `framer-motion` drives section reveals in [`index.tsx`](frontend/pages/index.tsx). Chat-specific styles (typing indicators, HTML content classes, scrollbar) live in [`styles/globals.css`](frontend/styles/globals.css) — they used to be `<style jsx global>` inside the chat component but were moved out so HMR CSS reloads don't restart message-bubble animations.

## Stack notes & known gotchas

- **React 19 + Next 16** on the frontend — `.npmrc`'s `legacy-peer-deps=true` is required (`@formspree/react`, `react-markdown` v8 haven't published React 19 peer ranges yet). Do not delete `.npmrc`.
- **LlamaIndex pins are exact** in `backend/pyproject.toml` (`llama-index-core==0.11.19`, etc.). The API churned hard across 0.11.x minors — bumping any of these will likely require code changes in `ModelsManager.py`, `vector_store_manager.py`, and `query_engine.py`.
- **`tokenizers==0.20.3` sdist is broken** — pyproject.toml marks it `no-build-package` in `[tool.uv]` so uv only uses the wheel. Don't remove that line or `uv sync` will fail on fresh installs.
- **`backend/.env` and `backend/chat/.env`** — both are gitignored via `**/.env`. There used to be a leaked `backend/chat/.env` in git history (committed before `.gitignore` was tightened); keys have since been rotated. If you ever see a `chat/.env` appear, delete it immediately.
- **The hardcoded `/etc/ssl/yatharthk.com.*` paths in `server.py:__main__`** were the pre-Docker deployment path. With the current Caddy-fronted setup, TLS is terminated upstream and the backend just speaks plain HTTP inside the container. The `__main__` block is only reached if you `python server.py` directly on a host with those certs.
- **Frontend `pages/components/` quirk** causes Next.js to expose each component as a route too (e.g. `/components/InpersonaButton` returns the rendered component). It's harmless but surprising — don't `next export` or write `getStaticProps` in those files.

## Doing common things

For step-by-step playbooks see [`.claude/skills/`](.claude/skills/):
- `redeploy-backend.md` — pushing backend code changes to Hetzner
- `update-inpersona-kb.md` — refreshing the RAG knowledge base
- `start-local-stack.md` — bringing up frontend + backend for local development
- `diagnose-inpersona.md` — debugging chat issues (rate limits, WebSocket failures, etc.)
- `manage-ionos-dns.md` — DNS changes at IONOS
- `redeploy-frontend.md` — how frontend auto-deploys via Vercel (and how to roll back)
