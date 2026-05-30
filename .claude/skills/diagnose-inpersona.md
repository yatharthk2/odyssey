---
name: diagnose-inpersona
description: Use when the Inpersona chat is broken or behaving oddly — red "Disconnected" status, no response to questions, garbled responses, slow streaming, or 502/503 errors from the backend. Walks through the standard diagnostic sequence from outermost (DNS, TLS) to innermost (LLM rate limits, prompt issues).
---

# Diagnosing Inpersona chat issues

When something's wrong, work from the outside in. The layers, in order:

1. **DNS** — does the domain resolve to the right place?
2. **TLS** — is the Caddy cert valid?
3. **WebSocket handshake** — can a connection be opened at all?
4. **Backend pipeline** — does the query reach the LLM?
5. **Response quality** — is the answer wrong or just oddly formatted?

The diagnostic path below targets each in turn.

## 0. Quick triage — what to ask first

- What URL is the user on? `yatharthk.com` (production) or `localhost:3000` (dev)?
- What does the status pill (top-right of the chat page) show — 🟢 Connected or 🔴 Disconnected?
- What do they see in the browser console (⌘⌥J)? The chat component logs `Inpersona: connecting to <URL>`, `Inpersona: connected`, `Inpersona: sending {...}`, `Inpersona: send blocked, ...`. These pin down the failure exactly.

If they can't share browser logs, work through the layers below.

## 1. DNS — is the domain pointing at the right thing?

```bash
dig +short A api.yatharthk.com         # expect 178.104.211.36 (Hetzner backend)
dig +short A yatharthk.com             # expect 216.198.79.1 (Vercel apex)
dig +short A www.yatharthk.com         # expect Vercel anycast IPs
```

If `api.yatharthk.com` doesn't resolve to `178.104.211.36`:
- Check IONOS DNS → the A record for `api` should point at `178.104.211.36`
- If you recently provisioned a new Hetzner box, update the A record (see `manage-ionos-dns` skill)

## 2. TLS — is Caddy serving a valid cert?

```bash
curl -vI https://api.yatharthk.com/ 2>&1 | grep -iE "subject:|issuer:|expire|HTTP/"
# Should show CN=api.yatharthk.com, issuer="(STAGING) Let's Encrypt" or "Let's Encrypt", expiry date, HTTP/2 404
```

The 404 is fine (no HTTP route on `/`). The cert details matter:
- **"STAGING" issuer**: Caddy is rate-limited or stuck in staging mode — check `docker compose logs caddy` on the server
- **No cert at all / connection refused**: Caddy isn't running or port 443 isn't open. SSH in: `cd /opt/odyssey/deploy && docker compose ps caddy`
- **Expired cert**: Caddy normally auto-renews ~30 days before expiry. If expired, `docker compose restart caddy` forces a re-attempt.

## 3. WebSocket handshake

```bash
# Quick connectivity check
curl -sI -H "Connection: Upgrade" -H "Upgrade: websocket" \
     -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: $(openssl rand -base64 16)" \
     https://api.yatharthk.com/chat
# Expect HTTP/1.1 101 Switching Protocols (or HTTP/2 equivalent)
```

Or actually open the WebSocket and time the handshake:

```bash
.venv/bin/python <<'PY'
import asyncio, time, websockets
async def main():
    t0 = time.time()
    async with websockets.connect("wss://api.yatharthk.com/chat") as ws:
        print(f"Connected in {time.time()-t0:.2f}s")
asyncio.run(main())
PY
```

If the handshake fails:
- **HTTP/2 502/503** — backend container is down. SSH in: `docker compose ps backend && docker compose logs --tail=30 backend`
- **HTTP 404 from `/chat`** — the WebSocket route isn't registered. Means the backend started but didn't finish lifespan (check logs for tracebacks).
- **Connection refused** — Caddy isn't running.

## 4. Backend pipeline

Open the WebSocket and send a real query, watching the server logs simultaneously:

