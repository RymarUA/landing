/**
 * lib/catalog-config.ts
 *
 * Catalog category list is now driven by siteConfig.catalogCategories
 * so you only need to update lib/site-config.ts to sync with Sitniks CRM.
 *
 * ALL_CATEGORIES is kept for backwards-compatibility with existing imports.
 */
import { siteConfig } from "@/lib/site-config";

// Re-export from siteConfig so catalog and any other consumer stays in sync
export const ALL_CATEGORIES: readonly string[] = siteConfig.catalogCategories;

export type SortKey = "default" | "price_asc" | "price_desc" | "rating" | "newest";

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "default",   label: "За замовчуванням" },
  { value: "newest",    label: "Спочатку нові" },
  { value: "price_asc", label: "Від дешевих" },
  { value: "price_desc",label: "Від дорогих" },
  { value: "rating",    label: "За рейтингом" },
];

