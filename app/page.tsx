/**
 * app/page.tsx — Home Page (Server Component) - Temu Style
 *
 * Product data is fetched server-side from instagram-catalog.ts.
 */

import { Suspense } from "react";
import { getCatalogProducts } from "@/lib/instagram-catalog";
import { TemuCatalog, CatalogSkeleton } from "@/components/temu-catalog";
import { ShopNovaPoshta } from "@/components/shop-novaposhta";
import { ShopFaq } from "@/components/shop-faq";
import { ShopFooter } from "@/components/shop-footer";
import { ErrorBoundary } from "@/components/error-boundary";

/** Inner async component so Suspense can show skeleton while fetching */
async function CatalogSection() {
  const products = await getCatalogProducts();
  return <TemuCatalog products={products} />;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ ttn?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Catalog — wrapped in ErrorBoundary + Suspense */}
      <ErrorBoundary label="Каталог" fallback={<CatalogSkeleton count={0} />}>
        <Suspense fallback={<CatalogSkeleton count={20} />}>
          <CatalogSection />
        </Suspense>
      </ErrorBoundary>

      {/* Nova Poshta tracker */}
      <ErrorBoundary label="Трекінг посилок">
        <ShopNovaPoshta initialTtn={params.ttn} />
      </ErrorBoundary>

      {/* FAQ */}
      <ErrorBoundary label="FAQ">
        <ShopFaq />
      </ErrorBoundary>

      <ShopFooter />
    </main>
  );
}
