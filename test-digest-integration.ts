/**
 * Integration test for digest API endpoint
 * Tests both rule-based and LLM modes
 * Run with: npx tsx test-digest-integration.ts
 */
import type { FeedItem } from "./src/lib/types";

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

async function testDigestEndpoint() {
  console.log("🧪 Testing digest API endpoint integration\n");

  // Start the dev server in the background (would need to be already running)
  console.log("⚠️  Make sure the dev server is running: npm run dev\n");

  console.log("Testing with sample items...");
  
  try {
    const response = await fetch("http://localhost:3000/api/digest", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ items: sampleItems }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    
    console.log("\n✅ Response received:");
    console.log(`Mode: ${data.mode}`);
    console.log(`\nDigest:\n${data.digest}`);

    if (data.mode === "rule-based") {
      console.log("\n✅ Rule-based mode working (no LLM configured)");
      console.log("💡 To test LLM mode, set LLM_BASE_URL and LLM_API_KEY");
    } else if (data.mode === "ai") {
      console.log("\n✅ AI mode working (LLM configured)");
    }

    console.log("\n🎉 Integration test passed!");
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    console.log("\n💡 Make sure the server is running: npm run dev");
    process.exit(1);
  }
}

testDigestEndpoint();
