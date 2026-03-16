// @ts-nocheck
"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

  const visibleProducts = products.slice(0, visibleCount);

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
        <AnimatePresence mode="popLayout">
          {visibleProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="h-full"
            >
              <ModernProductCard
                product={product}
                onAddToCart={onAddToCart}
                searchQuery={searchQuery}
                priority={index < 2} // Перші 2 зображення з високим пріоритетом
                compact={false}
              />
            </motion.div>
          ))}
        </AnimatePresence>
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
