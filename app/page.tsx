// @ts-nocheck
import { Suspense } from "react";
import dynamic from "next/dynamic";
import { getCatalogProducts } from "@/lib/instagram-catalog";
import { HealthFooter } from "@/components/health-footer";

const EnhancedShopCatalog = dynamic(
  () => import("@/components/enhanced-shop-catalog").then(m => ({ default: m.EnhancedShopCatalog })),
  { 
    loading: () => (
      <section className="bg-white py-8">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 24 }).map((_, idx) => (
              <div key={idx} className="h-64 rounded-lg border border-gray-100 bg-gray-50 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    )
  }
);

function CatalogFallback() {
  return (
    <section className="bg-white py-8" aria-busy="true" aria-live="polite">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 24 }).map((_, idx) => (
            <div
              key={idx}
              className="h-64 rounded-lg border border-gray-100 bg-gray-50 animate-pulse"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default async function Home() {
  const products = await getCatalogProducts();

  return (
    <main className="min-h-screen bg-white pt-16">
      <div id="catalog">
        <Suspense fallback={<CatalogFallback />}>
          <EnhancedShopCatalog products={products} />
        </Suspense>
      </div>
      <HealthFooter />
    </main>
  );
}

