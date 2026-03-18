// @ts-nocheck
import { Suspense } from "react";
import dynamic from "next/dynamic";
import { getCachedCatalogProducts, getCachedFeaturedHits } from "@/lib/cached-data";
import { ShopFooter } from "@/components/shop-footer";

const PromoBannerSlider = dynamic(
  () => import("@/components/promo-banner-slider").then(mod => ({ default: mod.PromoBannerSlider })),
  { 
    loading: () => (
      <div className="relative w-full overflow-hidden rounded-2xl shadow-lg mb-6">
        <div className="relative bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-5 md:py-6">
          <div className="flex items-center justify-center gap-2.5 text-white">
            <div className="w-6 h-6 bg-white/20 rounded animate-pulse"></div>
            <div className="h-6 bg-white/20 rounded w-48 animate-pulse"></div>
          </div>
        </div>
      </div>
    ),
  }
);

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

const CatalogHashProvider = dynamic(
  () => import("@/components/catalog-hash-provider").then(mod => ({ default: mod.CatalogHashProvider }))
);

const EnhancedShopCatalog = dynamic(
  () => import("@/components/enhanced-shop-catalog").then(mod => ({ default: mod.EnhancedShopCatalog })),
  { loading: CatalogFallback }
);

export default async function Home() {
  const [products, featuredHits] = await Promise.all([
    getCachedCatalogProducts(),
    getCachedFeaturedHits(10),
  ]);

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 bg-white flex flex-col">
        {/* Обработчик хеша для прокрутки к каталогу */}
        <CatalogHashProvider />
        
        {/* Promo Banner */}
        <div className="mx-auto max-w-7xl px-2 sm:px-3 md:px-4 mt-4 sm:mt-6">
          <Suspense fallback={
            <div className="relative w-full overflow-hidden rounded-2xl shadow-lg mb-6">
              <div className="relative bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-5 md:py-6">
                <div className="flex items-center justify-center gap-2.5 text-white">
                  <div className="w-6 h-6 bg-white/20 rounded animate-pulse"></div>
                  <div className="h-6 bg-white/20 rounded w-48 animate-pulse"></div>
                </div>
              </div>
            </div>
          }>
            <PromoBannerSlider />
          </Suspense>
        </div>

        {/* Featured Sections */}
        <FeaturedProducts products={featuredHits} type="hits" />
        
        {/* Main Catalog */}
        <div data-catalog-section>
          <Suspense fallback={<CatalogFallback />}>
            <EnhancedShopCatalog products={products} />
          </Suspense>
        </div>
        </main>
      <ShopFooter />
    </div>
  );
}

