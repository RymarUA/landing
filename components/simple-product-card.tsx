"use client";

import React from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import type { CatalogProduct } from "@/lib/instagram-catalog";
import { useWishlist } from "@/components/wishlist-context";
import { useProductTracking } from "@/hooks/use-product-tracking";
import { OptimizedImage } from "@/components/optimized-image";

interface SimpleProductCardProps {
  product: CatalogProduct;
  priority?: boolean;
}

export function SimpleProductCard({ 
  product, 
  priority 
}: SimpleProductCardProps) {
  // Move all hooks to top before early return
  const { has, toggle, hydrated } = useWishlist();
  const { trackClick } = useProductTracking();
  const [heartPulse, setHeartPulse] = React.useState(false);

  // Validate product data
  if (!product || !product.id || !product.name || !product.category || product.price === undefined) {
    console.error("[SimpleProductCard] Invalid product data:", product);
    return null;
  }

  const inWishlist = hydrated && has(product.id);

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(product.id);
    setHeartPulse(true);
    setTimeout(() => setHeartPulse(false), 600);
  };

  const discount = product.oldPrice 
    ? Math.round((1 - product.price / product.oldPrice) * 100) 
    : 0;

  const handleCardClick = () => {
    trackClick({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
    });
  };

  return (
    <Link
      href={`/product/${product.id}`}
      onClick={handleCardClick}
      className="group bg-white rounded-md overflow-hidden border border-gray-100 hover:shadow-md transition-shadow duration-200 cursor-pointer flex flex-col h-full"
    >
      {/* Image */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        <OptimizedImage
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 16vw"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          priority={priority}
        />
        
        {/* Discount badge */}
        {discount > 0 && (
          <div className="absolute top-1.5 left-1.5 bg-[#E31C25] text-white text-xs font-black px-2 py-0.5 rounded shadow-sm z-10">
            -{discount}%
          </div>
        )}
        
        {/* Wishlist button */}
        <motion.button
          onClick={handleWishlistToggle}
          className="absolute top-1.5 right-1.5 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors z-10"
          aria-label={inWishlist ? "Видалити з бажань" : "Додати в бажання"}
          animate={heartPulse ? { scale: [1, 1.3, 1] } : { scale: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <Heart
            size={15}
            className={inWishlist ? "fill-red-500 text-red-500" : "text-gray-600"}
          />
        </motion.button>

        {/* Out of stock */}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
            <span className="bg-white text-gray-900 font-bold px-1.5 py-0.5 rounded text-[8px] sm:text-[9px]">
              Немає в наявності
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-2 flex flex-col flex-1">
        {/* Title */}
        <h3 className="text-[13px] font-semibold text-gray-900 line-clamp-2 leading-tight mb-2 flex-1">
          {product.name}
        </h3>

        {/* Price */}
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-black text-[#E31C25] leading-none">
            {product.price}
          </span>
          <span className="text-[10px] font-bold text-[#E31C25]">грн</span>
          {product.oldPrice && (
            <span className="text-[10px] text-gray-400 line-through ml-1">
              {product.oldPrice} грн
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
