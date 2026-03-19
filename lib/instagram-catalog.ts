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
 *  - rating: "4.8" (число 0-5)
 *  - reviews: "48" (число)
 */

import {
  getAllSitniksProducts,
  getSitniksProductById as getSitniksProductByIdRaw,
  type SitniksProduct,
  type SitniksVariation,
  type SitniksProperty,
  type SitniksAuxiliaryInfo,
} from "./sitniks-consolidated";

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
  reviewCount?: number;   // аліас для reviews (для сумісності з картками)
  sold?: number;          // кількість проданих товарів
  stock: number;          // availableQuantity першої активної варіації
  sizes: string[];        // properties з name="Розмір" по всіх активних варіаціях
  description: string;
  image: string;          // перше фото варіації або продукту
  images?: string[];     // додаткові фото товару
  instagramPermalink: string | null;
  weight?: number;

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

// In-memory cache for variation → product mapping (avoids repeated API calls)
const variationToProductCache = new Map<number, number>();
let variationCacheBuildPromise: Promise<void> | null = null;
let variationCacheBuilt = false;

async function buildVariationCache(): Promise<void> {
  if (variationCacheBuilt) return;
  if (variationCacheBuildPromise) {
    await variationCacheBuildPromise;
    return;
  }

  variationCacheBuildPromise = (async () => {
    try {
      const allProducts = await getAllSitniksProducts();
      for (const product of allProducts) {
        if (!product?.variations?.length) continue;
        for (const variation of product.variations) {
          if (variation?.id) {
            variationToProductCache.set(variation.id, product.id);
          }
        }
      }
      variationCacheBuilt = true;
      console.log(`[catalog] Built variation cache: ${variationToProductCache.size} variations`);
    } catch (error) {
      console.error("[catalog] Failed to build variation cache:", error);
    } finally {
      variationCacheBuildPromise = null;
    }
  })();

  await variationCacheBuildPromise;
}

async function findProductByVariationId(variationId: number): Promise<number | null> {
  const cached = variationToProductCache.get(variationId);
  if (cached) {
    console.log(`[catalog] Found variation ${variationId} → product ${cached} in cache`);
    return cached;
  }

  await buildVariationCache();

  const resolved = variationToProductCache.get(variationId) ?? null;
  if (resolved) {
    console.log(`[catalog] Found variation ${variationId} → product ${resolved} after cache build`);
  }
  return resolved;
}

/** Шукає значення характеристики по імені (без урахування регістру та пробілів) */
function getProp(p: SitniksProduct, key: string, variation?: SitniksVariation): string | undefined {
  const target = key.toLowerCase().trim();

  const matchValue = (props?: SitniksProperty[]) => {
    if (!props) return undefined;
    const prop = props.find((prop) => prop.name?.toLowerCase().trim() === target);
    return prop?.value;
  };

  // Спочатку шукаємо в переданій варіації
  const variationValue = matchValue(variation?.properties);
  if (variationValue) return variationValue;

  // Потім шукаємо в характеристиках продукту
  const productValue = matchValue(p.properties);
  if (productValue) return productValue;

  // І нарешті переглядаємо інші активні варіації — іноді менеджери Sitniks ставлять характеристику не на першу
  for (const v of p.variations ?? []) {
    if (variation && v.id === variation.id) continue;
    if (!v.isActive) continue;
    const value = matchValue(v.properties);
    if (value) return value;
  }

  return undefined;
}

function getPropFromVariants(
  product: SitniksProduct,
  keys: string[],
  variation?: SitniksVariation
): string | undefined {
  for (const key of keys) {
    const value = getProp(product, key, variation);
    if (value !== undefined) return value;
  }
  return undefined;
}

