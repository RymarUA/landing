import { getCatalogProducts } from "@/lib/instagram-catalog";
import { HealthHero } from "@/components/health-hero";
import { HealthTrust } from "@/components/health-trust";
import { HealthCategories } from "@/components/health-categories";
import { HealthGuide } from "@/components/health-guide";
import { HealthFeatured } from "@/components/health-featured";
import { HealthTestimonials } from "@/components/health-testimonials";
import { ShopFaq } from "@/components/shop-faq";
import { HealthFooter } from "@/components/health-footer";

export default async function Home() {
  const products = await getCatalogProducts();

  return (
    <main className="min-h-screen bg-[#F6F4EF]">
      <HealthHero />
      <HealthTrust />
      <HealthCategories />
      <HealthGuide />
      <div id="catalog">
        <HealthFeatured products={products} />
      </div>
      <HealthTestimonials />
      <ShopFaq />
      <HealthFooter />
    </main>
  );
}

