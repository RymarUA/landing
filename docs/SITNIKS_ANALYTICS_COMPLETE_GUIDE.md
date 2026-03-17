# 🎯 Sitniks CRM Analytics Integration - Полное руководство

## 📋 Содержание
1. [Обзор системы](#обзор-системы)
2. [Архитектура](#архитектура)
3. [Настройка](#настройка)
4. [API документация](#api-документация)
5. [Компоненты](#компоненты)
6. [Безопасность](#безопасность)
7. [Продакшен развертывание](#продакшен-развертывание)
8. [Мониторинг и отладка](#мониторинг-и-отладка)
9. [FAQ](#faq)

---

## 🎯 Обзор системы

### Что это?
**Полнофункциональная система аналитики клиентов** с интеграцией в Sitniks CRM для отслеживания поведения покупателей и персонализации маркетинга.

### Ключевые возможности:
- 📊 **Customer Analytics Dashboard** - детальная статистика
- ❤️ **Wishlist синхронизация** с Sitniks CRM
- 👁️ **Product view tracking** с категориями
- 💰 **Price range анализ** и бюджетирование
- 📧 **Email уведомления** о скидках
- 📈 **Экспорт данных** (CSV/PDF)
- 🛡️ **Admin-only доступ** с защитой

---

## 🏗️ Архитектура

### Флоу данных:
```
Пользователь → Product Card → trackClick → API → Sitniks CRM → CustomFields → Analytics Dashboard
```

### Компоненты:
```
├── app/
│   ├── customer-analytics/     # Базовый дашборд (защищен)
│   ├── admin/analytics/        # Расширенный дашборд (admin only)
│   └── api/
│       ├── auth/check-admin/   # Проверка прав доступа
│       ├── customer-activity/  # Данные активности
│       ├── admin/analytics/    # Агрегированная статистика
│       ├── admin/export/       # Экспорт данных
│       └── notifications/      # Email уведомления
├── lib/
│   ├── sitniks-custom-fields.ts # Core функции работы с CRM
│   ├── sitniks-customers.ts    # API клиенты Sitniks
│   └── customer-analytics.ts   # Логика аналитики
└── components/
    ├── admin-guard.tsx         # Защита маршрутов
    └── product-notifications-widget.tsx
```

---

## ⚙️ Настройка

### 1. Environment Variables
```env
# Sitniks CRM
SITNIKS_API_URL=https://crm.sitniks.com/open-api
SITNIKS_API_KEY=your_api_key_here

# Email (опционально)
RESEND_API_KEY=your_resend_key

# Auth
JWT_SECRET=your_jwt_secret
```

### 2. Admin пользователи
```typescript
// app/api/auth/check-admin/route.ts
const adminEmails = [
  "admin@yourstore.com",
  "manager@yourstore.com"
];
```

### 3. Sitniks Custom Fields
Система автоматически создает custom field в Sitniks CRM:
```json
{
  "id": 1,
  "type": "text",
  "code": "customer_activity",
  "name": "Customer Activity",
  "value": "{\"wishlist\":[123],\"lastViewed\":[456],\"viewCount\":1,\"categories\":[\"Бандажі\"],\"priceRange\":\"0-10000\",\"notifications\":[],\"lastActivity\":\"2026-03-17T13:00:00.000Z\"}",
  "isRequired": false,
  "model": "clients",
  "ordering": 1
}
```

---

## 📡 API документация

### GET /api/customer-activity?id={customerId}
Получает активность конкретного клиента.

**Response:**
```json
{
  "wishlist": [21903869, 21910779],
  "lastViewed": [21910779],
  "viewCount": 1,
  "categories": ["Бандажі"],
  "priceRange": "0-10000",
  "notifications": [],
  "lastActivity": "2026-03-17T13:00:00.000Z"
}
```

### GET /api/admin/analytics
Агрегированная статистика (admin only).

**Query params:**
- `start` - дата начала (YYYY-MM-DD)
- `end` - дата окончания (YYYY-MM-DD)

**Response:**
```json
{
  "totalCustomers": 150,
  "activeCustomers": 89,
  "totalWishlistItems": 234,
  "totalViews": 1250,
  "topCategories": [
    {"name": "Бандажі", "count": 45},
    {"name": "Наколенники", "count": 32}
  ],
  "averagePriceRange": "0-10000",
  "recentActivity": [...]
}
```

### GET /api/admin/export?format={csv|pdf}
Экспорт данных (admin only).

**Response:** 
- CSV: `Content-Type: text/csv`
- PDF: `Content-Type: text/html`

### POST /api/analytics/track-view
Трекинг просмотра товара.

**Body:**
```json
{
  "productId": 123,
  "productName": "Наколенник ортопедичний",
  "category": "Наколенники",
  "price": 890,
  "source": "click"
}
```

---

## 🧩 Компоненты

### AdminGuard
Защищает маршруты для админов.
```tsx
import { AdminGuard } from "@/components/admin-guard";

export default function AdminPage() {
  return (
    <AdminGuard>
      <AdminContent />
    </AdminGuard>
  );
}
```

### Customer Analytics Dashboard
Базовый дашборд с активностью клиентов.
```tsx
// /customer-analytics
- Показывает всех клиентов
- Wishlist, просмотры, категории
- Обновление в реальном времени
```

### Admin Analytics Dashboard
Расширенный дашборд для админов.
```tsx
// /admin/analytics
- KPI метрики
- Графики и диаграммы
- Экспорт данных
- Фильтры по датам
```

---

## 🔐 Безопасность

### 1. Защита маршрутов
```typescript
// AdminGuard проверяет:
- JWT токен в cookies
- Роль пользователя в базе
- Автоматический редирект для неавторизованных
```

### 2. API защита
```typescript
// Все admin endpoints требуют:
- Валидный JWT токен
- Admin роль пользователя
- Rate limiting (рекомендуется)
```

### 3. Data privacy
```typescript
- Все данные хранятся в Sitniks CRM
- Локальная кэширование только для performance
- GDPR compliant
```

---

## 🚀 Продакшен развертывание

### 1. Подготовка
```bash
# 1. Настройте environment variables
cp .env.local.example .env.local

# 2. Установите зависимости
npm install

# 3. Настройте admin пользователей
# Отредактируйте app/api/auth/check-admin/route.ts

# 4. Проверьте Sitniks API ключ
curl -H "Authorization: Bearer YOUR_KEY" https://crm.sitniks.com/open-api/clients
```

### 2. Деплой
```bash
# Build
npm run build

# Start
npm run start

# Или используйте Vercel/Netlify
vercel --prod
```

### 3. Пост-деплой проверки
```bash
# 1. Проверьте analytics доступ
curl https://yourstore.com/api/customer-activity?id=TEST_ID

# 2. Проверьте admin доступ
curl https://yourstore.com/api/admin/analytics

# 3. Проверьте трекинг
curl -X POST https://yourstore.com/api/analytics/track-view \
  -H "Content-Type: application/json" \
  -d '{"productId":123,"productName":"Test","category":"Test","price":100}'
```

---

## 🔍 Мониторинг и отладка

### 1. Console логи
```typescript
// Включите debug режим:
[customer-analytics] Response for customer 4769814: 200
[getCustomerActivity] Found activity field: {...}
[custom-fields] Activity updated successfully via comment: {...}
```

### 2. Error handling
```typescript
// Ошибки логируются автоматически:
[sitniksRequest] API error 400: {...}
[api/admin/analytics] Failed to load analytics: {...}
```

### 3. Performance мониторинг
```typescript
// Добавьте в middleware.ts:
export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith('/api/admin')) {
    console.log(`[API] Admin request: ${req.method} ${req.url}`);
  }
}
```

---

## ❓ FAQ

### Q: Как добавить нового admin пользователя?
A: Отредактируйте `app/api/auth/check-admin/route.ts`:
```typescript
const adminEmails = ["admin@yourstore.com", "new-admin@yourstore.com"];
```

### Q: Как изменить тип данных в custom fields?
A: Отредактируйте `lib/sitniks-custom-fields.ts`:
```typescript
const customFields = [{
  type: "text", // или "number", "boolean", "datetime"
  // ...
}];
```

### Q: Как работает product view tracking?
A: Автоматически при клике на товар:
```typescript
// components/modern-product-card.tsx
const handleCardClick = () => {
  trackClick({
    id: product.id,
    name: product.name,
    category: product.category,
    price: product.price,
  });
};
```

### Q: Как настроить email уведомления?
A: Добавьте `RESEND_API_KEY` и настройте шаблоны в:
`app/api/notifications/wishlist-alerts/route.ts`

### Q: Как экспортировать данные?
A: Используйте `/admin/analytics` → "Экспорт CSV/PDF" или API:
```bash
curl "https://yourstore.com/api/admin/export?format=csv"
```

---

## 🎯 Ключевые файлы

### Core функции:
- `lib/sitniks-custom-fields.ts` - основная логика
- `lib/sitniks-customers.ts` - API клиенты
- `lib/customer-analytics.ts` - бизнес-логика

### API endpoints:
- `app/api/customer-activity/route.ts` - данные клиентов
- `app/api/admin/analytics/route.ts` - агрегация
- `app/api/auth/check-admin/route.ts` - безопасность

### UI компоненты:
- `app/customer-analytics/page.tsx` - базовый дашборд
- `app/admin/analytics/page.tsx` - admin дашборд
- `components/admin-guard.tsx` - защита маршрутов

---

## 🎉 Готово к использованию!

Система полностью функциональна и готова к продакшен развертыванию. Все компоненты протестированы и работают с реальными данными Sitniks CRM.

**Для начала работы:**
1. Настройте environment variables
2. Добавьте admin пользователей
3. Проверьте Sitniks API подключение
4. Деплойте и используйте!

---

*Последнее обновление: 17.03.2026*
*Версия: 1.0.0*
