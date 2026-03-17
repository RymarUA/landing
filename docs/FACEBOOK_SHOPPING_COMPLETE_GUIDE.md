# 🛍️ Facebook & Instagram Shopping Integration Guide

## 📋 Огляд

Система автоматичної синхронізації товарів з Sitniks CRM у Facebook Commerce Manager та Instagram Shopping.

### ✨ Що це дає:
- **Автоматична синхронізація:** Додав товар в Sitniks → з'явився на сайті, в Facebook та Instagram
- **Єдине джерело правди:** Sitniks CRM — всі оновлення звідти
- **Динамічна реклама:** Facebook знає, які товари дивляться, і показує релевантну рекламу
- **Shopping теги:** Клієнти можуть тапнути на товар в Instagram і купити на сайті
- **Автоматична наявність:** Товар закінчився → автоматично з'являється "Немає в наявності"

---

## 🔄 Архітектура системи

```
Sitniks CRM → (1 хв) → Сайт → (1 год) → Facebook → (миттєво) → Instagram
```

### Компоненти:

#### 1. **Sitniks CRM**
- Основне джерело даних про товари
- API для отримання товарів та категорій
- Автоматичне оновлення кожну хвилину

#### 2. **Next.js API Routes**
```
/api/fb-feed-csv     - Основний CSV фід (рекомендований)
/api/fb-feed         - Google Product XML
/api/fb-feed-test    - Тестовий XML з 2 товарами
/api/fb-feed-simple  - Простий RSS без namespace
/api/fb-feed-google  - Google Atom формат
```

#### 3. **Facebook Commerce Manager**
- Завантажує CSV фід щогодини
- Синхронізує з Instagram Shopping
- Керує каталогом товарів

---

## 🚀 Швидкий старт

### Крок 1: Перевірка API-ендпоінтів

Спробуй ці URL в порядку (простий → складний):

1. **CSV фід (найпростіший):**
   ```
   https://familyhub.com.ua/api/fb-feed-csv
   ```

2. **Простий RSS (без namespace):**
   ```
   https://familyhub.com.ua/api/fb-feed-simple
   ```

3. **Google Atom формат:**
   ```
   https://familyhub.com.ua/api/fb-feed-google
   ```

4. **Тестовий RSS з реальними товарами:**
   ```
   https://familyhub.com.ua/api/fb-feed-test
   ```

5. **Основний фід (повна версія):**
   ```
   https://familyhub.com.ua/api/fb-feed
   ```

### Крок 2: Налаштування Facebook Commerce Manager

