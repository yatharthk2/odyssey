# Add a second Inpersona persona (process-per-persona)

Run a second person's Inpersona chatbot alongside Yatharth's on the same Hetzner
box. Each persona is its own backend container off the **same image** (no second
build, so the disk constraint is respected), with its own documents, prompt,
indices, and subdomain. Good for 1 (tight for 2) extra personas on the CX23;
beyond that, do the multi-tenant single-process refactor instead.

## What's shared vs per-persona

| Shared | Per-persona |
|---|---|
| The Docker image (`inpersona-backend:latest`) | Documents (`documents-<p>/`) |
| The Caddy container + Redis container | System prompt (`personas/<p>.prompt.txt` + `PROMPT_PATH`) |
| The Hetzner box's RAM (~787 MiB resident each) | Indices (own `storage` + `chroma_db` volumes) |
| API keys, if you reuse `.env` (shared rate limit) | Redis logical DB (`/1`, `/2`, …) and subdomain |

The only code dependency is `PROMPT_PATH` (already in `settings.py` /
`query_engine.py`): unset = Yatharth's built-in prompt; set = read that file,
hard-failing if it's missing/empty so a persona never silently answers as
Yatharth.

## Inputs you need first

1. The person's name + background (to write the prompt).
2. Their docs (resume text + project notes).
3. Their subdomain, e.g. `api.janedoe.com`, with an **A record → 178.104.211.36**.
4. Their site origin(s) for CORS, e.g. `https://janedoe.com`.

## Steps (example persona: `jane`)

All paths are relative to `deploy/` on the server (`/opt/odyssey/deploy`).

1. **Prompt** — copy `backend/chat/prompt.py`'s string into
   `deploy/personas/jane.prompt.txt` and rewrite the identity (name, roles,
   education, companies, employment auth, contact, examples). Keep the HTML
   formatting + topic-filter rules verbatim; the frontend renders the output
   with `dangerouslySetInnerHTML`, so the output contract must not change.

2. **Documents** — put her resume/project text in `deploy/documents-jane/`.

3. **Compose service** — add to `deploy/docker-compose.yml` under `services:`:

   ```yaml
     backend-jane:
       image: inpersona-backend:latest   # reuse the image backend builds — no second build
       restart: unless-stopped
       mem_limit: 1200m                   # lower than backend's 2560m to avoid overcommit on 3.7 GiB
       mem_reservation: 768m
       cpus: 1.0
       env_file:
         - .env                           # reuses Yatharth's GROQ/Gemini keys (shared rate limit)
       environment:
         REDIS_URL: redis://redis:6379/1  # SEPARATE logical DB → no cache cross-contamination
         HOST: 0.0.0.0
         PORT: 8000
         PROMPT_PATH: /app/persona.prompt.txt
         ALLOWED_ORIGINS: https://janedoe.com,https://www.janedoe.com
       volumes:
         - backend_jane_storage:/app/storage
         - backend_jane_chroma:/app/chroma_db
         - backend_jane_hfcache:/app/.cache/huggingface
         - ./documents-jane:/app/documents:ro
         - ./personas/jane.prompt.txt:/app/persona.prompt.txt:ro
       depends_on:
         backend:
           condition: service_healthy     # start only after the first persona is warm → avoids cold-start OOM
         redis:
           condition: service_started
       networks:
         - inpersona
   ```

   Add the new named volumes under `volumes:`:

   ```yaml
     backend_jane_storage:
     backend_jane_chroma:
     backend_jane_hfcache:
   ```

   For the `service_healthy` gate to work, add a healthcheck to the existing
   `backend` service (uses the already-present `/ready` endpoint, which 503s
   until the RAG stack is built):

   ```yaml
       healthcheck:
         test: ["CMD", "python", "-c", "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://localhost:8000/ready').status==200 else 1)"]
         interval: 10s
         timeout: 5s
         retries: 30
         start_period: 120s
   ```

4. **Caddy route** — add a site block to `deploy/Caddyfile`:

   ```
   api.janedoe.com {
       encode zstd gzip
       reverse_proxy backend-jane:8000 {
           transport http {
               keepalive 5m
               keepalive_idle_conns 10
           }
       }
       log { output stdout; format console; level INFO }
   }
   ```

5. **Deploy** — from `/opt/odyssey/deploy`:

   ```bash
   docker compose up -d            # builds backend image once; backend-jane reuses it
   docker compose logs -f backend-jane
   ```

   The healthcheck staggers startup so the two backends never cold-start (peak
   memory) simultaneously. Confirm her prompt loaded: look for
   `Loaded persona system prompt from /app/persona.prompt.txt` in the logs.

6. **Her frontend** — set `NEXT_PUBLIC_INPERSONA_WS_URL=wss://api.janedoe.com/chat`.

## Gotchas

- **Redis DB isolation is mandatory.** The cache is keyed only by the
  normalized question (`odyssey:cache:` prefix, no persona namespace). Without a
  separate `REDIS_URL` DB index, "where are you based?" could return the wrong
  persona's cached answer. Use `/1`, `/2`, … per persona.
- **RAM:** two backends ≈ 1.6 GiB + caddy/redis/OS ≈ 2.4 GiB of 3.7 GiB. Fits,
  but the box already touches swap. A **third** persona needs a bigger box.
- **No rebuild for the second persona** — `backend-jane` references the existing
  image, so `docker compose up -d` won't trigger the CUDA/torch rebuild that the
  disk constraint can't accommodate. Only the `backend` service builds.
- **Shared API keys = shared rate limit.** If her traffic matters, give
  `backend-jane` its own `env_file` with separate `GROQ_API_KEY` /
  `Google_Gemini_API_KEY`.
- **Reindex after doc edits:** `docker compose restart backend-jane`.
