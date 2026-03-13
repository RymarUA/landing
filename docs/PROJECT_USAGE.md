# Project Usage & Configuration Guide

This guide collects the practical information you need to operate the storefront, customize content, and manage product metadata.

---
## 1. Project Setup

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Copy environment template**
   ```bash
   cp .env.local.example .env.local
   ```
3. **Fill mandatory env values** (WayForPay, Sitniks). Optional ones enable extra features:
   - `NEXT_PUBLIC_META_PIXEL_ID`, `NEXT_PUBLIC_GA4_ID` – analytics
   - `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` – Telegram notifications
4. **Run locally**
   ```bash
   npm run dev
   ```

`lib/env-validation.ts` automatically checks required variables during runtime and logs clear errors/warnings.

---
## 2. Global Site Configuration

### Dynamic Settings (Sitniks CRM) ⚡ NEW

Налаштування сайту тепер керуються через Sitniks CRM! Створіть спеціальний товар та додайте характеристики (Properties):

| Property Name | Example Value | Purpose |
| --- | --- | --- |
| `announcementText` | `"✨ Акція до кінця тижня – знижка 10%"` | Текст для AnnouncementBar |
| `telegramUsername` | `"your_bot"` | Telegram для кнопок підтримки |
| `viberPhone` | `"+380671234567"` | Viber для кнопок підтримки |
| `instagramUsername` | `"your_account"` | Instagram для кнопок підтримки |
| `phone` | `"+380671234567"` | Телефон для контактів |

