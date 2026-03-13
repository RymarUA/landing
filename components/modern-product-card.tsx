// @ts-nocheck
"use client";

import { useState } from "react";
import Image from "next/image";
import { ShoppingCart, Heart, Star, Zap, TrendingUp } from "lucide-react";
import { useWishlist } from "@/components/wishlist-context";
import type { CatalogProduct } from "@/lib/instagram-catalog";
import { blurProps } from "@/lib/utils";

interface ModernProductCardProps {
  product: CatalogProduct;
  onAddToCart: (product: CatalogProduct) => void;
  onClick: (product: CatalogProduct) => void;
  onQuickBuy?: (product: CatalogProduct) => void;
  searchQuery?: string;
}

export function ModernProductCard({
  product,
  onAddToCart,
  onClick,
  onQuickBuy,
  searchQuery: _searchQuery,
}: ModernProductCardProps) {
  const { has, toggle } = useWishlist();
  const isWished = has(product.id);
  const [imageLoaded, setImageLoaded] = useState(false);

  const discount = product.oldPrice
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : null;

  return (
    <div
      onClick={() => onClick(product)}
      className="bg-white rounded-lg overflow-hidden cursor-pointer relative group border border-gray-100 hover:border-orange-200 hover:shadow-md transition-all duration-300 flex flex-col h-full"
    >
      {/* Wishlist Heart */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggle(product.id);
        }}
        className={`absolute top-1 right-1 md:top-2 md:right-2 w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center z-10 transition-all ${
          isWished
            ? "bg-red-500 text-white"
            : "bg-white/90 backdrop-blur-sm text-gray-400 hover:text-red-500"
        }`}
      >
        <Heart size={12} className={`md:w-[14px] md:h-[14px] ${isWished ? "fill-white" : ""}`} />
      </button>

      {/* Image - Clean square format without badges */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse" />
        )}
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
          className={`object-cover transition-transform duration-300 group-hover:scale-105 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setImageLoaded(true)}
          {...blurProps()}
        />
      </div>

      {/* Content */}
      <div className="p-2 flex flex-col gap-1.5 flex-1">
        {/* Name - Compact with line-clamp-2 and min-height */}
        <h3 className="text-sm font-medium text-gray-800 line-clamp-2 min-h-[40px] leading-tight">
          {product.name}
        </h3>

        {/* Rating & Sales - Combined social proof */}
        <div className="flex items-center gap-1 text-[11px] text-gray-500">
          <Star size={12} className="fill-amber-400 text-amber-400" />
          <span className="font-medium text-gray-700">{product.rating}</span>
          <span>({product.reviews}+ відгуків)</span>
          <span className="mx-1">·</span>
          <span>Продано {Math.round(product.reviews * 1.5)}к+</span>
        </div>

        {/* Price - Large and prominent */}
        <div className="flex items-baseline gap-2 mt-0.5">
          <span className="text-lg font-bold text-orange-600">
            {product.price} грн
          </span>
          {product.oldPrice && (
            <span className="text-xs text-gray-400 line-through">
              {product.oldPrice} грн
            </span>
          )}
        </div>

        {/* Badges - Compact text labels */}
        <div className="flex flex-wrap gap-1.5 mt-1">
          {product.freeShipping && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-green-50 text-green-600">
              Безкоштовна доставка
            </span>
          )}
          {(product.isHit || product.badge) && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-orange-50 text-orange-600">
              Топ вибір
            </span>
          )}
          {discount && discount > 0 && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-red-50 text-red-600">
              -{discount}%
            </span>
          )}
        </div>

        {/* Hover Button - Shows on hover */}
        <div 
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 mt-2" 
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onAddToCart(product)}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
            title="Швидке замовлення"
          >
            <ShoppingCart size={16} />
            Швидке замовлення
          </button>
        </div>
      </div>
    </div>
  );
}
