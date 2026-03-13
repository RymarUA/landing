// @ts-nocheck
"use client";

import { TemuSearchBar } from "@/components/temu-search-bar";
import type { CatalogProduct } from "@/lib/instagram-catalog";

interface SearchBarWithProductsProps {
  products: CatalogProduct[];
  announcementText?: string;
}

export function SearchBarWithProducts({
  products,
  announcementText,
}: SearchBarWithProductsProps) {
  return (
    <TemuSearchBar products={products} announcementText={announcementText} />
  );
}