**Як це працює:**
1. Створіть товар в Sitniks CRM:
   - **SKU**: `SITE_SETTINGS` (обов'язково саме так!)
   - **Назва**: "Налаштування сайту" (або будь-яка інша)
   - **Категорія**: будь-яка (обов'язкове поле в Sitniks)
2. Додайте характеристики (Properties) з назвами вище
3. Сайт автоматично підхопить зміни (кеш ~60 секунд)
4. Якщо товар не знайдено — використовується fallback з `lib/site-config.ts`

**API endpoint:** `GET /api/settings` повертає поточні налаштування.

### Static Configuration (`lib/site-config.ts`)

Статичні налаштування, які не змінюються часто:

| Field | Purpose |
| --- | --- |
| `name`, `tagline`, `description` | Metadata, hero copy, featured sections |
| `url`, `ogImage`, `keywords` | SEO metadata |
| `catalogCategories` | Категорії каталогу (fallback якщо Sitniks недоступний) |

Ці поля використовуються як fallback, якщо Sitniks CRM недоступний або налаштування не знайдено.

---
## 3. Announcement Bar

**Component:** `components/announcement-bar.tsx`

- Текст читається з Sitniks CRM (товар з SKU `SITE_SETTINGS`, характеристика `announcementText`)
- Fallback на `lib/site-config.ts` якщо Sitniks недоступний
- Користувачі можуть закрити банер; стан зберігається в `sessionStorage`
- Автоматично ховається якщо текст порожній

**Як змінити:**
1. В Sitniks CRM → товар з SKU `SITE_SETTINGS` → Properties → `announcementText`
2. Або в `lib/site-config.ts` (fallback)

---
## 4. Support Buttons

### Floating Support Button
- Included globally in `app/layout.tsx` as `<SupportButton />`.
- Hides itself on checkout routes and when no contact channels are configured.
- Reads contacts from Sitniks CRM (товар з SKU `SITE_SETTINGS`) з fallback на `site-config`.

### Header Support Dropdown
- Added to `components/temu-search-bar.tsx`.
- Shows "Підтримка" button with Telegram, Viber, phone links.
- Uses the same Sitniks settings, so updating in CRM updates both widgets.

**Як змінити контакти:**
1. В Sitniks CRM → товар з SKU `SITE_SETTINGS` → Properties:
   - `telegramUsername`: "your_bot"
   - `viberPhone`: "+380..."
   - `instagramUsername`: "your_account"
   - `phone`: "+380..."
2. Або в `lib/site-config.ts` (fallback)

**Tip:** Щоб вимкнути канал — залиште відповідне поле порожнім.

---
## 5. Featured Product Sections

**Component:** `components/featured-products.tsx`

- Two sections render automatically on the homepage before the main catalog:
  - `type="hits"` → "🔥 Хіти продажів"
  - `type="new"` → "✨ Новинки"
- Products are filtered dynamically via flags inside Sitniks product properties (`isHit`, `isNew`).
- Each card reuses `ModernProductCard` and supports add-to-cart / modal behavior.

Nothing else to configure—just set the flags in Sitniks (see Section 8).

---
## 6. Analytics & Tracking

**Component:** `components/analytics.tsx`

1. **Enable** by setting at least one of:
   - `NEXT_PUBLIC_META_PIXEL_ID`
   - `NEXT_PUBLIC_GA4_ID`
2. `<Analytics />` is already rendered inside `app/layout.tsx`.
3. Helper functions you can import anywhere:
   - `trackAddToCart({ contentId, contentName, value, currency })`
   - `trackPurchase({ value, currency, orderId, contents })`
   - `trackViewContent`, `trackInitiateCheckout`, `trackSearch`, etc.

Checkout success page already fires `trackPurchase`. Catalog cards call `trackAddToCart`.

---
## 7. Utility Components & Hooks

### Container & Heading
- Located at `components/container.tsx` and `components/heading.tsx`.
- Use `<Container>` instead of repeating `max-w-7xl mx-auto px-4` wrappers.
- `<Heading>` provides consistent typography with `size="sm|md|xl|2xl"` and balanced text wrapping.

### Hooks (`hooks/use-isomorphic.ts`)
- `useLocalStorage(key, initialValue)` – SSR-safe persistent state.
- `useWindow()` – returns `{ isClient, window, document }` without breaking SSR.
- `useIsomorphic(value)` – syncs values after hydration to avoid mismatches.

Use these hooks when working with browser APIs to avoid hydration warnings.

---
## 8. Product Badges & Properties (Sitniks CRM)

Products now read metadata from Sitniks **Properties** (not `auxiliaryInfo`). Supported keys (case-insensitive):

| Property | Type | Effect |
| --- | --- | --- |
| `badge` | string (`"ХІТ"`, `"Новинка"`, `"Знижка"`, etc.) | Short label displayed above product image |
| `badgeColor` | string (Tailwind classes) | Optional custom color, e.g. `bg-amber-400 text-gray-900` |
| `isHit` | boolean-like text (`"Так"`, `"True"`, `"1"`) | Marks product as a sales hit (shows in Featured + card badge) |
| `isNew` | boolean-like text | Marks product as new (Featured + badge) |
| `freeShipping` | boolean-like text | Toggles "Безкоштовна доставка" badge |
| `oldPrice` | number-like | Displays crossed-out old price and calculates discount% |
| `rating` | number | Star rating in cards (defaults to 5.0) |
| `reviews` | integer | Review count label |

> **Where to edit:** In Sitniks CRM → product → Properties. These values are synced every ~1 minute (`revalidate: 60`).

**Example JSON snippet for quick copy-paste into properties editor:**
```
badge: ХІТ
badgeColor: bg-orange-500 text-white
isHit: Так
isNew: Ні
freeShipping: Так
oldPrice: 1800
rating: 4.9
reviews: 128
```

---
## 9. Phone Utilities in Checkout

`lib/phone-utils.ts` exposes:
- `isValidUkrainianPhone`
- `normalizePhone`
- `formatPhoneForDisplay`

`checkout-schema.ts` already uses these to validate and normalize phone numbers, so forms accept `067…`, `+380…`, etc. and store canonical `+380XXXXXXXXX` format.

---
## 10. FAQ & SEO

- `components/shop-faq.tsx` renders FAQ accordion and injects FAQPage JSON-LD.
- `components/seo/JsonLd.tsx` exports `organizationSchema`, `websiteSchema`, `generateProductSchema`, `generateFAQSchema`.
- Layout already injects organization + website schemas in `<head>`.

Use `generateProductSchema` or `generateFAQSchema` on specific pages to enrich search results.

---
## 11. Troubleshooting Checklist

- **Announcement not visible:** ensure `announcementText` is not empty and refresh without cached sessionStorage (or use incognito).
- **Support dropdown empty:** verify `siteConfig` contact fields.
- **Analytics not firing:** check that `NEXT_PUBLIC_META_PIXEL_ID` / `NEXT_PUBLIC_GA4_ID` exist both locally and on Vercel.
- **Badges missing:** confirm Sitniks property names (case-insensitive) and wait for cache refresh (~60s).
- **Featured sections empty:** `isHit` / `isNew` must be truthy; otherwise sections hide automatically.

---
Need additional details? Ask in this doc’s section, and we’ll extend it.
