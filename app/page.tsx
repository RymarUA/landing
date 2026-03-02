/**
 * app/page.tsx — Home Page (Server Component)
 *
 * Product data is fetched server-side from instagram-catalog.ts.
 * Currently uses mock data; swap getCatalogProducts() for a real IG API call
 * by following the instructions in lib/instagram-catalog.ts.
 *
 * Zero product data is shipped in the client JS bundle.
 */

import { getCatalogProducts } from "@/lib/instagram-catalog";
import { ShopHero } from "@/components/shop-hero";
import { ShopCatalog } from "@/components/shop-catalog";
import { ShopNovaPoshta } from "@/components/shop-novaposhta";
import { ShopFaq } from "@/components/shop-faq";
import { ShopFooter } from "@/components/shop-footer";
import { ScrollReveal } from "@/components/scroll-reveal";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ ttn?: string }>;
}) {
  const params = await searchParams;
  const products = await getCatalogProducts();

  return (
    <main className="bg-white min-h-screen">
      <ShopHero />

      <ScrollReveal direction="up">
        {/* ShopCatalog expects Product[] — CatalogProduct is compatible */}
        <ShopCatalog products={products} />
      </ScrollReveal>

      <ScrollReveal direction="up" delay={100}>
        <ShopNovaPoshta initialTtn={params.ttn} />
      </ScrollReveal>

      <ScrollReveal direction="up" delay={80}>
        <ShopFaq />
      </ScrollReveal>

      <ShopFooter />
    </main>
  );
}
