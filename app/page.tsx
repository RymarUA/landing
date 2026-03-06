/**
 * app/page.tsx — Home Page (Server Component) - Temu Style
 *
 * Product data is fetched server-side from instagram-catalog.ts.
 */

import { Suspense } from "react";
import { getCatalogProducts } from "@/lib/instagram-catalog";
import { TemuCatalog, CatalogSkeleton } from "@/components/temu-catalog";
import { ErrorBoundary } from "@/components/error-boundary";

/** Inner async component so Suspense can show skeleton while fetching */
async function CatalogSection() {
  const products = await getCatalogProducts();
  return <TemuCatalog products={products} />;
}

export default async function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Catalog — wrapped in ErrorBoundary + Suspense */}
      <ErrorBoundary label="Каталог" fallback={<CatalogSkeleton count={0} />}>
        <Suspense fallback={<CatalogSkeleton count={20} />}>
          <CatalogSection />
        </Suspense>
      </ErrorBoundary>
    </main>
  );
}
