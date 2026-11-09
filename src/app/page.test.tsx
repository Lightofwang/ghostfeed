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

  it("shows loading state initially and renders fast feeds immediately without waiting for slow feeds", async () => {
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

    // While all 4 feeds are still in flight, should show loading state instead of 'No items yet'
    expect(container.textContent).toContain("Summoning latest articles…");
    expect(container.textContent).not.toContain("No items yet — add a feed above.");

    // Resolve ONLY the first feed (Hacker News) while the other 3 remain pending
    await act(async () => {
      const resolveHN = resolvers.get("https://hnrss.org/frontpage");
      resolveHN?.(
        new Response(
          JSON.stringify({
            title: "Hacker News",
            lastPublishedAt: new Date().toISOString(),
            items: [
              {
                title: "Fast HN Article",
                link: "https://news.ycombinator.com/item?id=1",
                pubDate: new Date().toISOString(),
                sourceTitle: "Hacker News",
                sourceUrl: "https://hnrss.org/frontpage",
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );
      await new Promise((r) => setTimeout(r, 10));
    });

    // Fast HN Article must appear immediately even though the other 3 feeds haven't resolved yet
    expect(container.textContent).toContain("Fast HN Article");
    expect(container.textContent).not.toContain("Summoning latest articles…");
    expect(container.textContent).not.toContain("No items yet — add a feed above.");

    await act(async () => {
      root.unmount();
    });
  });
});
