# 🚀 Quick Deployment Guide - CDN Mode

## На сервере выполните:

```bash
# 1. Перейдите в директорию проекта
cd /var/www/familyhub

# 2. Скопируйте файлы с локальной машины (или git pull)
# Убедитесь, что есть: ecosystem.config.js и scripts/deploy-production.sh

# 3. Сделайте скрипт исполняемым
chmod +x scripts/deploy-production.sh
chmod +x scripts/check-env.sh

# 4. Запустите deployment
bash scripts/deploy-production.sh

# 5. Если всё успешно, запустите PM2
pm2 delete familyhub || true
pm2 start ecosystem.config.js
pm2 save

# 6. Проверьте логи
pm2 logs familyhub --lines 50
```

## Проверка окружения

Перед deployment можно проверить настройки:

```bash
bash scripts/check-env.sh
```

Этот скрипт проверит:
- ✅ Отсутствие VERCEL переменных
- ✅ Наличие .next/standalone/server.js
- ✅ Корректность PM2 конфигурации

## Что должно работать

### ✅ В PM2 логах:
```
✓ Ready in XXXms
- Local: http://localhost:3000
```

### ✅ В браузере DevTools → Network:
- Загружается `@tailwindcss/browser@4` с `cdn.jsdelivr.net`
- Страница отображается со стилями

### ✅ В консоли браузера:
- Нет ошибок "Failed to find Server Action"
- Нет hydration errors

## Troubleshooting

### Проблема: "MODULE_NOT_FOUND: server.js"

```bash
# Проверьте, что сборка создала standalone
ls -la .next/standalone/server.js

# Если файла нет, пересоберите
rm -rf .next
npm run build
```

### Проблема: "Нет стилей на странице"

```bash
# Проверьте VERCEL переменные
bash scripts/check-env.sh

# Если найдены VERCEL переменные:
unset VERCEL
unset NEXT_PUBLIC_VERCEL

# Удалите из .env файлов
sed -i '/VERCEL/d' .env
sed -i '/VERCEL/d' .env.local

# Пересоберите
npm run build
pm2 restart familyhub
```

### Проблема: PM2 не запускается

```bash
# Проверьте путь в ecosystem.config.js
# Должен быть: script: '.next/standalone/server.js'

# Проверьте права
chmod +x .next/standalone/server.js

# Проверьте Node.js версию
node --version  # Должна быть >= 18.0.0
```

## Файлы конфигурации

### `ecosystem.config.js`
PM2 конфигурация **БЕЗ** VERCEL переменных для CDN режима.

### `scripts/deploy-production.sh`
Автоматический deployment скрипт:
- Проверяет окружение
- Очищает кеш
- Устанавливает зависимости
- Собирает приложение
- Копирует static файлы

### `scripts/check-env.sh`
Проверка окружения перед deployment.

## Важно! ⚠️

**НИКОГДА не устанавливайте VERCEL переменные на своем сервере!**

Это приведет к:
- ❌ Отключению Tailwind CDN
- ❌ Отсутствию compiled CSS (если не установлены Tailwind пакеты)
- ❌ Полному отсутствию стилей

Для CDN режима нужно:
- ✅ НЕТ VERCEL переменных в окружении
- ✅ НЕТ VERCEL переменных в .env файлах
- ✅ НЕТ VERCEL переменных в ecosystem.config.js
