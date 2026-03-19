# 🚀 Посібник з деплою

## Проблема: "Could not find a production build"

Ця помилка виникає, коли PM2 намагається запустити `next start` без попередньої збірки проєкту.

## ✅ Рішення

### 1. **Автоматична збірка при запуску PM2**

PM2 тепер використовує `scripts/start-with-build.js`, який:
- Перевіряє наявність папки `.next` та `BUILD_ID`
- Автоматично виконує збірку, якщо вона відсутня
- Запускає production сервер

**Конфігурація PM2:**
```javascript
// ecosystem.config.js
{
  script: 'scripts/start-with-build.js',
  args: '-p 3000'
}
```

### 2. **Правильний деплой на сервер**

Використовуйте скрипт `deploy:server` для деплою:

```bash
npm run deploy:server
```

Цей скрипт виконує:
1. ✅ Видаляє стару збірку (`.next`)
2. ✅ Оновлює `DEPLOYMENT_ID` (нова версія)
3. ✅ Виконує `npm run build`
4. ✅ Перевіряє успішність збірки
5. ✅ Перезапускає PM2

### 3. **Ручний деплой (покрокова інструкція)**

Якщо потрібно виконати деплой вручну:

```bash
# 1. Оновити код з Git
git pull origin main

# 2. Встановити залежності (якщо змінився package.json)
npm install

# 3. Виконати деплой
npm run deploy:server
```

### 4. **Перезапуск PM2 без збірки**

Якщо збірка вже є і потрібно просто перезапустити:

```bash
pm2 restart ecosystem.config.js
```

Скрипт `start-with-build.js` автоматично визначить, що збірка є, і пропустить повторну збірку.

### 5. **Примусова збірка**

Якщо потрібно примусово перезібрати проєкт:

```bash
# Встановити змінну середовища
export FORCE_BUILD=1

# Перезапустити PM2
pm2 restart ecosystem.config.js --update-env
```

Або просто:

```bash
npm run deploy:server
```

## 🛡️ Захист від помилок

### Автоматичні перевірки:

1. **При запуску PM2:**
   - Перевіряється наявність `.next/BUILD_ID`
   - Якщо відсутній → автоматична збірка

2. **При деплої:**
   - Видаляється стара збірка
   - Оновлюється `DEPLOYMENT_ID`
   - Виконується чиста збірка
   - Перевіряється успішність

3. **На клієнті:**
   - `DeploymentErrorHandler` ловить ChunkLoadError
   - Автоматичне оновлення сторінки

## 📋 Доступні команди

```bash
# Розробка
npm run dev              # Запуск dev сервера
npm run dev:turbo        # Запуск з Turbopack

# Збірка
npm run build            # Повна збірка (з очищенням .next)
npm run build:fast       # Швидка збірка (без type-check)
npm run build:emergency  # Аварійна збірка

# Запуск production
npm start                # Запуск з автоматичною збіркою
npm run start:dev        # Те саме

# Деплой
npm run deploy:server    # Повний деплой на сервер
npm run deploy:prod      # Деплой на Vercel
npm run deploy:check     # Перевірка env змінних
```

## 🔧 Налагодження

### Помилка: "No .next directory found"

**Рішення:**
```bash
npm run build
pm2 restart ecosystem.config.js
```

### Помилка: "ChunkLoadError" на клієнті

**Причина:** Застарілі чанки після деплою

**Автоматичне рішення:** Сторінка оновиться автоматично

**Ручне рішення:**
```bash
# На сервері
npm run deploy:server
```

### PM2 не запускається

**Перевірка логів:**
```bash
pm2 logs familyhub
pm2 logs familyhub --err
```

**Перезапуск:**
```bash
pm2 delete familyhub
pm2 start ecosystem.config.js
```

## 📝 Важливі файли

- `ecosystem.config.js` - Конфігурація PM2
- `scripts/start-with-build.js` - Скрипт запуску з автоматичною збіркою
- `scripts/deploy-with-build.sh` - Скрипт деплою
- `scripts/update-deployment-id.js` - Оновлення версії деплою
- `components/deployment-error-handler.tsx` - Обробник помилок на клієнті
- `next.config.mjs` - Конфігурація Next.js з deploymentId

## ✅ Чеклист деплою

- [ ] Код закомічено в Git
- [ ] Код запушено на сервер (`git push`)
- [ ] На сервері виконано `git pull`
- [ ] Виконано `npm install` (якщо змінився package.json)
- [ ] Виконано `npm run deploy:server`
- [ ] Перевірено логи PM2 (`pm2 logs`)
- [ ] Перевірено сайт у браузері
- [ ] Перевірено відсутність помилок у консолі браузера

## 🎯 Результат

Після налаштування помилка **"Could not find a production build"** більше не з'явиться, тому що:

1. ✅ PM2 завжди перевіряє наявність збірки
2. ✅ Автоматична збірка при відсутності `.next`
3. ✅ Скрипт деплою гарантує чисту збірку
4. ✅ Клієнт автоматично оновлюється при помилках
5. ✅ Кожен деплой має унікальний ID