function getAuxiliaryValue(info: SitniksAuxiliaryInfo | Record<string, unknown> | undefined, keys: string[]) {
  if (!info) return undefined;
  for (const key of keys) {
    if (key in info && info[key as keyof SitniksAuxiliaryInfo] != null) {
      return String(info[key as keyof SitniksAuxiliaryInfo]);
    }
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

function getAllImages(product: SitniksProduct, variation?: SitniksVariation): string[] {
  const images: string[] = [];
  
  // Add variation images first (if they exist)
  if (variation?.attachments?.length) {
    for (const attachment of variation.attachments) {
      if (attachment.url && !images.includes(attachment.url)) {
        images.push(attachment.url);
      }
    }
  }
  
  // Add product images
  if (product.attachments?.length) {
    for (const attachment of product.attachments) {
      if (attachment.url && !images.includes(attachment.url)) {
        images.push(attachment.url);
      }
    }
  }
  
  // Add images from variations (for products with multiple color/size variations)
  if (product.variations?.length) {
    for (const v of product.variations) {
      if (!v.isActive) continue;
      if (v.attachments?.length) {
        for (const attachment of v.attachments) {
          if (attachment.url && !images.includes(attachment.url)) {
            images.push(attachment.url);
          }
        }
      }
    }
  }
  
  return images.length > 0 ? images : ["/images/placeholder.svg"];
}

function buildGalleryImages(primary: string, extras: string[]): string[] {
  const ordered: string[] = [];
  const seen = new Set<string>();

  const addIfNew = (url?: string) => {
    if (!url) return;
    if (seen.has(url)) return;
    seen.add(url);
    ordered.push(url);
  };

  addIfNew(primary);
  for (const extra of extras ?? []) {
    addIfNew(extra);
  }

  if (ordered.length === 0 && primary) {
    ordered.push(primary);
  }

  if (ordered.length === 1) {
    ordered.push(ordered[0]);
  }

  return ordered;
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
  const ratingRaw =
    getPropFromVariants(p, ["rating", "ratingValue", "avgRating"], firstVariation) ??
    getAuxiliaryValue(p.auxiliaryInfo as SitniksAuxiliaryInfo | undefined, ["rating", "ratingValue"]);
  const reviewsRaw =
    getPropFromVariants(p, ["reviews", "reviewCount", "reviewsCount"], firstVariation) ??
    getAuxiliaryValue(p.auxiliaryInfo as SitniksAuxiliaryInfo | undefined, ["reviews", "reviewCount"]);
  const soldRaw =
    getPropFromVariants(p, ["sold", "soldCount", "totalSold"], firstVariation) ??
    getAuxiliaryValue(p.auxiliaryInfo as SitniksAuxiliaryInfo | undefined, ["sold", "soldCount"]);

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

  // Rating / reviews / sold
  const rating = ratingRaw ? parseFloat(ratingRaw) : 5.0;
  const reviews = reviewsRaw ? parseInt(reviewsRaw, 10) : 0;
  const sold = soldRaw ? parseInt(soldRaw, 10) : undefined;

  const primaryImage = getFirstImage(p, firstVariation);
  const galleryImages = buildGalleryImages(primaryImage, getAllImages(p, firstVariation));

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
    category: p.category?.title ?? "Інше",
    badge,
    badgeColor,
    isHit,
    isNew,
    freeShipping,
    rating,
    reviews,
    reviewCount: reviews,
    sold,
    stock: getTotalStock(p),
    sizes: getSizes(p),
    description: p.description ?? "",
    image: primaryImage,
    images: galleryImages,
    instagramPermalink: null, // Not available from Sitniks API
    weight: firstVariation?.weight ?? p.weight,
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


// ─── Public API (same interface as before) ─────────────────────────────────────

/**
 * Всі активні товари з Sitniks API.
 * Кешується Next.js на 1 хвилину.
 * Якщо API недоступний, повертає порожній масив для розробки.
 */
export async function getCatalogProducts(): Promise<CatalogProduct[]> {
  try {
    const sitniksProducts = await getAllSitniksProducts();
    // Виключаємо товар з налаштуваннями сайту (SKU = "SITE_SETTINGS" або назва "Налаштування сайту")
    const catalogProducts = sitniksProducts.filter(p => {
      const sku = p.sku?.toUpperCase();
      const title = p.title?.toLowerCase();
      const name = p.name?.toLowerCase();
      
      return (
        sku !== "SITE_SETTINGS" && 
        title !== "налаштування сайту" &&
        name !== "налаштування сайту"
      );
    });

    if (catalogProducts.length === 0) {
      return [];
    }

    return catalogProducts.map(mapSitniksProduct);
  } catch {
    // Якщо Sitniks недоступний, повертаємо порожній список
    return [];
  }
}

/**
 * Один товар за ID з Sitniks API.
 * Спочатку пробує знайти як productId, якщо не знайдено - шукає як variationId (для старих товарів у кошику)
 */
export async function getCatalogProductById(id: number): Promise<CatalogProduct | null> {
  try {
    // Try direct product lookup first
    const product = await getSitniksProductByIdRaw(id);
    if (product) {
      return mapSitniksProduct(product);
    }

    // Fallback: search for parent product by variation ID
    console.log(`[getCatalogProductById] Product ${id} not found, searching as variationId...`);
    
    const parentProductId = await findProductByVariationId(id);
    if (parentProductId) {
      console.log(`[getCatalogProductById] Found parent product ${parentProductId} for variation ${id}`);
      const parentProduct = await getSitniksProductByIdRaw(parentProductId);
      if (parentProduct) {
        return mapSitniksProduct(parentProduct);
      }
    }

    console.warn(`[getCatalogProductById] Neither product nor variation ${id} found in Sitniks`);
    return null;
  } catch (error) {
    console.error(`[getCatalogProductById] Error:`, error);
    return null;
  }
}
