// @ts-nocheck
"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { CatalogProduct as Product } from "@/lib/instagram-catalog";
import { ModernProductCard } from "@/components/modern-product-card";

interface VirtualizedProductGridProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  searchQuery: string;
  visibleCount: number;
  hasMore: boolean;
  onLoadMore: () => void;
}

// Віртуалізована сітка товарів для оптимізації великих списків
export function VirtualizedProductGrid({
  products,
  onAddToCart,
  searchQuery,
  visibleCount,
  hasMore,
  onLoadMore,
}: VirtualizedProductGridProps) {
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef<IntersectionObserver>();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const animatedCardsRef = useRef<Set<Product["id"]>>(new Set());
  const shouldReduceMotion = useReducedMotion();

  const visibleProducts = useMemo(
    () => products.slice(0, visibleCount),
    [products, visibleCount]
  );

  const getCardAnimation = useCallback(
    (productId: Product["id"], orderIndex: number) => {
      if (shouldReduceMotion) {
        return {
          initial: false,
          animate: { opacity: 1, y: 0, scale: 1 },
        };
      }

      if (animatedCardsRef.current.has(productId)) {
        return {
          initial: false,
          animate: { opacity: 1, y: 0, scale: 1 },
          transition: { duration: 0.2 },
        };
      }

      return {
        initial: { opacity: 0, y: 24, scale: 0.96 },
        whileInView: { opacity: 1, y: 0, scale: 1 },
        viewport: { once: true, amount: 0.2, margin: "0px 0px -80px 0px" },
        transition: {
          duration: 0.45,
          ease: [0.22, 1, 0.36, 1],
          delay: Math.min(orderIndex, 8) * 0.025,
        },
        onViewportEnter: () => {
          animatedCardsRef.current.add(productId);
        },
      };
    },
    [shouldReduceMotion]
  );

  // Intersection Observer для lazy loading
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !isLoading) {
          setIsLoading(true);
          onLoadMore();
          // Додаємо затримку для плавності
          setTimeout(() => setIsLoading(false), 300);
        }
      },
      {
        threshold: 0.1,
        rootMargin: "100px", // Починати завантаження за 100px до елемента
      }
    );

    const currentObserver = observerRef.current;
    if (loadMoreRef.current) {
      currentObserver.observe(loadMoreRef.current);
    }

    return () => {
      if (currentObserver) {
        currentObserver.disconnect();
      }
    };
  }, [hasMore, isLoading, onLoadMore]);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1.5">
        {visibleProducts.map((product, index) => (
          <motion.div
            key={product.id}
            className="h-full"
            {...getCardAnimation(product.id, index)}
          >
            <ModernProductCard
              product={product}
              onAddToCart={onAddToCart}
              searchQuery={searchQuery}
              priority={index < 6} // Перші 6 зображень з високим пріоритетом для LCP
              compact={false}
            />
          </motion.div>
        ))}
      </div>

      {/* Елемент для відстеження прокрутки */}
      {hasMore && (
        <div ref={loadMoreRef} className="mt-3 sm:mt-4 flex justify-center">
          {isLoading ? (
            <div className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-lg bg-gray-100">
              <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs sm:text-sm text-gray-600">Завантаження...</span>
            </div>
          ) : (
            <button
              onClick={onLoadMore}
              className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg bg-white border border-gray-300 text-gray-700 font-bold text-xs sm:text-sm hover:bg-gray-50 transition-colors"
            >
              Завантажити ще ({products.length - visibleCount})
            </button>
          )}
        </div>
      )}
    </>
  );
}
