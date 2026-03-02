/**
 * lib/instagram-catalog.ts
 *
 * Product catalog service with an Instagram Graph API architecture.
 *
 * ┌─ Current state (MOCK) ───────────────────────────────────────────────┐
 * │  Returns static mock data so the rest of the app works without       │
 * │  Instagram credentials.                                              │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌─ Future state (REAL API) ────────────────────────────────────────────┐
 * │  To connect real Instagram data:                                     │
 * │  1. Get a long-lived User Access Token from Meta for Developers.     │
 * │  2. Set INSTAGRAM_ACCESS_TOKEN in .env.local                         │
 * │  3. Uncomment the `fetchInstagramProducts()` function below and      │
 * │     swap the mock call in `getCatalogProducts()` for it.             │
 * │                                                                      │
 * │  The parser `parseInstagramCaption()` turns an Instagram post        │
 * │  caption (structured as shown in the comment below) into a          │
 * │  CatalogProduct. Agree with your Instagram manager on a caption     │
 * │  format and implement the parser accordingly.                        │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ENV VARS (for real API — not needed for mock):
 *   INSTAGRAM_ACCESS_TOKEN  — long-lived IG User Access Token
 *   INSTAGRAM_USER_ID       — numeric Instagram Business/Creator account ID
 */

import type {
  CatalogProduct,
  InstagramMediaItem,
  InstagramMediaResponse,
} from "./types";

/* ─────────────────────────────────────────────────────────────────────────
   SUPABASE IMAGE BASE (reuse existing storage)
   ───────────────────────────────────────────────────────────────────────── */
const IMG = "https://lrggyvioreorxttbasgi.supabase.co/storage/v1/object/public/app-assets/9586/images";

/* ─────────────────────────────────────────────────────────────────────────
   MOCK DATA
   ───────────────────────────────────────────────────────────────────────── */

/**
 * Static mock catalog.
 * Each entry has `instagramMediaId: null` and `instagramPermalink: null`
 * because these are not yet sourced from Instagram.
 *
 * When you connect real IG data, populated entries will have actual values.
 */
