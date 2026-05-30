---
name: redeploy-backend
description: Use when changes need to ship to the production backend on Hetzner — code edits in `backend/`, prompt tuning in `chat/prompt.py`, settings changes in `settings.py`, dependency bumps in `pyproject.toml`, or new docs under `documents/`. The backend does NOT auto-deploy on git push; this is a manual flow over SSH.
---

# Redeploying the backend to Hetzner

The production backend lives on a Hetzner CX23 in Falkenstein at `178.104.211.36`, reachable as `api.yatharthk.com`. It runs as a 3-service Docker Compose stack (caddy + backend + redis) from `/opt/odyssey/deploy/`.

## SSH access

```bash
ssh root@178.104.211.36
```

Your laptop's `~/.ssh/id_ed25519` key is already in `authorized_keys` on the server. No password.

## Standard redeploy (code or dependency change)

After pushing your changes to `origin/main`:

```bash
ssh root@178.104.211.36 'cd /opt/odyssey && git pull origin main && cd deploy && docker compose up -d --build backend'
```

What this does:
1. `git pull` — fetch latest `main` on the server
2. `docker compose up -d --build backend` — rebuild the backend image, recreate just the backend container (caddy + redis stay up untouched), detached

First-time rebuilds take ~3-5 min (uv sync, layer caching). Subsequent rebuilds reuse cache and take ~30-60s.

Watch the boot:
```bash
ssh root@178.104.211.36 'docker compose -f /opt/odyssey/deploy/docker-compose.yml logs -f backend'
```
Wait for `Application startup complete.` — that means the lifespan ran, indices loaded, ready for traffic.

## Lighter restart (no rebuild — just settings/env tweak)

If you only changed `backend/.env` on the server (e.g. rotated an API key) or want to force the lifespan to re-run without changing code:

```bash
ssh root@178.104.211.36 'cd /opt/odyssey/deploy && docker compose restart backend'
```

## Smoke test after deploy

```bash
cd /Users/yatharth/Desktop/code/odyssey/backend && .venv/bin/python <<'PY'
import asyncio, json, websockets
async def main():
    async with websockets.connect("wss://api.yatharthk.com/chat") as ws:
        await ws.send(json.dumps({"question":"In one sentence, who are you?","vector_store":"vector","query_transformation":None}))
        n = 0
        while True:
            m = json.loads(await asyncio.wait_for(ws.recv(), timeout=60))
            if "error" in m: print("ERROR:", m["error"]); return
            if m["type"] == "chunk": n += 1; print(m["content"], end="", flush=True)
            elif m["type"] == "complete": print(f"\n[OK] {n} chunks"); return
asyncio.run(main())
PY
```

If that streams a response, the redeploy succeeded.

## If the boot hangs or fails

```bash
# Full stack status
ssh root@178.104.211.36 'cd /opt/odyssey/deploy && docker compose ps'

# Last 50 lines of backend logs
ssh root@178.104.211.36 'cd /opt/odyssey/deploy && docker compose logs --tail=50 backend'

# Rollback — last-known-good image is still on the host as a previous Docker layer
ssh root@178.104.211.36 'cd /opt/odyssey && git log --oneline -5'    # find a good commit
ssh root@178.104.211.36 'cd /opt/odyssey && git checkout <SHA> && cd deploy && docker compose up -d --build backend'
```

## What never gets touched on redeploy (stays persistent)

- `backend_storage` volume — KG + vector index pickles (rebuild on demand via `update-inpersona-kb` skill)
- `backend_chroma` volume — ChromaDB sqlite + binary
- `backend_hfcache` volume — HuggingFace embedding model (~440MB; download once, never again)
- `redis_data` volume — Redis cache AOF

If you ever need to nuke them and rebuild from scratch, see the `update-inpersona-kb` skill.

## What never to do

- Never SSH-edit files under `/opt/odyssey/` (other than `deploy/.env` and `deploy/documents/`). Edits get blown away on the next `git pull`. Always edit locally, commit, push, redeploy.
- Never `docker compose down` without need — that takes Caddy offline and forces a TLS re-validate on next `up`. Use `restart backend` for code changes.
- Never bake `backend/.env` into the image. It lives only on the server in `/opt/odyssey/deploy/.env` and is loaded via `env_file:` in compose.
