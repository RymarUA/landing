module.exports = {
  apps: [
    {
      name: 'familyhub',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      cwd: '/var/www/familyhub',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        // ⚠️ ВАЖНО: НЕ устанавливайте VERCEL переменные для CDN режима!
        // VERCEL: '1',  ❌ НЕТ! Это отключит CDN и стили не загрузятся
        // NEXT_PUBLIC_VERCEL: '1',  ❌ НЕТ!
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
