# Production Deployment Guide - FamilyHub

## Проблема

На продакшене приложение не работает из-за:
1. **Отсутствует `.next/standalone/server.js`** - сборка не выполнена или выполнена неправильно
2. **Нет стилей Tailwind** - страница отображается как чистый HTML
3. **Ошибки "Failed to find Server Action"** - несоответствие клиента и сервера

## Корневая причина

Приложение имеет **два режима работы**:

### 1. Vercel/Production режим (compiled CSS)
- Tailwind компилируется в CSS при сборке
- Используется `@tailwindcss/postcss` + `postcss`
- CDN **отключается** через:
  - `scripts/remove-cdn-for-vercel.cjs` (prebuild скрипт)
  - Webpack NormalModuleReplacementPlugin в `next.config.mjs`

### 2. Development режим (CDN)
- Tailwind загружается через CDN в браузере
- Используется `TailwindCDNClient` компонент
- Не требует установки Tailwind пакетов

## Критическая ошибка на вашем сервере

**Переменные окружения VERCEL установлены, но сборка не выполнена!**

Когда установлены `VERCEL=1` или `NEXT_PUBLIC_VERCEL=1`:
1. ✅ Prebuild скрипт **удаляет** CDN код из `tailwind-cdn-client.tsx`
2. ✅ Webpack **блокирует** импорт CDN компонента
3. ❌ НО Tailwind пакеты **не установлены** на сервере
4. ❌ НО сборка **не выполнена** с этими пакетами

**Результат**: Нет ни CDN, ни compiled CSS → нет стилей вообще!

---

## Решение 1: Standalone Production Build (Рекомендуется)

Это правильный способ для production сервера с PM2.

### Шаг 1: Очистка окружения

```bash
# На сервере удалите VERCEL переменные из .env или PM2 config
unset VERCEL
unset NEXT_PUBLIC_VERCEL
unset VERCEL_ENV
unset VERCEL_URL

# Проверьте PM2 ecosystem.config.js или .env файлы
pm2 env 0  # Посмотрите переменные окружения процесса
```

### Шаг 2: Установка зависимостей

```bash
cd /var/www/familyhub

# Очистите старые файлы
rm -rf .next node_modules/.cache

# Установите зависимости (используйте npm или pnpm)
npm ci --legacy-peer-deps
# ИЛИ
pnpm install
```

### Шаг 3: Production сборка

```bash
# Выполните сборку БЕЗ VERCEL переменных
npm run build

# Проверьте, что создан standalone сервер
ls -la .next/standalone/server.js
# Должен существовать!
```

### Шаг 4: Настройка PM2

Создайте или обновите `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'familyhub',
    script: '.next/standalone/server.js',
    cwd: '/var/www/familyhub',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      // НЕ УСТАНАВЛИВАЙТЕ VERCEL переменные!
      // VERCEL: '1',  ❌ НЕТ!
      // NEXT_PUBLIC_VERCEL: '1',  ❌ НЕТ!
    }
  }]
}
```

### Шаг 5: Перезапуск

```bash
# Остановите старый процесс
pm2 delete familyhub

# Запустите с новой конфигурацией
pm2 start ecosystem.config.js

# Сохраните конфигурацию
pm2 save

# Проверьте логи
pm2 logs familyhub --lines 50
```

---

## Решение 2: Vercel-style Build (Альтернатива)

Если хотите использовать compiled Tailwind CSS как на Vercel:

### Шаг 1: Установите Tailwind пакеты

```bash
cd /var/www/familyhub

# Установите Tailwind CSS v4
npm install tailwindcss @tailwindcss/postcss postcss --save --legacy-peer-deps
```

### Шаг 2: Создайте postcss.config.mjs

```javascript
// postcss.config.mjs
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

### Шаг 3: Установите VERCEL переменные

```bash
# В .env или PM2 config
export VERCEL=1
export NEXT_PUBLIC_VERCEL=1
```

### Шаг 4: Сборка

```bash
# Prebuild скрипт автоматически удалит CDN код
npm run build

# Проверьте standalone сервер
ls -la .next/standalone/server.js
```

### Шаг 5: Запуск

```bash
pm2 restart familyhub
# ИЛИ
npm start
```

---

## Проверка работоспособности

### 1. Проверьте standalone сервер

```bash
ls -la /var/www/familyhub/.next/standalone/server.js
# Должен существовать и быть ~100KB+
```

### 2. Проверьте PM2 логи

```bash
pm2 logs familyhub --lines 100
```

**Ожидаемый вывод:**
```
✓ Ready in XXXms
- Local: http://localhost:3000
```

**НЕ должно быть:**
```
Error: Cannot find module '.next/standalone/server.js'
MODULE_NOT_FOUND
```

### 3. Проверьте стили в браузере

Откройте DevTools → Network:
- **Решение 1 (CDN)**: Должен загружаться `@tailwindcss/browser@4` с jsdelivr.net
- **Решение 2 (Compiled)**: Должны быть файлы `/_next/static/css/*.css`

### 4. Проверьте консоль браузера

**НЕ должно быть:**
```
Failed to find Server Action
Hydration mismatch
```

---

## Диагностика проблем

### Проблема: "MODULE_NOT_FOUND: server.js"

**Причина**: Сборка не выполнена или `output: "standalone"` отключен

**Решение**:
```bash
# Проверьте next.config.mjs
grep "output.*standalone" next.config.mjs

# Пересоберите
rm -rf .next
npm run build
```

### Проблема: "Нет стилей на странице"

**Причина**: VERCEL переменные установлены, но Tailwind не собран

**Решение**:
```bash
# Вариант А: Удалите VERCEL переменные (используйте CDN)
unset VERCEL
unset NEXT_PUBLIC_VERCEL
npm run build

# Вариант Б: Установите Tailwind пакеты (используйте compiled CSS)
npm install tailwindcss @tailwindcss/postcss postcss --save
# Обновите postcss.config.mjs (см. выше)
npm run build
```

### Проблема: "Failed to find Server Action"

**Причина**: Клиент и сервер из разных сборок

**Решение**:
```bash
# Полная пересборка
rm -rf .next node_modules/.cache
npm ci
npm run build
pm2 restart familyhub
```

---

## Рекомендации

### ✅ Для Production сервера (PM2)

**Используйте Решение 1** (CDN режим):
- Проще в настройке
- Не требует Tailwind пакетов
- Меньше размер node_modules
- Быстрее сборка

### ✅ Для Vercel/Netlify

**Используйте Решение 2** (Compiled CSS):
- Автоматически настраивается через prebuild
- Оптимизированный CSS bundle
- Лучшая производительность

### ⚠️ Важно

**НИКОГДА не устанавливайте VERCEL переменные на своем сервере без установки Tailwind пакетов!**

Это приведет к:
- Отключению CDN
- Отсутствию compiled CSS
- Полному отсутствию стилей

---

## Быстрый чеклист

- [ ] Удалены VERCEL переменные из окружения (для CDN режима)
- [ ] Выполнен `npm ci` или `pnpm install`
- [ ] Выполнен `npm run build`
- [ ] Существует `.next/standalone/server.js`
- [ ] PM2 запускает `node .next/standalone/server.js`
- [ ] В логах нет ошибок MODULE_NOT_FOUND
- [ ] Стили загружаются (CDN или CSS файлы)
- [ ] Нет ошибок Server Action в консоли

---

## Контакты для поддержки

Если проблемы остаются:
1. Проверьте PM2 логи: `pm2 logs familyhub`
2. Проверьте переменные окружения: `pm2 env 0`
3. Проверьте файлы сборки: `ls -la .next/standalone/`
