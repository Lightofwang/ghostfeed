import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import Home from "./page";
import { SEED_FEEDS } from "@/lib/seed";

describe("Home page seed feeds auto-load", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    localStorage.clear();
    container = document.createElement("div");
    document.body.appendChild(container);
    // Tell React 18 we are in an act environment
    (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.restoreAllMocks();
  });

  it("loads the 4 seed feeds and fetches their articles automatically on first visit with empty localStorage", async () => {
    const fetchedUrls: string[] = [];
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const reqUrl = typeof input === "string" ? input : input.toString();
      const parsed = new URL(reqUrl, "http://localhost");
      const feedUrl = parsed.searchParams.get("url") ?? "";
      fetchedUrls.push(feedUrl);

      const seed = SEED_FEEDS.find((s) => s.url === feedUrl);
      const title = seed ? seed.title : "Unknown Feed";
      return new Response(
        JSON.stringify({
          title,
          siteUrl: seed?.siteUrl,
          lastPublishedAt: new Date().toISOString(),
          items: [
            {
              title: `Article from ${title}`,
              link: `${seed?.siteUrl ?? "https://example.com"}/article-1`,
              pubDate: new Date().toISOString(),
              sourceTitle: title,
              sourceUrl: feedUrl,
              snippet: `Snippet from ${title}`,
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    });

    const root = createRoot(container);
    await act(async () => {
      root.render(
        <React.StrictMode>
          <Home />
        </React.StrictMode>
      );
    });

    // Wait for async effects and fetch promises to flush
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });

    // Verify all 4 seed feeds are displayed
    expect(container.textContent).toContain("Hacker News");
    expect(container.textContent).toContain("The Verge");
    expect(container.textContent).toContain("CSS-Tricks");
    expect(container.textContent).toContain("Nature News");

    // Verify /api/feeds was called for each of the 4 seed feeds, and guarded against StrictMode double-fetch
    expect(fetchedUrls).toEqual([
      "https://hnrss.org/frontpage",
      "https://www.theverge.com/rss/index.xml",
      "https://css-tricks.com/feed/",
      "https://www.nature.com/nature.rss",
    ]);

    // Verify articles are rendered in Latest and empty state is gone
    expect(container.textContent).not.toContain("No items yet — add a feed above.");
    expect(container.textContent).toContain("Article from Hacker News");
    expect(container.textContent).toContain("Article from The Verge");
    expect(container.textContent).toContain("Article from CSS-Tricks");
    expect(container.textContent).toContain("Article from Nature News");

    await act(async () => {
      root.unmount();
    });
  });

  it("waits for all 4 seed feeds to finish and keeps at most 5 newest items per feed so all 4 sources appear in Latest", async () => {
    const resolvers = new Map<string, (res: Response) => void>();

    vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
      const reqUrl = typeof input === "string" ? input : input.toString();
      const parsed = new URL(reqUrl, "http://localhost");
      const feedUrl = parsed.searchParams.get("url") ?? "";
      return new Promise<Response>((resolve) => {
        resolvers.set(feedUrl, resolve);
      });
    });

    const root = createRoot(container);
    await act(async () => {
      root.render(<Home />);
    });

    // While feeds are in flight, should show loading state
    expect(container.textContent).toContain("Summoning latest articles…");

    // Resolve ONLY the first feed (Hacker News) with 15 very recent articles
    await act(async () => {
      resolvers.get("https://hnrss.org/frontpage")?.(
        new Response(
          JSON.stringify({
            title: "Hacker News: Front Page",
            lastPublishedAt: "2026-11-09T12:00:00.000Z",
            items: Array.from({ length: 15 }, (_, i) => ({
              title: `HN Article ${i + 1}`,
              link: `https://news.ycombinator.com/item?id=${i + 1}`,
              pubDate: new Date(Date.UTC(2026, 10, 9, 12, 0, 15 - i)).toISOString(),
              sourceTitle: "Hacker News",
              sourceUrl: "https://hnrss.org/frontpage",
            })),
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );
      await new Promise((r) => setTimeout(r, 10));
    });

    // Should still wait for the remaining feeds before rendering the list
    expect(container.textContent).toContain("Summoning latest articles…");
    expect(container.textContent).not.toContain("HN Article 1");

    // Resolve the remaining 3 feeds (each with 10 articles from earlier dates)
    await act(async () => {
      const otherSeeds = [
        { url: "https://www.theverge.com/rss/index.xml", name: "The Verge", day: 8 },
        { url: "https://css-tricks.com/feed/", name: "CSS-Tricks", day: 7 },
        { url: "https://www.nature.com/nature.rss", name: "Nature News", day: 6 },
      ];
      for (const s of otherSeeds) {
        resolvers.get(s.url)?.(
          new Response(
            JSON.stringify({
              title: s.name,
              lastPublishedAt: new Date(Date.UTC(2026, 10, s.day, 12, 0, 0)).toISOString(),
              items: Array.from({ length: 10 }, (_, i) => ({
                title: `${s.name} Article ${i + 1}`,
                link: `https://example.com/${s.day}/${i + 1}`,
                pubDate: new Date(Date.UTC(2026, 10, s.day, 12, 0, 10 - i)).toISOString(),
                sourceTitle: s.name,
                sourceUrl: s.url,
              })),
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          )
        );
      }
      await new Promise((r) => setTimeout(r, 20));
    });

    // Now all 4 feeds have finished: each feed should contribute 5 items (total 20 items)
    expect(container.textContent).not.toContain("Summoning latest articles…");
    expect(container.textContent).toContain("HN Article 1");
    expect(container.textContent).toContain("HN Article 5");
    expect(container.textContent).not.toContain("HN Article 6");
    expect(container.textContent).toContain("The Verge Article 1");
    expect(container.textContent).toContain("The Verge Article 5");
    expect(container.textContent).not.toContain("The Verge Article 6");
    expect(container.textContent).toContain("CSS-Tricks Article 1");
    expect(container.textContent).toContain("CSS-Tricks Article 5");
    expect(container.textContent).toContain("Nature News Article 1");
    expect(container.textContent).toContain("Nature News Article 5");

    await act(async () => {
      root.unmount();
    });
  });
});
