# GhostFeed — Design

## Overview
Next.js 14 (App Router, TypeScript, Tailwind). No database in the MVP: feeds live in `localStorage`, fetching/parsing happens in Next.js Route Handlers so the browser never hits CORS walls. The AI digest is behind a provider interface with two implementations: rule-based (default) and OpenAI-compatible LLM (opt-in via env).

## Architecture
```
Browser (React, Tailwind, graveyard theme)
  └─ localStorage: feeds[], read state
  └─ GET  /api/feeds?url=...   → fetch + parse one feed (rss-parser)
  └─ POST /api/digest          → { items } → rule-based digest, or LLM if configured
```

## Components
- `FeedList` — subscribe form + feed cards with Alive / Dead badge.
- `ItemList` — newest-first items, source + date, opens original in new tab.
- `Graveyard` — dead feeds with last-alive date, last error, replacement suggestions.
- `DigestView` — top 5–8 items of the last 24h + summary, labelled rule-based or AI.

## Data Models
```ts
type FeedStatus = "alive" | "dead" | "unknown";
interface Feed {
  id: string; url: string; title: string; siteUrl?: string;
  status: FeedStatus; lastPublishedAt?: string; lastFetchedAt: string;
  lastError?: string; consecutiveFailures: number;
}
interface FeedItem {
  title: string; link: string; pubDate?: string;
  sourceTitle: string; sourceUrl: string; snippet?: string;
}
```

## Dead-source rules (must match requirements.md)
- Dead if `now - lastPublishedAt > 90 days`, OR `consecutiveFailures >= 3`.
- Recovered automatically on a successful fetch with a newer item.

## Replacement suggestions
Curated map in `src/lib/replacements.ts`: topic keyword → 1–3 known-good feed URLs (Hacker News, CSS-Tricks, Nature News, etc.). Never invent a URL; if no match, say so.

## Styling
Graveyard / ghost theme: near-black background `#0c0a12`, bone-white text, pumpkin-orange `#ff7a1a` accent, purple `#8b5cf6` secondary. Spooky elements (ghost 👻, tombstones 🪦) are labels and badges only — they must never hide the feed title, date, or link.

## Testing Strategy
- Property-based tests for the RSS parser: any valid RSS/Atom sample parses without throwing; dates always parse to a valid ISO string or `undefined`.
- Unit tests for dead-source detection: 90-day boundary, 3-failure boundary, recovery.
- Manual checklist: add a bad URL, add a dead feed, load with no network for the digest (falls back to rule-based).