const MOCK_PRODUCTS: CatalogProduct[] = [
  {
    id: 1,
    slug: "nike-air-replica",
    name: "Кросівки Nike Air (репліка)",
    category: "Для чоловіків",
    price: 1200,
    oldPrice: 1800,
    image: `${IMG}/1772177782851-sneakers-hero`,
    badge: "Хіт",
    badgeColor: "bg-orange-500",
    sizes: ["36", "37", "38", "39", "40"],
    rating: 4.9,
    reviews: 48,
    stock: 3,
    description:
      "Легкі та зручні кросівки Nike Air — репліка преміум-якості. Дихаюча сітка, амортизуюча підошва. Ідеально для щоденного носіння та спорту.",
    isHit: true,
    instagramMediaId: null,
    instagramPermalink: null,
  },
  {
    id: 2,
    slug: "adidas-ultraboost",
    name: "Кросівки Adidas Ultraboost",
    category: "Для жінок",
    price: 950,
    oldPrice: null,
    image: `${IMG}/1772177782851-sneakers-hero`,
    badge: "Новинка",
    badgeColor: "bg-orange-400",
    sizes: ["36", "37", "38", "39"],
    rating: 4.8,
    reviews: 32,
    stock: 7,
    description:
      "Стильні жіночі кросівки Adidas Ultraboost з покращеною підошвою Boost. Максимальний комфорт при ходьбі та бігу.",
    isNew: true,
    instagramMediaId: null,
    instagramPermalink: null,
  },
  {
    id: 9,
    slug: "dytyachyi-kostyum-92",
    name: "Дитячий костюм (зріст 92)",
    category: "Для дітей",
    price: 420,
    oldPrice: 580,
    image: `${IMG}/1772177785940-toys-product`,
    badge: "Знижка",
    badgeColor: "bg-amber-500",
    sizes: ["86", "92", "98", "104"],
    rating: 4.7,
    reviews: 19,
    stock: 5,
    description:
      "М'який та приємний до тіла дитячий костюм з гіпоалергенних матеріалів. Зручний крій, еластичний пояс. Безпечні барвники.",
    isNew: true,
    instagramMediaId: null,
    instagramPermalink: null,
  },
  {
    id: 3,
    slug: "nabir-ihrashok-montessori",
    name: "Набір іграшок Монтессорі",
    category: "Іграшки",
    price: 320,
    oldPrice: 450,
    image: `${IMG}/1772177785940-toys-product`,
    badge: "Знижка",
    badgeColor: "bg-amber-500",
    sizes: [],
    rating: 5.0,
    reviews: 61,
    stock: 12,
    description:
      "Розвиваючий набір іграшок у стилі Монтессорі. Розвиває дрібну моторику, логічне мислення та творчість. Вік 1–4 роки.",
    isHit: true,
    instagramMediaId: null,
    instagramPermalink: null,
  },
  {
    id: 4,
    slug: "myaka-ihrashka-vedmedyk",
    name: "М'яка іграшка Ведмедик",
    category: "Іграшки",
    price: 180,
    oldPrice: null,
    image: `${IMG}/1772177785940-toys-product`,
    badge: null,
    badgeColor: "",
    sizes: [],
    rating: 4.6,
    reviews: 14,
    stock: 20,
    description:
      "Пухнастий плюшевий ведмедик — ідеальний подарунок для дитини. М'яке наповнення, безпечні матеріали, можна прати.",
    instagramMediaId: null,
    instagramPermalink: null,
  },
  {
    id: 5,
    slug: "orhanayzer-dlya-domu",
    name: "Органайзер для дому",
    category: "Дім",
    price: 145,
    oldPrice: null,
    image: `${IMG}/1772177786810-home-accessories`,
    badge: null,
    badgeColor: "",
    sizes: [],
    rating: 4.5,
    reviews: 27,
    stock: 15,
    description:
      "Стильний і функціональний органайзер для дому. Компактний дизайн, 6 відділень. Підходить для кухні, ванної чи офісу.",
    isNew: true,
    instagramMediaId: null,
    instagramPermalink: null,
  },
  {
    id: 6,
    slug: "dekoratyvni-svichky",
    name: "Декоративні свічки (набір)",
    category: "Дім",
    price: 210,
    oldPrice: 280,
    image: `${IMG}/1772177786810-home-accessories`,
    badge: "Знижка",
    badgeColor: "bg-amber-500",
    sizes: [],
    rating: 4.8,
    reviews: 33,
    stock: 8,
    description:
      "Набір із 6 ароматичних декоративних свічок. Аромати: ваніль, сандалове дерево, лаванда. Час горіння — до 30 год.",
    isHit: true,
    instagramMediaId: null,
    instagramPermalink: null,
  },
  {
    id: 7,
    slug: "trymach-dlya-telefonu-avto",
    name: "Тримач для телефону в авто",
    category: "Авто",
    price: 195,
    oldPrice: null,
    image: `${IMG}/1772177787276-auto-accessories`,
    badge: "Топ",
    badgeColor: "bg-orange-500",
    sizes: [],
    rating: 4.9,
    reviews: 72,
    stock: 4,
    description:
      "Магнітний тримач для телефону на дефлектор або лобове скло. Сумісний з усіма смартфонами. Надійна фіксація.",
    isHit: true,
    instagramMediaId: null,
    instagramPermalink: null,
  },
  {
    id: 8,
    slug: "aromatyzator-avto",
    name: "Ароматизатор для авто",
    category: "Авто",
    price: 120,
    oldPrice: null,
    image: `${IMG}/1772177787276-auto-accessories`,
    badge: null,
    badgeColor: "",
    sizes: [],
    rating: 4.4,
    reviews: 18,
    stock: 30,
    description:
      "Стильний ароматизатор для авто на дефлектор. Доступні аромати: New Car, Ocean, Vanilla. Тривалість дії — 2–3 місяці.",
    instagramMediaId: null,
    instagramPermalink: null,
  },
];

/* ─────────────────────────────────────────────────────────────────────────
   INSTAGRAM CAPTION PARSER (for real API integration)
   ───────────────────────────────────────────────────────────────────────── */

/**
 * Expected Instagram caption format (agree with your SMM manager):
 *
 * ```
 * 🛍 Назва товару
 * 💰 Ціна: 1200 грн (стара: 1800 грн)
 * 📦 Категорія: Для чоловіків
 * 📏 Розміри: 36, 37, 38, 39, 40
 * ✅ В наявності: 5 шт.
 * 🔥 Хіт
 * ---
 * Опис товару в довільній формі...
 * ```
 *
 * This parser is intentionally kept simple — extend as needed.
 */
