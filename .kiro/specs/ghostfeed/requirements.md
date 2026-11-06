# GhostFeed — Requirements

## Introduction
GhostFeed revives RSS (Resurrection category, Kiroween 2026). Algorithmic feeds bury what readers actually want. GhostFeed brings back reader-owned subscription: subscribe to any RSS/Atom feed, see at a glance which sources are alive or dead, and get a short daily digest. No sign-up is required to try it.

## Glossary
- **Feed**: an RSS/Atom source identified by a URL.
- **Dead source**: a feed that has not published in 90+ days, repeatedly fails to fetch, or returns HTTP errors.
- **Digest**: a daily, plain-language summary of the newest items across subscribed feeds.
- **Ghost**: a dead source, shown in the graveyard UI with its last-alive date.

## Requirements

### Requirement 1 — Subscribe to any feed
**User Story:** As a reader, I want to add any RSS/Atom URL, so I can follow sources I choose instead of an algorithm.

#### Acceptance Criteria
1. WHEN the user submits a feed URL THEN the system SHALL fetch and parse it server-side and add it to the list within 10 seconds, or show a clear error.
2. WHEN a feed URL is invalid or unreachable THEN the system SHALL show a specific error (invalid URL / fetch failed / not a feed) and SHALL NOT add a broken entry.
3. WHEN a feed is added THEN the system SHALL store its title, site URL, and last-fetch time in localStorage (no account needed for the MVP).

### Requirement 2 — Read items
**User Story:** As a reader, I want to see the newest items across my feeds, so I can catch up in minutes.

#### Acceptance Criteria
1. WHEN the feed list loads THEN the system SHALL show items sorted newest-first with title, source, and published date.
2. WHEN the user clicks an item THEN the system SHALL open the original article in a new tab.
3. WHEN a feed has no items THEN the system SHALL show an empty state, not a blank page.

### Requirement 3 — Detect dead sources
**User Story:** As a reader, I want to know which of my sources have died, so I stop waiting for updates that will never come.

#### Acceptance Criteria
1. WHEN a feed has not published in 90+ days OR its last 3 fetches failed THEN the system SHALL mark it Dead.
2. WHEN a feed is Dead THEN the system SHALL show its last-alive date and last error in the graveyard view.
3. WHEN a feed recovers (publishes again / fetch succeeds) THEN the system SHALL mark it Alive again automatically.

### Requirement 4 — Suggest replacements
**User Story:** As a reader, I want a replacement suggestion when a source dies, so I don't lose that topic.

#### Acceptance Criteria
1. WHEN a feed is Dead THEN the system SHALL suggest at least one replacement from a curated list matched by topic keyword (e.g. tech, design, science).
2. WHEN the user accepts a suggestion THEN the system SHALL add the replacement feed with one click.
3. WHEN no curated match exists THEN the system SHALL say so honestly instead of inventing a URL.

### Requirement 5 — Daily digest (mock first, LLM later)
**User Story:** As a reader, I want a short daily digest, so I can read 5 minutes instead of 50.

#### Acceptance Criteria
1. WHEN the user opens the Digest view THEN the system SHALL show the top 5–8 items from the last 24h, grouped by feed.
2. WHEN no LLM key is configured THEN the system SHALL generate a rule-based digest (top items + one-line extract) and label it "Rule-based digest — connect an LLM for AI summaries".
3. WHEN `LLM_BASE_URL` + `LLM_API_KEY` are configured THEN the system SHALL call the OpenAI-compatible endpoint and replace the rule-based summary with an AI summary, with a fallback to the rule-based version on error.

### Requirement 6 — No sign-up to try
**User Story:** As a judge, I want to try the app without creating an account, so I can evaluate it in under a minute.

#### Acceptance Criteria
1. WHEN a first-time visitor opens the app THEN the system SHALL preload 4 working demo feeds.
2. WHEN the visitor adds/removes feeds THEN the system SHALL persist the change locally without any login.
3. THE system SHALL NOT require email, password, or OAuth for any MVP feature.
