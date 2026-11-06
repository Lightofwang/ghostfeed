import type { FeedItem } from "./types";

/** Rule-based digest (default, no LLM key needed). Label it as such in the UI. */
export function ruleBasedDigest(items: FeedItem[]): string {
  if (items.length === 0) return "No new items in the last 24 hours. The graveyard is quiet.";
  const lines = items.slice(0, 8).map((it, i) => `${i + 1}. ${it.title} — ${it.sourceTitle}`);
  return `Today in ${items.length} new ${items.length === 1 ? "item" : "items"}:\n${lines.join("\n")}`;
}

export function topItemsLast24h(items: FeedItem[], now = new Date()): FeedItem[] {
  const cutoff = now.getTime() - 24 * 60 * 60 * 1000;
  return items
    .filter((it) => {
      if (!it.pubDate) return true; // undated items stay visible rather than disappearing
      const t = new Date(it.pubDate).getTime();
      return !Number.isNaN(t) && t >= cutoff;
    })
    .sort((a, b) => {
      const ta = a.pubDate ? new Date(a.pubDate).getTime() : 0;
      const tb = b.pubDate ? new Date(b.pubDate).getTime() : 0;
      return tb - ta;
    })
    .slice(0, 8);
}
