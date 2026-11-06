import { NextRequest, NextResponse } from "next/server";
import { topItemsLast24h } from "@/lib/digest";
import { createDigestProvider, RuleBasedProvider } from "@/lib/digest-provider";
import type { FeedItem } from "@/lib/types";

/**
 * POST { items: FeedItem[] } → { digest, mode: "rule-based" | "ai" }
 * AI mode is opt-in: set LLM_BASE_URL + LLM_API_KEY (OpenAI-compatible, e.g. new-api).
 * Any LLM failure falls back to the rule-based digest — never crash the page.
 */
export async function POST(req: NextRequest) {
  const { items } = (await req.json()) as { items: FeedItem[] };
  const top = topItemsLast24h(items ?? []);

  // Create provider based on environment (LLM if configured, rule-based otherwise)
  const provider = createDigestProvider();
  const fallback = new RuleBasedProvider();

  try {
    const digest = await provider.generate(top);
    return NextResponse.json({ digest, mode: provider.mode });
  } catch (error) {
    // On LLM failure, fall back to rule-based
    console.error("LLM digest failed, falling back to rule-based:", error);
    const digest = await fallback.generate(top);
    return NextResponse.json({ digest, mode: fallback.mode });
  }
}
