// @ts-nocheck
"use client";

import { TemuBottomNav } from "@/components/temu-bottom-nav";
import { CookieBanner } from "@/components/cookie-banner";
import { CartWidget } from "@/components/cart-widget";

interface MobileLayoutProps {
  children: React.ReactNode;
}

export function MobileLayout({
  children,
}: MobileLayoutProps) {
  return (
    <>
      {/* Main content with bottom padding for navigation */}
      <div className="pb-[92px]">
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
