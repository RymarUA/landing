"use client";

import { useState, useEffect } from "react";
import { AddToCartButton } from "./add-to-cart-button";
import type { CatalogProduct } from "@/lib/instagram-catalog";

const SENTINEL_SELECTOR = "[data-main-cta]";

/**
 * Mobile sticky purchase bar. Shows only when the main CTA block is out of view (IntersectionObserver).
 */
export function MobileStickyBar({ product }: { product: CatalogProduct }) {
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes[0] ?? "");
  const [show, setShow] = useState(false);

  useEffect(() => {
    let cleanup: (() => void) | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const setupObserver = () => {
      const el = document.querySelector(SENTINEL_SELECTOR);
      if (!el) return false;

      const ob = new IntersectionObserver(
        ([entry]) => setShow(!entry?.isIntersecting),
        { threshold: 0, rootMargin: "0px 0px -80px 0px" }
      );
      ob.observe(el);
      cleanup = () => ob.disconnect();
      return true;
    };

    if (!setupObserver()) {
      // Retry shortly after hydration in case the sentinel isn't in the DOM yet
      retryTimer = setTimeout(() => {
        setupObserver();
      }, 100);
    }

    return () => {
      if (cleanup) cleanup();
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-lg border-t border-gray-100 z-50 md:hidden shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between gap-4 max-w-5xl mx-auto">
        <div className="flex flex-col shrink-0">
          <span className="text-xs text-gray-400 font-bold uppercase tracking-tight">
            Ціна
          </span>
          <span className="text-xl font-black text-gray-900 leading-none">
            {product.price.toLocaleString("uk-UA")}{" "}
            <span className="text-sm">грн</span>
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <AddToCartButton
            product={product}
            selectedSize={selectedSize}
            onSizeChange={setSelectedSize}
            hideSizeSelector={true}
            stickyCtaOnly={true}
          />
        </div>
      </div>
    </div>
  );
}
