# Week 1 — MVP checklist (Nov 6–12, solo)

Goal by Nov 12: a working GhostFeed you can demo to a friend — subscribe, read, dead-feed graveyard, rule-based digest.

## Today (Nov 6) — do not wait for credits
- [ ] Devpost: confirm Join Hackathon
- [ ] Credits: submit the Credit Request Form with GhostFeed / Resurrection (provisional — it can be changed later)
- [ ] GitHub: create a public repo, push this scaffold (`git init`, add, commit, push) — check `/.kiro` is in the repo and NOT in `.gitignore`
- [ ] Local: `npm install && npm run dev`, open http://localhost:3000, add one feed by hand

## Nov 7–9 — core
- [ ] Verify the 4 seed feeds actually parse (Hacker News, The Verge, CSS-Tricks, Nature)
- [ ] Test a bad URL → clear error, no broken entry
- [ ] Test a dead feed (pick a blog that stopped in 2023) → Graveyard shows last-alive + replacement
- [ ] Digest button works with no LLM key (rule-based label visible)

## Nov 10–12 — harden
- [ ] `npm run build` passes; fix all TypeScript errors
- [ ] Deploy a public URL (Vercel or your VPS) — judges must be able to open it logged-out
- [ ] Tick off tasks in `.kiro/specs/ghostfeed/tasks.md` as you finish them

## If Kiro credits arrive mid-week
Use them for: LLM digest wiring (`LLM_BASE_URL`/`LLM_API_KEY`), property-based tests for the parser, and the OPML import/export stretch goal. Do not rewrite the MVP from scratch.
