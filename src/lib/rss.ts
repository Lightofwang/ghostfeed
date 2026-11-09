import Parser from "rss-parser";
import type { FeedItem } from "./types";

const parser = new Parser({
  timeout: 8000,
  headers: {
    "User-Agent": "GhostFeed/1.0 (+https://github.com/Lightofwang/ghostfeed)",
    Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
  },
  customFields: {
    item: [["dc:date", "dcDate"]],
  },
});

export interface ParsedFeed {
  title: string;
  siteUrl?: string;
  items: FeedItem[];
  lastPublishedAt?: string;
}

const CACHE_TTL_MS = 5 * 60 * 1000;
const feedCache = new Map<string, { data: ParsedFeed; expiresAt: number }>();

const FALLBACK_URLS: Record<string, string> = {
  "https://hnrss.org/frontpage": "https://news.ycombinator.com/rss",
};

function toIsoDate(raw: unknown): string | undefined {
  if (!raw || typeof raw !== "string") return undefined;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

export async function fetchFeed(url: string): Promise<ParsedFeed> {
  const cached = feedCache.get(url);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  let parsed;
  try {
    parsed = await parser.parseURL(url);
  } catch (err) {
    const fallbackUrl = FALLBACK_URLS[url];
    if (fallbackUrl) {
      try {
        parsed = await parser.parseURL(fallbackUrl);
      } catch {
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(`Could not fetch this feed: ${msg}`);
      }
    } else {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Could not fetch this feed: ${msg}`);
    }
  }

  const items: FeedItem[] = (parsed.items ?? []).map((it) => {
    const rawDate =
      it.isoDate ??
      it.pubDate ??
      (it as unknown as Record<string, unknown>).dcDate;
    return {
      title: it.title ?? "(no title)",
      link: it.link ?? parsed.link ?? url,
      pubDate: toIsoDate(rawDate),
      sourceTitle: parsed.title ?? url,
      sourceUrl: url,
      snippet: (it.contentSnippet ?? "").slice(0, 200) || undefined,
    };
  });
  const dates = items
    .map((i) => (i.pubDate ? new Date(i.pubDate).getTime() : NaN))
    .filter((t) => !Number.isNaN(t));

  const result: ParsedFeed = {
    title: parsed.title ?? url,
    siteUrl: parsed.link,
    items,
    lastPublishedAt: dates.length ? new Date(Math.max(...dates)).toISOString() : undefined,
  };

  feedCache.set(url, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
  return result;
}
