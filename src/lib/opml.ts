import type { Feed } from "./types";

/**
 * Export feeds to OPML 2.0 format
 * @param feeds Array of Feed objects to export
 * @returns OPML XML string
 */
export function exportToOPML(feeds: Feed[]): string {
  const now = new Date().toUTCString();
  
  const outlines = feeds
    .map(feed => {
      const title = escapeXml(feed.title || "Untitled Feed");
      const xmlUrl = escapeXml(feed.url);
      const htmlUrl = feed.siteUrl ? escapeXml(feed.siteUrl) : xmlUrl;
      
      return `    <outline type="rss" text="${title}" title="${title}" xmlUrl="${xmlUrl}" htmlUrl="${htmlUrl}" />`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>GhostFeed Subscriptions</title>
    <dateCreated>${now}</dateCreated>
  </head>
  <body>
${outlines}
  </body>
</opml>`;
}

/**
 * Import feeds from OPML content
 * @param opmlContent OPML XML string
 * @returns Array of feed URLs extracted from the OPML
 * @throws Error if OPML parsing fails
 */
export function importFromOPML(opmlContent: string): string[] {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(opmlContent, "text/xml");
    
    // Check for parsing errors (including unclosed tags in environments like happy-dom)
    const parserError = doc.querySelector("parsererror");
    if (parserError || /<[^>]*</.test(opmlContent) || !doc.querySelector("opml")) {
      throw new Error("Invalid XML format");
    }
    
    // Find all outline elements
    const outlines = doc.querySelectorAll("outline");
    const urls: string[] = [];
    
    outlines.forEach(outline => {
      // OPML feeds can have xmlUrl or url attribute
      const xmlUrl = outline.getAttribute("xmlUrl") || outline.getAttribute("url");
      if (xmlUrl && xmlUrl.trim()) {
        urls.push(xmlUrl.trim());
      }
    });
    
    if (urls.length === 0) {
      throw new Error("No feeds found in OPML file");
    }
    
    return urls;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to parse OPML file");
  }
}

/**
 * Escape special XML characters
 */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Download OPML file to user's computer
 * @param opmlContent OPML XML string
 * @param filename Name of the file to download
 */
export function downloadOPML(opmlContent: string, filename: string = "ghostfeed-subscriptions.opml"): void {
  const blob = new Blob([opmlContent], { type: "application/xml" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
