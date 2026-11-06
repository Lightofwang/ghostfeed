# 👻 GhostFeed — RSS, back from the dead

**Kiroween 2026 · Resurrection category · Built with Kiro**

Algorithmic feeds bury what readers actually want. GhostFeed brings back reader-owned subscription: subscribe to any RSS/Atom feed, see at a glance which sources are alive or dead, and get a short daily digest. **No sign-up required** — judges can try it in under a minute.

## What it does
- **Subscribe to any feed** — paste an RSS/Atom URL; it is fetched and parsed server-side (no CORS issues).
- **Read newest-first** — items across your feeds, with source and date; click through to the original.
- **Graveyard** — a feed is marked Dead if it hasn't published in 90+ days or its last 3 fetches failed. Dead feeds show their last-alive date and last error, and recover automatically if they publish again.
- **Replacements** — dead sources get a curated replacement suggestion (never an invented URL), addable in one click.
- **Daily digest** — top items of the last 24h. Rule-based by default; set `LLM_BASE_URL` + `LLM_API_KEY` (OpenAI-compatible, e.g. new-api) for an AI summary, with automatic fallback to rule-based.

## Run it
```bash
npm install
npm run dev    # http://localhost:3000
npm run build  # production check
```

Optional (AI digest):
```bash
LLM_BASE_URL=https://your-new-api.example.com/v1
LLM_API_KEY=sk-...
LLM_MODEL=gpt-4o-mini
```

## How Kiro was used
- **Spec-driven development**: `.kiro/specs/ghostfeed/` holds `requirements.md`, `design.md`, and `tasks.md` — the spec was written before the code.
- **Steering docs**: `.kiro/steering/` (product / tech / structure) keeps every change aligned: no sign-up, server-side RSS only, never invent a feed URL.
- **Agent hooks**: `.kiro/hooks/on-save-typecheck.json` runs `tsc --noEmit` on save.
- **Property-based testing** (Week 2): parser invariants — any valid RSS/Atom sample parses without throwing.

## Tech
Next.js 14 (App Router) · TypeScript · Tailwind CSS · `rss-parser` · localStorage (no database, no auth in the MVP)

## License
MIT — see [LICENSE](LICENSE).
