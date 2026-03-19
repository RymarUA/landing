# 🚀 Швидкий старт деплою

## Проблема вирішена ✅

Помилка **"Could not find a production build in the '.next' directory"** більше не з'явиться.

## Що змінено:

### 1. **PM2 тепер використовує розумний запуск**
```javascript
// ecosystem.config.js
script: 'scripts/start-with-build.js'  // Замість прямого 'next start'
```

### 2. **Автоматична перевірка збірки**
Скрипт `start-with-build.js` автоматично:
- ✅ Перевіряє наявність `.next/BUILD_ID`
- ✅ Виконує збірку, якщо потрібно
- ✅ Запускає сервер

### 3. **Правильний деплой**
```bash
npm run deploy:server
```

Цей скрипт:
1. Видаляє стару збірку
2. Оновлює версію (DEPLOYMENT_ID)
3. Виконує чисту збірку
4. Перезапускає PM2

## 📋 Команди для деплою

### На сервері:

```bash
# Повний деплой (рекомендовано)
cd /var/www/familyhub
git pull origin main
npm install  # Якщо змінився package.json
npm run deploy:server

# Швидкий перезапуск (якщо збірка вже є)
pm2 restart ecosystem.config.js

# Примусова збірка
export FORCE_BUILD=1
pm2 restart ecosystem.config.js --update-env
```

### Перевірка статусу:

```bash
# Статус PM2
pm2 status

# Логи
pm2 logs familyhub

# Тільки помилки
pm2 logs familyhub --err

# Моніторинг
pm2 monit
```

## 🛡️ Захист від помилок

### Серверна частина:
- ✅ Автоматична збірка при запуску PM2
- ✅ Перевірка BUILD_ID перед стартом
- ✅ Очищення .next перед кожною збіркою
- ✅ Унікальний DEPLOYMENT_ID для кожної версії

### Клієнтська частина:
- ✅ Автоматичне оновлення при ChunkLoadError
- ✅ Захист від нескінченних перезавантажень
- ✅ Збереження URL при оновленні

## 📖 Детальна документація

Дивіться `docs/DEPLOYMENT_GUIDE.md` для повної інформації.

## ⚡ Швидкий чеклист

- [ ] `git pull origin main`
- [ ] `npm install` (якщо потрібно)
- [ ] `npm run deploy:server`
- [ ] Перевірити `pm2 logs`
- [ ] Відкрити сайт у браузері

**Готово!** 🎉
