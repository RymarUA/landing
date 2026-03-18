// @ts-nocheck
/**
 * Product data layer
 *
 * Now uses only real Sitniks API data - no mock products
 * All functions are wrappers around instagram-catalog.ts
 */

import { getCatalogProducts, getCatalogProductById, type CatalogProduct } from "./instagram-catalog";

export type Product = CatalogProduct;

/* -- Public API -------------------------------------------------------- */

/** Returns all real products from Sitniks API */
export async function getAllProducts(): Promise<Product[]> {
  return getCatalogProducts();
}

/** Returns a single product by id from Sitniks API, or null if not found */
export async function getProductById(id: number): Promise<Product | null> {
  return getCatalogProductById(id);
}

/** Returns a single product by slug from Sitniks API, or null if not found */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const products = await getCatalogProducts();
  return products.find((p) => p.slug === slug) ?? null;
}

/** Returns all unique category names from Sitniks API */
export async function getCategories(): Promise<string[]> {
  const products = await getCatalogProducts();
  const cats = new Set(products.map((p) => p.category));
  return ["Всі", ...Array.from(cats)];
}
