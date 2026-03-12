// @ts-nocheck
"use client";

import { TemuSearchBar } from "@/components/temu-search-bar";
import { TemuBottomNav } from "@/components/temu-bottom-nav";
import { CookieBanner } from "@/components/cookie-banner";
import { CartWidget } from "@/components/cart-widget";

interface MobileLayoutProps {
  children: React.ReactNode;
}

export function MobileLayout({ children }: MobileLayoutProps) {
  return (
    <>
      {/* Brand Top Bar */}
      <TemuSearchBar />

      {/* Main content with top padding for fixed search bar */}
      <div className="pt-[76px] pb-[92px]">
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
