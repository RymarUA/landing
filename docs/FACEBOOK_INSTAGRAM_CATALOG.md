# 🛍️ Facebook & Instagram Shopping Integration

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
/api/fb-feed/products        - Основний фід товарів
/api/fb-feed/inventory       - Фід наявності
/api/fb-feed/categories      - Фід категорій
/api/feed-test/validate      - Тестування фіду
```

#### 3. **Facebook Commerce Manager**
- Отримує дані з API routes
- Автоматично синхронізує з Instagram
- Керує наявністю та цінами

---

## � Швидка настройка (5 хвилин)

### Крок 1: Environment Variables
```bash
# Додайте в .env.local
INSTAGRAM_ACCESS_TOKEN=your_long_lived_token
INSTAGRAM_USER_ID=your_numeric_user_id
```

### Крок 2: Facebook Commerce Manager
1. **Створіть Catalog** в Commerce Manager
2. **Налаштуйте фід товарів:**
   - URL: `https://your-site.com/api/fb-feed/products`
   - Schedule: Every hour
3. **Підключіть Instagram** до Catalog

### Крок 3: Instagram Shopping
1. **Налаштуйте Instagram Shopping** в Instagram App
2. **Підключіть ваш Catalog**
3. **Додайте shopping теги** до постів

### Крок 4: Перевірка
```bash
# Тест фіду
curl https://your-site.com/api/fb-feed/products

# Валідація
curl https://your-site.com/api/feed-test/validate
```

---

## � Детальна технічна документація

### 1. Перевірка API-ендпоінтів

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

### 2. Діагностика проблем

Якщо жоден URL не працює, перевір:

1. **Доступність URL:**
   ```
   https://familyhub.com.ua/api/feed-test
   ```
   - Повинен повернути JSON з усіма endpoints

2. **SSL сертифікат:** Переконайся, що https://familyhub.com.ua має валідний SSL

3. **Firewall/Cloudflare:** Можливо, блокує запити від Facebook IP

4. **Geoblocking:** URL повинен бути доступний з будь-якої країни

### 3. Налаштування Facebook Commerce Manager

