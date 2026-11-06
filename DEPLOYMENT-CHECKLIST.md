# 📋 Deployment Checklist for Kiroween Judges

Use this checklist to verify the GhostFeed deployment is ready for judge review.

## Pre-Deployment Checks

- [x] Build passes locally (`npm run build`)
- [x] Tests pass (`npm test`)
- [ ] `.gitignore` includes `.env*.local`
- [ ] No hardcoded API keys in source code
- [ ] README.md includes deployment instructions
- [ ] DEPLOYMENT.md guide is complete

## Choose Your Deployment Platform

Select ONE platform and follow its checklist:

### Option A: Docker + VPS
- [ ] VPS server ready (Ubuntu/Debian)
- [ ] Docker and Docker Compose installed
- [ ] Repository cloned to VPS
- [ ] `.env` file created (optional, for LLM)
- [ ] `docker compose up -d` successful
- [ ] Nginx reverse proxy configured
- [ ] SSL certificate installed (Let's Encrypt)
- [ ] Public URL accessible

### Option B: Netlify (Easiest)
- [ ] Repository pushed to GitHub/GitLab/Bitbucket
- [ ] Netlify account created/logged in
- [ ] Site created and connected to repo
- [ ] Build successful
- [ ] Public URL obtained (*.netlify.app)

### Option C: Railway
- [ ] Repository pushed to GitHub
- [ ] Railway account created
- [ ] Project deployed from GitHub
- [ ] Build successful
- [ ] Public URL obtained (*.up.railway.app)

### Option D: Cloudflare Pages
- [ ] Repository pushed to GitHub
- [ ] Cloudflare account created
- [ ] Pages project created
- [ ] Build settings configured (Node 22)
- [ ] Build successful
- [ ] Public URL obtained (*.pages.dev)

### Option E: PM2 + VPS (Traditional)
- [ ] VPS server ready
- [ ] Node.js 22 installed via fnm
- [ ] PM2 installed globally
- [ ] Repository cloned
- [ ] `npm run build` successful
- [ ] PM2 started with ecosystem.config.js
- [ ] Nginx configured
- [ ] SSL certificate installed
- [ ] Public URL accessible

## Environment Variables (Optional - for AI Digest)

If you want AI-powered digest (optional):

**For Docker/PM2 (VPS)**:
- [ ] `.env` or `.env.local` file created
- [ ] `LLM_BASE_URL` set
- [ ] `LLM_API_KEY` set
- [ ] `LLM_MODEL` set (optional)

**For Netlify/Railway/Cloudflare**:
- [ ] `LLM_BASE_URL` set in dashboard
- [ ] `LLM_API_KEY` set in dashboard
- [ ] `LLM_MODEL` set (optional)

**Test**:
- [ ] AI digest generates successfully
- [ ] Fallback to rule-based works if LLM fails

**Note**: App works perfectly without these variables using rule-based digest.

## Post-Deployment Verification

### Core Features (Must Work)
- [ ] Homepage loads at public URL
- [ ] Can add RSS feed (test with `https://blog.rust-lang.org/feed.xml`)
- [ ] Feed items display correctly
- [ ] Can click through to original articles
- [ ] Can delete feeds
- [ ] Items sorted newest-first

### OPML Features
- [ ] Can import OPML file
- [ ] Can export OPML file
- [ ] Exported OPML contains correct feeds

### Digest Feature
- [ ] "Generate Digest" button works
- [ ] Digest shows last 24h items
- [ ] Rule-based digest always works
- [ ] If LLM configured: AI digest works
- [ ] If LLM fails: fallback to rule-based works

### Graveyard Feature
- [ ] Dead feeds show in graveyard section
- [ ] Last-alive date displayed
- [ ] Replacement suggestions appear
- [ ] Can add replacement in one click

### Performance
- [ ] Initial page load < 3 seconds
- [ ] RSS fetch completes within 10 seconds
- [ ] No CORS errors in console
- [ ] No unhandled errors in console

### Security
- [ ] No API keys visible in browser dev tools
- [ ] No API keys in HTML source
- [ ] No API keys in JavaScript bundles
- [ ] `.env.local` not in git history

## Judge Submission

- [ ] Public URL recorded: `_______________________________`
- [ ] URL added to submission form
- [ ] Demo video recorded (if required)
- [ ] Repo is public or judges have access

## Quick Test URLs

Test these RSS feeds to demonstrate functionality:

1. **Active Feed**: `https://blog.rust-lang.org/feed.xml`
2. **Active Feed**: `https://xeiaso.net/blog.rss`
3. **Active Feed**: `https://rachelbythebay.com/w/atom.xml`

## Troubleshooting Guide

| Issue | Solution |
|-------|----------|
| Build fails | Check Node version is 22: `fnm use 22` |
| CORS errors | Should not happen - we fetch server-side |
| Feeds don't load | Check network tab, verify RSS URL is valid |
| Digest empty | Ensure feeds have items from last 24h |
| LLM digest fails | Check environment variables, verify API endpoint |

## Contact Information

If judges need assistance:
- GitHub Issues: [your-repo-url]/issues
- Documentation: See README.md and DEPLOYMENT.md
- Live demo: [your-vercel-url]

---

**Date Deployed**: _____________
**Deployed By**: _____________
**Deployment Platform**: ☐ Docker+VPS ☐ Netlify ☐ Railway ☐ Cloudflare Pages ☐ PM2+VPS ☐ Other: _______
