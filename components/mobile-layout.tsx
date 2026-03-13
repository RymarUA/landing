// @ts-nocheck
"use client";

import { SearchBarWithProducts } from "@/components/search-bar-with-products";
import { StickyCategories } from "@/components/sticky-categories";
import { TemuBottomNav } from "@/components/temu-bottom-nav";
import { CookieBanner } from "@/components/cookie-banner";
import { CartWidget } from "@/components/cart-widget";
import type { CatalogProduct } from "@/lib/instagram-catalog";

interface MobileLayoutProps {
  children: React.ReactNode;
  products?: CatalogProduct[];
}

export function MobileLayout({ children, products = [] }: MobileLayoutProps) {
  return (
    <>
      {/* Brand Top Bar */}
      <SearchBarWithProducts products={products} />

      {/* Sticky Categories Bar */}
      <StickyCategories />

      {/* Main content with top padding for announcement bar + search bar + categories */}
      <div className="pt-[188px] pb-[92px]">
        {children}
      </div>

      {/* Floating Cart Widget */}
      <CartWidget />

      {/* Temu-style Bottom Navigation (includes cart) */}
      <TemuBottomNav />
      
      {/* Cookie Banner */}
      <CookieBanner />
    </>
  );
}
