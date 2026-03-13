  // @ts-nocheck
"use client";

import { useState, useEffect, useRef } from "react";
import { Flame, Sparkles, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { ModernProductCard } from "@/components/modern-product-card";
import { ProductModal } from "@/components/product-modal";
import type { CatalogProduct } from "@/lib/instagram-catalog";
import { useCart } from "@/components/cart-context";

interface FeaturedProductsProps {
  products: CatalogProduct[];
  type: "hits" | "new";
}

export function FeaturedProducts({ products, type }: FeaturedProductsProps) {
  const [modalProduct, setModalProduct] = useState<CatalogProduct | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { addItem } = useCart();

  // Filter products based on type
  const filteredProducts = products.filter((p) =>
    type === "hits" ? p.isHit : p.isNew
  );

  if (filteredProducts.length === 0) return null;

  const title = type === "hits" ? "Хіти продажів" : "Новинки";
  const subtitle = type === "hits" 
    ? "Найпопулярніші товари серед наших клієнтів"
    : "Щойно додані до каталогу";
  const Icon = type === "hits" ? Flame : Sparkles;
  const bgGradient = type === "hits"
    ? "from-orange-50 to-red-50"
    : "from-purple-50 to-pink-50";
  const accentColor = type === "hits" ? "text-orange-600" : "text-purple-600";

  const handleAddToCart = (product: CatalogProduct) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      size: product.sizes[0] ?? null,
      oldPrice: product.oldPrice ?? null,
    });
  };

  // Auto-scroll effect
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || isPaused) return;

    const scrollSpeed = 0.5; // pixels per frame - slow and smooth
    let animationFrameId: number;

    const autoScroll = () => {
      if (container.scrollLeft >= container.scrollWidth - container.clientWidth) {
        container.scrollLeft = 0;
      } else {
        container.scrollLeft += scrollSpeed;
      }
      animationFrameId = requestAnimationFrame(autoScroll);
    };

    animationFrameId = requestAnimationFrame(autoScroll);

    return () => cancelAnimationFrame(animationFrameId);
  }, [isPaused]);

  const handleViewAll = () => {
    window.location.href = "/?category=#catalog";
  };

  return (
    <>
      {modalProduct && (
        <ProductModal
          product={modalProduct}
          onClose={() => setModalProduct(null)}
          onAddToCart={handleAddToCart}
        />
      )}
      
      <section className={`bg-gradient-to-br ${bgGradient} py-3 sm:py-4 overflow-x-hidden`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        {/* Header - Temu Style */}
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <h2 className={`text-base sm:text-lg md:text-xl font-bold ${accentColor} flex items-center gap-1.5`}>
            {title} 🔥
          </h2>
          <button
            onClick={handleViewAll}
            className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 flex items-center gap-0.5 font-medium transition-colors"
          >
            Дивитись всі
            <ChevronRight size={14} className="sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Auto-scrolling Products Carousel */}
        <div
          ref={scrollRef}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {filteredProducts.map((product, index) => (
            <div 
              key={product.id} 
              className="flex-shrink-0 w-[calc(33.333%-5.33px)] sm:w-[calc(25%-6px)] md:w-[calc(16.666%-6.67px)]"
            >
              <ModernProductCard
                product={product}
                onAddToCart={handleAddToCart}
                onClick={setModalProduct}
                priority={index < 6}
                compact
              />
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
    </>
  );
}
