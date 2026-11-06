export type FeedStatus = "alive" | "dead" | "unknown";

export interface Feed {
  id: string;
  url: string;
  title: string;
  siteUrl?: string;
  status: FeedStatus;
  lastPublishedAt?: string;
  lastFetchedAt: string;
  lastError?: string;
  consecutiveFailures: number;
}

export interface FeedItem {
  title: string;
  link: string;
  pubDate?: string;
  sourceTitle: string;
  sourceUrl: string;
  snippet?: string;
}
