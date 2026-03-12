// @ts-nocheck
"use client";

import { TemuSearchBar } from "@/components/temu-search-bar";
import type { CatalogProduct } from "@/lib/instagram-catalog";

interface SearchBarWithProductsProps {
  products: CatalogProduct[];
}

export function SearchBarWithProducts({ products }: SearchBarWithProductsProps) {
  return <TemuSearchBar products={products} />;
}