1. **Перейди в [Commerce Manager](https://business.facebook.com/commerce)**

2. **Створи новий каталог** (якщо ще немає):
   - Назва: "Rymar Catalog"
   - Часовий пояс: Europe/Kyiv
   - Валюта: UAH

3. **Додай джерело даних:**
   - Data Sources → Add items → Data Feed
   - Вибери "Scheduled Fetch"
   - **Спробуй CSV формат спочатку:**
     - URL: `https://familyhub.com.ua/api/fb-feed-csv`
     - File format: **CSV**
   - **Якщо CSV працює, спробуй XML:**
     - URL: `https://familyhub.com.ua/api/fb-feed-simple`
     - File format: **RSS/ATOM**
   - Method: GET
   - Schedule: Every hour
   - Encoding: UTF-8

4. **Збережи** і зачекай першого завантаження (5-10 хвилин)

### Крок 3: Прив'язка до Facebook сторінки

1. **Commerce Manager** → Твій каталог
2. **Sales Channels** → Add Sales Channel
3. **Вибери "Facebook Page"**
4. **Підключи сторінку** `familyhubmarketod`

### Крок 4: Активація Shopping на сторінці

1. **На сторінці Facebook:**
   - Налаштування → Шаблони та вкладки
   - Додай вкладку "Shop"
   - Налаштуй її показувати твій каталог

2. **Додай кнопку Shop Now:**
   - Тип кнопки: "Shop Now"
   - URL: `https://www.facebook.com/familyhubmarketod/shop`

### Крок 5: Instagram Shopping

1. **Переконайся, що Instagram:**
   - Professional (Business) акаунт
   - Прив'язаний до тієї ж Facebook Page

2. **У Instagram:**
   - Профіль → Налаштування → Бізнес → Shopping
   - Вибери свій Facebook каталог
   - Налаштуй доставки та повернення

---

## 🔧 Технічні деталі

### API Routes

#### `/api/fb-feed-csv` (Рекомендований)
```typescript
// CSV формат з реальними товарами з Sitniks
// Автоматично оновлюється кожну хвилину
// Підтримує fallback до тестових даних
```

**Формат CSV:**
```csv
id,title,description,availability,condition,price,link,image_link,brand,category,quantity
12345,Наколенник ортопедичний,Ортопедичний наколенник,in stock,new,1200.00 UAH,https://...,https://...,Rymar,Наколінники,10
```

#### `/api/fb-feed` (Google Product XML)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>Rymar Product Feed</title>
    <item>
      <g:id>12345</g:id>
      <g:title>Наколенник ортопедичний</g:title>
      <g:description>Ортопедичний наколенник...</g:description>
      <g:availability>in stock</g:availability>
      <g:condition>new</g:condition>
      <g:price>1200.00 UAH</g:price>
      <g:link>https://familyhub.com.ua/product/...</g:link>
      <g:image_link>https://cdn.sitniks.com/...</g:image_link>
      <g:brand>Rymar</g:brand>
      <g:category>Наколінники</g:category>
      <g:quantity>10</g:quantity>
    </item>
  </channel>
</rss>
```

### Кешування та оновлення

#### Sitniks → Сайт (1 хвилина)
```typescript
// lib/instagram-catalog.ts
export async function getCatalogProducts() {
  // Next.js автоматично кешує на 1 хвилину
  const products = await getAllSitniksProducts();
  return products.map(mapSitniksProduct);
}
```

#### Сайт → Facebook (1 година)
- Facebook Commerce Manager завантажує фід щогодини
- Оновлює каталог автоматично
- Зміни з'являються протягом 1-2 годин

### CORS та Security Headers
```javascript
// next.config.mjs
{
  source: "/api/fb-feed/:path*",
  headers: [
    { key: "Access-Control-Allow-Origin", value: "*" },
    { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
    { key: "Access-Control-Allow-Headers", value: "Content-Type" },
    { key: "Cache-Control", value: "public, max-age=3600" },
  ],
}
```

---

## 🛠️ Обробка помилок

### Поширені проблеми та рішення

#### 1. "URL не содержит ссылку на поддерживаемый файл"
**Причина:** Facebook не може прочитати XML формат
**Рішення:** Спробуй CSV формат спочатку
```
https://familyhub.com.ua/api/fb-feed-csv
```

#### 2. "Feed is empty" або "No products found"
**Причина:** Проблема з Sitniks API або кешуванням
**Рішення:** Перевір тестовий фід
```
https://familyhub.com.ua/api/fb-feed-test
```

#### 3. "SSL certificate error"
**Причина:** Проблеми з SSL сертифікатом
**Рішення:** Перевір SSL на https://familyhub.com.ua

#### 4. "Geoblocked" або "Access denied"
**Причина:** Firewall або geoblocking
**Рішення:** Перевір, що URL доступний з будь-якої країни

### Діагностичні endpoints

#### `/api/feed-test`
```json
{
  "status": "ok",
  "timestamp": "2026-03-17T13:59:00.000Z",
  "domain": "familyhub.com.ua",
  "endpoints": {
    "xml": "https://familyhub.com.ua/api/fb-feed",
    "csv": "https://familyhub.com.ua/api/fb-feed-csv"
  }
}
```

#### `/api/facebook-shop-check`
```json
{
  "page": {
    "url": "https://www.facebook.com/familyhubmarketod",
    "status": "exists",
    "recommendations": [
      "Перевір, що сторінка має Business тип",
      "Додай вкладку Shop в налаштуваннях сторінки"
    ]
  },
  "catalog": {
    "url": "https://familyhub.com.ua/api/fb-feed-csv",
    "status": "active",
    "update_frequency": "1 hour"
  }
}
```

---

## 📊 Моніторинг та аналітика

### Перевірка статусу фіду
```bash
# Перевірка доступності
curl -I https://familyhub.com.ua/api/fb-feed-csv

# Перевірка вмісту
curl https://familyhub.com.ua/api/fb-feed-csv | head -5
```

### Логування помилок
```typescript
// app/api/fb-feed-csv/route.ts
try {
  const products = await getCatalogProducts();
  // ...
} catch (error) {
  console.error('[fb-feed-csv] Error generating CSV feed:', error);
  // Fallback до тестових даних
}
```

### Метрики успішності
- **Кількість товарів:** Повинна збігатися з Sitniks
- **Час оновлення:** Кожні 60 хвилин
- **Статус завантаження:** Active у Commerce Manager
- **Помилки:** 0 або мінімум

---

## 🔄 Процес оновлення товарів

### Автоматичний процес
1. **Додавання товару в Sitniks**
2. **Через 1 хвилину:** Товар з'являється на сайті
3. **Через 1 годину:** Товар з'являється в Facebook Commerce Manager
4. **Миттєво:** Товар синхронізується з Instagram Shopping

### Ручне оновлення (якщо потрібно)
1. **Commerce Manager** → Data Sources
2. **Вибери фід** → Fetch Now
3. **Зачекай** 5-10 хвилин

### Масові оновлення
- **Ціни:** Автоматично оновлюються
- **Наявність:** Автоматично оновлюється
- **Описи:** Автоматично оновлюються
- **Зображення:** Автоматично оновлюються

---

## 🎯 Найкращі практики

### 1. Використовуй CSV формат
- Facebook краще підтримує CSV
- Менше проблем з форматуванням
- Швидша обробка

### 2. Регулярно перевіряй статус
- Commerce Manager → Data Sources
- Перевір останнє завантаження
- Монітор помилки

### 3. Тримай дані актуальними
- Оновлюйте ціни в Sitniks
- Слідкуйте за наявністю
- Перевіряйте зображення

### 4. Тестуй зміни
- Спочатку тестовий фід
- Потім основний фід
- Перевір результат

### 5. Резервне копіювання
- Зберігай тестові фіди
- Май fallback варіанти
- Монітор логи

---

## 📞 Підтримка

### Корисні посилання
- [Facebook Commerce Manager](https://business.facebook.com/commerce)
- [Facebook Shopping Help](https://www.facebook.com/business/help/2284463181837648)
- [Instagram Shopping Guide](https://business.instagram.com/shopping/)

### Діагностичні URL
- Основний фід: `https://familyhub.com.ua/api/fb-feed-csv`
- Тестовий фід: `https://familyhub.com.ua/api/fb-feed-test`
- Діагностика: `https://familyhub.com.ua/api/feed-test`

### Контакти для підтримки
- Технічні питання: перевір логи сервера
- Facebook питання: Commerce Manager → Help Center
- Instagram питання: Instagram Business → Help Center

---

## 📈 Майбутні розширення

### Плановані функції:
1. **Real-time синхронізація** замість щогодинної
2. **Advanced analytics** для відстеження конверсій
3. **Multi-language підтримка** для міжнародних ринків
4. **Custom attributes** для специфічних товарів
5. **Bulk operations** для масових оновлень

### Можливі інтеграції:
1. **Google Shopping** через той самий фід
2. **TikTok Shop** API
3. **Amazon Marketplace** integration
4. **Etsy** для hand-made товарів

---

## 🎉 Результат

Після налаштування у тебе буде:
- ✅ **Повна автоматизація** товарів з Sitniks
- ✅ **Facebook Shopping** на сторінці `familyhubmarketod`
- ✅ **Instagram Shopping** з тегами товарів
- ✅ **Динамічна реклама** на основі реальних товарів
- ✅ **Автоматична наявність** та ціни
- ✅ **Єдине джерело правди** — Sitniks CRM

**Система готова до використання!** 🚀
