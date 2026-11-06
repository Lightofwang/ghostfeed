# 👻 GhostFeed — RSS, back from the dead

[![Netlify Status](https://api.netlify.com/api/v1/badges/1b849ac1-f3fd-4a23-b464-8ebef4ee9b5d/deploy-status)](https://app.netlify.com/projects/statuesque-cocada-f881c1/deploys)
[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://statuesque-cocada-f881c1.netlify.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Kiroween 2026 · Resurrection category · Built with Kiro**

**🌐 [Try Live Demo](https://statuesque-cocada-f881c1.netlify.app)** | **📖 [Deployment Guide](DEPLOYMENT.md)**

Algorithmic feeds bury what readers actually want. GhostFeed brings back reader-owned subscription: subscribe to any RSS/Atom feed, see at a glance which sources are alive or dead, and get a short daily digest. **No sign-up required** — judges can try it in under a minute.

## What it does
- **Subscribe to any feed** — paste an RSS/Atom URL; it is fetched and parsed server-side (no CORS issues).
- **Read newest-first** — items across your feeds, with source and date; click through to the original.
- **Graveyard** — a feed is marked Dead if it hasn't published in 90+ days or its last 3 fetches failed. Dead feeds show their last-alive date and last error, and recover automatically if they publish again.
- **Replacements** — dead sources get a curated replacement suggestion (never an invented URL), addable in one click.
- **Daily digest** — top items of the last 24h. Rule-based by default; set `LLM_BASE_URL` + `LLM_API_KEY` (OpenAI-compatible, e.g. new-api) for an AI summary, with automatic fallback to rule-based.

## Run it locally
```bash
npm install
npm run dev    # http://localhost:3000
npm run build  # production check
```

## Deploy it

**Multiple deployment options available** — see [DEPLOYMENT.md](DEPLOYMENT.md) for complete guides.

Since Vercel is not available, we provide **5 deployment options**:

1. **Docker + VPS** (Recommended) — Full control, easy to manage
2. **Netlify** — Easiest, free tier, auto-deploy
3. **Railway** — Simple, $5 free credit, auto-deploy
4. **Cloudflare Pages** — Free, global CDN, unlimited bandwidth
5. **PM2 + Nginx + VPS** — Traditional setup, full control

**Quick Start (Docker + VPS)**:
```bash
# On your VPS
git clone <your-repo>
cd ghostfeed
docker compose up -d
```

**Quick Start (Netlify)**:
```bash
# Push to GitHub, then connect at netlify.com
git push origin main
# Follow Netlify dashboard to import project
```

The app runs without environment variables (rule-based digest). For AI-powered digest, set `LLM_BASE_URL`, `LLM_API_KEY`, and `LLM_MODEL` in your deployment platform.

### AI Digest (Optional)
GhostFeed uses a **provider interface** for digest generation with two implementations:

1. **Rule-based** (default) — simple numbered list, no LLM needed
2. **AI-powered** — connects to any OpenAI-compatible endpoint (OpenAI, new-api, local models)

To enable AI summaries, create a `.env.local` file:
```bash
LLM_BASE_URL=https://your-new-api.example.com/v1
LLM_API_KEY=sk-...
LLM_MODEL=gpt-4o-mini  # optional, defaults to gpt-4o-mini
```

The system **automatically falls back** to rule-based digest if the LLM fails — the page never crashes.

## How Kiro was used
- **Spec-driven development**: `.kiro/specs/ghostfeed/` holds `requirements.md`, `design.md`, and `tasks.md` — the spec was written before the code.
- **Steering docs**: `.kiro/steering/` (product / tech / structure) keeps every change aligned: no sign-up, server-side RSS only, never invent a feed URL.
- **Agent hooks**: `.kiro/hooks/on-save-typecheck.json` runs `tsc --noEmit` on save.
- **Property-based testing** (Week 2): parser invariants — any valid RSS/Atom sample parses without throwing.

## Tech
Next.js 14 (App Router) · TypeScript · Tailwind CSS · `rss-parser` · localStorage (no database, no auth in the MVP)

## License
MIT — see [LICENSE](LICENSE).
