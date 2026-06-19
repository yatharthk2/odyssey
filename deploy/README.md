# Deployment

Production setup: **Vercel for the frontend, Hetzner CX22 + Docker for the backend.** ~$5/month total.

```
                            yatharthk.com  ─►  Vercel
                                                  │
                                  HTTPS           ▼
                                                Next.js
                                                  │
                                  WSS             ▼
                       api.yatharthk.com  ─►  Caddy  ─►  FastAPI  ─►  Redis
                                                ─────────────────────────────
                                                Hetzner CX22 (Docker compose)
```

The pieces:

| Piece | Where | What |
|---|---|---|
| `yatharthk.com` | Vercel | Next.js static site; chat connects out via WSS |
| `api.yatharthk.com` | Hetzner | Caddy (TLS + WS reverse proxy) → FastAPI backend → Redis cache |

The frontend is stateless and free to host. The backend is stateful (in-memory vector + KG indices, ~1GB RAM) and lives on a single small VPS.

---

## Prerequisites

- Domain you control (e.g. `yatharthk.com`) with DNS access (Cloudflare, Namecheap, etc.)
- A [Hetzner Cloud](https://www.hetzner.com/cloud) account
- A [Vercel](https://vercel.com) account, linked to your GitHub
- `GROQ_API_KEY` and `Google_Gemini_API_KEY` ready to paste

---

## 1. Provision the Hetzner box

1. **Create a CX22 server** in the Hetzner Cloud Console:
   - Image: **Ubuntu 24.04**
   - Type: **CX22** (2 vCPU, 4GB RAM, ~€4.51/mo)
   - Location: closest to your visitors (Ashburn for US, Falkenstein for EU)
   - SSH key: upload your `~/.ssh/id_ed25519.pub` so you can log in passwordlessly
   - Networking: leave default — Hetzner gives you a public IPv4

2. Note the IP. SSH in once to accept the host key:
   ```bash
   ssh root@<HETZNER_IP>
   ```

3. **Point DNS at it.** In your DNS provider, add:
   ```
   A    api.yatharthk.com    <HETZNER_IP>    300
   ```
   Wait 1–2 minutes for propagation. Verify with `dig +short api.yatharthk.com`.

4. **Install Docker** on the server (the official one-liner):
   ```bash
   curl -fsSL https://get.docker.com | sh
   ```

5. **Open the firewall** (Hetzner's UFW is closed by default for new servers — check your image):
   ```bash
   ufw allow 22/tcp && ufw allow 80/tcp && ufw allow 443/tcp && ufw --force enable
   ```

---

## 2. Deploy the backend

1. **Clone the repo on the server** (or on whichever machine you'll deploy from):
   ```bash
   cd /opt
   git clone https://github.com/yatharthk2/odyssey.git
   cd odyssey/deploy
   ```

2. **Create the env file** from the template:
   ```bash
   cp .env.example .env
   nano .env   # paste GROQ_API_KEY and Google_Gemini_API_KEY
   ```

3. **Stage your RAG documents.** The compose file mounts `deploy/documents/` read-only into the container. Copy what you want indexed:
   ```bash
   mkdir -p documents
   cp ../backend/documents/resume.txt documents/
   # Add any other docs you want the chatbot to know about here.
   ```

4. **Bring up the stack:**
   ```bash
   docker compose up -d --build
   ```
   First boot takes **3–5 minutes** — Caddy fetches the TLS cert and the backend downloads the embedding model + builds both the vector and KG indices from scratch. Subsequent restarts are ~10s because the indices and HuggingFace cache live on named volumes.

5. **Watch it come up:**
   ```bash
   docker compose logs -f backend
   ```
   You should see `Application startup complete.` Test from your laptop:
   ```bash
   curl https://api.yatharthk.com/health   # {"status":"ok"} once TLS + routing work
   curl https://api.yatharthk.com/ready    # {"status":"ready"} once indices are warm
   ```

---

## 3. Deploy the frontend

1. **Import the repo into Vercel** — log in, click "Add New Project", select `yatharthk2/odyssey`.

2. **Configure the project:**
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `frontend`
   - **Build Command:** *(leave default — Vercel runs `npm run build`)*
   - **Install Command:** *(leave default — Vercel respects `frontend/.npmrc` which sets `legacy-peer-deps=true`)*

3. **Environment variables:** add under Project → Settings → Environment Variables:
   ```
   NEXT_PUBLIC_INPERSONA_WS_URL = wss://api.yatharthk.com/chat
   ```
   (Production, Preview, and Development scopes — set for all three.)

4. **Deploy.** Vercel will build and deploy on every push to `main` from here on out.

5. **Point your apex domain** (`yatharthk.com`) at Vercel — Project → Settings → Domains → Add. Vercel walks you through the DNS records (one `A` and one `CNAME`, typically).

---

## 4. Verify end-to-end

1. Open `https://yatharthk.com`
2. Hit "Inpersona" — the chat page should show **🟢 Connected** within a second
3. Ask "What's your current role?" — answer should stream in

If the green light never appears, the backend WebSocket isn't reachable. Check from your laptop:
```bash
# Should return HTTP/1.1 101 Switching Protocols
wscat -c wss://api.yatharthk.com/chat
```

---

## Day-2 ops

| Task | Command |
|---|---|
| Health / readiness | `curl https://api.yatharthk.com/health` (liveness) · `/ready` (indices warm) |
| Metrics (Prometheus) | `curl https://api.yatharthk.com/metrics` — query count, cache-hit rate, error rate, latency, active connections |
| Update the chatbot's knowledge | Edit `deploy/documents/resume.txt` on the server, then `docker compose exec backend rm -rf /app/storage/* /app/chroma_db/* && docker compose restart backend` to force re-indexing |
| Update the backend code | `cd /opt/odyssey && git pull && cd deploy && docker compose up -d --build backend` |
| View logs | `docker compose logs -f backend` (or `caddy`, `redis`) |
| Restart everything | `docker compose restart` |
| Wipe the cache | `docker compose exec redis redis-cli FLUSHDB` |
| Check Caddy TLS status | `docker compose exec caddy caddy validate --config /etc/caddy/Caddyfile` |
| Server disk usage | `du -sh /var/lib/docker/volumes/deploy_*` |

### Rotating API keys

1. `nano .env` — paste new keys
2. `docker compose up -d backend` (recreates the container with new env)

### Changing models / settings

The full list of tunable settings lives in [`backend/settings.py`](../backend/settings.py) — `chunk_size`, `groq_model`, `default_model_provider`, etc. Most can be overridden by env vars in `.env` (see the docstring at the top of that file). Rebuild + restart after changes.

### Costs

- Hetzner CX22: **€4.51 / month** (~$5)
- Vercel Hobby: **$0** (more than enough for portfolio traffic)
- Groq API: **$0** at low volume (free tier ≈ 30 req/min on `llama-3.1-8b-instant`)
- Google Gemini API: **$0** at low volume (free tier ≈ 15 req/min on gemini-2.5-pro)
- Domain renewal: whatever you already pay

**Total: ~$5/month.**

---

## Common gotchas

- **Green light flickers on Inpersona.** Means the WebSocket is reconnecting. Check `docker compose logs backend` for errors (Groq rate-limit 429s are the most common — switch the default model in `settings.py` or upgrade Groq).
- **Caddy can't get a cert.** DNS isn't propagated yet, or ports 80/443 aren't open. `docker compose logs caddy` will say exactly which.
- **Backend OOMs on boot.** The embedding model + LlamaIndex want ~1GB headroom. CX22 has 4GB, so this only happens if something else on the box is hogging memory. `htop` to investigate.
- **Vercel build fails with peer-dep errors.** Make sure `frontend/.npmrc` exists with `legacy-peer-deps=true` — it's there in the repo but worth double-checking.
- **Inpersona page says "Disconnected" in red.** The browser couldn't open the WSS connection. Open DevTools → Network → WS tab to see the actual failure (cert error, 502, etc.).
