# ✅ ФИНАЛЬНОЕ ИСПРАВЛЕНИЕ

## Проблема

Next.js 15.5.12 не позволяет использовать `next start` с `output: "standalone"`:
```
⚠ "next start" does not work with "output: standalone" configuration.
```

## Решение

Убрал `output: "standalone"` из `next.config.mjs` - теперь используем обычный `next start`.

---

## На сервере выполните:

```bash
cd /var/www/familyhub

# 1. Получить обновления
git fetch origin
git reset --hard origin/main

# 2. Установить зависимости
pnpm install

# 3. Очистить старую сборку
rm -rf .next

# 4. Собрать приложение
pnpm build

# 5. Перезапустить PM2
pm2 restart familyhub

# 6. Проверить логи
pm2 logs familyhub --lines 30
```

---

## Или одной командой:

```bash
cd /var/www/familyhub && \
git fetch origin && \
git reset --hard origin/main && \
pnpm install && \
rm -rf .next && \
pnpm build && \
pm2 restart familyhub && \
pm2 logs familyhub --lines 30
```

---

## Что изменилось

### ❌ Было (не работало):
```javascript
// next.config.mjs
const nextConfig = {
  output: "standalone",  // ❌ Конфликт с next start
  // ...
}
```

### ✅ Стало (работает):
```javascript
// next.config.mjs
const nextConfig = {
  // output: "standalone" removed
  // Using regular next start for PM2
  // ...
}
```

### PM2 конфигурация (без изменений):
```javascript
// ecosystem.config.js
{
  script: 'node_modules/next/dist/bin/next',
  args: 'start -p 3000',
  // ...
}
```

---

## Ожидаемый результат

После выполнения команд вы увидите:

```
✓ Ready in XXXms
   ▲ Next.js 15.5.12
   - Local:        http://localhost:3000
   - Network:      http://0.0.0.0:3000
```

**БЕЗ предупреждений** о standalone!

---

## Проверка

1. **PM2 логи чистые**:
   ```bash
   pm2 logs familyhub --lines 50
   ```
   Не должно быть ошибок или предупреждений

2. **Сайт работает**:
   - Откройте в браузере
   - Стили загружаются (Tailwind CDN)
   - Нет ошибок в консоли

3. **DevTools → Network**:
   - Загружается `@tailwindcss/browser@4` с jsdelivr.net
   - Все статические файлы загружаются

---

## Почему это работает

1. ✅ Убрали `output: "standalone"` → нет конфликта с `next start`
2. ✅ `next start` использует `.next` директорию (создается при build)
3. ✅ PM2 запускает `next start -p 3000`
4. ✅ VERCEL переменных нет → Tailwind CDN активен
5. ✅ Все работает как в development, но в production режиме

---

## Альтернатива (если нужен standalone)

Если в будущем понадобится standalone режим:

1. Оставить `output: "standalone"` в next.config.mjs
2. Изменить PM2 конфигурацию:
   ```javascript
   script: '.next/standalone/server.js'
   ```
3. После build скопировать файлы:
   ```bash
   cp -r .next/static .next/standalone/.next/
   cp -r public .next/standalone/
   ```

Но для текущей задачи обычный `next start` проще и работает отлично.
