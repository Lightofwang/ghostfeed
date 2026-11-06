# Cloudflare Pages Configuration Guide

## Environment Variables (在 Cloudflare Pages 仪表板设置)

必须设置：
- NODE_VERSION = 22

可选（AI 摘要功能）：
- LLM_BASE_URL = 你的 OpenAI 兼容端点
- LLM_API_KEY = 你的 API 密钥  
- LLM_MODEL = gpt-4o-mini (或其他模型)

## Build Settings

- **Framework preset**: Next.js
- **Build command**: 
pm run build
- **Build output directory**: .next
- **Root directory**: / (默认)
- **Node version**: 22

