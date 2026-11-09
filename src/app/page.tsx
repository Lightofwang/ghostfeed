"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Feed, FeedItem } from "@/lib/types";
import { SEED_FEEDS } from "@/lib/seed";
import { detectStatus, daysSince } from "@/lib/dead";
import { suggestReplacements } from "@/lib/replacements";
import { exportToOPML, importFromOPML, downloadOPML } from "@/lib/opml";
const LS_KEY = "ghostfeed.feeds.v1";
const ITEMS_PER_FEED = 5;
function loadFeeds(): Feed[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Feed[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return SEED_FEEDS;
}
function pickFeedItems(rawItems: FeedItem[], sourceTitle: string): FeedItem[] {
  return [...rawItems]
    .map((it) => ({ ...it, sourceTitle: sourceTitle || it.sourceTitle }))
    .sort((a, b) => (b.pubDate ?? "").localeCompare(a.pubDate ?? ""))
    .slice(0, ITEMS_PER_FEED);
}
export default function Home() {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [items, setItems] = useState<FeedItem[]>([]);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingFeeds, setFetchingFeeds] = useState(true);
  const [digest, setDigest] = useState<{ text: string; mode: string } | null>(null);
  const [importStatus, setImportStatus] = useState("");
  const fetchedUrlsRef = useRef<Set<string>>(new Set());
  useEffect(() => { setFeeds(loadFeeds()); }, []);
  useEffect(() => { if (feeds.length) localStorage.setItem(LS_KEY, JSON.stringify(feeds)); }, [feeds]);
  useEffect(() => {
    if (feeds.length === 0) return;
    const toFetch = feeds.filter((f) => !fetchedUrlsRef.current.has(f.url));
    if (toFetch.length === 0) return;
    toFetch.forEach((f) => fetchedUrlsRef.current.add(f.url));
    setFetchingFeeds(true);
    (async () => {
      const all: FeedItem[] = [];
      const updates = new Map<string, Feed>();
      await Promise.all(
        toFetch.map(async (f) => {
          try {
            const r = await fetch(`/api/feeds?url=${encodeURIComponent(f.url)}`);
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            const d = await r.json();
            const displayTitle = f.title || d.title;
            all.push(...pickFeedItems(d.items ?? [], displayTitle));
            updates.set(f.id, {
              ...f,
              title: displayTitle,
              status: detectStatus({ lastPublishedAt: d.lastPublishedAt, consecutiveFailures: 0 }),
              lastPublishedAt: d.lastPublishedAt,
              lastFetchedAt: new Date().toISOString(),
              consecutiveFailures: 0,
              lastError: undefined,
            });
          } catch (e) {
            const failures = f.consecutiveFailures + 1;
            updates.set(f.id, {
              ...f,
              status: detectStatus({ lastPublishedAt: f.lastPublishedAt, consecutiveFailures: failures }),
              lastFetchedAt: new Date().toISOString(),
              consecutiveFailures: failures,
              lastError: e instanceof Error ? e.message : "Fetch failed",
            });
          }
        })
      );
      setFeeds((prev) => prev.map((f) => updates.get(f.id) ?? f));
      setItems((prev) =>
        [...prev, ...all].sort((a, b) => (b.pubDate ?? "").localeCompare(a.pubDate ?? ""))
      );
      setFetchingFeeds(false);
    })();
  }, [feeds]);
  const dead = useMemo(() => feeds.filter((f) => f.status === "dead"), [feeds]);
  async function addFeed(e: React.FormEvent) {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const trimmedUrl = url.trim();
      const r = await fetch(`/api/feeds?url=${encodeURIComponent(trimmedUrl)}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Could not add this feed.");
      fetchedUrlsRef.current.add(trimmedUrl);
      const feed: Feed = { id: `f-${Date.now()}`, url: trimmedUrl, title: d.title, siteUrl: d.siteUrl, status: detectStatus({ lastPublishedAt: d.lastPublishedAt, consecutiveFailures: 0 }), lastPublishedAt: d.lastPublishedAt, lastFetchedAt: new Date().toISOString(), consecutiveFailures: 0 };
      const picked = pickFeedItems(d.items ?? [], d.title);
      setFeeds((p) => [...p, feed]);
      setItems((p) => [...picked, ...p].sort((a, b) => (b.pubDate ?? "").localeCompare(a.pubDate ?? "")));
      setUrl("");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not add this feed."); } finally { setLoading(false); }
  }
  async function makeDigest() {
    const r = await fetch("/api/digest", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items }) });
    const d = await r.json(); setDigest({ text: d.digest, mode: d.mode });
  }

  function handleExportOPML() {
    try {
      const opmlContent = exportToOPML(feeds);
      downloadOPML(opmlContent);
      setImportStatus("✓ OPML exported successfully");
      setTimeout(() => setImportStatus(""), 3000);
    } catch (e) {
      setImportStatus("✗ Export failed: " + (e instanceof Error ? e.message : "Unknown error"));
      setTimeout(() => setImportStatus(""), 5000);
    }
  }

  async function handleImportOPML(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const inputElement = e.target;
    if (!file) return;

    setImportStatus("Importing...");

    try {
      const text = await file.text();
      const urls = importFromOPML(text);

      // Filter out duplicates
      const existingUrls = new Set(feeds.map(f => f.url));
      const newUrls = urls.filter(url => !existingUrls.has(url));

      if (newUrls.length === 0) {
        setImportStatus("✓ No new feeds to import (all already subscribed)");
        setTimeout(() => setImportStatus(""), 5000);
        inputElement.value = "";
        return;
      }

      // Add each new feed
      let successCount = 0;
      const newFeeds: Feed[] = [];
      const newItems: FeedItem[] = [];

      for (const url of newUrls) {
        try {
          const r = await fetch(`/api/feeds?url=${encodeURIComponent(url)}`);
          const d = await r.json();
          if (r.ok) {
            fetchedUrlsRef.current.add(url);
            const title = d.title || "Untitled Feed";
            const feed: Feed = {
              id: `f-${Date.now()}-${successCount}`,
              url: url,
              title,
              siteUrl: d.siteUrl,
              status: detectStatus({ lastPublishedAt: d.lastPublishedAt, consecutiveFailures: 0 }),
              lastPublishedAt: d.lastPublishedAt,
              lastFetchedAt: new Date().toISOString(),
              consecutiveFailures: 0
            };
            newFeeds.push(feed);
            newItems.push(...pickFeedItems(d.items ?? [], title));
            successCount++;
          }
        } catch {
          // Skip feeds that fail to fetch
          continue;
        }
      }

      if (successCount > 0) {
        setFeeds(prev => [...prev, ...newFeeds]);
        setItems(prev => [...newItems, ...prev].sort((a, b) => (b.pubDate ?? "").localeCompare(a.pubDate ?? "")));
        setImportStatus(`✓ Successfully imported ${successCount} feed${successCount !== 1 ? 's' : ''}`);
      } else {
        setImportStatus("✗ Could not import any feeds (all failed to fetch)");
      }

      setTimeout(() => setImportStatus(""), 5000);

      // Reset file input
      inputElement.value = "";
    } catch (err) {
      setImportStatus("✗ Import failed: " + (err instanceof Error ? err.message : "Invalid OPML file"));
      setTimeout(() => setImportStatus(""), 5000);
      inputElement.value = "";
    }
  }

  return (
    <main className="min-h-screen bg-[#0c0a12] text-zinc-100">
      <div className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="text-4xl font-bold">👻 GhostFeed</h1>
        <p className="mt-2 text-zinc-400">RSS, back from the dead. Subscribe to what you choose — no algorithm, no sign-up.</p>
        <form onSubmit={addFeed} className="mt-6 flex gap-2">
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste an RSS / Atom URL…" className="flex-1 rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 outline-none focus:border-orange-500" />
          <button disabled={loading} className="rounded-lg bg-orange-500 px-4 py-2 font-semibold text-black disabled:opacity-50">{loading ? "Summoning…" : "Add feed"}</button>
        </form>
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

        <div className="mt-4 flex gap-2 items-center">
          <button
            onClick={handleExportOPML}
            disabled={feeds.length === 0}
            className="rounded-lg border border-purple-500 px-3 py-1.5 text-sm text-purple-300 hover:bg-purple-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Export all feeds as OPML"
          >
            📤 Export OPML
          </button>
          <label className="rounded-lg border border-purple-500 px-3 py-1.5 text-sm text-purple-300 hover:bg-purple-500/10 cursor-pointer">
            📥 Import OPML
            <input
              type="file"
              accept=".opml,.xml"
              onChange={handleImportOPML}
              className="hidden"
            />
          </label>
          {importStatus && <span className="text-sm text-zinc-400">{importStatus}</span>}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {feeds.map((f) => (
            <span key={f.id} className="rounded-full border border-zinc-700 px-3 py-1 text-sm">{f.status === "dead" ? "🪦 " : "✨ "}{f.title}<button className="ml-2 text-zinc-500" onClick={() => { fetchedUrlsRef.current.delete(f.url); setFeeds((p) => p.filter((x) => x.id !== f.id)); }} aria-label={`Remove ${f.title}`}>×</button></span>
          ))}
        </div>
        <section className="mt-8">
          <div className="flex items-center justify-between"><h2 className="text-xl font-semibold">📰 Latest</h2><button onClick={makeDigest} className="rounded-lg border border-purple-500 px-3 py-1.5 text-sm text-purple-300">Daily digest</button></div>
          {digest && <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-zinc-900 p-4 text-sm">{digest.text}{"\n\n"}— {digest.mode === "ai" ? "AI digest" : "Rule-based digest — connect an LLM for AI summaries"}</pre>}
          <ul className="mt-4 space-y-3">
            {items.slice(0, 20).map((it, i) => (
              <li key={i} className="rounded-lg border border-zinc-800 p-3"><a href={it.link} target="_blank" rel="noreferrer" className="font-medium text-orange-300 hover:underline">{it.title}</a><p className="text-xs text-zinc-500">{it.sourceTitle}{it.pubDate ? ` · ${new Date(it.pubDate).toLocaleDateString()}` : ""}</p>{it.snippet && <p className="mt-1 text-sm text-zinc-400">{it.snippet}</p>}</li>
            ))}
            {items.length === 0 && (
              <li className="text-zinc-500">
                {fetchingFeeds && feeds.length > 0 ? "Summoning latest articles…" : "No items yet — add a feed above."}
              </li>
            )}
          </ul>
        </section>
        {dead.length > 0 && (
          <section className="mt-10"><h2 className="text-xl font-semibold">🪦 Graveyard — dead sources</h2>
            {dead.map((f) => (
              <div key={f.id} className="mt-3 rounded-lg border border-zinc-800 p-4"><p className="font-medium">{f.title}</p><p className="text-sm text-zinc-500">Last alive: {f.lastPublishedAt ? `${daysSince(f.lastPublishedAt)} days ago` : "unknown"}{f.lastError ? ` · ${f.lastError}` : ""}</p>
                <div className="mt-2 flex flex-wrap gap-2">{suggestReplacements(f.title, f.url).map((r) => (<button key={r.url} className="rounded-full bg-zinc-800 px-3 py-1 text-sm" onClick={() => setUrl(r.url)}>Try instead: {r.title} →</button>))}{suggestReplacements(f.title, f.url).length === 0 && <span className="text-sm text-zinc-500">No curated replacement for this topic yet.</span>}</div></div>
            ))}
          </section>
        )}
        <footer className="mt-12 text-xs text-zinc-600">GhostFeed — Kiroween 2026, Resurrection. Built with Kiro. No account needed.</footer>
      </div>
    </main>
  );
}
