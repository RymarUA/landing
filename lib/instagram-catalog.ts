// @ts-nocheck
/**
 * lib/instagram-catalog.ts
 *
 * Читає товари з Sitniks CRM через характеристики (Properties).
 *
 * Як це працює:
 *  1. getAllSitniksProducts() → отримуємо список з Sitniks API
 *  2. mapSitniksProduct() → конвертуємо в CatalogProduct, читаючи дані з характеристик
 *  3. Кеш Next.js { revalidate: 60 } — сайт оновлюється кожну хвилину автоматично
 *
 * Характеристики товару в Sitniks CRM:
 *  Створіть характеристики для товару:
 *  - badge: "ХІТ" | "Новинка" | "Знижка" | "Топ" | "Акція"
 *  - badgeColor: "bg-amber-400 text-gray-900" (опціонально)
 *  - isHit: "Так" | "True" | "1"
 *  - isNew: "Так" | "True" | "1"
 *  - freeShipping: "Так" | "True" | "1"
 *  - oldPrice: "1800" (число)
 *  - rati  ng: "4.8" (число 0-5)
 *  - reviews: "48" (число)
 */

import {
  getAllSitniksProducts,
  getSitniksProductById as getSitniksProductByIdRaw,
  type SitniksProduct,
  type SitniksVariation,
} from "./sitniks-consolidated";
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
  freeShipping: boolean;  // безкоштовна доставка
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

/** Шукає значення характеристики по імені (без урахування регістру) */
function getProp(p: SitniksProduct, key: string, variation?: SitniksVariation): string | undefined {
  // Спочатку шукаємо в характеристиках варіації
  if (variation?.properties) {
    const varProp = variation.properties.find(prop => prop.name?.toLowerCase() === key.toLowerCase());
    if (varProp?.value) return varProp.value;
  }
  
  // Потім шукаємо в характеристиках продукту
  if (p.properties) {
    const prodProp = p.properties.find(prop => prop.name?.toLowerCase() === key.toLowerCase());
    if (prodProp?.value) return prodProp.value;
  }
  
  return undefined;
}

/** Перевіряє "Так/True" в характеристиках */
function isTrue(val?: string): boolean {
  if (!val) return false;
  const v = val.toLowerCase().trim();
  return v === "так" || v === "true" || v === "yes" || v === "1" || v === "да";
}

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
  const activeVariations = (p.variations ?? []).filter((v) => v.isActive);
  const firstVariation = activeVariations[0];

  // Читаємо дані з характеристик (Properties) - шукаємо в варіації та продукті
  const badgeText = getProp(p, "badge", firstVariation);
  const badgeColorCustom = getProp(p, "badgeColor", firstVariation);
  const oldPriceRaw = getProp(p, "oldPrice", firstVariation);
  const ratingRaw = getProp(p, "rating", firstVariation);
  const reviewsRaw = getProp(p, "reviews", firstVariation);

  // Price: з першої варіації
  const price = firstVariation?.price ?? 0;
  const oldPrice = oldPriceRaw ? parseFloat(oldPriceRaw) : null;

  // Badge
  const badge = badgeText || null;
  const badgeColor = badgeColorCustom
    ? badgeColorCustom
    : badge ? (DEFAULT_BADGE_COLOR[badge] ?? "bg-orange-500 text-white") : "";

  // Flags
  const isHit = isTrue(getProp(p, "isHit", firstVariation));
  const isNew = isTrue(getProp(p, "isNew", firstVariation));
  const freeShipping = isTrue(getProp(p, "freeShipping", firstVariation));

  // Rating / reviews
  const rating = ratingRaw ? parseFloat(ratingRaw) : 5.0;
  const reviews = reviewsRaw ? parseInt(reviewsRaw, 10) : 0;

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
    category: p.category?.title ?? p.category?.name ?? "Інше",
    badge,
    badgeColor,
    isHit,
    isNew,
    freeShipping,
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
    freeShipping: Boolean(p.freeShipping),
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
 * Кешується Next.js на 1 хвилину.
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

