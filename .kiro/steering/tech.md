# Tech steering — GhostFeed

- Stack: Next.js 14 App Router, TypeScript (strict), Tailwind CSS. No database in the MVP.
- RSS fetching/parsing is server-side only (Route Handlers), never from the browser — avoids CORS.
- `rss-parser` with an 8s timeout; every fetch failure must produce a specific, user-facing error.
- AI digest behind a provider interface: rule-based by default, OpenAI-compatible LLM only when `LLM_BASE_URL` + `LLM_API_KEY` are set. LLM failure must fall back to rule-based, never crash the page.
- State: `localStorage` only. No auth, no cookies, no tracking in the MVP.
- Tests: property-based tests for the parser, unit tests for dead-source rules (90-day and 3-failure boundaries).
