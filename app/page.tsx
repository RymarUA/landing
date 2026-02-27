import { ShopHero } from "@/components/shop-hero";
import { ShopCatalog } from "@/components/shop-catalog";
import { ShopMeest } from "@/components/shop-meest";
import { ShopReviews } from "@/components/shop-reviews";
import { ShopOrder } from "@/components/shop-order";
import { ShopFooter } from "@/components/shop-footer";

export default function Home() {
  return (
    <main className="bg-white min-h-screen">
      <ShopHero />
      <ShopCatalog />
      <ShopMeest />
      <ShopReviews />
      <ShopOrder />
      <ShopFooter />
    </main>
  );
}
