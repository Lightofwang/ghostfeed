import { NextRequest, NextResponse } from "next/server";
import { fetchFeed } from "@/lib/rss";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing ?url=" }, { status: 400 });
  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL — please paste a full http(s) feed URL." }, { status: 400 });
  }
  try {
    const feed = await fetchFeed(url);
    return NextResponse.json(feed);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Fetch failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
