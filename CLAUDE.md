# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Odyssey is a personal portfolio website (Yatharth Kapadia) plus **Inpersona AI**, a chatbot that answers as the site's owner using RAG over the owner's documents. The repo is a two-package monorepo: a Next.js frontend and a Python (FastAPI + LlamaIndex) backend that communicate over a single WebSocket endpoint.

## Common commands

### Frontend (`frontend/`)
```bash
npm install            # legacy-peer-deps=true is set via .npmrc; required for the React 19 / Next 16 combo
npm run dev            # http://localhost:3000
npm run build
npm run start
npm run lint
```

### Backend (`backend/`)
```bash
poetry install
poetry run python server.py           # serves wss://0.0.0.0:8000/chat (loads SSL certs from /etc/ssl/yatharthk.com.*)
poetry run python client.py           # interactive CLI client for the WebSocket (uses ws://localhost:8000)
poetry run python -m chat.ChatManager # runs the in-file __main__ smoke test (expects ./test_docs)
```

There is no test runner configured — `backend/test.py` is a stub (`pass`), and the frontend has no test script. The only "tests" are the `__main__` blocks in `backend/server.py`, `backend/client.py`, and `backend/chat/ChatManager.py`.

### Running locally end-to-end
`server.py` hard-codes SSL certificates under `/etc/ssl/yatharthk.com.*` and will `raise` if they're missing — for local dev you typically either (a) run the FastAPI app via `uvicorn server:app --reload` on plain HTTP/WS, or (b) point `wsRef` in [InpersonaChat.tsx](frontend/pages/components/InpersonaChat.tsx) at a local `ws://` URL (it currently builds `wss://${window.location.hostname}:8000/chat`).

### Required env vars (`backend/.env`)
- `GROQ_API_KEY` — required, server refuses to start without it
- `Google_Gemini_API_KEY` — required, server refuses to start without it (note the unusual mixed-case name)
- `REDIS_URL` — optional, defaults to `redis://localhost:6379`; if Redis is unreachable, caching is silently disabled
- `DEFAULT_MODEL_PROVIDER` — optional, `groq` or `gemini` (defaults to `groq` in server.py despite the ModelManager default being `gemini`)

## Architecture

### Backend RAG pipeline
The backend is a single WebSocket endpoint (`/chat` in [backend/server.py](backend/server.py)) backed by a layered pipeline. **`ChatManager` is the composition root** — it wires together every other component, and `server.py` holds a single global instance that gets torn down and rebuilt whenever a client requests a different `model_provider`.

Initialization order (enforced in `ChatManager.initialize_system`):
1. `ModelManager` — selects Groq (`llama-3.3-70b-versatile`) or Gemini (`gemini-2.0-pro-exp-02-05`) for the LLM, always uses HuggingFace `BAAI/bge-base-en-v1.5` for embeddings, and writes both into LlamaIndex global `Settings`.
2. `ChromaStoreManager` — opens a persistent ChromaDB at `./chroma_db` with one shared collection (`property_graph_store`) used by **both** the knowledge graph and the plain vector store.
3. `VectorStoreManager` — builds two indices **in parallel threads**: a `PropertyGraphIndex` (knowledge graph, persisted under `./storage/` as `docstore.json` + `graph_store.json` + an HTML viz at `./kg.html`) and a `VectorStoreIndex` (pickled to `./storage/vector_store.pkl`). Both read PDFs from `./documents/` via `SimpleDirectoryReader`. If either set of files exists on disk it is loaded instead of rebuilt; corrupt KG files are auto-removed and recreated.
4. `QueryEngine` — wraps each index as a streaming `as_query_engine`, plus a HyDE-transformed variant (`TransformQueryEngine` + `HyDEQueryTransform`). Four engines total: `{KG, vector} × {plain, HyDE}`.

Per-query flow (`QueryEngine.process_query`):
- Check Redis cache (`CacheManager`, keyed by lowercased question) → return immediately on hit.
- Append the question to the in-memory `Chat` deque (size 10, so 20 messages max).
- Concatenate the system prompt from [backend/chat/prompt.py](backend/chat/prompt.py) (`contextualized_query`) + the full chat history + the current question into one prompt string.
- Pick `{KG | vector} × {HyDE | plain}` engine from the WebSocket request and stream chunks back via a `Queue` populated from a worker `Thread` (the LlamaIndex stream is sync, so it's bridged into the async WebSocket handler this way).
- After streaming completes, append the assembled response to chat history and write it to the cache.

### The system prompt is load-bearing
[backend/chat/prompt.py](backend/chat/prompt.py) defines `contextualized_query`, which instructs the model to respond *as Yatharth in first person*, in **HTML (not Markdown)**, with strict formatting rules and a topic filter that refuses off-topic questions. The frontend's chat UI renders these responses as HTML — changes to the prompt's output format will break rendering, and changes to the frontend renderer must match the prompt's contract.

### Frontend ↔ Backend contract
WebSocket request shape (from [InpersonaChat.tsx](frontend/pages/components/InpersonaChat.tsx)):
```json
{ "question": "...", "vector_store": "KG" | "vector", "query_transformation": "HyDE" | null, "model_provider": "groq" | "gemini" }
```
Server responses are JSON-per-frame: `{"type":"chunk","content":"..."}` repeated, terminated by `{"type":"complete"}`, or `{"error":"..."}` on failure. The frontend toggles in the chat UI (`useKnowledgeGraph`, `useHydeQuery`) map directly onto `vector_store` and `query_transformation`.

### Frontend layout quirk
Page-level routes live in `frontend/pages/` (Next.js Pages Router), but **most reusable UI components live in `frontend/pages/components/`** rather than the conventional top-level `frontend/components/`. The top-level `components/` directory exists too and contains only the cross-cutting `Layout`, `NextImage`, `ThemeToggle`, and animation primitives. When adding a new component, match whichever location its siblings use — don't consolidate.

Theme state is React Context (`frontend/context/ThemeContext.tsx`), wrapped at `_app.tsx`. Tailwind is used throughout; `framer-motion` drives the section reveal animations in [index.tsx](frontend/pages/index.tsx).

### Stack notes
- React 19 + Next 16 on the frontend — the `.npmrc` `legacy-peer-deps=true` is required because some deps (e.g. `@formspree/react`, `react-markdown` v8) haven't published React-19-compatible peer ranges yet. Do **not** delete `.npmrc`.
- The backend pins exact versions of `llama-index-*` packages (`0.11.19`, `0.3.1`, etc.) in `pyproject.toml`. The LlamaIndex API churned heavily across minor releases — bumping any of these will likely require code changes in `ModelsManager.py`, `VectorStore_manager.py`, and `query_engine.py`.
