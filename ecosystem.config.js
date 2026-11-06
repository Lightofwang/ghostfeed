// PM2 Ecosystem Configuration for GhostFeed
// For VPS deployment with PM2 process manager

module.exports = {
  apps: [
    {
      name: 'ghostfeed',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        // Optional: Uncomment and set these for AI-powered digest
        // LLM_BASE_URL: 'https://your-llm-endpoint.com/v1',
        // LLM_API_KEY: 'sk-your-api-key',
        // LLM_MODEL: 'gpt-4o-mini'
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Ensure Node 22 is used
      interpreter: 'node',
      exec_mode: 'fork'
    }
  ],

  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/ghostfeed.git',
      path: '/var/www/ghostfeed',
      'post-deploy': 'fnm use 22 && npm ci && npm run build && pm2 reload ecosystem.config.js --env production',
      env: {
        NODE_ENV: 'production'
      }
    }
  }
};

// Usage:
// 1. Build the project: npm run build
// 2. Start with PM2: pm2 start ecosystem.config.js
// 3. Save PM2 config: pm2 save
// 4. Setup auto-restart: pm2 startup
// 5. View logs: pm2 logs ghostfeed
// 6. Restart: pm2 restart ghostfeed
// 7. Stop: pm2 stop ghostfeed
