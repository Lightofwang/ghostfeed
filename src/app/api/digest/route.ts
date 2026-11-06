import { NextRequest, NextResponse } from "next/server";
import { ruleBasedDigest, topItemsLast24h } from "@/lib/digest";
import type { FeedItem } from "@/lib/types";

/**
 * POST { items: FeedItem[] } → { digest, mode: "rule-based" | "ai" }
 * AI mode is opt-in: set LLM_BASE_URL + LLM_API_KEY (OpenAI-compatible, e.g. new-api).
 * Any LLM failure falls back to the rule-based digest — never crash the page.
 */
export async function POST(req: NextRequest) {
  const { items } = (await req.json()) as { items: FeedItem[] };
  const top = topItemsLast24h(items ?? []);
  const baseUrl = process.env.LLM_BASE_URL;
  const apiKey = process.env.LLM_API_KEY;
  if (baseUrl && apiKey) {
    try {
      const res = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: process.env.LLM_MODEL ?? "gpt-4o-mini",
          messages: [
            { role: "system", content: "Summarise these RSS headlines in 5 short bullet points, plain English." },
            { role: "user", content: top.map((i) => `- ${i.title} (${i.sourceTitle})`).join("\n") || "No new items." },
          ],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content as string | undefined;
        if (text) return NextResponse.json({ digest: text, mode: "ai" });
      }
    } catch {
      // fall through to rule-based
    }
  }
  return NextResponse.json({ digest: ruleBasedDigest(top), mode: "rule-based" });
}
