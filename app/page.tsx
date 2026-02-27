import { ShopHero } from "@/components/shop-hero";
import { ShopCatalog } from "@/components/shop-catalog";
import { ShopNovaPoshta } from "@/components/shop-novaposhta";
import { ShopFooter } from "@/components/shop-footer";

export default function Home() {
  return (
    <main className="bg-white min-h-screen">
      <ShopHero />
      <ShopCatalog />
      <ShopNovaPoshta />
      <ShopFooter />
    </main>
  );
}
