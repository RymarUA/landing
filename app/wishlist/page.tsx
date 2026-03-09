import { WishlistPageClient } from "./wishlist-client";
import { getCatalogProducts } from "@/lib/instagram-catalog";

export const metadata = {
  title: "Список бажань",
  description: "Ваші збережені товари в FamilyHub Market. Переглядайте та замовляйте у зручний час.",
};

export default async function WishlistPage() {
  // Fetch all products server-side so the client can filter by wishlisted IDs
  const products = await getCatalogProducts();
  return <WishlistPageClient allProducts={products} />;
}
