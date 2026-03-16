# Інтеграція аналітики та персоналізації з Sitniks CRM

Повна інтеграція системи аналітики поведінки клієнтів, синхронізації списку бажань та уведомлень про товари з Sitniks CRM.

## 📊 Що інтегровано

### 1. **Аналітика просмотрів товарів**
- Автоматичне відстеження кліків по товарах
- Збір даних про перегляди для персоналізації
- Аналіз інтересів по категоріях
- Історія переглядів клієнта

### 2. **Синхронізація списку бажань**
- Автоматична синхронізація з Sitniks CRM
- Збереження улюблених товарів у профілі клієнта
- Відстеження змін у списку бажань
- Debounce для оптимізації запитів (2 секунди)

### 3. **Система уведомлень**
- **Зниження цін** - сповіщення про знижки на товари зі списку бажань
- **Повернення в наявність** - коли товар знову доступний
- **Нові надходження** - товари в улюблених категоріях

### 4. **Персоналізовані рекомендації**
- На основі історії переглядів
- Схожі покупки інших клієнтів
- Трендові товари
- Товари зі знижками

---

## 🚀 Як це працює

### Відстеження просмотрів

```typescript
import { useProductTracking } from "@/hooks/use-product-tracking";

const { trackClick } = useProductTracking();

// При кліку на товар
trackClick({
  id: product.id,
  name: product.name,
  category: product.category,
  price: product.price,
});
```

**Автоматично інтегровано в:**
- `modern-product-card.tsx` - всі картки товарів
- Компактний і звичайний режими

### Синхронізація Wishlist

```typescript
import { useWishlistSync } from "@/hooks/use-product-tracking";

const { syncWishlist, getAlerts } = useWishlistSync();

// Синхронізація списку
await syncWishlist(productIds, products);

// Отримання сповіщень
const alerts = await getAlerts();
```

**Автоматично працює в:**
- `wishlist-context.tsx` - при кожній зміні списку бажань
- Debounce 2 секунди для оптимізації

### Уведомлення про товари

```typescript
import { useProductNotifications } from "@/hooks/use-product-tracking";

const { subscribeToPriceDrop, subscribeToBackInStock, getAlerts } = useProductNotifications();

// Підписка на зниження ціни
await subscribeToPriceDrop(productId, currentPrice);

// Підписка на повернення в наявність
await subscribeToBackInStock(productId);

// Отримання всіх сповіщень
const alerts = await getAlerts();
```

**Відображається в:**
- `ProductNotificationsWidget` - віджет у профілі клієнта
- Автоматичне завантаження при вході

---

## 📁 Структура файлів

### Бібліотеки (lib/)
```
lib/
├── customer-analytics.ts       # Аналітика поведінки клієнтів
├── wishlist-sync.ts           # Синхронізація списку бажань
└── product-notifications.ts   # Система уведомлень
```

### API Endpoints (app/api/)
```
app/api/
├── analytics/
│   ├── track-view/route.ts          # POST - відстеження перегляду
│   └── recommendations/route.ts     # GET - персоналізовані рекомендації
├── wishlist/
│   ├── sync/route.ts               # POST - синхронізація списку
│   └── alerts/route.ts             # GET - сповіщення про товари
└── notifications/
    ├── subscribe/route.ts          # POST - підписка на уведомлення
    └── alerts/route.ts             # GET - всі сповіщення
```

### Хуки (hooks/)
```
hooks/
└── use-product-tracking.ts    # Хуки для відстеження та уведомлень
```

### Компоненти (components/)
```
components/
├── modern-product-card.tsx              # ✅ Інтегровано відстеження
├── wishlist-context.tsx                 # ✅ Інтегровано синхронізацію
└── product-notifications-widget.tsx     # Віджет уведомлень
```

---

## 🔧 API Endpoints

### 1. Відстеження перегляду товару
```http
POST /api/analytics/track-view
Content-Type: application/json

{
  "productId": 123,
  "productName": "Назва товару",
  "category": "Категорія",
  "price": 1500,
  "source": "catalog"
}
```

**Відповідь:**
```json
{
  "success": true
}
```

