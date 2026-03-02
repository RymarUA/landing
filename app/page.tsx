// Server Component — fetches product data, passes to client children
import { getAllProducts } from "@/lib/products";
import { ShopHero } from "@/components/shop-hero";
import { ShopCatalog } from "@/components/shop-catalog";
import { ShopNovaPoshta } from "@/components/shop-novaposhta";
import { ShopReviews } from "@/components/shop-reviews";
import { ShopFaq } from "@/components/shop-faq";
import { ShopFooter } from "@/components/shop-footer";
import { ScrollReveal } from "@/components/scroll-reveal";

export default async function Home() {
  // Fetched server-side: zero product data in client JS bundle
  const products = await getAllProducts();

  return (
    <main className="bg-white min-h-screen">
      <ShopHero />

      <ScrollReveal direction="up">
        <ShopCatalog products={products} />
      </ScrollReveal>

      <ScrollReveal direction="up" delay={100}>
        <ShopNovaPoshta />
      </ScrollReveal>

      <ScrollReveal direction="up" delay={80}>
        <ShopReviews />
      </ScrollReveal>

      <ScrollReveal direction="up" delay={80}>
        <ShopFaq />
      </ScrollReveal>

      <ShopFooter />
    </main>
  );
}
