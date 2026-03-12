// @ts-nocheck
"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Flame, Sparkles } from "lucide-react";
import { ModernProductCard } from "@/components/modern-product-card";
import type { CatalogProduct } from "@/lib/instagram-catalog";
import { useCart } from "@/components/cart-context";

interface FeaturedProductsProps {
  products: CatalogProduct[];
  type: "hits" | "new";
}

export function FeaturedProducts({ products, type }: FeaturedProductsProps) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const { addItem } = useCart();
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);

  // Filter products based on type
  const filteredProducts = products.filter((p) =>
    type === "hits" ? p.isHit : p.isNew
  );

  if (filteredProducts.length === 0) return null;

  const title = type === "hits" ? "🔥 Хіти продажів" : "✨ Новинки";
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

  const scroll = (direction: "left" | "right") => {
    const container = document.getElementById(`featured-${type}`);
    if (!container) return;
    
    const scrollAmount = 300;
    const newPosition = direction === "left" 
      ? Math.max(0, scrollPosition - scrollAmount)
      : Math.min(container.scrollWidth - container.clientWidth, scrollPosition + scrollAmount);
    
    container.scrollTo({ left: newPosition, behavior: "smooth" });
    setScrollPosition(newPosition);
  };

  return (
    <section className={`bg-gradient-to-br ${bgGradient} py-8 md:py-12`}>
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className={`text-2xl md:text-3xl font-bold ${accentColor} flex items-center gap-2`}>
              <Icon size={28} className="animate-pulse" />
              {title}
            </h2>
            <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
          </div>

          {/* Navigation Arrows */}
          <div className="hidden md:flex gap-2">
            <button
              onClick={() => scroll("left")}
              disabled={scrollPosition === 0}
              className="w-10 h-10 rounded-full bg-white shadow-md hover:shadow-lg disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all"
              aria-label="Прокрутити вліво"
            >
              <ChevronLeft size={20} className="text-gray-700" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="w-10 h-10 rounded-full bg-white shadow-md hover:shadow-lg flex items-center justify-center transition-all"
              aria-label="Прокрутити вправо"
            >
              <ChevronRight size={20} className="text-gray-700" />
            </button>
          </div>
        </div>

        {/* Products Horizontal Scroll */}
        <div
          id={`featured-${type}`}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {filteredProducts.map((product) => (
            <div key={product.id} className="flex-shrink-0 w-[180px] md:w-[220px]">
              <ModernProductCard
                product={product}
                onAddToCart={handleAddToCart}
                onClick={setSelectedProduct}
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
  );
}
