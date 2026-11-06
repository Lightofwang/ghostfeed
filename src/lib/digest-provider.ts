import type { FeedItem } from "./types";

/**
 * Provider interface for digest generation.
 * Implementations: rule-based (default) and LLM (OpenAI-compatible).
 */
export interface DigestProvider {
  generate(items: FeedItem[]): Promise<string>;
  mode: "rule-based" | "ai";
}

/**
 * Rule-based digest provider (default, no LLM key needed).
 * Returns a simple numbered list of items.
 */
export class RuleBasedProvider implements DigestProvider {
  mode = "rule-based" as const;

  async generate(items: FeedItem[]): Promise<string> {
    if (items.length === 0) {
      return "No new items in the last 24 hours. The graveyard is quiet.";
    }
    const lines = items
      .slice(0, 8)
      .map((it, i) => `${i + 1}. ${it.title} — ${it.sourceTitle}`);
    return `Today in ${items.length} new ${items.length === 1 ? "item" : "items"}:\n${lines.join("\n")}`;
  }
}

/**
 * OpenAI-compatible LLM provider (opt-in via LLM_BASE_URL + LLM_API_KEY).
 * Uses new-api or any OpenAI-compatible endpoint.
 * Throws on failure — caller must handle fallback to rule-based.
 */
export class LLMProvider implements DigestProvider {
  mode = "ai" as const;

  constructor(
    private baseUrl: string,
    private apiKey: string,
    private model: string = "gpt-4o-mini"
  ) {}

  async generate(items: FeedItem[]): Promise<string> {
    const headlines = items
      .map((i) => `- ${i.title} (${i.sourceTitle})`)
      .join("\n") || "No new items.";

    const res = await fetch(
      `${this.baseUrl.replace(/\/$/, "")}/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: "system",
              content:
                "Summarise these RSS headlines in 5 short bullet points, plain English.",
            },
            {
              role: "user",
              content: headlines,
            },
          ],
        }),
      }
    );

    if (!res.ok) {
      throw new Error(`LLM API returned ${res.status}`);
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content as string | undefined;

    if (!text) {
      throw new Error("LLM API returned no content");
    }

    return text;
  }
}

/**
 * Factory function to create the appropriate provider based on environment.
 * Returns LLMProvider if LLM_BASE_URL and LLM_API_KEY are set, otherwise RuleBasedProvider.
 */
export function createDigestProvider(): DigestProvider {
  const baseUrl = process.env.LLM_BASE_URL;
  const apiKey = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL ?? "gpt-4o-mini";

  if (baseUrl && apiKey) {
    return new LLMProvider(baseUrl, apiKey, model);
  }

  return new RuleBasedProvider();
}
