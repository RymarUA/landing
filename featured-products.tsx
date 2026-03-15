// @ts-nocheck
"use client";

import { useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CatalogProduct } from "@/lib/instagram-catalog";
import { ModernProductCard } from "@/components/modern-product-card";
import { useCart } from "@/components/cart-context";
import { trackAddToCart } from "@/components/analytics";

interface FeaturedProductsProps {
  products: CatalogProduct[];
  type: "hits" | "new";
}

export function FeaturedProducts({ products, type }: FeaturedProductsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { addItem } = useCart();

  // Фільтруємо товари
  const filtered = products.filter((p) => 
    type === "hits" ? p.isHit : p.isNew
  ).slice(0, 10); // Максимум 10 товарів

  // Автоскрол кожні 3 секунди
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || filtered.length <= 3) return;

    const interval = setInterval(() => {
      const scrollWidth = container.scrollWidth;
      const clientWidth = container.clientWidth;
      const currentScroll = container.scrollLeft;

      // Якщо дійшли до кінця - повертаємось на початок
      if (currentScroll + clientWidth >= scrollWidth - 10) {
        container.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        // Скролимо на ширину однієї карточки
        container.scrollBy({ left: 200, behavior: 'smooth' });
      }
    }, 3000); // Кожні 3 секунди

    return () => clearInterval(interval);
  }, [filtered.length]);

  const handleAddToCart = (product: CatalogProduct) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      size: product.sizes[0] ?? null,
      oldPrice: product.oldPrice ?? null,
    });
    
    trackAddToCart({
      contentId: product.id,
      contentName: product.name,
      value: product.price,
      currency: "UAH",
    });
  };

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 300;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (filtered.length === 0) return null;

  const title = type === "hits" ? "🔥 Хіти продажів" : "✨ Новинки";

  return (
    <section className="bg-gradient-to-b from-orange-50 to-white py-6 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Заголовок */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-black text-gray-900">
            {title}
          </h2>
          <a
            href={`/?category=${type === "hits" ? "Хіт" : "Новинка"}#catalog`}
            className="text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors"
          >
            Дивитись всі →
          </a>
        </div>

        {/* Карусель з кнопками */}
        <div className="relative group">
          {/* Кнопка ліворуч */}
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50 border border-gray-200"
            aria-label="Прокрутити вліво"
          >
            <ChevronLeft size={20} className="text-gray-700" />
          </button>

          {/* Кнопка праворуч */}
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50 border border-gray-200"
            aria-label="Прокрутити вправо"
          >
            <ChevronRight size={20} className="text-gray-700" />
          </button>

          {/* Скролабельний контейнер - КОМПАКТНИЙ */}
          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth"
          >
            {filtered.map((product) => (
              <div
                key={product.id}
                className="flex-shrink-0 w-[160px] sm:w-[180px] md:w-[200px]"
              >
                <ModernProductCard
                  product={product}
                  onAddToCart={handleAddToCart}
                  onClick={() => {}} // Відкриття модалки
                  onQuickBuy={() => {}} // Швидка покупка
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
