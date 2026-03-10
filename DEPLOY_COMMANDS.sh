#!/bin/bash

# Production Deployment Commands for FamilyHub
# Выполните эти команды на сервере /var/www/familyhub

set -e

echo "🚀 Starting deployment..."

# 1. Перейти в директорию проекта
cd /var/www/familyhub

# 2. Получить последние изменения
echo "📥 Fetching latest code..."
git fetch origin
git reset --hard origin/main

# 3. Установить зависимости
echo "📦 Installing dependencies..."
pnpm install

# 4. Очистить старую сборку
echo "🧹 Cleaning old build..."
rm -rf .next

# 5. Собрать приложение
echo "🔨 Building application..."
pnpm build

# 6. Перезапустить PM2
echo "🔄 Restarting PM2..."
pm2 restart familyhub

# 7. Проверить логи
echo "📋 Checking logs..."
pm2 logs familyhub --lines 30

echo "✅ Deployment complete!"
