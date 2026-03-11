// @ts-nocheck
/**
 * Product data layer
 *
 * Currently uses static data. To switch to a real Supabase query:
 *   1. npm install @supabase/supabase-js
 *   2. Replace the static array with: const { data } = await supabase.from("products").select("*")
 *   3. This file is imported only by Server Components → zero JS sent to browser
 */

export type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  oldPrice: number | null;
  image: string;
  badge: string | null;
  badgeColor: string;
  sizes: string[];
  rating: number;
  reviews: number;
  /** Live stock — fetch from DB in production to prevent overselling */
  stock: number;
  description: string;
  isNew?: boolean;
  isHit?: boolean;
  slug: string;
};

/* ─── Static catalogue (replace with DB query in production) ─────── */
const STATIC_PRODUCTS: Product[] = [];

/* ─── Public API ─────────────────────────────────── */

/** Returns all products. In production — replace with Supabase query. */
export async function getAllProducts(): Promise<Product[]> {
  // Example Supabase implementation:
  // const { data, error } = await supabase.from("products").select("*").order("id");
  // if (error) throw error;
  // return data ?? [];
  return STATIC_PRODUCTS;
}

/** Returns a single product by id, or null if not found. */
export async function getProductById(id: number): Promise<Product | null> {
  return STATIC_PRODUCTS.find((p) => p.id === id) ?? null;
}

/** Returns a single product by slug, or null if not found. */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  return STATIC_PRODUCTS.find((p) => p.slug === slug) ?? null;
}

/** Returns all unique category names. */
export async function getCategories(): Promise<string[]> {
  const cats = new Set(STATIC_PRODUCTS.map((p) => p.category));
  return ["Всі", ...Array.from(cats)];
}

/** Legacy compatibility exports */
export const CATALOG_PRODUCTS = STATIC_PRODUCTS;
export const getCatalogProducts = getAllProducts;
export const getCatalogProductById = getProductById;