1. **Перейди в [Commerce Manager](https://business.facebook.com/commerce)**

2. **Створи новий каталог** (якщо ще немає)

3. **Налаштування каталогу:**
   - Назва: "Rymar Catalog"
   - Часовий пояс: Europe/Kyiv
   - Валюта: UAH

4. **Додай джерело даних:**
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

5. **Збережи** і зачекай першого завантаження (5-10 хвилин)

### 3. Прив'язка Instagram Shopping

1. **Переконайся, що Instagram:**
   - Professional (Business) акаунт
   - Прив'язаний до тієї ж Facebook Page
   
2. **У Instagram:**
   - Профіль → Налаштування → Бізнес → Shopping
   - Вибери свій Facebook каталог
   - Налаштуй доставки та повернення

3. **Активуй теги товарів:**
   - Налаштування → Бізнес → Теги товарів
   - Вибери каталог для тегування

---

## 🔧 Технічні деталі

### Структура XML-фіда

API-ендпоінт `/api/fb-feed` генерує XML з такими полями:

```xml
<g:id>12345</g:id>
<g:title>Назва товару</g:title>
<g:description>Опис товару</g:description>
<g:price>890.00 UAH</g:price>
<g:sale_price>750.00 UAH</g:sale_price>
<g:availability>in stock</g:availability>
<g:condition>new</g:condition>
<g:link>https://yourdomain.com/product/slug</g:link>
<g:image_link>https://cdn.com/image.jpg</g:image_link>
<g:brand>Rymar</g:brand>
<g:category>Категорія</g:category>
<g:quantity>10</g:quantity>
```

### Синхронізація ID товарів

**Важливо:** ID товару в XML-фіді повинен збігатися з ID, який передає Facebook Pixel:

```javascript
// Приклад ViewContent події
fbq('track', 'ViewContent', {
  content_ids: ['12345'], // Той самий ID, що й у XML
  content_type: 'product',
  value: 890,
  currency: 'UAH'
});
```

### Оновлення товарів

- **Sitniks → Сайт:** Автоматично через 1 хвилину (Next.js кеш)
- **Сайт → Facebook:** Щогодини (за розкладом)
- **Facebook → Instagram:** Майже миттєво

---

## 🛠️ Вимоги до товарів у Sitniks

### Обов'язкові поля:
- **title** - Назва товару
- **price** - Ціна
- **image** - Фото товару

### Рекомендовані поля:
- **description** - Опис для кращої конверсії
- **category** - Категорія для групування
- **badge** - "ХІТ", "Новинка", "Знижка"
- **oldPrice** - стара ціна для знижок

### Налаштування характеристик (Properties) у Sitniks:

```
badge: ХІТ | Новинка | Знижка | Топ | Акція
badgeColor: bg-amber-400 text-gray-900 (опціонально)
isHit: Так | True | 1
isNew: Так | True | 1
freeShipping: Так | True | 1
oldPrice: 1800 (число)
rating: 4.8 (число 0-5)
reviews: 48 (число)
```

---

## 🐛 Troubleshooting

### Товари не з'являються в Facebook

1. **Перевір XML-фід:**
   ```
   https://yourdomain.com/api/fb-feed
   ```
   - Чи є товари в XML?
   - Чи правильна структура?

2. **Перевір статус завантаження:**
   - Commerce Manager → Data Sources
   - Натисни на свій фід
   - Подивись останнє завантаження та помилки

3. **Перевір відповідність вимогам:**
   - Усі товари мають унікальні ID
   - Ціни в правильному форматі (890.00 UAH)
   - Фото доступні за URL

### Instagram Shopping не активується

1. **Перевір прив'язку:**
   - Instagram Business акаунт
   - Та сама Facebook Page
   - Каталог налаштований

2. **Перевір товари:**
   - Мінімум 9 товарів у каталозі
   - Всі товари мають фото та ціни

3. **Зачекай 24 години** — іноді потрібен час на синхронізацію

### Динамічна реклама не працює

1. **Перевір Facebook Pixel:**
   - Встановлений на сайті
   - Передає правильні content_ids

2. **Перевір відповідність ID:**
   - ID в XML = ID в Pixel
   - Формат ID однаковий (рядок або число)

---

## 📈 Моніторинг

### Регулярно перевіряй:

1. **Статус фіду:** Commerce Manager → Data Sources
2. **Кількість товарів:** Повинна збігатися з Sitniks
3. **Помилки:** Facebook показує детальні помилки
4. **Продажі:** Перевір, чи відстежуються конверсії

### Корисні лінки:

- [Commerce Manager](https://business.facebook.com/commerce)
- [Facebook Pixel Helper](https://chrome.google.com/webstore/detail/facebook-pixel-helper/fdgfkebogoimckpcfnmclbnghhpphppp)
- [Product Feed Validator](https://www.productfeedvalidator.com/)

---

## 🚀 Додаткові можливості

### Розширений фід

Можна розширити XML-фід додатковими полями:

```typescript
// Додати в generateFacebookFeed()
if (product.freeShipping) {
  fbProduct['g:shipping'] = '<g:shipping><g:country>UA</g:country><g:service>Standard</g:service><g:price>0 UAH</g:price></g:shipping>';
}

if (product.rating) {
  fbProduct['g:rating'] = product.rating.toString();
}
```

### Кілька фідів

Для різних країн чи категорій можна створити кілька фідів:

- `/api/fb-feed/ua` - товари для України
- `/api/fb-feed/eu` - товари для ЄС
- `/api/fb-feed/sale` - товари зі знижками

---

## 💎 Підсумок

Після налаштування ти отримаєш повністю автоматизовану систему:

1. **Додав товар в Sitniks** → автоматично з'явився на сайті та в Instagram
2. **Змінив ціну** → оновилася скрізь за 1-2 години
3. **Товар закінчився** → реклама автоматично зупинилася
4. **Клієнт тапнув на товар в Instagram** → купив на сайті

Це найефективніший спосіб вести сучасний e-commerce в 2024! 🚀