### 2. Персоналізовані рекомендації
```http
GET /api/analytics/recommendations?limit=10
```

**Відповідь:**
```json
{
  "recommendations": [
    {
      "productId": 456,
      "score": 0.95,
      "reason": "viewed_category"
    }
  ]
}
```

### 3. Синхронізація списку бажань
```http
POST /api/wishlist/sync
Content-Type: application/json

{
  "productIds": [123, 456, 789],
  "products": [
    {
      "id": 123,
      "name": "Товар 1",
      "price": 1500,
      "category": "Категорія"
    }
  ]
}
```

**Відповідь:**
```json
{
  "success": true,
  "synced": 3
}
```

### 4. Сповіщення про товари
```http
GET /api/wishlist/alerts
```

**Відповідь:**
```json
{
  "priceDrops": [
    {
      "productId": 123,
      "oldPrice": 2000,
      "newPrice": 1500,
      "discount": 500,
      "discountPercent": 25
    }
  ],
  "backInStock": [456, 789]
}
```

### 5. Підписка на уведомлення
```http
POST /api/notifications/subscribe
Content-Type: application/json

{
  "type": "price-drop",
  "productId": 123,
  "currentPrice": 2000
}
```

**Типи уведомлень:**
- `price-drop` - зниження ціни
- `back-in-stock` - повернення в наявність
- `new-arrivals` - нові надходження

### 6. Всі сповіщення клієнта
```http
GET /api/notifications/alerts
```

**Відповідь:**
```json
{
  "priceDrops": [...],
  "backInStock": [...],
  "newArrivals": [...],
  "total": 5
}
```

---

## 💡 Використання в компонентах

### Відстеження кліків у картці товару

```tsx
import { useProductTracking } from "@/hooks/use-product-tracking";

export function ProductCard({ product }) {
  const { trackClick } = useProductTracking();

  const handleCardClick = () => {
    trackClick({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
    });
  };

  return (
    <Link href={`/product/${product.id}`} onClick={handleCardClick}>
      {/* Вміст картки */}
    </Link>
  );
}
```

### Віджет уведомлень у профілі

```tsx
import { ProductNotificationsWidget } from "@/components/product-notifications-widget";

export function ProfilePage() {
  return (
    <div>
      {/* Автоматично завантажує та відображає сповіщення */}
      <ProductNotificationsWidget />
      
      {/* Інший контент профілю */}
    </div>
  );
}
```

---

## 🎯 Переваги інтеграції

### Для бізнесу:
- **Глибока аналітика** - розуміння поведінки клієнтів
- **Персоналізація** - індивідуальні рекомендації для кожного
- **Збільшення конверсії** - уведомлення про знижки та наявність
- **Утримання клієнтів** - нагадування про улюблені товари
- **Сегментація** - автоматичний поділ клієнтів за інтересами

### Для клієнта:
- **Персональний досвід** - товари за інтересами
- **Економія часу** - не потрібно шукати знижки
- **Актуальність** - сповіщення про важливі події
- **Зручність** - все в одному профілі

---

## 🔒 Безпека

- **Автентифікація** - всі endpoints вимагають JWT токен
- **Валідація** - перевірка всіх вхідних даних
- **Rate limiting** - захист від зловживань
- **Silent fail** - аналітика не ламає UX при помилках

---

## 📈 Метрики та моніторинг

### Логування:
```
[customer-analytics] Tracked product view: 123
[wishlist-sync] Synced 5 items for customer 456
[product-notifications] Sent price drop alert for product 789
```

### Метрики для відстеження:
- Кількість переглядів товарів
- Конверсія з перегляду в покупку
- Ефективність рекомендацій
- Відкриття уведомлень
- Синхронізація списку бажань

---

## 🚦 Статус інтеграції

✅ **Повністю інтегровано:**
- Відстеження просмотрів товарів
- Синхронізація списку бажань
- Система уведомлень
- Віджет у профілі клієнта
- API endpoints
- Автоматична робота

🎉 **Готово до використання!**

Всі компоненти автоматично працюють після авторизації клієнта. Не потрібно додаткових налаштувань.
