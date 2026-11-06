import Parser from "rss-parser";
import type { FeedItem } from "./types";

const parser = new Parser({ timeout: 8000 });

export interface ParsedFeed {
  title: string;
  siteUrl?: string;
  items: FeedItem[];
  lastPublishedAt?: string;
}

export async function fetchFeed(url: string): Promise<ParsedFeed> {
  let parsed;
  try {
    parsed = await parser.parseURL(url);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Could not fetch this feed: ${msg}`);
  }
  const items: FeedItem[] = (parsed.items ?? []).map((it) => ({
    title: it.title ?? "(no title)",
    link: it.link ?? parsed.link ?? url,
    pubDate: it.pubDate ? new Date(it.pubDate).toISOString() : undefined,
    sourceTitle: parsed.title ?? url,
    sourceUrl: url,
    snippet: (it.contentSnippet ?? "").slice(0, 200) || undefined,
  }));
  const dates = items
    .map((i) => (i.pubDate ? new Date(i.pubDate).getTime() : NaN))
    .filter((t) => !Number.isNaN(t));
  return {
    title: parsed.title ?? url,
    siteUrl: parsed.link,
    items,
    lastPublishedAt: dates.length ? new Date(Math.max(...dates)).toISOString() : undefined,
  };
}
