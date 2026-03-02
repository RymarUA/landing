import { ShopHero } from "@/components/shop-hero";
import { ShopCatalog } from "@/components/shop-catalog";
import { ShopNovaPoshta } from "@/components/shop-novaposhta";
import { ShopReviews } from "@/components/shop-reviews";
import { ShopFaq } from "@/components/shop-faq";
import { ShopFooter } from "@/components/shop-footer";
import { ScrollReveal } from "@/components/scroll-reveal";

export default function Home() {
  return (
    <main className="bg-white min-h-screen">
      {/* Hero — full screen, no reveal */}
      <ShopHero />

      {/* Catalog: new arrivals + main grid */}
      <ScrollReveal direction="up">
        <ShopCatalog />
      </ScrollReveal>

      {/* Nova Poshta tracking */}
      <ScrollReveal direction="up" delay={100}>
        <ShopNovaPoshta />
      </ScrollReveal>

      {/* Reviews */}
      <ScrollReveal direction="up" delay={80}>
        <ShopReviews />
      </ScrollReveal>

      {/* FAQ */}
      <ScrollReveal direction="up" delay={80}>
        <ShopFaq />
      </ScrollReveal>

      {/* Footer */}
      <ShopFooter />
    </main>
  );
}
