// @ts-nocheck
"use client";

import { useState } from "react";
import Image from "next/image";
import { ShoppingCart, Heart, Star, Zap } from "lucide-react";
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
      className="bg-white rounded-lg md:rounded-xl overflow-hidden cursor-pointer relative group border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all duration-200 flex flex-col h-full"
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

      {/* Image - Clean without any labels */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse" />
        )}
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, 25vw"
          className={`object-cover transition-all duration-300 group-hover:scale-105 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setImageLoaded(true)}
          {...blurProps()}
        />
      </div>

      {/* Content */}
      <div className="p-1.5 md:p-2 flex flex-col gap-1 flex-1">
        {/* Badges - Moved under photo */}
        <div className="hidden md:flex flex-wrap gap-1.5 mb-2">
          {product.badge && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${product.badgeColor || "bg-orange-500 text-white"}`}>
              {product.badge}
            </span>
          )}
          {product.isNew && !product.badge && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">
              АКЦІЯ
            </span>
          )}
          {product.isHit && !product.badge && !product.isNew && (
            <span className="bg-[#D4AF37] text-white text-[10px] font-bold px-2 py-0.5 rounded">
              ХІТ
            </span>
          )}
          {discount && (
            <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">
              -{discount}%
            </span>
          )}
          {product.freeShipping && (
            <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">
              Безкоштовна доставка
            </span>
          )}
        </div>

        {/* Category */}
        <p className="hidden md:block text-xs text-gray-500 mb-1">{product.category}</p>

        {/* Name */}
        <h3 className="text-[11px] md:text-sm font-medium md:font-bold text-gray-800 line-clamp-1 md:line-clamp-2 leading-tight">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="hidden md:flex items-center gap-1.5 mb-2">
          <div className="flex items-center gap-0.5 mb-2">
            {Array.from({ length: 5 }).map((_, i) => {
              const isFull = i < Math.floor(product.rating);
              const isHalf = i === Math.floor(product.rating) && product.rating % 1 >= 0.3 && product.rating % 1 < 0.8;
              return (
                <div key={i} className="relative" style={{ width: 13, height: 13 }}>
                  <Star
                    size={13}
                    className={isFull ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}
                  />
                  {isHalf && (
                    <div className="absolute inset-0 overflow-hidden" style={{ width: '6.5px' }}>
                      <Star size={13} className="fill-amber-400 text-amber-400" />
                    </div>
                  )}
                </div>
              );
            })}
            <span className="text-xs text-gray-400 ml-1">({product.reviews})</span>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-1 mt-auto">
          <span className="text-sm md:text-sm font-bold md:font-extrabold text-emerald-700">
            {product.price} грн
          </span>
          {product.oldPrice && (
            <span className="text-[9px] text-gray-400 line-through">
              {product.oldPrice} грн
            </span>
          )}
        </div>

        {/* Buttons - Hidden on mobile 4-column grid */}
        <div className="hidden md:flex gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onAddToCart(product)}
            className="flex-1 bg-white hover:bg-emerald-50 border border-emerald-600 text-emerald-600 text-xs font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            title="Додати товар у кошик"
          >
            <ShoppingCart size={14} />
            Додати в кошик
          </button>
          {onQuickBuy && (
            <button
              onClick={() => onQuickBuy(product)}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              title="Швидке оформлення"
            >
              <Zap size={15} />
              Купити
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
