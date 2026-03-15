// @ts-nocheck
import { Suspense } from "react";
import dynamic from "next/dynamic";
import { getCatalogProducts } from "@/lib/instagram-catalog";
import { ShopFooter } from "@/components/shop-footer";

const FeaturedProducts = dynamic(
  () => import("@/components/featured-products").then(mod => ({ default: mod.FeaturedProducts })),
  { 
    loading: () => (
      <section className="bg-white py-4 sm:py-6 md:py-8">
        <div className="mx-auto max-w-7xl px-2 sm:px-3 md:px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded-lg w-48 mb-4"></div>
            <div className="grid gap-1.5 sm:gap-2 md:gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="h-56 sm:h-60 md:h-64 rounded-lg border border-gray-100 bg-gray-50" />
              ))}
            </div>
          </div>
        </div>
      </section>
    )
  }
);

const CatalogFallback = () => (
  <section className="bg-white py-4 sm:py-6 md:py-8" aria-busy="true" aria-live="polite">
    <div className="mx-auto max-w-7xl px-2 sm:px-3 md:px-4">
      <div className="grid gap-1.5 sm:gap-2 md:gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 24 }).map((_, idx) => (
          <div key={idx} className="h-56 sm:h-60 md:h-64 rounded-lg border border-gray-100 bg-gray-50 animate-pulse" />
        ))}
      </div>
    </div>
  </section>
);

const EnhancedShopCatalog = dynamic(
  () => import("@/components/enhanced-shop-catalog"),
  { loading: CatalogFallback }
);

export default async function Home() {
  const products = await getCatalogProducts();

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 bg-white flex flex-col">
        {/* Featured Sections */}
        <FeaturedProducts products={products} type="hits" />
        
        {/* Main Catalog */}
        <div id="catalog">
          <Suspense fallback={<CatalogFallback />}>
            <EnhancedShopCatalog products={products} />
          </Suspense>
        </div>
        </main>
      <ShopFooter />
    </div>
  );
}

