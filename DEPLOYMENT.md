# 🚀 GhostFeed 部署指南 / Deployment Guide

> **Note**: This guide provides multiple deployment options since Vercel is not available. Choose the option that best fits your infrastructure.

## 前置条件 / Prerequisites

- Node.js 22 (使用 `fnm use 22` / use `fnm use 22`)
- 项目构建成功 / Project builds successfully: `npm run build`
- Git 仓库 / Git repository

---

## 方案 A: Docker + VPS（推荐，完全控制） / Option A: Docker + VPS (Recommended, Full Control)

### 优势 / Advantages
- ✅ 完全控制服务器环境 / Complete control over environment
- ✅ 易于复制和扩展 / Easy to replicate and scale
- ✅ 环境隔离 / Environment isolation
- ✅ 简单的回滚和更新 / Easy rollback and updates

### 前置要求 / Requirements
- 一台 VPS (Ubuntu 20.04+, Debian 11+, 或任何支持 Docker 的系统)
- Docker 和 Docker Compose 已安装
- 域名（可选，用于 HTTPS）

### 部署步骤 / Deployment Steps

#### 1. 在 VPS 上安装 Docker

**Ubuntu/Debian**:
```bash
# 更新包索引 / Update package index
sudo apt update

# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装 Docker Compose
sudo apt install docker-compose-plugin

# 将当前用户加入 docker 组（避免每次 sudo）
sudo usermod -aG docker $USER
newgrp docker

# 验证安装 / Verify installation
docker --version
docker compose version
```

#### 2. 克隆项目 / Clone Project
```bash
git clone <your-repo-url> ghostfeed
cd ghostfeed
```

#### 3. 配置环境变量（可选，用于 AI 摘要）/ Configure Environment Variables (Optional for AI digest)
```bash
# 创建 .env 文件 / Create .env file
cat > .env << EOF
LLM_BASE_URL=https://your-llm-endpoint.com/v1
LLM_API_KEY=sk-your-api-key
LLM_MODEL=gpt-4o-mini
EOF
```

**注意 / Note**: 如果不配置 LLM，应用将使用基于规则的摘要（完全可用）。
If LLM is not configured, the app will use rule-based digest (fully functional).

#### 4. 使用 Docker Compose 部署 / Deploy with Docker Compose
```bash
# 构建并启动容器 / Build and start container
docker compose up -d

# 查看日志 / View logs
docker compose logs -f

# 检查状态 / Check status
docker compose ps
```

应用将在 `http://your-server-ip:3000` 运行。
The app will run at `http://your-server-ip:3000`.

#### 5. 配置 Nginx 反向代理（推荐，用于 HTTPS）/ Configure Nginx Reverse Proxy (Recommended for HTTPS)

**安装 Nginx**:
```bash
sudo apt install nginx
```

**创建配置文件** / **Create config file** `/etc/nginx/sites-available/ghostfeed`:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**启用站点** / **Enable site**:
```bash
sudo ln -s /etc/nginx/sites-available/ghostfeed /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**设置 SSL (Let's Encrypt)**:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

#### 6. 管理命令 / Management Commands

```bash
# 查看日志 / View logs
docker compose logs -f ghostfeed

# 重启应用 / Restart app
docker compose restart

# 停止应用 / Stop app
docker compose down

# 更新部署 / Update deployment
git pull
docker compose up -d --build

# 查看资源使用 / View resource usage
docker stats
```

---

## 方案 B: Netlify（最简单，免费）/ Option B: Netlify (Easiest, Free)

### 优势 / Advantages
- ✅ 零配置部署 / Zero-config deployment
- ✅ 自动 HTTPS / Automatic HTTPS
- ✅ CDN 分发 / CDN distribution
- ✅ 持续部署（git push 自动部署）/ Continuous deployment
- ✅ 免费层级 / Free tier available

### 部署步骤 / Deployment Steps

#### 1. 推送到 Git / Push to Git
```bash
git add .
git commit -m "Prepare for Netlify deployment"
git push origin main
```

#### 2. 连接到 Netlify / Connect to Netlify
1. 访问 [netlify.com](https://netlify.com) 并登录
2. 点击 "Add new site" → "Import an existing project"
3. 选择你的 Git 提供商（GitHub/GitLab/Bitbucket）
4. 选择 GhostFeed 仓库
5. Netlify 会自动检测 `netlify.toml` 配置
6. 点击 "Deploy site"

#### 3. 配置环境变量（可选，用于 AI 摘要）/ Configure Environment Variables (Optional for AI digest)
在 Netlify 仪表板中：
- 进入 Site settings → Environment variables
- 添加：
  - `LLM_BASE_URL`: 你的 LLM 端点
  - `LLM_API_KEY`: 你的 API 密钥
  - `LLM_MODEL`: 模型名称（可选，默认 `gpt-4o-mini`）

#### 4. 访问你的网站 / Access Your Site
你的网站将在 `https://your-site-name.netlify.app` 可用。

