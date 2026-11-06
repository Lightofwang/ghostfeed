"use client";
import { useEffect, useMemo, useState } from "react";
import type { Feed, FeedItem } from "@/lib/types";
import { SEED_FEEDS } from "@/lib/seed";
import { detectStatus, daysSince } from "@/lib/dead";
import { suggestReplacements } from "@/lib/replacements";
const LS_KEY = "ghostfeed.feeds.v1";
function loadFeeds(): Feed[] {
  try { const raw = localStorage.getItem(LS_KEY); if (raw) return JSON.parse(raw) as Feed[]; } catch {}
  return SEED_FEEDS;
}
export default function Home() {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [items, setItems] = useState<FeedItem[]>([]);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [digest, setDigest] = useState<{ text: string; mode: string } | null>(null);
  useEffect(() => { setFeeds(loadFeeds()); }, []);
  useEffect(() => { if (feeds.length) localStorage.setItem(LS_KEY, JSON.stringify(feeds)); }, [feeds]);
  useEffect(() => {
    if (feeds.length === 0) return;
    (async () => {
      const all: FeedItem[] = [];
      const updated = await Promise.all(feeds.map(async (f) => {
        try {
          const r = await fetch(`/api/feeds?url=${encodeURIComponent(f.url)}`);
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          const d = await r.json();
          all.push(...(d.items ?? []));
          return { ...f, title: d.title ?? f.title, status: detectStatus({ lastPublishedAt: d.lastPublishedAt, consecutiveFailures: 0 }), lastPublishedAt: d.lastPublishedAt, lastFetchedAt: new Date().toISOString(), consecutiveFailures: 0, lastError: undefined };
        } catch (e) {
          const failures = f.consecutiveFailures + 1;
          return { ...f, status: detectStatus({ lastPublishedAt: f.lastPublishedAt, consecutiveFailures: failures }), lastFetchedAt: new Date().toISOString(), consecutiveFailures: failures, lastError: e instanceof Error ? e.message : "Fetch failed" };
        }
      }));
      setFeeds(updated);
      setItems(all.sort((a, b) => (b.pubDate ?? "").localeCompare(a.pubDate ?? "")));
    })();
  }, []);
  const dead = useMemo(() => feeds.filter((f) => f.status === "dead"), [feeds]);
  async function addFeed(e: React.FormEvent) {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const r = await fetch(`/api/feeds?url=${encodeURIComponent(url.trim())}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Could not add this feed.");
      const feed: Feed = { id: `f-${Date.now()}`, url: url.trim(), title: d.title, siteUrl: d.siteUrl, status: detectStatus({ lastPublishedAt: d.lastPublishedAt, consecutiveFailures: 0 }), lastPublishedAt: d.lastPublishedAt, lastFetchedAt: new Date().toISOString(), consecutiveFailures: 0 };
      setFeeds((p) => [...p, feed]); setItems((p) => [...(d.items ?? []), ...p]); setUrl("");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not add this feed."); } finally { setLoading(false); }
  }
  async function makeDigest() {
    const r = await fetch("/api/digest", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items }) });
    const d = await r.json(); setDigest({ text: d.digest, mode: d.mode });
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
        <div className="mt-6 flex flex-wrap gap-2">
          {feeds.map((f) => (
            <span key={f.id} className="rounded-full border border-zinc-700 px-3 py-1 text-sm">{f.status === "dead" ? "🪦 " : "✨ "}{f.title}<button className="ml-2 text-zinc-500" onClick={() => setFeeds((p) => p.filter((x) => x.id !== f.id))} aria-label={`Remove ${f.title}`}>×</button></span>
          ))}
        </div>
        <section className="mt-8">
          <div className="flex items-center justify-between"><h2 className="text-xl font-semibold">📰 Latest</h2><button onClick={makeDigest} className="rounded-lg border border-purple-500 px-3 py-1.5 text-sm text-purple-300">Daily digest</button></div>
          {digest && <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-zinc-900 p-4 text-sm">{digest.text}{"\n\n"}— {digest.mode === "ai" ? "AI digest" : "Rule-based digest — connect an LLM for AI summaries"}</pre>}
          <ul className="mt-4 space-y-3">
            {items.slice(0, 20).map((it, i) => (
              <li key={i} className="rounded-lg border border-zinc-800 p-3"><a href={it.link} target="_blank" rel="noreferrer" className="font-medium text-orange-300 hover:underline">{it.title}</a><p className="text-xs text-zinc-500">{it.sourceTitle}{it.pubDate ? ` · ${new Date(it.pubDate).toLocaleDateString()}` : ""}</p>{it.snippet && <p className="mt-1 text-sm text-zinc-400">{it.snippet}</p>}</li>
            ))}
            {items.length === 0 && <li className="text-zinc-500">No items yet — add a feed above.</li>}
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
