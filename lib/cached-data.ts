import { unstable_cache } from "next/cache";
import { getSiteSettingsWithFallback } from "@/lib/sitniks-consolidated";
import { getCatalogProducts, type CatalogProduct } from "@/lib/instagram-catalog";
import type { CatalogSearchProduct } from "@/types/catalog-search";
import type { FeaturedProduct } from "@/types/featured-product";

const FIVE_MINUTES = 60 * 5;
const TWO_MINUTES = 60 * 2;
const FEATURED_CACHE_LIMIT = 20;

export const getCachedSiteSettings = unstable_cache(
  async () => {
    return getSiteSettingsWithFallback();
  },
  ["site-settings"],
  {
    revalidate: FIVE_MINUTES,
    tags: ["site-settings"],
  },
);

export const getCachedCatalogProducts = unstable_cache(
  async () => {
    return getCatalogProducts();
  },
  ["catalog-products"],
  {
    revalidate: TWO_MINUTES,
    tags: ["catalog-products"],
  },
);

export function mapProductsForSearch(products: CatalogSearchProduct[]): CatalogSearchProduct[] {
  return products.map((product) => ({
    id: product.id,
    name: product.name,
    category: product.category,
    description: product.description,
    image: product.image,
    price: product.price,
    oldPrice: product.oldPrice,
  }));
}

function mapToFeaturedProduct(product: CatalogProduct): FeaturedProduct {
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    oldPrice: product.oldPrice,
    rating: product.rating,
    reviews: product.reviews,
    image: product.image,
    stock: product.stock,
    sizes: product.sizes,
    isHit: product.isHit,
    isNew: product.isNew,
    freeShipping: product.freeShipping,
    badge: product.badge,
    badgeColor: product.badgeColor,
  };
}

const getCachedFeaturedHitsInternal = unstable_cache(
  async () => {
    const products = await getCatalogProducts();
    return products
      .filter((product) => product.isHit)
      .slice(0, FEATURED_CACHE_LIMIT)
      .map(mapToFeaturedProduct);
  },
  ["featured-hits"],
  {
    revalidate: TWO_MINUTES,
    tags: ["featured-hits"],
  },
);

export async function getCachedFeaturedHits(limit = 10): Promise<FeaturedProduct[]> {
  const hits = await getCachedFeaturedHitsInternal();
  return limit < hits.length ? hits.slice(0, limit) : hits;
}
