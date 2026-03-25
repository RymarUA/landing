# 🛍️ FamilyHub Market - Сучасний E-commerce Platform

**FamilyHub Market** - це повнофункціональна платформа електронної комерції побудована на Next.js 15 з глибокою інтеграцією з Sitniks CRM, WayForPay та Новою Поштою. Платформа забезпечує безшовний досвід покупок з розширеними можливостями аналітики, управління замовленнями та маркетинговими інструментами.

## 🎯 Ключові можливості

### 🛒 E-commerce функціонал
- **Каталог товарів** з динамічною фільтрацією та пошуком
- **Корзина** з крос-сел рекомендаціями та збереженням стану
- **Оформлення замовлення** з вибором доставки та оплати
- **Особистий кабінет** з історією покупок та управлінням профілем
- **Адміністративна панель** для управління сайтом

### � Платіжні системи
- **WayForPay** - прийом платежів карткою
- **Наложений платіж** через Нову Пошту
- **Безпечна обробка** даних карток (PCI DSS)

### 📦 Логістика
- **Нова Пошта** - автоматичне створення ТТН
- **Відстеження** замовлень в реальному часі
- **Розрахунок** вартості доставки

### 📊 Аналітика та CRM
- **Sitniks CRM** - повна інтеграція для управління клієнтами
- **Transactional Outbox** - надійна доставка заказів з retry логікою
- **Google Analytics 4** - відстеження поведінки користувачів
- **Meta Pixel** - ретаргетинг та аналітика
- **Внутрішня аналітика** - звіти по продажах та конверсіях

### � Безпека та автентифікація
- **JWT автентифікація** для адміністративної панелі
- **OTP верифікація** через SMS/Email
- **GDPR відповідність** з управлінням cookie
- **Захист від CSRF** та XSS атак

## 🏗️ Технологічний стек

### Frontend
```
📱 Next.js 15 (App Router)
⚛️ React 18 (Server Components)
🎨 TailwindCSS + shadcn/ui
🎭 Framer Motion (анімації)
📝 TypeScript (типізація)
🍪 Zustand (state management)
```

### Backend
```
🔐 Next.js API Routes
🗄️ Sitniks CRM API
💳 WayForPay API
📦 Nova Poshta API
📧 Resend (email сервіс)
📱 TurboSMS (SMS сервіс)
```

### Інфраструктура
```
� Vercel (hosting)
📊 Vercel Analytics
🔍 Google Analytics
📱 Meta Pixel
💾 Vercel KV (Redis)
```

## 📁 Структура проєкту

```
landing/
├── app/                     # Next.js App Router
│   ├── (auth)/             # Сторінки автентифікації
│   ├── admin/              # Адміністративна панель
│   ├── api/                # API маршрути
│   ├── cart/               # Корзина
│   ├── checkout/           # Оформлення замовлення
│   ├── profile/            # Особистий кабінет
│   └── globals.css         # Глобальні стилі
├── components/             # React компоненти
│   ├── ui/                 # Базові UI компоненти
│   ├── icons/              # Іконки
│   └── [features]/         # Функціональні компоненти
├── lib/                    # Утиліти та API клієнти
├── hooks/                  # Custom React hooks
├── types/                  # TypeScript типи
├── docs/                   # Документація
│   ├── TRANSACTIONAL_OUTBOX.md  # Outbox система
│   └── [features]/         # Документація функцій
└── public/                 # Статичні ресурси
```

## 🚀 Швидкий старт

### Вимоги
- Node.js 18+
- npm 9+ або pnpm

### Встановлення
```bash
# Клонування репозиторію
git clone <repository-url>
cd landing

# Встановлення залежностей
npm install

# Налаштування змінних середовища
cp .env.local.example .env.local
# Відредагуйте .env.local з вашими API ключами
```

### Запуск
```bash
# Розробка
npm run dev

# Швидка розробка (без перевірок)
npm run dev:fast

# Production збірка
npm run build

# Запуск production сервера
npm run start
```

### Доступні скрипти
```bash
npm run dev              # Запуск dev сервера
npm run build            # Production збірка
npm run start            # Запуск production сервера
npm run lint             # ESLint перевірка
npm run type-check       # TypeScript перевірка
npm run test             # Запуск тестів
npm run clean            # Очистка кешу
```

## ⚡ Продуктивність

- **Dev Server Startup**: <2 секунди
- **Hot Module Replacement**: <100ms
- **Production Build**: <30 секунд
- **First Load JS**: ~75kB
- **Lighthouse Score**: 95-100

## 📚 Документація

### � Основна документація
- [📋 Технічна архітектура](./docs/TECHNICAL_ARCHITECTURE.md) - Детальний опис архітектури
- [📡 API Reference](./docs/API_REFERENCE.md) - Повна документація API
- [🔧 Troubleshooting Guide](./docs/TROUBLESHOOTING_GUIDE.md) - Рішення проблем

### 🔌 Інтеграції
- [🔗 Sitniks CRM Integration](./docs/SITNIKS_INTEGRATION_GUIDE.md) - Повна інтеграція з CRM
- [💳 WayForPay Payment Guide](./docs/CHECKOUT_AUTH_INTEGRATION.md) - Налаштування платежів
- [📦 Nova Poshta Integration](./docs/NOVAPOSHTA_AUTO_TTN.md) - Автоматичні ТТН

### 📊 Аналітика та маркетинг
- [📈 Sitniks Analytics](./docs/SITNIKS_ANALYTICS_COMPLETE_GUIDE.md) - Аналітика та звіти
- [📱 Facebook & Instagram Catalog](./docs/FACEBOOK_INSTAGRAM_CATALOG.md) - Налаштування соцмереж
- [🔗 Referral System](./docs/REFERRAL_SYSTEM_GUIDE.md) - Реферальна програма

