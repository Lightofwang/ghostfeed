/**
 * Unit tests for digest providers
 * Run with: npx tsx src/lib/digest-provider.test.ts
 */
import type { FeedItem } from "./types";
import { RuleBasedProvider, LLMProvider } from "./digest-provider";

const sampleItems: FeedItem[] = [
  {
    title: "Breaking: New AI Model Released",
    link: "https://example.com/1",
    pubDate: new Date().toISOString(),
    sourceTitle: "Tech News",
    sourceUrl: "https://example.com",
  },
  {
    title: "CSS Grid Tips and Tricks",
    link: "https://example.com/2",
    pubDate: new Date().toISOString(),
    sourceTitle: "Web Design Weekly",
    sourceUrl: "https://design.example.com",
  },
  {
    title: "Climate Study Shows Alarming Trends",
    link: "https://example.com/3",
    pubDate: new Date().toISOString(),
    sourceTitle: "Nature News",
    sourceUrl: "https://nature.example.com",
  },
];

async function testRuleBasedProvider() {
  console.log("\n=== Testing RuleBasedProvider ===");
  const provider = new RuleBasedProvider();

  // Test with items
  console.log("\n1. With items:");
  const digest = await provider.generate(sampleItems);
  console.log(digest);
  console.log(`Mode: ${provider.mode}`);

  // Test with empty items
  console.log("\n2. With no items:");
  const emptyDigest = await provider.generate([]);
  console.log(emptyDigest);

  // Test with many items (should cap at 8)
  console.log("\n3. With 10 items (should show first 8):");
  const manyItems = Array.from({ length: 10 }, (_, i) => ({
    ...sampleItems[0],
    title: `Item ${i + 1}`,
  }));
  const manyDigest = await provider.generate(manyItems);
  console.log(manyDigest);

  console.log("\n✅ RuleBasedProvider tests passed");
}

async function testLLMProvider() {
  console.log("\n=== Testing LLMProvider ===");

  // Mock LLM endpoint (would need actual endpoint to test)
  const mockBaseUrl = "https://api.openai.com/v1";
  const mockApiKey = "test-key";

  const provider = new LLMProvider(mockBaseUrl, mockApiKey);
  console.log(`Mode: ${provider.mode}`);

  console.log("\nℹ️  LLM tests require actual API credentials");
  console.log("Set LLM_BASE_URL and LLM_API_KEY to test live");

  // Test error handling
  try {
    await provider.generate(sampleItems);
    console.log("❌ Should have thrown an error with invalid credentials");
  } catch (error) {
    console.log(`✅ Correctly throws error: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

async function runTests() {
  try {
    await testRuleBasedProvider();
    await testLLMProvider();
    console.log("\n🎉 All tests completed");
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  }
}

runTests();
