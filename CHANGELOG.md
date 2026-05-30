# Changelog

All notable changes to **odyssey** (yatharthk.com portfolio + Inpersona AI) are documented in this file.

The format is based on [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/). This project does not yet ship tagged releases, so versions below are date-suffixed pseudo-versions (`MAJOR.MINOR.PATCH-YYYY-MM-DD`) ordered newest-first. Dates use `YYYY-MM-DD`.

Sections per release: **Added / Changed / Fixed / Removed / Security**.

---

## [0.4.0] — 2026-05-30 — RAG quality + CI prep

Tightens the Inpersona system prompt against issues surfaced by an end-to-end test harness, adds OpenAI as a third LLM provider, and lays down project documentation for future Claude Code sessions.

### Added
- Third LLM provider option: OpenAI alongside Groq and Gemini, wired through `ModelsManager.SUPPORTED_PROVIDERS` (a738c65).
- End-to-end `test-chat-modes` workflow that runs every (question × routing-mode) pair against the live WebSocket and adversarially judges responses for accuracy, HTML compliance, and relevance; companion skill playbook included (a613478).
- YC hackathon entry under achievements; Kelley School of Business logo wired into the experience section (94ad8b1).
- Rewritten top-level `CLAUDE.md` plus a suite of skill playbooks under `.claude/skills/` covering redeploys, KB updates, local stack, RAG diagnosis, DNS, and quality tuning (a988385).

### Changed
- System prompt now distinguishes "off-topic" from "on-topic but no data" via explicit case A/B/C handling, reducing false refusals on legitimate questions with no retrieved context (b3fbf15).
- Three quality regressions in `prompt.py` fixed based on signals from the test-chat-modes workflow (52acfd3).

### Fixed
- Responses no longer emit a literal `TL;DR:` prefix; the summary line is now rendered inline as intended (0a0ba7c).

---

## [0.3.0] — 2026-05-30 — Production deployment

Ships the site to production for the first time. Frontend lives on Vercel at <https://www.yatharthk.com>; backend WebSocket lives on a Hetzner CX23 at <wss://api.yatharthk.com/chat>, fronted by Caddy and run via `docker compose`.

### Added
- Vercel deployment scaffolding for the Next.js frontend, with `NEXT_PUBLIC_INPERSONA_WS_URL` wired through `InpersonaChat.tsx` so the WS endpoint is environment-driven (afd125e).
- Hetzner deployment under `deploy/`: `docker-compose.yml` (caddy + backend + redis), `Caddyfile` for automatic TLS, and a full provisioning runbook in `deploy/README.md` (afd125e).
- Manual redeploy workflow documented: SSH + `git pull` + `docker compose up -d --build backend` (afd125e).

---

## [0.2.0] — 2026-05-29 — Repo-wide cleanup

Migrates the backend off Poetry, prunes dead code from the frontend, makes portfolio content fully data-driven, and refreshes the resume content.

### Added
- Moss founding-engineer experience and latest resume content surfaced in the portfolio (4e63fc0).
- Shared frontend primitives extracted to `frontend/components/primitives/`: `SectionCard`, `GradientHeading`, `InpersonaNavLink` (0559332).
- `frontend/pages/index.json` as the single source of nearly all user-facing copy (experience, projects, achievements, testimonials, Inpersona toggle copy), with a typed loader at `frontend/types/config.ts` (0559332).
- `backend/settings.py` as the single source of truth for configuration, exposing `PropertyGraphSettings.from_env()` consumed by `server.py` at module load (82a4fd7).

### Changed
- Backend dependency management migrated from Poetry to `uv` 0.9.26 via `pyproject.toml` + `uv.lock`; bundled with a RAG quality pass (6e8790a).
- Frontend WebSocket client stability fix in `InpersonaChat.tsx` to handle reconnect / lifecycle edge cases (6e8790a).
- `backend/server.py` refactored to consume centralized settings instead of ad-hoc `os.environ` reads (82a4fd7).

### Removed
- Dead code and stale components purged from the frontend as part of the data-driven content migration (0559332).

---

## [0.1.0] — 2026-01 — Initial stack

First working version of the portfolio + Inpersona chatbot: Next.js 16 / React 19 frontend, FastAPI + LlamaIndex backend with Redis caching, Groq and Gemini providers.

### Added
- Google Gemini API integration; `model_provider` field on the WebSocket request lets clients toggle between Groq and Gemini per query (b774988).
- Redis-backed response caching in `ChatManager` and `QueryEngine`, keyed by lowercased question; silently disabled if Redis is unreachable (55480f0).
- Hero component with advanced framer-motion animations and responsive design (135f224).
- Open-Notif project entry with reveal animation in the Projects section (ead08c8).

### Changed
- Upgraded to Next.js 16.1.3 and React 19.2.3; TypeScript configuration updated to match (c2fce14).

### Fixed
- `.npmrc` added with `legacy-peer-deps=true` to unblock `npm install` against React-19-incompatible peer ranges in `react-markdown` and `@formspree/react` — do not delete (9518460).

[0.4.0]: #040--2026-05-30--rag-quality--ci-prep
[0.3.0]: #030--2026-05-30--production-deployment
[0.2.0]: #020--2026-05-29--repo-wide-cleanup
[0.1.0]: #010--2026-01--initial-stack
