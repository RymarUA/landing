import type { Metadata } from "next/types";
import { WishlistPageClient } from "./wishlist-client";
import { getCatalogProducts } from "@/lib/instagram-catalog";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Список бажань",
  description: `Ваші обрані товари в ${siteConfig.name}. Зберігайте та повертайтесь у будь-який час.`,
};

export default async function WishlistPage() {
  const products = await getCatalogProducts();
  return <WishlistPageClient allProducts={products} />;
}

