---
name: start-local-stack
description: Use to bring up the full Inpersona stack (frontend + backend) locally for development. Both must be running for the chat UI to work end-to-end. Defaults to plain HTTP/WS (no TLS) — production uses HTTPS+WSS via Caddy on Hetzner, but local doesn't need that.
---

# Starting the local dev stack

For full chat-UI development you need **both** servers running:

| Service | Port | Where |
|---|---|---|
| Backend (FastAPI + RAG) | `8000` | `backend/` |
| Frontend (Next.js dev) | `3000` | `frontend/` |

The frontend auto-detects local mode (when `window.location.protocol === "http:"`) and builds the WebSocket URL as `ws://${hostname}:8000/chat` instead of using the production `wss://api.yatharthk.com/chat`. No env var changes needed for local dev.

## First-time setup

```bash
# Backend
cd backend
uv sync                                # creates .venv from uv.lock (~3-5 min first time, downloads torch + sentence-transformers)
cp .env.example .env
# Edit .env and paste your GROQ_API_KEY and Google_Gemini_API_KEY

# Frontend
cd ../frontend
npm install                            # .npmrc enforces --legacy-peer-deps automatically
```

## Bringing it up (each time)

Two terminals, one per service:

### Terminal 1 — backend

```bash
cd backend
.venv/bin/python -m uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```

The `--reload` flag restarts on Python file changes (handy when editing `prompt.py` or `query_engine.py`).

First boot takes ~20-30s while:
1. The HuggingFace embedding model (`BAAI/bge-base-en-v1.5`, ~440MB) loads into memory
2. ChromaDB opens its persistent client at `./chroma_db`
3. The KG + vector indices either load from `./storage/` (if they exist) OR rebuild from `./documents/` (first boot only — takes another 30s for KG extraction via Groq)
4. Lifespan finishes with `Application startup complete.`

After that boot, restarts are seconds because everything's cached.

Logs to look for:
- `Initialized cache manager with Redis at redis://localhost:6379` — Redis is reachable (optional; absent is fine)
- `Failed to initialize Redis connection: Error 61` — Redis isn't running (cache silently disabled, no functional impact)
- `Loaded vector index from ./storage/vector_store.pkl` — using cached indices
- `Found existing property graph. Loading from storage...` — same, for KG
- `Application startup complete.` — ready for traffic

### Terminal 2 — frontend

```bash
cd frontend
npm run dev
```

Wait for `✓ Ready in <Nms>`. Open http://localhost:3000.

### (Optional) Redis

If you want to test the cache path locally:

```bash
brew install redis
brew services start redis
```

The backend will pick it up at the default `redis://localhost:6379`. Caching is keyed on lowercased question text — ask the same question twice and you'll see `INFO Returning cached response` in the backend logs on the second call.

## Verifying the stack works

1. Open http://localhost:3000
2. Click **Inpersona** → wait through the loading screen
3. Status pill top-right should go 🟢 **Connected** within ~1 second
4. Click any suggestion tile → response should stream in chunk by chunk
5. Toggle "Use Knowledge Graph" → ask again → backend log should show `Using KG query engine` (vs. `Using vector query engine`)

If the status pill stays red, check:
- Is the backend actually listening? `curl -sI http://localhost:8000/` should return something (404 is fine, that's FastAPI saying "no route" — the WebSocket is alive)
- Browser console (⌘⌥J in Chrome) — the chat component logs `Inpersona: connecting to ws://localhost:8000/chat`, `Inpersona: connected`, etc. If you see `WebSocket error`, the URL or port is wrong.

## Stopping the stack

`Ctrl+C` in each terminal. Or to nuke both at once:

```bash
lsof -i :3000 -i :8000 | awk 'NR>1 {print $2}' | sort -u | xargs -r kill
```

## Common annoyances

- **The backend keeps timing out on first query.** Cold start of the embedding model — wait 30s and try again. If it persists, the indices are corrupt; `rm -rf backend/storage backend/chroma_db backend/kg.html` and restart to force rebuild.
- **Frontend says "Disconnected" but backend logs show no connection attempt.** The browser tried a WSS connection but the backend is plain WS. Hard-reload the page (⌘⇧R) — Next.js HMR sometimes serves stale JS that has the wrong scheme.
- **Strict Mode double-connect.** Next.js dev mode mounts components twice in Strict Mode. You'll see two `WebSocket /chat [accepted]` lines in the backend log per page load — that's expected, not a bug. The chat component handles it correctly with the `wsRef.current !== ws` guard.
- **"Resource exhausted" or `429 Too Many Requests` from Groq.** Free tier rate limit. The KG path makes 5+ LLM calls per query and burns through limits fast — switch to vector path or wait a minute. Switching `groq_model` to `llama-3.1-8b-instant` (current default) gives ~3-4x more headroom than `llama-3.3-70b-versatile`.
