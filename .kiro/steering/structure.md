# Structure steering — GhostFeed

- `src/app/` — pages + Route Handlers (`api/feeds`, `api/digest`).
- `src/lib/` — pure logic only: `types.ts`, `rss.ts`, `dead.ts`, `digest.ts`, `replacements.ts`, `seed.ts`. No React imports in `src/lib/`.
- `src/components/` — `FeedList.tsx`, `ItemList.tsx`, `Graveyard.tsx`, `DigestView.tsx`.
- `data/seed-feeds.json` — the 4 preloaded demo feeds.
- `.kiro/specs/ghostfeed/` — requirements.md, design.md, tasks.md. Update tasks.md when a task is done; never edit requirements without updating design.
- Never add `/.kiro` to `.gitignore`. The `/.kiro` directory at the repo root is a submission requirement.
