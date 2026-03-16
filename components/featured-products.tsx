  // @ts-nocheck
"use client";

import { useState, useRef, useEffect } from "react";
import { Flame, Sparkles, ChevronRight, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";
import { ModernProductCard } from "@/components/modern-product-card";
import type { CatalogProduct } from "@/lib/instagram-catalog";
import { useCart } from "@/components/cart-context";
import { Container } from "@/components/container";
import { Heading } from "@/components/heading";

interface FeaturedProductsProps {
  products: CatalogProduct[];
  type: "hits" | "new";
}

export function FeaturedProducts({ products, type }: FeaturedProductsProps) {
  const { addItem } = useCart();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Filter products based on type
  const filteredProducts = products.filter((p) =>
    type === "hits" ? p.isHit : p.isNew
  ).slice(0, 10); // Максимум 10 товарів

  // Автоскрол кожні 3 секунди
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || filteredProducts.length <= 3) return;

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
  }, [filteredProducts.length]);

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

  const handleViewAll = () => {
    window.location.href = "/?category=#catalog";
  };

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 300;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <section className={`bg-gradient-to-br ${bgGradient} py-2 sm:py-3 overflow-x-hidden`}>
      <Container>
        {/* Header - Temu Style */}
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <div className="flex items-center gap-1.5">
            <Heading size="sm" as="h2" className={`${accentColor} !text-left !mx-0`}>
              {title}
            </Heading>
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Flame className={`w-5 h-5 ${accentColor}`} />
            </motion.div>
          </div>
          <button
            onClick={handleViewAll}
            className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 flex items-center gap-0.5 font-medium transition-colors"
          >
            Дивитись всі
            <ChevronRight size={14} className="sm:w-4 sm:h-4" />
          </button>
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

          {/* Скролабельний контейнер */}
          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth"
          >
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex-shrink-0 w-[160px] sm:w-[180px] md:w-[200px]"
              >
                <ModernProductCard
                  product={product}
                  onAddToCart={handleAddToCart}
                  priority={index < 2}
                  compact={false}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
