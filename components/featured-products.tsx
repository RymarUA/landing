// @ts-nocheck
"use client";

import { useRef, useEffect } from "react";
import { Flame, ChevronRight, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";
import { SimpleProductCard } from "@/components/simple-product-card";
import { ModernProductCard } from "@/components/modern-product-card";
import type { FeaturedProduct } from "@/types/featured-product";
import { useCart } from "@/components/cart-context";
import { Container } from "@/components/container";
import { Heading } from "@/components/heading";

interface FeaturedProductsProps {
  products: FeaturedProduct[];
  type: "hits" | "new";
}

export function FeaturedProducts({ products, type }: FeaturedProductsProps) {
  const { addItem } = useCart();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || products.length <= 3) return;

    const interval = setInterval(() => {
      const scrollWidth = container.scrollWidth;
      const clientWidth = container.clientWidth;
      const currentScroll = container.scrollLeft;

      if (currentScroll + clientWidth >= scrollWidth - 10) {
        container.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: 200, behavior: 'smooth' });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [products.length]);

  if (products.length === 0) return null;

  const title = type === "hits" ? "Хіти продажів" : "Новинки";
  const bgGradient = type === "hits"
    ? "from-orange-50 to-red-50"
    : "from-purple-50 to-pink-50";
  const accentColor = type === "hits" ? "text-orange-600" : "text-purple-600";

  const handleAddToCart = (product: FeaturedProduct) => {
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
    const baseUrl = "/#catalog";
    
    if (type === "hits") {
      window.location.href = `${baseUrl}?category=Хіти продажів`;
    } else if (type === "new") {
      window.location.href = `${baseUrl}?sort=newest`;
    } else {
      window.location.href = baseUrl;
    }
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
        {/* Компактний header */}
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <div className="flex items-center gap-1">
            <Heading size="sm" as="h2" className={`${accentColor} !text-left !mx-0 !text-lg sm:!text-xl`}>
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
              <Flame className={`w-4 h-4 sm:w-5 sm:h-5 ${accentColor}`} />
            </motion.div>
          </div>
          <button
            onClick={handleViewAll}
            className="text-xs text-gray-600 hover:text-gray-900 flex items-center gap-0.5 font-medium transition-colors"
          >
            Всі
            <ChevronRight size={12} className="sm:w-3.5 sm:h-3.5" />
          </button>
        </div>

        {/* Карусель */}
        <div className="relative group">
          {/* Кнопки навігації - тільки на desktop */}
          <button
            onClick={() => scroll("left")}
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white shadow-lg items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50 border border-gray-200"
            aria-label="Прокрутити вліво"
          >
            <ChevronLeft size={18} className="text-gray-700" />
          </button>

          <button
            onClick={() => scroll("right")}
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white shadow-lg items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50 border border-gray-200"
            aria-label="Прокрутити вправо"
          >
            <ChevronRight size={18} className="text-gray-700" />
          </button>

          {/* Скролабельний контейнер - КОМПАКТНІ КАРТОЧКИ */}
          <div
            ref={scrollRef}
            className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth"
          >
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex-shrink-0 w-[140px] sm:w-[160px] md:w-[180px]"
              >
                {type === "hits" ? (
                  <SimpleProductCard
                    product={product}
                    priority={index < 6}
                  />
                ) : (
                  <ModernProductCard
                    product={product}
                    onAddToCart={handleAddToCart}
                    priority={index < 6}
                    compact={true}
                  />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