```bash
# Terminal A — tail the backend
ssh root@178.104.211.36 'cd /opt/odyssey/deploy && docker compose logs -f --tail=0 backend'

# Terminal B — fire a test query
.venv/bin/python <<'PY'
import asyncio, json, websockets
async def main():
    async with websockets.connect("wss://api.yatharthk.com/chat") as ws:
        await ws.send(json.dumps({"question":"hi","vector_store":"vector","query_transformation":None}))
        while True:
            m = json.loads(await asyncio.wait_for(ws.recv(), timeout=60))
            print(m)
            if m.get("type") == "complete" or "error" in m: return
asyncio.run(main())
PY
```

What you should see in Terminal A:
- `WebSocket /chat [accepted]`
- `Using vector query engine` (or `KG`)
- `HTTP Request: POST https://api.groq.com/openai/v1/chat/completions "HTTP/1.1 200 OK"`
- Eventually `WebSocket client disconnected`

What goes wrong, and what it means:

| Log pattern | Meaning | Fix |
|---|---|---|
| `429 Too Many Requests` | Groq rate limit | Wait, or use vector path (1 LLM call) instead of KG (5+ calls). Long-term: bump to a paid Groq plan or switch model. |
| `Retrying request in N seconds` | Auto-retry against Groq | Same. Each KG query needs 5+ calls so it hits the limit faster. |
| `Failed to initialize Redis connection: Error 61` | Redis not running | Harmless — cache is silently disabled. To restore: `docker compose up -d redis` |
| `Error processing query: ...` | Pipeline crashed mid-stream | Full traceback in the log; usually a llama-index version mismatch or a malformed prompt. |
| `Application startup complete.` is never printed | Backend never fully booted | Check the bottom of the log for a traceback. Often missing env vars or a corrupt index — `rm -rf storage chroma_db kg.html` then restart. |

## 5. Response quality issues

If the chat connects and answers but the answers are **wrong**, **stale**, or **hallucinated**:

- **Stale answer** — see `update-inpersona-kb` skill. Either Redis is serving an old cached response (`docker compose exec redis redis-cli FLUSHDB`) or the indices weren't actually wiped after a content update.
- **Garbled HTML** — the model output isn't matching the prompt's HTML contract. Check `backend/chat/prompt.py` — the few-shot examples there are load-bearing. If you changed them, make sure they're consistent with what the renderer expects.
- **Hallucinated facts** — the KB doesn't contain the fact. Add a doc to `backend/documents/` (or `deploy/documents/` on the server) and reindex.
- **"I'm focused on discussing my professional background..."** — that's the prompt's topic-filter response. Either the question is genuinely off-topic, or the prompt is too strict — loosen the topic filter in `prompt.py`.

## When the chat is "slow"

"Slow" usually means one of:

1. **Groq rate-limit backoff** — 429s with `Retrying in 11s, 17s, ...` add real wall-clock time. Single dominant cause in our setup. Fix: use vector path (1 call) over KG (5+ calls), or pay for Groq.
2. **No Redis cache** — every question is a fresh LLM call. Cache hit = ~50ms response; miss = 2-5s typical. To enable: `cd /opt/odyssey/deploy && docker compose up -d redis`.
3. **Cold-start of embedding model** — only on first boot after container restart. ~20-30s, then warm.
4. **KG path is genuinely slower** — 5+ LLM calls per query for entity extraction + synthesis. Switch the toggle to vector for snappier answers.

## Useful one-liners

```bash
# Backend container resource use
ssh root@178.104.211.36 'docker stats --no-stream'

# Full Caddy cert info
ssh root@178.104.211.36 'docker compose -f /opt/odyssey/deploy/docker-compose.yml exec caddy caddy list-modules | head'

# Quickly cycle the backend without rebuild
ssh root@178.104.211.36 'cd /opt/odyssey/deploy && docker compose restart backend'

# Force a fresh TLS cert attempt
ssh root@178.104.211.36 'cd /opt/odyssey/deploy && docker compose restart caddy'
```
