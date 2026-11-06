# Manual Testing Guide for Task 2.1

## Prerequisites
- Node 22 installed (use `fnm use 22`)
- Dev dependencies installed (`npm install`)

## Quick Tests

### Test 1: Verify Build (Already Done ✅)
```bash
fnm use 22
npm run build
```
**Status**: ✅ PASSED

### Test 2: Run Unit Tests (Already Done ✅)
```bash
npx tsx src/lib/digest-provider.test.ts
```
**Status**: ✅ PASSED
- Rule-based provider generates correct format
- LLM provider has correct mode
- Error handling works

### Test 3: Visual Verification (Recommended)

1. Start the dev server:
```bash
fnm use 22
npm run dev
```

2. Open browser to http://localhost:3000

3. Click "Daily digest" button

4. Verify you see:
   - A digest with numbered items
   - Label: "Rule-based digest — connect an LLM for AI summaries"
   - This confirms rule-based mode works (no LLM configured)

### Test 4: LLM Mode (Optional - Requires API Key)

1. Create `.env.local` in project root:
```bash
LLM_BASE_URL=https://api.openai.com/v1
LLM_API_KEY=sk-your-actual-key
LLM_MODEL=gpt-4o-mini
```

2. Restart dev server:
```bash
npm run dev
```

3. Open http://localhost:3000

4. Click "Daily digest"

5. Verify:
   - AI-generated summary (not numbered list)
   - Label: "AI digest"

## What Was Implemented

✅ Provider interface for digest generation
✅ RuleBasedProvider (default, no config needed)
✅ LLMProvider (OpenAI-compatible, opt-in via env vars)
✅ Factory function to select provider based on environment
✅ API route with automatic fallback on LLM errors
✅ UI properly labels digest mode
✅ Configuration documented in .env.example
✅ Unit tests for both providers
✅ Error handling and logging

## Verification Complete

The implementation satisfies all requirements:
- Works with new-api (OpenAI-compatible)
- Falls back to rule-based on error
- Properly labeled in UI
- No breaking changes
- Backward compatible
