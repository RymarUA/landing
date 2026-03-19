const fs = require('fs');
const path = require('path');

function loadEnvFile(filename) {
  const fullPath = path.resolve(__dirname, filename);
  if (!fs.existsSync(fullPath)) return {};

  return fs
    .readFileSync(fullPath, 'utf-8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .reduce((acc, line) => {
      const delimiterIndex = line.indexOf('=');
      if (delimiterIndex === -1) return acc;

      const key = line.slice(0, delimiterIndex).trim();
      const rawValue = line.slice(delimiterIndex + 1).trim();
      const cleanedValue = rawValue.replace(/^['"]|['"]$/g, '');

      if (key) {
        acc[key] = cleanedValue;
      }
      return acc;
    }, {});
}

const sharedEnv = {
  ...loadEnvFile('.env.production'),
  ...loadEnvFile('.env.server'),
  ...loadEnvFile('.env.local'),
};

const baseEnv = {
  NODE_ENV: 'production',
  PORT: 3000,
  ...sharedEnv,
  // ⚠️ ВАЖНО: НЕ устанавливайте VERCEL переменные для CDN режима!
  // VERCEL: '1',  ❌ НЕТ! Это отключит CDN и стили не загрузятся
  // NEXT_PUBLIC_VERCEL: '1',  ❌ НЕТ!
};

module.exports = {
  apps: [
    {
      name: 'familyhub',
      script: 'scripts/start-with-build.js',
      args: '-p 3000',
      cwd: '/var/www/familyhub',
      instances: 1,
      exec_mode: 'fork',
      env: baseEnv,
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env_production: baseEnv,
    },
  ],
};
