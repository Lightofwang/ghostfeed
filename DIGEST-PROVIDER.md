# Digest Provider Implementation

## Overview

Task 2.1 implements support for OpenAI-compatible LLM digest providers with automatic fallback to rule-based summaries. This allows GhostFeed to generate AI-powered summaries when configured, while maintaining backward compatibility with the rule-based approach.

## Architecture

The implementation uses a provider pattern with two implementations:

1. **RuleBasedProvider** (default) - Simple numbered list of items
2. **LLMProvider** (opt-in) - OpenAI-compatible API calls for AI summaries

## Configuration

Set these environment variables to enable AI digest:

```bash
LLM_BASE_URL=https://your-vps.example.com/v1
LLM_API_KEY=your-api-key-here
LLM_MODEL=gpt-4o-mini  # optional, defaults to gpt-4o-mini
```

Without these variables, the system automatically uses rule-based digests.

## Files Modified/Created

### Core Implementation

- **src/lib/digest-provider.ts** - Provider interface and implementations
  - `DigestProvider` interface
  - `RuleBasedProvider` class
  - `LLMProvider` class
  - `createDigestProvider()` factory function

- **src/app/api/digest/route.ts** - API endpoint with fallback logic
  - Creates provider based on environment
  - Catches LLM errors and falls back to rule-based
  - Returns `{ digest, mode }` to inform UI

### Configuration

- **.env.example** - Documents the LLM environment variables

### Tests

- **src/lib/digest-provider.test.ts** - Unit tests for both providers
- **test-digest-integration.ts** - Integration test for the API endpoint

## Behavior

### Rule-Based Mode (Default)

When `LLM_BASE_URL` or `LLM_API_KEY` are not set:

```
Today in 3 new items:
1. Breaking: New AI Model Released — Tech News
2. CSS Grid Tips and Tricks — Web Design Weekly
3. Climate Study Shows Alarming Trends — Nature News
```

UI displays: "Rule-based digest — connect an LLM for AI summaries"

### AI Mode (Configured)

When both environment variables are set and the LLM API succeeds:

```
Here are today's highlights:
• A new AI model was released with improved capabilities
• Web designers share helpful CSS Grid techniques
• New climate research reveals concerning trends
```

UI displays: "AI digest"

### Fallback on Error

If the LLM provider is configured but fails (network error, API error, etc.):
- Error is logged to console
- System automatically falls back to rule-based digest
- UI shows rule-based mode

## API Compatibility

The LLM provider works with any OpenAI-compatible endpoint:
- OpenAI official API
- new-api (as used on user's VPS)
- LocalAI
- Ollama with OpenAI compatibility layer
- Any other OpenAI-compatible service

## Testing

### Run Unit Tests

```bash
npx tsx src/lib/digest-provider.test.ts
```

### Run Integration Test

1. Start the dev server:
```bash
npm run dev
```

2. In another terminal:
```bash
npx tsx test-digest-integration.ts
```

### Test with Real LLM

1. Create a `.env.local` file:
```bash
LLM_BASE_URL=https://your-api-url/v1
LLM_API_KEY=your-key
```

2. Start the dev server:
```bash
npm run dev
```

3. Open http://localhost:3000 and click "Daily digest"

## Design Decisions

### Why Provider Pattern?

- Clean separation of concerns
- Easy to add more providers (Anthropic, local models, etc.)
- Testable without API calls
- Consistent interface regardless of implementation

### Why Factory Function?

The `createDigestProvider()` function:
- Centralizes environment variable checking
- Makes testing easier (can override in tests)
- Reduces duplication in route handlers

### Why Fallback in Route Handler?

Placing fallback logic in the API route (not the provider) allows:
- Logging of LLM failures
- Consistent error handling
- User never sees an error, just gets rule-based digest
- API can return mode information to the UI

### Why No Retry Logic?

For MVP simplicity:
- Fast failure keeps digest generation quick
- Rule-based fallback is always available
- Can add retry/circuit breaker in future if needed

## Requirements Validation

✅ **Requirement 5.1** - Top 5-8 items from last 24h (handled by `topItemsLast24h()`)
✅ **Requirement 5.2** - Rule-based digest when no LLM key, properly labeled
✅ **Requirement 5.3** - OpenAI-compatible API with fallback on error

## Future Enhancements

Potential improvements for later iterations:
- [ ] Retry logic with exponential backoff
- [ ] Circuit breaker pattern for repeated LLM failures
- [ ] Caching of digest for performance
- [ ] Support for other LLM providers (Anthropic, Gemini)
- [ ] User preference for digest style/length
- [ ] A/B testing between providers