### 🛠️ Адміністрування
- [👤 Admin Panel Guide](./docs/ADMIN_PANEL_GUIDE.md) - Керівництво адміністратора
- [📋 Production Readiness](./docs/PRODUCTION_READINESS_CHECKLIST.md) - Чек-лист для продакшена
- [🚀 Deployment Guide](./docs/DEPLOYMENT_GUIDE.md) - Інструкція з деплою

## 🔧 Конфігурація

### Environment Variables
Створіть `.env.local` на основі `.env.local.example`:

```bash
# Базова конфігурація
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=FamilyHub Market

# WayForPay платежі
WAYFORPAY_MERCHANT_ACCOUNT=your_merchant
WAYFORPAY_SECRET_KEY=your_secret

# Sitniks CRM
SITNIKS_API_URL=https://your-store.sitniks.com/api/v1
SITNIKS_API_KEY=your_bearer_token

# Нова Пошта
SITNIKS_NP_INTEGRATION_ID=your_integration_id

# Email (Resend)
RESEND_API_KEY=your_resend_key
EMAIL_FROM=noreply@yourstore.com

# SMS (TurboSMS)
TURBOSMS_TOKEN=your_token
TURBOSMS_SENDER=your_sender

# Аналітика
NEXT_PUBLIC_META_PIXEL_ID=your_pixel_id
NEXT_PUBLIC_GA4_ID=your_ga4_id
```

## 🎯 Особливості платформи

### �️ E-commerce функціонал
- **Інтерактивний каталог** з фільтрацією за категоріями, цінами, розмірами
- **Розумна корзина** з збереженням стану та крос-сел рекомендаціями
- **Просте оформлення** з вибором способів доставки та оплати
- **Особистий кабінет** з історією замовлень та управлінням профілем
- **Адміністративна панель** для управління товарами, замовленнями та клієнтами

### 💳 Платіжна інтеграція
- **WayForPay** - прийом платежів Visa/Mastercard з безпечною обробкою
- **Наложений платіж** - оплата при отриманні через Нову Пошту
- **Автоматична верифікація** платежів через webhooks
- **Детальна аналітика** транзакцій та конверсій

### 📦 Логістичні рішення
- **Нова Пошта API** - автоматичне створення ТТН
- **Відстеження статусів** замовлень в реальному часі
- **Розрахунок вартості** доставки залежно від ваги та відстані
- **Інтеграція зі складами** для управління запасами

### 📊 Аналітика та CRM
- **Sitniks CRM** - повна синхронізація клієнтів та замовлень
- **Google Analytics 4** - детальна аналітика поведінки користувачів
- **Meta Pixel** - ретаргетинг та відстеження конверсій
- **Внутрішні звіти** по продажах, популярних товарах, конверсіях

### 🔐 Безпека
- **JWT токени** для захищеного доступу до адмінпанелі
- **OTP верифікація** через SMS або Email
- **GDPR відповідність** з управлінням згодами на cookie
- **Захист від атак** CSRF, XSS, SQL Injection

## 🚀 Деплоймент

### Vercel (Рекомендовано)
```bash
# Встановлення Vercel CLI
npm i -g vercel

# Деплоймент
vercel

# Production деплоймент
vercel --prod
```

### Налаштування середовища
1. Створіть проєкт на Vercel
2. Додайте всі environment variables з `.env.local.example`
3. Підключіть домен (за потреби)
4. Налаштуйте custom domain SSL

### Моніторинг
- **Vercel Analytics** - моніторинг продуктивності
- **Vercel Speed Insights** - аналіз швидкості завантаження
- **Error Logging** - автоматичне збирання помилок

## 📈 Продуктивність та оптимізація

### Технічні оптимізації
- **Server Components** за замовчуванням для кращої продуктивності
- **Image Optimization** з AVIF/WebP форматами
- **Code Splitting** для мінімізації розміру бандлу
- **Edge Runtime** для швидких API endpoints
- **Caching Strategy** з оптимальними TTL налаштуваннями

### SEO оптимізація
- **Meta tags** для всіх сторінок
- **Structured Data** (JSON-LD) для продуктів
- **Sitemap.xml** автоматична генерація
- **Robots.txt** правильна конфігурація
- **Open Graph** для соціальних мереж

## 🔧 Розробка

### Створення нових сторінок
```typescript
// app/new-page/page.tsx
export const metadata = {
  title: 'Нова сторінка',
  description: 'Опис сторінки',
};

export default function NewPage() {
  return <div>Контент сторінки</div>;
}
```

### Додавання API endpoints
```typescript
// app/api/endpoint/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Hello API' });
}
```

### Компоненти
Використовуйте Server Components за замовчуванням:
```typescript
// Компонент за замовчуванням (Server)
export default function ProductCard({ product }) {
  return <div>{product.name}</div>;
}

// Client компонент (тільки за потреби)
'use client';

export default function InteractiveButton() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c + 1)}>{count}</button>;
}
```

## 🤝 Внесок та підтримка

### Як внести зміни
1. Fork репозиторій
2. Створіть feature branch
3. Зробіть changes
4. Створіть Pull Request

### Звіт про помилки
- Використовуйте GitHub Issues
- Додайте детальний опис проблеми
- Вкажіть steps to reproduce
- Додайте relevant logs/screenshots

## 📝 Ліцензія

MIT License - вільно використовувати для комерційних проєктів.

---

**Побудовано з ❤️ для сучасного e-commerce в Україні**

🇺🇦 Optimized for Ukrainian market with local payment systems and logistics
