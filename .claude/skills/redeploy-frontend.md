---
name: redeploy-frontend
description: Use to ship frontend changes to production (yatharthk.com on Vercel) — content edits in `frontend/pages/index.json`, component changes under `frontend/pages/components/` or `frontend/components/`, styling tweaks in `globals.css`, or env var changes. The frontend auto-deploys on every push to `main`; this skill covers how that flow works and how to verify or roll back.
---

# Deploying the frontend (via Vercel)

The frontend lives at `yatharthk.com` (apex redirects to `www.yatharthk.com`) on Vercel's free Hobby tier. **Every push to `origin/main` triggers an automatic build and deploy** — there is no manual step on the Vercel side once it's set up.

## Standard flow

```bash
# Make your changes locally
npm --prefix frontend run dev          # verify on http://localhost:3000

# Commit and push to main
git add <files>
git commit -m "frontend: ..."
git push origin main
```

Vercel picks up the push within seconds. Build takes 60-90s. Deployment auto-aliases to `www.yatharthk.com` and the apex redirect target.

Watch progress at: https://vercel.com/yatharth-s-projects1/odyssey/deployments

## Project config (already set, don't change unless you mean to)

- **Root Directory:** `frontend` (Vercel runs everything from inside that dir — so `npm install` reads `frontend/.npmrc`'s `legacy-peer-deps=true`)
- **Framework Preset:** Next.js (auto-detected; do NOT leave it as "Other" — that breaks Next.js dynamic routing and serves 404 from Vercel's edge for every page)
- **Environment Variables:**
  - `NEXT_PUBLIC_INPERSONA_WS_URL = wss://api.yatharthk.com/chat` — production + preview + development scopes all set

If a deploy returns 404 for everything despite a "Ready" status, the Framework Preset has reverted to "Other". Settings → Framework Settings → set to Next.js → redeploy with cache cleared.

## Smoke test after deploy

```bash
curl -sI https://yatharthk.com/ | head -3                    # expect 307 redirect to www
curl -sI https://www.yatharthk.com/ | head -3                # expect 200
curl -sI https://www.yatharthk.com/inpersona | head -3       # expect 200
```

Or just open https://www.yatharthk.com/inpersona, watch the green "Connected" status pill appear (means WSS to api.yatharthk.com is alive), and ask a question.

## Rolling back a bad deploy

Vercel keeps the last ~30 deployments accessible. To roll back:

1. Vercel dashboard → Deployments
2. Find the last-known-good deployment
3. Click ⋯ → **Promote to Production**

This re-aliases www + apex to the older build in ~5 seconds. No DNS change needed.

Or via git:
```bash
git revert <bad-commit>
git push origin main     # triggers a new build with the revert
```

## Changing env vars

Vercel doesn't pick up env var changes from existing deployments — you must trigger a new deploy after editing them:

1. Vercel → Settings → Environment Variables → edit the variable → Save
2. Deployments → latest → ⋯ → Redeploy (with "Use existing Build Cache" checked is fine)

## Branch deploys / previews

Pushing to **any** branch other than `main` creates a preview deployment with its own URL (`odyssey-git-<branch>-yatharth-s-projects1.vercel.app`). Preview deployments are by default **password-protected** by Vercel's Deployment Protection — to share with anyone outside the team, either disable protection (Settings → Deployment Protection → Off for previews) or use a Protection Bypass link.

PR previews work the same way if you open a PR against `main`.

## What you can't do (limitations of the Hobby tier)

- No team members (free tier is solo)
- 100 GB bandwidth/month (way more than this site uses)
- No commercial usage technically (TOS — personal portfolio is fine)
- Deployment Protection on by default for preview deployments

If any of those become limiting, upgrade to Pro ($20/mo).
