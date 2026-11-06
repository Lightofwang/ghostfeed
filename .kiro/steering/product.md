# Product steering — GhostFeed

- Reader-owned, not algorithmic: the user chooses every source. Never add a "For you" algorithmic feed.
- No sign-up for the MVP. Every feature must work logged-out, with demo feeds preloaded.
- Dead sources are a feature, not an error state: show last-alive date and a replacement, don't just hide them.
- Never invent a feed URL. Replacement suggestions come only from the curated list in `src/lib/replacements.ts`.
- English UI and English submission materials (Devpost requires English).
