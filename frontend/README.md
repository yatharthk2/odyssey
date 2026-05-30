# Odyssey frontend

Next.js (Pages Router) site for Yatharth Kapadia's portfolio, plus the Inpersona chat UI.

See the [root README](../readme.md) for the full architecture overview, content map, and end-to-end dev loop. This file is just the package-level cheatsheet.

## Quickstart

```bash
npm install        # legacy-peer-deps=true via .npmrc, required for React 19 + Next 16
npm run dev        # http://localhost:3000
npm run build      # production build
npm run start      # serve the production build
npm run lint
```

## Where things live

- **`pages/index.json`** — single source of truth for site content. Edit this, not the components.
- **`pages/index.tsx`** — home-page composition (imports each section component).
- **`pages/components/`** — section components (Hero, Experience, Projects, Skills, …).
- **`components/`** — cross-cutting components (Layout, ThemeToggle, animation primitives, `primitives/SectionCard`, `primitives/GradientHeading`, `primitives/InpersonaNavLink`).
- **`hooks/`** — shared React hooks (`useIsMobile`).
- **`types/config.ts`** — typed loader over `pages/index.json`. Extend the `Config` interface if you add a new top-level key.
- **`public/`** — static assets (company logos, project images, the resume PDF).
- **`styles/globals.css`** — Tailwind base layer plus the Inpersona chat animations.

## Connecting to the backend

The Inpersona chat opens a WebSocket built from `inpersona.websocketPort` / `inpersona.websocketPath` in `pages/index.json`. The protocol is derived from `window.location.protocol`, so dev (http) speaks `ws://` and prod (https) speaks `wss://`.

To run end-to-end locally, spin up the backend in another terminal:

```bash
cd ../backend && uv sync && uv run python -m uvicorn server:app --reload
```

…then reload the chat page.

## Stack

React 19 · Next.js 16 (Pages Router, Turbopack dev) · TypeScript · Tailwind CSS · framer-motion · lucide-react · react-icons · @formspree/react · react-markdown.