### Netlify CLI 部署（替代方式）/ Netlify CLI Deployment (Alternative)
```bash
# 安装 Netlify CLI
npm install -g netlify-cli

# 登录
netlify login

# 初始化并部署
netlify init
netlify deploy --prod
```

---

## 方案 C: Railway（简单，免费额度）/ Option C: Railway (Simple, Free Tier)

### 优势 / Advantages
- ✅ 简单部署 / Simple deployment
- ✅ 自动 HTTPS / Automatic HTTPS
- ✅ 免费 $5/月额度 / Free $5/month credit
- ✅ 从 GitHub 自动部署 / Auto-deploy from GitHub

### 部署步骤 / Deployment Steps

#### 1. 推送到 GitHub / Push to GitHub
```bash
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

#### 2. 部署到 Railway / Deploy to Railway
1. 访问 [railway.app](https://railway.app)
2. 使用 GitHub 登录
3. 点击 "New Project" → "Deploy from GitHub repo"
4. 选择 GhostFeed 仓库
5. Railway 会自动检测 Next.js 并部署

#### 3. 配置环境变量（可选）/ Configure Environment Variables (Optional)
在 Railway 仪表板中：
- 选择你的项目
- 进入 Variables 标签
- 添加：
  - `LLM_BASE_URL`
  - `LLM_API_KEY`
  - `LLM_MODEL`

#### 4. 设置自定义域名（可选）/ Set Custom Domain (Optional)
在 Settings → Domains 中添加你的域名。

你的应用将在 `https://your-app.up.railway.app` 可用。

---

## 方案 D: Cloudflare Pages（免费，快速）/ Option D: Cloudflare Pages (Free, Fast)

### 优势 / Advantages
- ✅ 全球 CDN / Global CDN
- ✅ 无限带宽（免费层级）/ Unlimited bandwidth (free tier)
- ✅ 自动 HTTPS / Automatic HTTPS
- ✅ 快速构建 / Fast builds

### 部署步骤 / Deployment Steps

#### 1. 推送到 GitHub / Push to GitHub
```bash
git add .
git commit -m "Prepare for Cloudflare Pages"
git push origin main
```

