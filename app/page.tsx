/**
 * app/page.tsx — Home Page (Server Component)
 *
 * Product data is fetched server-side from instagram-catalog.ts.
 * Currently uses mock data; swap getCatalogProducts() for a real IG API call
 * by following the instructions in lib/instagram-catalog.ts.
 *
 * Zero product data is shipped in the client JS bundle.
 */

import { Suspense } from "react";
import { getCatalogProducts } from "@/lib/instagram-catalog";
import { ShopHero } from "@/components/shop-hero";
import { ShopCatalog, CatalogSkeleton } from "@/components/shop-catalog";
import { ShopNovaPoshta } from "@/components/shop-novaposhta";
import { ShopFaq } from "@/components/shop-faq";
import { ShopFooter } from "@/components/shop-footer";
import { ScrollReveal } from "@/components/scroll-reveal";
import { ErrorBoundary } from "@/components/error-boundary";

/** Inner async component so Suspense can show skeleton while fetching */
async function CatalogSection() {
  const products = await getCatalogProducts();
  return <ShopCatalog products={products} />;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ ttn?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-[#fdf6f0]">
      <ShopHero />

      {/* Catalog — wrapped in ErrorBoundary + Suspense */}
      <ScrollReveal direction="up">
        <ErrorBoundary label="Каталог" fallback={<CatalogSkeleton count={0} />}>
          <Suspense fallback={<CatalogSkeleton count={12} />}>
            <CatalogSection />
          </Suspense>
        </ErrorBoundary>
      </ScrollReveal>

      {/* Nova Poshta tracker */}
      <ScrollReveal direction="up" delay={100}>
        <ErrorBoundary label="Трекінг посилок">
          <ShopNovaPoshta initialTtn={params.ttn} />
        </ErrorBoundary>
      </ScrollReveal>

      {/* FAQ */}
      <ScrollReveal direction="up" delay={80}>
        <ErrorBoundary label="FAQ">
          <ShopFaq />
        </ErrorBoundary>
      </ScrollReveal>

      <ShopFooter />
    </main>
  );
}
