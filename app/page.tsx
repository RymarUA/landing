import { Suspense } from "react";
import { getCatalogProducts } from "@/lib/instagram-catalog";
import { HealthHero } from "@/components/health-hero";
import { HealthTrust } from "@/components/health-trust";
import { HealthCategories } from "@/components/health-categories";
import { HealthGuide } from "@/components/health-guide";
import { HealthFeatured } from "@/components/health-featured";
import { HealthTestimonials } from "@/components/health-testimonials";
import { ShopFaq } from "@/components/shop-faq";
import { HealthFooter } from "@/components/health-footer";

function CatalogFallback() {
  return (
    <section className="bg-white py-20" aria-busy="true" aria-live="polite">
      <div className="mx-auto max-w-6xl px-4">
        <div className="h-10 w-52 rounded-full bg-[#E7EFEA] animate-pulse" />
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="h-64 rounded-2xl border border-[#E7EFEA] bg-[#F6F4EF] animate-pulse"
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
    <main className="min-h-screen bg-[#F6F4EF]">
      <HealthHero />
      <HealthTrust />
      <HealthCategories />
      <HealthGuide />
      <div id="catalog">
        <Suspense fallback={<CatalogFallback />}>
          <HealthFeatured products={products} />
        </Suspense>
      </div>
      <HealthTestimonials />
      <ShopFaq />
      <HealthFooter />
    </main>
  );
}

