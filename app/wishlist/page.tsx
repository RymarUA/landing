import { WishlistPageClient } from "./wishlist-client";
import { getCatalogProducts } from "@/lib/instagram-catalog";
import { siteConfig } from "@/lib/site-config";

export const metadata = {
  title: "������ ������",
  description: `���� �������� ������ � ${siteConfig.name}. ������������ �� ���������� � ������� ���.`,
};

export default async function WishlistPage() {
  const products = await getCatalogProducts();
  return <WishlistPageClient allProducts={products} />;
}