export function parseInstagramCaption(
  media: InstagramMediaItem,
  index: number
): CatalogProduct {
  const caption = media.caption ?? "";
  const lines = caption.split("\n").map((l) => l.trim());

  // Extract name (first non-empty line, strip emoji prefix)
  const rawName = lines.find((l) => l.length > 2) ?? `Товар #${index + 1}`;
  const name = rawName.replace(/^[^\w\u0400-\u04FF]+/, "").trim();

  // Price
  const priceMatch = caption.match(/[Цц]іна[:\s]+(\d+)/);
  const price = priceMatch ? parseInt(priceMatch[1], 10) : 0;

  // Old price
  const oldPriceMatch = caption.match(/стара[:\s]+(\d+)/i);
  const oldPrice = oldPriceMatch ? parseInt(oldPriceMatch[1], 10) : null;

  // Category
  const catMatch = caption.match(/[Кк]атегорія[:\s]+([^\n]+)/);
  const category = catMatch ? catMatch[1].trim() : "Інше";

  // Sizes
  const sizesMatch = caption.match(/[Рр]озміри?[:\s]+([^\n]+)/);
  const sizes = sizesMatch
    ? sizesMatch[1].split(/[,\s]+/).map((s) => s.trim()).filter(Boolean)
    : [];

  // Stock
  const stockMatch = caption.match(/[Вв]\s*наявності[:\s]+(\d+)/);
  const stock = stockMatch ? parseInt(stockMatch[1], 10) : 99;

  // Badges
  const isHit = /[Хх]іт/i.test(caption);
  const isNew = /[Нн]овинка/i.test(caption);
  const hasDiscount = oldPrice !== null;

  const badge = isHit ? "Хіт" : isNew ? "Новинка" : hasDiscount ? "Знижка" : null;
  const badgeColor = isHit
    ? "bg-orange-500"
    : isNew
    ? "bg-orange-400"
    : hasDiscount
    ? "bg-amber-500"
    : "";

  // Description (everything after "---")
  const sepIdx = lines.findIndex((l) => l.startsWith("---"));
  const description =
    sepIdx >= 0 ? lines.slice(sepIdx + 1).join(" ").trim() : name;

  // Generate stable numeric ID from IG media ID
  const id = index + 100; // offset to avoid collision with mock ids
  const slug = name
    .toLowerCase()
    .replace(/[^a-zа-яёіїє0-9\s]/gu, "")
    .replace(/\s+/g, "-")
    .slice(0, 60);

  return {
    id,
    slug,
    name,
    category,
    price,
    oldPrice,
    image: media.media_url,
    badge,
    badgeColor,
    sizes,
    rating: 5.0,   // no rating data from IG; could be fetched from reviews DB
    reviews: 0,
    stock,
    description,
    isNew,
    isHit,
    instagramMediaId: media.id,
    instagramPermalink: media.permalink,
  };
}

/* ─────────────────────────────────────────────────────────────────────────
   STRICT CAPTION PARSER (Key: value per line)
   ───────────────────────────────────────────────────────────────────────── */

/**
 * Parses caption in format:
 *   Назва: Nike Air Max 90
 *   Ціна: 2850
 *   Стара ціна: 3200
 *   Категорія: Для чоловіків
 *   Розміри: 40,41,42,43
 *   Залишок: 7
 *   Рейтинг: 4.8
 *   Відгуки: 124
 *   Опис: ...
 *   Бейдж: Хіт
 * Returns null if required fields (Назва, Ціна) are missing.
 */
