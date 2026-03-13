"use client";

import { TemuBottomNav } from "@/components/temu-bottom-nav";
import { CookieBanner } from "@/components/cookie-banner";
import { CartWidget } from "@/components/cart-widget";
import { usePathname } from "next/navigation";

interface MobileLayoutProps {
  children: React.ReactNode;
}

export function MobileLayout({
  children,
}: MobileLayoutProps) {
  const pathname = usePathname();
  
  // Check if current page has footer (home page)
  const hasFooter = pathname === "/";
  
  return (
    <>
      {/* Main content with bottom padding for navigation only if no footer */}
      <div className={hasFooter ? "" : "pb-[92px]"}>
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
