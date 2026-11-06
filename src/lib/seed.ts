import type { Feed } from "./types";

export const SEED_FEEDS: Feed[] = [
  {
    id: "seed-hn", url: "https://hnrss.org/frontpage", title: "Hacker News",
    siteUrl: "https://news.ycombinator.com", status: "unknown",
    lastFetchedAt: new Date().toISOString(), consecutiveFailures: 0,
  },
  {
    id: "seed-verge", url: "https://www.theverge.com/rss/index.xml", title: "The Verge",
    siteUrl: "https://www.theverge.com", status: "unknown",
    lastFetchedAt: new Date().toISOString(), consecutiveFailures: 0,
  },
  {
    id: "seed-css", url: "https://css-tricks.com/feed/", title: "CSS-Tricks",
    siteUrl: "https://css-tricks.com", status: "unknown",
    lastFetchedAt: new Date().toISOString(), consecutiveFailures: 0,
  },
  {
    id: "seed-nature", url: "https://www.nature.com/nature.rss", title: "Nature News",
    siteUrl: "https://www.nature.com", status: "unknown",
    lastFetchedAt: new Date().toISOString(), consecutiveFailures: 0,
  },
];
