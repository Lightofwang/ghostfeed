# 📦 Deployment Configuration Files

This document explains the deployment configuration files in this repository.

## Configuration Files Overview

### Docker Deployment
- **`Dockerfile`** — Multi-stage Docker image for production deployment
  - Uses Node 22 Alpine for minimal image size
  - Three stages: deps → builder → runner
  - Includes health checks
  - Runs as non-root user for security
  
- **`docker-compose.yml`** — Docker Compose configuration for easy deployment
  - Single-command deployment: `docker compose up -d`
  - Environment variable support
  - Health checks and auto-restart
  - Network isolation

- **`.dockerignore`** — Excludes unnecessary files from Docker builds
  - Reduces image size
  - Speeds up builds
  - Excludes dev dependencies and docs

### PM2 Deployment
- **`ecosystem.config.js`** — PM2 process manager configuration
  - Auto-restart on crash
  - Memory limit (500MB)
  - Log management
  - Deployment automation support

### Platform Deployment
- **`netlify.toml`** — Netlify configuration
  - Node 22 environment
  - Next.js plugin integration
  - Security headers
  - Static asset caching

### Next.js Configuration
- **`next.config.mjs`** — Modified to enable standalone output
  - Required for Docker deployment
  - Optimizes production builds
  - Creates self-contained deployment bundle

## File Usage by Platform

| File | Docker+VPS | PM2+VPS | Netlify | Railway | Cloudflare |
|------|-----------|---------|---------|---------|------------|
| `Dockerfile` | ✅ | ❌ | ❌ | ⚠️ Optional | ❌ |
| `docker-compose.yml` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `.dockerignore` | ✅ | ❌ | ❌ | ⚠️ If using Docker | ❌ |
| `ecosystem.config.js` | ❌ | ✅ | ❌ | ❌ | ❌ |
| `netlify.toml` | ❌ | ❌ | ✅ | ❌ | ❌ |
| `next.config.mjs` | ✅ | ✅ | ✅ | ✅ | ✅ |

## Quick Start Commands

### Docker + VPS
```bash
docker compose up -d
```

### PM2 + VPS
```bash
npm run build
pm2 start ecosystem.config.js
```

### Netlify
```bash
# Push to git, Netlify auto-deploys
git push origin main
```

### Railway / Cloudflare
```bash
# Connect repo in dashboard, auto-deploys on push
git push origin main
```

## Environment Variables

All deployment configurations support these optional environment variables:

- `LLM_BASE_URL` — OpenAI-compatible API endpoint
- `LLM_API_KEY` — API authentication key
- `LLM_MODEL` — Model name (defaults to `gpt-4o-mini`)

**How to set**:

- **Docker**: Create `.env` file in project root
- **PM2**: Edit `ecosystem.config.js` or create `.env.local`
- **Netlify/Railway/Cloudflare**: Set in platform dashboard

## Security Notes

- Never commit `.env` or `.env.local` files
- All configurations exclude sensitive files via `.gitignore`
- Docker runs as non-root user (uid 1001)
- Netlify config includes security headers
- API keys should only be set in deployment environment

## Verification

After deployment with any method:

1. Check app loads: `curl https://your-domain.com`
2. Test API: `curl https://your-domain.com/api/feeds?url=https://blog.rust-lang.org/feed.xml`
3. Verify health: `curl https://your-domain.com` (should return 200)

## File Modifications

If you need to modify these files:

- **Dockerfile**: Change Node version, add dependencies, or adjust build steps
- **docker-compose.yml**: Change ports, add volumes, or configure networks
- **ecosystem.config.js**: Adjust memory limits, instances, or deployment settings
- **netlify.toml**: Update build commands, Node version, or headers
- **next.config.mjs**: Add Next.js configuration options

## Troubleshooting

### Docker build fails
- Ensure standalone output is enabled in `next.config.mjs`
- Check `.dockerignore` isn't excluding required files
- Verify Node version matches (22)

### PM2 won't start
- Check Node version: `node --version` (should be 22.x)
- Verify build completed: `ls .next/standalone`
- Check logs: `pm2 logs ghostfeed`

### Platform deployment fails
- Verify build command: `npm run build`
- Check Node version setting (must be 22)
- Review platform build logs

## Additional Documentation

- **[DEPLOYMENT.md](DEPLOYMENT.md)** — Complete deployment guide for all platforms
- **[DEPLOYMENT-CHECKLIST.md](DEPLOYMENT-CHECKLIST.md)** — Pre-deployment verification checklist
- **[README.md](README.md)** — Project overview and quick start

## Support

For deployment issues:
- Check platform-specific docs in DEPLOYMENT.md
- Review configuration file comments
- Verify Node 22 is being used
- Check build output for errors
