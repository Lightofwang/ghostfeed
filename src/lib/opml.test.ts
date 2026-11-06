import { describe, it, expect } from "vitest";
import { exportToOPML, importFromOPML } from "./opml";
import type { Feed } from "./types";

describe("OPML export", () => {
  it("generates valid OPML 2.0 XML structure", () => {
    const feeds: Feed[] = [
      {
        id: "1",
        url: "https://example.com/feed.xml",
        title: "Example Feed",
        siteUrl: "https://example.com",
        status: "alive",
        lastFetchedAt: new Date().toISOString(),
        consecutiveFailures: 0,
      },
    ];

    const opml = exportToOPML(feeds);

    expect(opml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(opml).toContain('<opml version="2.0">');
    expect(opml).toContain("<head>");
    expect(opml).toContain("<title>GhostFeed Subscriptions</title>");
    expect(opml).toContain("<dateCreated>");
    expect(opml).toContain("</head>");
    expect(opml).toContain("<body>");
    expect(opml).toContain("</body>");
    expect(opml).toContain("</opml>");
  });

  it("includes all feeds with correct attributes", () => {
    const feeds: Feed[] = [
      {
        id: "1",
        url: "https://example.com/feed.xml",
        title: "Example Feed",
        siteUrl: "https://example.com",
        status: "alive",
        lastFetchedAt: new Date().toISOString(),
        consecutiveFailures: 0,
      },
      {
        id: "2",
        url: "https://test.com/rss",
        title: "Test Blog",
        status: "dead",
        lastFetchedAt: new Date().toISOString(),
        consecutiveFailures: 3,
      },
    ];

    const opml = exportToOPML(feeds);

    expect(opml).toContain('type="rss"');
    expect(opml).toContain('xmlUrl="https://example.com/feed.xml"');
    expect(opml).toContain('title="Example Feed"');
    expect(opml).toContain('htmlUrl="https://example.com"');
    expect(opml).toContain('xmlUrl="https://test.com/rss"');
    expect(opml).toContain('title="Test Blog"');
  });

  it("escapes special XML characters in titles and URLs", () => {
    const feeds: Feed[] = [
      {
        id: "1",
        url: "https://example.com/feed?id=1&test=2",
        title: 'Feed with "quotes" & <special> characters',
        status: "alive",
        lastFetchedAt: new Date().toISOString(),
        consecutiveFailures: 0,
      },
    ];

    const opml = exportToOPML(feeds);

    expect(opml).toContain("&quot;");
    expect(opml).toContain("&amp;");
    expect(opml).toContain("&lt;");
    expect(opml).toContain("&gt;");
    expect(opml).not.toContain('Feed with "quotes"');
    expect(opml).not.toContain("id=1&test=2");
  });

  it("handles feeds without siteUrl", () => {
    const feeds: Feed[] = [
      {
        id: "1",
        url: "https://example.com/feed.xml",
        title: "No Site URL",
        status: "alive",
        lastFetchedAt: new Date().toISOString(),
        consecutiveFailures: 0,
      },
    ];

    const opml = exportToOPML(feeds);

    // Should use xmlUrl as htmlUrl when siteUrl is missing
    expect(opml).toContain('htmlUrl="https://example.com/feed.xml"');
  });

  it("handles empty feed list", () => {
    const opml = exportToOPML([]);

    expect(opml).toContain("<body>");
    expect(opml).toContain("</body>");
    expect(opml).not.toContain("<outline");
  });

  it("handles feed with empty title", () => {
    const feeds: Feed[] = [
      {
        id: "1",
        url: "https://example.com/feed.xml",
        title: "",
        status: "alive",
        lastFetchedAt: new Date().toISOString(),
        consecutiveFailures: 0,
      },
    ];

    const opml = exportToOPML(feeds);

    expect(opml).toContain('title="Untitled Feed"');
  });
});

describe("OPML import", () => {
  it("parses standard OPML 2.0 with xmlUrl", () => {
    const opml = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>Test Subscriptions</title>
  </head>
  <body>
    <outline type="rss" text="Example Feed" title="Example Feed" xmlUrl="https://example.com/feed.xml" htmlUrl="https://example.com" />
    <outline type="rss" text="Test Blog" title="Test Blog" xmlUrl="https://test.com/rss" htmlUrl="https://test.com" />
  </body>
</opml>`;

    const urls = importFromOPML(opml);

    expect(urls).toHaveLength(2);
    expect(urls).toContain("https://example.com/feed.xml");
    expect(urls).toContain("https://test.com/rss");
  });

  it("parses OPML with url attribute (alternative format)", () => {
    const opml = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="1.0">
  <body>
    <outline type="rss" text="Feed" url="https://example.com/feed.xml" />
  </body>
</opml>`;

    const urls = importFromOPML(opml);

    expect(urls).toHaveLength(1);
    expect(urls[0]).toBe("https://example.com/feed.xml");
  });

  it("handles nested outlines (folders)", () => {
    const opml = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <body>
    <outline text="Tech">
      <outline type="rss" xmlUrl="https://tech1.com/feed" />
      <outline type="rss" xmlUrl="https://tech2.com/feed" />
    </outline>
    <outline type="rss" xmlUrl="https://other.com/feed" />
  </body>
</opml>`;

    const urls = importFromOPML(opml);

    expect(urls).toHaveLength(3);
    expect(urls).toContain("https://tech1.com/feed");
    expect(urls).toContain("https://tech2.com/feed");
    expect(urls).toContain("https://other.com/feed");
  });

  it("skips outlines without xmlUrl or url", () => {
    const opml = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <body>
    <outline text="Folder without URL" />
    <outline type="rss" xmlUrl="https://example.com/feed.xml" />
  </body>
</opml>`;

    const urls = importFromOPML(opml);

    expect(urls).toHaveLength(1);
    expect(urls[0]).toBe("https://example.com/feed.xml");
  });

  it("trims whitespace from URLs", () => {
    const opml = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <body>
    <outline type="rss" xmlUrl="  https://example.com/feed.xml  " />
  </body>
</opml>`;

    const urls = importFromOPML(opml);

    expect(urls).toHaveLength(1);
    expect(urls[0]).toBe("https://example.com/feed.xml");
  });

  it("throws error on invalid XML", () => {
    const invalidOpml = `<?xml version="1.0"?>
<opml>
  <body>
    <outline type="rss" xmlUrl="https://example.com/feed.xml"
  </body>
</opml>`;

    expect(() => importFromOPML(invalidOpml)).toThrow("Invalid XML format");
  });

  it("throws error on empty OPML (no feeds)", () => {
    const emptyOpml = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head><title>Empty</title></head>
  <body></body>
</opml>`;

    expect(() => importFromOPML(emptyOpml)).toThrow("No feeds found in OPML file");
  });

  it("throws error on non-XML content", () => {
    const notXml = "This is not XML";

    expect(() => importFromOPML(notXml)).toThrow();
  });

  it("handles OPML with special characters in URLs", () => {
    const opml = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <body>
    <outline type="rss" xmlUrl="https://example.com/feed?id=1&amp;test=2" />
  </body>
</opml>`;

    const urls = importFromOPML(opml);

    expect(urls).toHaveLength(1);
    expect(urls[0]).toBe("https://example.com/feed?id=1&test=2");
  });
});

describe("OPML round-trip", () => {
  it("exports and imports feeds correctly", () => {
    const originalFeeds: Feed[] = [
      {
        id: "1",
        url: "https://example.com/feed.xml",
        title: "Example Feed",
        siteUrl: "https://example.com",
        status: "alive",
        lastFetchedAt: new Date().toISOString(),
        consecutiveFailures: 0,
      },
      {
        id: "2",
        url: "https://test.com/rss",
        title: "Test Blog",
        status: "alive",
        lastFetchedAt: new Date().toISOString(),
        consecutiveFailures: 0,
      },
    ];

    const opml = exportToOPML(originalFeeds);
    const urls = importFromOPML(opml);

    expect(urls).toHaveLength(2);
    expect(urls).toContain("https://example.com/feed.xml");
    expect(urls).toContain("https://test.com/rss");
  });

  it("preserves special characters through export and import", () => {
    const feeds: Feed[] = [
      {
        id: "1",
        url: "https://example.com/feed?id=1&test=2",
        title: 'Feed with "quotes" & <special> characters',
        status: "alive",
        lastFetchedAt: new Date().toISOString(),
        consecutiveFailures: 0,
      },
    ];

    const opml = exportToOPML(feeds);
    const urls = importFromOPML(opml);

    expect(urls).toHaveLength(1);
    expect(urls[0]).toBe("https://example.com/feed?id=1&test=2");
  });
});