#### 2. 部署到 Cloudflare Pages / Deploy to Cloudflare Pages
1. 访问 [pages.cloudflare.com](https://pages.cloudflare.com)
2. 登录并点击 "Create a project"
3. 连接你的 GitHub 账户
4. 选择 GhostFeed 仓库
5. 配置构建设置：
   - **Framework preset**: Next.js
   - **Build command**: `npm run build`
   - **Build output directory**: `.next`
   - **Node version**: `22`

#### 3. 配置环境变量（可选）/ Configure Environment Variables (Optional)
在 Settings → Environment variables 中添加：
- `LLM_BASE_URL`
- `LLM_API_KEY`
- `LLM_MODEL`
- `NODE_VERSION=22`

#### 4. 访问你的网站 / Access Your Site
你的网站将在 `https://ghostfeed.pages.dev` 可用。

---

## 方案 E: PM2 + Nginx + VPS（传统方案）/ Option E: PM2 + Nginx + VPS (Traditional)

### 优势 / Advantages
- ✅ 完全控制 / Full control
- ✅ 无容器开销 / No container overhead
- ✅ 适合已有 Node.js 服务器 / Good for existing Node.js servers
- ✅ 使用 PM2 进程管理 / Process management with PM2

### 前置要求 / Requirements
- VPS (Ubuntu 20.04+, Debian 11+, CentOS 7+)
- Node.js 22
- PM2
- Nginx

### 部署步骤 / Deployment Steps

#### 1. 安装 Node.js 22 / Install Node.js 22
```bash
# 使用 fnm (推荐) / Using fnm (recommended)
curl -fsSL https://fnm.vercel.app/install | bash
source ~/.bashrc
fnm install 22
fnm use 22
fnm default 22

# 验证 / Verify
node --version  # 应显示 v22.x.x / Should show v22.x.x
```

#### 2. 安装 PM2 / Install PM2
```bash
npm install -g pm2
```

#### 3. 克隆并构建项目 / Clone and Build Project
```bash
git clone <your-repo-url> /var/www/ghostfeed
cd /var/www/ghostfeed
npm ci
npm run build
```

#### 4. 创建日志目录 / Create Logs Directory
```bash
mkdir -p logs
```

#### 5. 配置环境变量（可选）/ Configure Environment Variables (Optional)
```bash
# 创建 .env.local 文件 / Create .env.local file
cat > .env.local << EOF
LLM_BASE_URL=https://your-llm-endpoint.com/v1
LLM_API_KEY=sk-your-api-key
LLM_MODEL=gpt-4o-mini
EOF
```

或者在 `ecosystem.config.js` 中直接设置。
Or set directly in `ecosystem.config.js`.

#### 6. 使用 PM2 启动 / Start with PM2
```bash
# 使用 ecosystem 配置文件启动 / Start with ecosystem config
pm2 start ecosystem.config.js

# 或者简单启动 / Or simple start
pm2 start npm --name "ghostfeed" -- start

# 保存 PM2 配置 / Save PM2 config
pm2 save

# 设置开机自启 / Setup auto-start on boot
pm2 startup
# 按照输出的命令执行 / Follow the output command
```

#### 7. 配置 Nginx / Configure Nginx
```bash
sudo apt install nginx
```

创建配置文件 / Create config file `/etc/nginx/sites-available/ghostfeed`:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Logs
    access_log /var/log/nginx/ghostfeed-access.log;
    error_log /var/log/nginx/ghostfeed-error.log;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files caching
    location /_next/static {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

启用站点 / Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/ghostfeed /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 8. 设置 SSL / Setup SSL
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

#### 9. PM2 管理命令 / PM2 Management Commands

```bash
# 查看状态 / Check status
pm2 status

# 查看日志 / View logs
pm2 logs ghostfeed

# 重启 / Restart
pm2 restart ghostfeed

# 停止 / Stop
pm2 stop ghostfeed

# 删除 / Delete
pm2 delete ghostfeed

# 监控 / Monitor
pm2 monit

# 更新部署 / Update deployment
cd /var/www/ghostfeed
git pull
npm ci
npm run build
pm2 restart ghostfeed
```

---

## 部署后验证 / Post-Deployment Verification

部署完成后，验证以下功能：/ After deployment, verify these features:

### 1. 基本功能 / Basic Functionality
- [ ] 在浏览器中打开 URL / Open URL in browser
- [ ] UI 正确加载 / UI loads correctly
- [ ] 可以添加新 feed（测试：`https://blog.rust-lang.org/feed.xml`）
- [ ] Feed 条目显示 / Feed items appear
- [ ] 可以点击跳转到原文 / Can click through to original articles

### 2. Feed 管理 / Feed Management
- [ ] 可以删除 feed / Can delete feeds
- [ ] 可以导入 OPML / Can import OPML
- [ ] 可以导出 OPML / Can export OPML
- [ ] 死亡 feed 检测工作（查看墓地部分）/ Dead feed detection works (check graveyard)

### 3. 摘要生成 / Digest Generation
- [ ] 生成摘要功能工作（基于规则的总是工作）/ Generate digest works (rule-based always works)
- [ ] 如果配置了 LLM：AI 摘要工作 / If LLM configured: AI digest works
- [ ] 如果未配置 LLM 或失败：回退到基于规则的 / If LLM not configured or fails: falls back to rule-based

### 4. 性能 / Performance
- [ ] RSS 获取工作（无 CORS 错误）/ RSS fetching works (no CORS errors)
- [ ] 页面在 3 秒内加载 / Page loads in <3 seconds
- [ ] API 路由快速响应 / API routes respond quickly

### 5. 安全检查 / Security Check
- [ ] `.env.local` 不在 git 历史中 / `.env.local` is NOT in git history
- [ ] API 密钥不出现在浏览器控制台 / API keys don't appear in browser console
- [ ] HTML 源码中无敏感数据 / No sensitive data in HTML source

---

## 故障排除 / Troubleshooting

### 构建失败 / Build Fails
```bash
# 确保使用 Node 22 / Ensure Node 22
fnm use 22
node --version  # 应显示 v22.x.x / Should show v22.x.x

# 清除缓存并重建 / Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Docker: 容器无法启动 / Container Won't Start
```bash
# 查看日志 / Check logs
docker compose logs ghostfeed

# 检查端口是否被占用 / Check if port is in use
sudo lsof -i :3000

# 重建容器 / Rebuild container
docker compose down
docker compose up -d --build
```

### PM2: 应用崩溃 / App Crashes
```bash
# 查看详细日志 / View detailed logs
pm2 logs ghostfeed --lines 100

# 检查 Node 版本 / Check Node version
node --version

# 检查环境变量 / Check environment variables
pm2 env 0  # 0 是进程 ID / 0 is process ID
```

### Nginx: 502 Bad Gateway
```bash
# 检查应用是否运行 / Check if app is running
curl http://localhost:3000

# 检查 Nginx 配置 / Check Nginx config
sudo nginx -t

# 查看 Nginx 错误日志 / View Nginx error log
sudo tail -f /var/log/nginx/error.log
```

### RSS feeds 无法加载 / RSS Feeds Don't Load
- 确保服务端获取正常工作（检查 `/api/feeds` 路由）
- 某些 RSS feeds 可能阻止特定的 user agents
- 检查不是 CORS 问题（服务端获取不应该有 CORS 问题）

---

## 更新部署 / Updating Deployment

### Docker
```bash
cd ghostfeed
git pull
docker compose up -d --build
```

### Netlify / Railway / Cloudflare
Push to git, auto-deploys:
```bash
git add .
git commit -m "Update feature"
git push
```

### PM2
```bash
cd /var/www/ghostfeed
git pull
npm ci  # 如果 package.json 改变 / If package.json changed
npm run build
pm2 restart ghostfeed
```

---

## 环境变量参考 / Environment Variables Reference

| 变量 / Variable | 必需 / Required | 默认值 / Default | 说明 / Description |
|-----------------|-----------------|------------------|---------------------|
| `LLM_BASE_URL` | No | - | OpenAI 兼容的 API 端点 / OpenAI-compatible API endpoint |
| `LLM_API_KEY` | No | - | API 密钥 / API key |
| `LLM_MODEL` | No | `gpt-4o-mini` | 模型名称 / Model name |
| `NODE_ENV` | No | `production` | 环境模式 / Environment mode |
| `PORT` | No | `3000` | 应用端口 / App port |

**注意 / Note**: 不设置 LLM 变量时，应用使用基于规则的摘要（完全功能）。
Without LLM variables, the app uses rule-based digest (fully functional).

---

## 方案对比 / Comparison Matrix

| 方案 / Option | 难度 / Difficulty | 成本 / Cost | 控制度 / Control | HTTPS | 推荐场景 / Best For |
|---------------|-------------------|-------------|------------------|-------|---------------------|
| **Docker + VPS** | 中等 / Medium | $5-20/月 | 完全 / Full | 需手动配置 / Manual | 生产环境，完全控制 / Production, full control |
| **Netlify** | 简单 / Easy | 免费-$19/月 | 低 / Low | 自动 / Auto | 快速原型，演示 / Quick prototypes, demos |
| **Railway** | 简单 / Easy | $5 免费额度 / $5 free credit | 中等 / Medium | 自动 / Auto | 小项目，快速部署 / Small projects, quick deploy |
| **Cloudflare Pages** | 简单 / Easy | 免费 / Free | 低 / Low | 自动 / Auto | 全球分发，高流量 / Global distribution, high traffic |
| **PM2 + VPS** | 较难 / Hard | $5-20/月 | 完全 / Full | 需手动配置 / Manual | 现有服务器，传统部署 / Existing servers, traditional |

---

## 演示 URL / Demo URL

部署后，在此记录你的公开 URL 供评审：
After deployment, record your public URL here for judges:

**生产 URL / Production URL**: `_____________________________`

---

## 支持 / Support

具体问题请参考：/ For specific issues:
- **Docker**: [Docker Docs](https://docs.docker.com/)
- **Next.js**: [Next.js Docs](https://nextjs.org/docs)
- **PM2**: [PM2 Docs](https://pm2.keymetrics.io/)
- **Netlify**: [Netlify Docs](https://docs.netlify.com/)
- **Railway**: [Railway Docs](https://docs.railway.app/)
- **Cloudflare Pages**: [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
