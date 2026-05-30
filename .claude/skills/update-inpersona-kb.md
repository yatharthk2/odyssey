---
name: update-inpersona-kb
description: Use when the chatbot needs to know about new or changed content — updated resume, new project to mention, FAQ entries, etc. The RAG knowledge base is the contents of `backend/documents/` (plus `deploy/documents/` on the server). Adding/editing files there requires a backend reindex, which this skill walks through.
---

# Updating the Inpersona knowledge base

The chatbot's answers are grounded in whatever files live in `backend/documents/` (local) and `deploy/documents/` (production, on the Hetzner server). LlamaIndex chunks them on first boot and stores embeddings in ChromaDB + a Property Graph. **A content change requires both the file update AND a reindex** — settings changes alone won't propagate to existing on-disk indices.

## The single source of truth

Today the production KB is just one file: `deploy/documents/resume.txt` on the server. The local repo has the same file at `backend/documents/resume.txt` (a clean LaTeX-stripped version of Yatharth's resume). Add more files (project READMEs, FAQs, blog posts) for richer answers — the chunker handles plain text and PDFs out of the box.

## Local update flow

```bash
# 1. Edit or add documents
vim backend/documents/resume.txt
# or drop new files in:
cp ~/project-readmes/*.md backend/documents/

# 2. Wipe the existing indices so the next boot rebuilds against the new content
rm -rf backend/storage backend/chroma_db backend/kg.html

# 3. Restart the local backend (assumes it was running)
lsof -i :8000 | awk 'NR>1 {print $2}' | sort -u | xargs -r kill 2>/dev/null
sleep 1
cd backend && .venv/bin/python -m uvicorn server:app --host 0.0.0.0 --port 8000 &
```

The first request after restart will trigger a full reindex (~30s for a single resume file, longer for more docs — KG extraction is the slow step because it makes one LLM call per chunk to pull out entities).

Watch for `Application startup complete.` then smoke test:

```bash
cd backend && .venv/bin/python <<'PY'
import asyncio, json, websockets
async def main():
    async with websockets.connect("ws://localhost:8000/chat") as ws:
        await ws.send(json.dumps({"question":"Tell me about your latest project","vector_store":"vector","query_transformation":None}))
        while True:
            m = json.loads(await asyncio.wait_for(ws.recv(), timeout=120))
            if m.get("error"): print("ERROR:", m["error"]); return
            if m["type"] == "chunk": print(m["content"], end="", flush=True)
            elif m["type"] == "complete": print("\n[OK]"); return
asyncio.run(main())
PY
```

## Production update flow

Two paths depending on what changed:

### Path A — just a content edit (resume.txt or similar)

The fastest path. SCP the new file up and force a reindex:

```bash
# 1. SCP the updated file
scp backend/documents/resume.txt root@178.104.211.36:/opt/odyssey/deploy/documents/resume.txt

# 2. Force the backend container to drop its indices and rebuild from the new content
ssh root@178.104.211.36 <<'EOF'
cd /opt/odyssey/deploy
docker compose exec backend rm -rf /app/storage /app/chroma_db /app/kg.html
docker compose restart backend
EOF

# 3. Watch the lifespan re-run (rebuild takes ~30-60s for a single file)
ssh root@178.104.211.36 'cd /opt/odyssey/deploy && docker compose logs -f backend'
# Look for "Application startup complete."
```

### Path B — content change that's also tracked in git

Commit the file change, push, and trigger a `git pull` on the server alongside the index wipe:

```bash
git add backend/documents/resume.txt
git commit -m "kb: refresh resume content"
git push origin main

ssh root@178.104.211.36 <<'EOF'
cd /opt/odyssey
git pull origin main
cp backend/documents/*.txt deploy/documents/
cd deploy
docker compose exec backend rm -rf /app/storage /app/chroma_db /app/kg.html
docker compose restart backend
EOF
```

(Note: `backend/documents/` in the repo and `deploy/documents/` on the server are kept in sync by manual copy. `deploy/documents/` is gitignored so its contents don't pollute the repo, but the repo's `backend/documents/` is the canonical source — that's why we copy from one to the other.)

### Smoke test after production reindex

```bash
cd backend && .venv/bin/python <<'PY'
import asyncio, json, websockets
async def main():
    async with websockets.connect("wss://api.yatharthk.com/chat") as ws:
        await ws.send(json.dumps({"question":"What's the most recent thing you've worked on?","vector_store":"vector","query_transformation":None}))
        while True:
            m = json.loads(await asyncio.wait_for(ws.recv(), timeout=120))
            if m.get("error"): print("ERROR:", m["error"]); return
            if m["type"] == "chunk": print(m["content"], end="", flush=True)
            elif m["type"] == "complete": print("\n[OK]"); return
asyncio.run(main())
PY
```

Ask something specific to the new content. If the answer reflects it, the reindex succeeded.

## Writing for the chunker

The RAG quality lives or dies on how the content is chunked. With the current settings (`chunk_size=800, chunk_overlap=100`), each chunk is roughly one section of the resume. Tips:

- **Prefer prose over bullet-only.** A short intro sentence per section gives the embedder semantic context that bullets-alone lack.
- **Use clear section headers** (`## Founding Engineer at Moss` rather than just `Moss`). The chunker preserves them and they help the LLM ground its citations.
- **Don't paste LaTeX or HTML directly.** Strip formatting first — keep it plain text or markdown. Special characters mostly survive but can confuse the retriever.
- **One topic per ~400-800 chars.** If a section grows beyond ~1200 chars, split it — multiple chunks beats one chunk that's too big to retrieve cleanly.

## When the chatbot gives stale answers

If you've updated content and the answers still reflect the old version, in priority order:
1. The Redis cache is serving a stale response (cleared after every reindex via `docker compose restart backend` — but a forgotten manual restart wouldn't). Run `docker compose exec redis redis-cli FLUSHDB` on the server.
2. The on-disk indices weren't actually wiped. Re-check that `storage/`, `chroma_db/`, and `kg.html` are gone inside the container: `docker compose exec backend ls /app/storage` should return "No such file or directory".
3. The new file isn't in `deploy/documents/` on the server. Verify with `ssh root@178.104.211.36 ls /opt/odyssey/deploy/documents/`.

## Cost note

A full reindex makes 1 LLM call per chunk via Groq for KG entity extraction. With ~10 chunks (typical resume), that's ~10 calls — well within free-tier limits. Larger KBs (50+ chunks) start running into the per-minute rate limit; the indexer retries with backoff but it takes longer.
