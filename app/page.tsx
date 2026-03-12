// @ts-nocheck
import { Suspense } from "react";
import dynamic from "next/dynamic";
import { getCatalogProducts } from "@/lib/instagram-catalog";
import { HealthFooter } from "@/components/health-footer";
import { ShopFaq } from "@/components/shop-faq";
import { FeaturedProducts } from "@/components/featured-products";

const CatalogFallback = () => (
  <section className="bg-white py-8" aria-busy="true" aria-live="polite">
    <div className="mx-auto max-w-7xl px-4">
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 24 }).map((_, idx) => (
          <div key={idx} className="h-64 rounded-lg border border-gray-100 bg-gray-50 animate-pulse" />
        ))}
      </div>
    </div>
  </section>
);

const EnhancedShopCatalog = dynamic(
  () => import("@/components/enhanced-shop-catalog").then(m => ({ default: m.EnhancedShopCatalog })),
  { loading: CatalogFallback }
);

export default async function Home() {
  const products = await getCatalogProducts();

  return (
    <main className="min-h-screen bg-white">
      {/* Featured Sections */}
      <FeaturedProducts products={products} type="hits" />
      <FeaturedProducts products={products} type="new" />
      
      {/* Main Catalog */}
      <div id="catalog">
        <Suspense fallback={<CatalogFallback />}>
          <EnhancedShopCatalog products={products} />
        </Suspense>
      </div>
      <ShopFaq />
      <HealthFooter />
    </main>
  );
}

