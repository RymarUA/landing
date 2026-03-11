// @ts-nocheck
/**
 * lib/instagram-catalog.ts  ← ЗАМІНИТИ ПОВНІСТЮ цим файлом
 *
 * Тепер читає товари з Sitniks CRM замість mock-даних.
 *
 * Як це працює:
 *  1. getAllSitniksProducts() → отримуємо список з Sitniks API
 *  2. mapSitniksProduct() → конвертуємо в CatalogProduct (той самий тип що раніше)
 *  3. Кеш Next.js { revalidate: 300 } — сайт оновлюється кожні 5 хвилин автоматично
 *
 * Кастомні поля в Sitniks (auxiliaryInfo):
 *  Щоб додати бейдж, isHit, isNew — заповни поле "Додаткова інформація" товару в Sitniks:
 *  {
 *    "badge": "ХІТ",
 *    "badgeColor": "bg-amber-400 text-gray-900",
 *    "isHit": true,
 *    "isNew": false,
 *    "oldPrice": 1800,
 *    "rating": 4.8,
 *    "reviews": 48
 *  }
 */

import {
  getAllSitniksProducts,
  getSitniksProductById as getSitniksProductByIdRaw,
  type SitniksProduct,
  type SitniksVariation,
} from "./sitniks-api";
import { getAllProducts, getProductById as getFallbackProductById } from "./products";

// ─── Type (same shape as before — nothing else in the app needs to change) ─────
export interface CatalogProduct {
  id: number;
  slug: string;
  instagramMediaId: string | null;
  name: string;
  price: number;
  oldPrice: number | null;
  category: string;
  badge: string | null;
  badgeColor: string;
  isHit: boolean;
  isNew: boolean;
  rating: number;
  reviews: number;
  stock: number;          // availableQuantity першої активної варіації
  sizes: string[];        // properties з name="Розмір" по всіх активних варіаціях
  description: string;
  image: string;          // перше фото варіації або продукту
  instagramPermalink: string | null;

  // Sitniks-specific (для сторінки товару)
  variationId?: number;   // ID першої варіації (для замовлення)
  allVariations?: Array<{
    id: number;
    sku?: string;
    price: number;
    stock: number;
    properties: Array<{ name: string; value: string }>;
    image?: string;
  }>;
}

// ─── Mapper ────────────────────────────────────────────────────────────────────

const DEFAULT_BADGE_COLOR: Record<string, string> = {
  "ХІТ":     "bg-amber-400 text-gray-900",
  "Новинка": "bg-orange-500 text-white",
  "Знижка":  "bg-red-500 text-white",
  "Топ":     "bg-orange-500 text-white",
  "Акція":   "bg-purple-500 text-white",
};

function getFirstImage(product: SitniksProduct, variation?: SitniksVariation): string {
  // Пріоритет: фото варіації → фото продукту → заглушка
  if (variation?.attachments?.length) return variation.attachments[0].url;
  if (product.attachments?.length)    return product.attachments[0].url;
  return "/images/placeholder.svg";
}

function getSizes(product: SitniksProduct): string[] {
  const sizes = new Set<string>();
  for (const v of product.variations ?? []) {
    if (!v.isActive) continue;
    for (const p of v.properties ?? []) {
      if (p.name?.toLowerCase().includes("розмір") || p.name?.toLowerCase() === "size") {
        sizes.add(p.value);
      }
    }
  }
  return Array.from(sizes);
}

function getTotalStock(product: SitniksProduct): number {
  return (product.variations ?? [])
    .filter((v) => v.isActive)
    .reduce((sum, v) => sum + (v.availableQuantity ?? 0), 0);
}

function mapSitniksProduct(p: SitniksProduct): CatalogProduct {
  const aux = (p.auxiliaryInfo ?? {}) as Record<string, unknown>;
  const activeVariations = (p.variations ?? []).filter((v) => v.isActive);
  const firstVariation = activeVariations[0];

  // Price: з першої варіації
  const price = firstVariation?.price ?? 0;
  const oldPrice = typeof aux.oldPrice === "number" ? aux.oldPrice : null;

  // Badge
  const badge = typeof aux.badge === "string" ? aux.badge || null : null;
  const badgeColor =
    typeof aux.badgeColor === "string"
      ? aux.badgeColor
      : badge ? (DEFAULT_BADGE_COLOR[badge] ?? "bg-orange-500 text-white") : "";

  // Flags
  const isHit = Boolean(aux.isHit);
  const isNew = Boolean(aux.isNew);

  // Rating / reviews (зберігаються в auxiliaryInfo бо Sitniks не має вбудованих)
  const rating = typeof aux.rating === "number" ? aux.rating : 5.0;
  const reviews = typeof aux.reviews === "number" ? aux.reviews : 0;

  return {
    id: p.id,
    slug: p.title
      .toLowerCase()
      .replace(/[^a-zа-яїєі0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, ""),
    instagramMediaId: null, // Not available from Sitniks API
    name: p.title,
    price,
    oldPrice,
    category: p.category?.name ?? "Інше",
    badge,
    badgeColor,
    isHit,
    isNew,
    rating,
    reviews,
    stock: getTotalStock(p),
    sizes: getSizes(p),
    description: p.description ?? "",
    image: getFirstImage(p, firstVariation),
    instagramPermalink: null, // Not available from Sitniks API
    variationId: firstVariation?.id,
    allVariations: activeVariations.map((v) => ({
      id: v.id,
      sku: v.sku,
      price: v.price,
      stock: v.availableQuantity,
      properties: v.properties,
      image: v.attachments?.[0]?.url,
    })),
  };
}


function mapFallbackProductToCatalogProduct(p: Awaited<ReturnType<typeof getAllProducts>>[number]): CatalogProduct {
  return {
    id: p.id,
    slug: p.slug
      .toLowerCase()
      .replace(/[^a-zа-яїєі0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, ""),
    instagramMediaId: null,
    name: p.name,
    price: p.price,
    oldPrice: p.oldPrice,
    category: p.category,
    badge: p.badge,
    badgeColor: p.badgeColor ?? "",
    isHit: Boolean(p.isHit),
    isNew: Boolean(p.isNew),
    rating: p.rating,
    reviews: p.reviews,
    stock: p.stock,
    sizes: p.sizes ?? [],
    description: p.description ?? "",
    image: p.image,
    instagramPermalink: null,
  };
}

// ─── Public API (same interface as before) ─────────────────────────────────────

/**
 * Всі активні товари для каталогу.
 * Кешується Next.js на 5 хвилин.
 */
export async function getCatalogProducts(): Promise<CatalogProduct[]> {
  try {
    const sitniksProducts = await getAllSitniksProducts();
    return sitniksProducts.map(mapSitniksProduct);
  } catch (err) {
    console.error("[instagram-catalog] Failed to fetch from Sitniks:", err);
    // Fallback: статичний каталог щоб вітрина працювала навіть без Sitniks API
    const fallbackProducts = await getAllProducts();
    return fallbackProducts.map(mapFallbackProductToCatalogProduct);
  }
}

/**
 * Один товар за ID.
 */
export async function getCatalogProductById(id: number): Promise<CatalogProduct | null> {
  try {
    const p = await getSitniksProductByIdRaw(id);
    if (!p) return null;
    return mapSitniksProduct(p);
  } catch {
    const fallbackProduct = await getFallbackProductById(id);
    return fallbackProduct ? mapFallbackProductToCatalogProduct(fallbackProduct) : null;
  }
}

