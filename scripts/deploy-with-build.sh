#!/bin/bash

###############################################################################
# deploy-with-build.sh
# 
# Гарантує правильну послідовність дій при деплої:
# 1. Оновлює DEPLOYMENT_ID
# 2. Видаляє стару збірку (.next)
# 3. Виконує нову збірку
# 4. Перезапускає PM2
#
# Використання:
#   bash scripts/deploy-with-build.sh
###############################################################################

set -e  # Вихід при будь-якій помилці

echo "🚀 [DEPLOY] Початок деплою..."

# Перевірка наявності .next
if [ -d ".next" ]; then
  echo "🗑️  [DEPLOY] Видалення старої збірки..."
  rm -rf .next
  echo "✅ [DEPLOY] Стара збірка видалена"
fi

# Оновлення DEPLOYMENT_ID
echo "🔄 [DEPLOY] Оновлення DEPLOYMENT_ID..."
node scripts/update-deployment-id.js

# Виконання збірки
echo "🔨 [DEPLOY] Запуск збірки..."
npm run build

# Перевірка успішності збірки
if [ ! -f ".next/BUILD_ID" ]; then
  echo "❌ [DEPLOY] Помилка: збірка не створила BUILD_ID"
  exit 1
fi

echo "✅ [DEPLOY] Збірка успішна"

# Перезапуск PM2 (якщо встановлено)
if command -v pm2 &> /dev/null; then
  echo "🔄 [DEPLOY] Перезапуск PM2..."
  pm2 restart ecosystem.config.js --update-env
  echo "✅ [DEPLOY] PM2 перезапущено"
else
  echo "⚠️  [DEPLOY] PM2 не знайдено - пропускаємо перезапуск"
fi

echo "🎉 [DEPLOY] Деплой завершено успішно!"
