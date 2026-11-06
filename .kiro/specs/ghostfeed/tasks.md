# GhostFeed — Implementation Plan (solo, 28 days)

## Week 1 — MVP (Nov 6–12) — this week
- [x] Scaffold Next.js 14 + TypeScript + Tailwind; add MIT LICENSE; confirm `.kiro/` is NOT in `.gitignore`
- [x] 1.1 `src/lib/types.ts` + `src/lib/rss.ts`: server-side fetch + parse with `rss-parser`, timeout 8s
- [x] 1.2 `src/app/api/feeds/route.ts`: `GET ?url=` returns parsed feed or a specific error
- [x] 1.3 `FeedList` + subscribe form: add / remove feeds, persist to localStorage, preload 4 demo feeds (in `src/app/page.tsx` + `src/lib/seed.ts`)
- [x] 1.4 `ItemList`: newest-first, title + source + date, open original in new tab (in `src/app/page.tsx`)
- [x] 1.5 Dead detection in `src/lib/dead.ts`: 90-day rule + 3-failure rule + auto-recovery
- [x] 1.6 `Graveyard` view + `src/lib/replacements.ts`: curated replacements, one-click add (in `src/app/page.tsx`)
- [x] 1.7 `POST /api/digest` + `DigestView`: rule-based top 5–8 of last 24h, labelled as rule-based
- [x] 1.8 Graveyard theme in `globals.css` + responsive layout; `npm run build` passes

> Verified 2026-11-06: `npm run build` passed; live test fetched real Hacker News feed via `/api/feeds` and `/api/digest` returned a rule-based digest. Remaining Week 1 work is yours to verify by hand (see below), not to re-implement.

## Week 2 — Polish + Kiro depth (Nov 13–19)
- [ ] 2.1 LLM digest: OpenAI-compatible provider via `LLM_BASE_URL` / `LLM_API_KEY` (works with new-api on the user's VPS), fallback to rule-based
- [ ] 2.2 Property-based tests for the parser (fast-check) + unit tests for dead detection
- [ ] 2.3 Kiro hooks: on-save run `tsc --noEmit`; on spec change remind to update tasks.md
- [ ] 2.4 OPML import/export (one file, big demo win for RSS users)
- [ ] 2.5 Deploy to VPS / Vercel, public URL ready for judges

## Week 3 — Submission (Nov 20–Dec 4, deadline Dec 5 06:00 CST)
- [ ] 3.1 Record <3 min YouTube demo video (problem → subscribe → dead feed → replacement → digest)
- [ ] 3.2 Write Devpost text + "How Kiro was used" (spec-driven, hooks, steering, MCP, PBT — with concrete examples)
- [ ] 3.3 Social Blitz post starting with #KiroweenHackathon26 + optional blog post
- [ ] 3.4 Final check: public GitHub repo, LICENSE visible, `/.kiro` at root, demo URL works logged-out
- [ ] 3.5 Submit on Devpost before Dec 4 14:00 PT — do NOT leave it to the last day