function parseCaptionStrict(
  media: InstagramMediaItem,
  index: number
): CatalogProduct | null {
  const caption = media.caption ?? "";
  const lines = caption.split("\n").map((l) => l.trim());

  const getLine = (key: string): string | null => {
    const prefix = key + ":";
    const line = lines.find((l) => l.startsWith(prefix));
    if (!line) return null;
    return line.slice(prefix.length).trim() || null;
  };

  const name = getLine("Назва");
  const priceStr = getLine("Ціна");
  if (!name || !priceStr) return null;

  const price = parseInt(priceStr, 10);
  if (Number.isNaN(price) || price <= 0) return null;

  const oldPriceStr = getLine("Стара ціна");
  const oldPriceNum = oldPriceStr ? parseInt(oldPriceStr, 10) : null;
  const oldPrice = oldPriceNum != null && !Number.isNaN(oldPriceNum) ? oldPriceNum : null;
  const category = getLine("Категорія") ?? "Інше";
  const sizesStr = getLine("Розміри");
  const sizes = sizesStr ? sizesStr.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean) : [];
  const stockStr = getLine("Залишок");
  const stock = stockStr ? parseInt(stockStr, 10) : 99;
  const ratingStr = getLine("Рейтинг");
  const rating = ratingStr ? parseFloat(ratingStr) : 5;
  const reviewsStr = getLine("Відгуки");
  const reviews = reviewsStr ? parseInt(reviewsStr, 10) : 0;
  const description = getLine("Опис") ?? name;
  const badgeVal = getLine("Бейдж");

  const isHit = badgeVal === "Хіт" || /хіт/i.test(badgeVal ?? "");
  const isNew = badgeVal === "Новинка" || /новинка/i.test(badgeVal ?? "");
  const hasDiscount = oldPrice !== null;
  const badge = badgeVal || (isHit ? "Хіт" : isNew ? "Новинка" : hasDiscount ? "Знижка" : null);
  const badgeColor = isHit ? "bg-orange-500" : isNew ? "bg-orange-400" : hasDiscount ? "bg-amber-500" : "";

  const id = index + 100;
  const slug = name
    .toLowerCase()
    .replace(/[^a-zа-яёіїє0-9\s]/gu, "")
    .replace(/\s+/g, "-")
    .slice(0, 60);

  return {
    id,
    slug,
    name,
    category,
    price,
    oldPrice,
    image: media.media_url,
    badge,
    badgeColor,
    sizes,
    rating: Number.isNaN(rating) ? 5 : rating,
    reviews: Number.isNaN(reviews) ? 0 : reviews,
    stock: Number.isNaN(stock) ? 99 : stock,
    description,
    isNew: isNew || undefined,
    isHit: isHit || undefined,
    instagramMediaId: media.id,
    instagramPermalink: media.permalink,
  };
}

/* ─────────────────────────────────────────────────────────────────────────
   REAL INSTAGRAM FETCH
   ───────────────────────────────────────────────────────────────────────── */

/**
 * Fetches products from Instagram Graph API. Throws if credentials missing
 * (caller can catch and fall back to mock).
 */
export async function fetchInstagramProducts(): Promise<CatalogProduct[]> {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  const userId = process.env.INSTAGRAM_USER_ID;

  if (!token || !userId) {
    throw new Error("[instagram-catalog] INSTAGRAM_ACCESS_TOKEN or INSTAGRAM_USER_ID not set");
  }

  const fields = "id,caption,media_url,permalink,timestamp";
  const url = `https://graph.instagram.com/${userId}/media?fields=${fields}&limit=50&access_token=${token}`;

  const res = await fetch(url, {
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[instagram-catalog] Graph API error", res.status, err);
    throw new Error(`Instagram API error: ${res.status}`);
  }

  const data: InstagramMediaResponse = await res.json();
  const products: CatalogProduct[] = [];

  for (let i = 0; i < (data.data?.length ?? 0); i++) {
    const item = data.data![i];
    const product = parseCaptionStrict(item, i);
    if (product) products.push(product);
  }

  return products;
}

/* ─────────────────────────────────────────────────────────────────────────
   FALLBACK CACHE (last successful fetch — so site is never empty if IG API fails)
   ───────────────────────────────────────────────────────────────────────── */

let lastSuccessfulCatalog: CatalogProduct[] | null = null;

/* ─────────────────────────────────────────────────────────────────────────
   PUBLIC API (Server-only)
   ───────────────────────────────────────────────────────────────────────── */

/**
 * Returns the full product catalog. Uses Instagram if configured,
 * otherwise mock. On IG API failure returns last successful result or mock.
 */
export async function getCatalogProducts(): Promise<CatalogProduct[]> {
  try {
    const products = await fetchInstagramProducts();
    if (products.length > 0) {
      lastSuccessfulCatalog = products;
    }
    return products;
  } catch (err) {
    console.error("[instagram-catalog] fetch failed, using fallback", err);
    if (lastSuccessfulCatalog && lastSuccessfulCatalog.length > 0) {
      return lastSuccessfulCatalog;
    }
    return MOCK_PRODUCTS;
  }
}

/** Returns a single product by numeric ID, or null. */
export async function getCatalogProductById(
  id: number
): Promise<CatalogProduct | null> {
  const products = await getCatalogProducts();
  return products.find((p) => p.id === id) ?? null;
}

/** Returns a single product by slug, or null. */
export async function getCatalogProductBySlug(
  slug: string
): Promise<CatalogProduct | null> {
  const products = await getCatalogProducts();
  return products.find((p) => p.slug === slug) ?? null;
}

/** Returns all unique category labels, prepended with "Всі". */
export async function getCatalogCategories(): Promise<string[]> {
  const products = await getCatalogProducts();
  const cats = new Set(products.map((p) => p.category));
  return ["Всі", ...Array.from(cats)];
}

// Re-export type so consumers don't need to import from two places
export type { CatalogProduct };
