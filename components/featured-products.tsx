  // @ts-nocheck
"use client";

import { useState } from "react";
import { Flame, Sparkles, ChevronRight } from "lucide-react";
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

  const handleViewAll = () => {
    window.location.href = "/?category=#catalog";
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

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-4">
          {filteredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="h-full"
            >
              <ModernProductCard
                product={product}
                onAddToCart={handleAddToCart}
                priority={index < 2}
              />
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
