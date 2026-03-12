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
  searchQuery = "",
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
      className="bg-white rounded-xl overflow-hidden cursor-pointer relative group border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all duration-200"
    >
      {/* Wishlist Heart */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggle(product.id);
        }}
        className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center z-10 transition-all ${
          isWished
            ? "bg-red-500 text-white"
            : "bg-white/90 backdrop-blur-sm text-gray-400 hover:text-red-500"
        }`}
      >
        <Heart size={14} className={isWished ? "fill-white" : ""} />
      </button>

      {/* Image */}
      <div className="relative aspect-square bg-gray-50">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse" />
        )}
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, 25vw"
          className={`object-cover transition-all duration-300 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setImageLoaded(true)}
          {...blurProps()}
        />

        {/* Labels - Bright and prominent */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.isNew && (
            <span className="bg-red-500 text-white text-xs font-black px-2 py-1 rounded shadow-md">
              АКЦІЯ
            </span>
          )}
          {product.isHit && !product.isNew && (
            <span className="bg-[#D4AF37] text-white text-xs font-black px-2 py-1 rounded shadow-md">
              ХІТ
            </span>
          )}
          {discount && (
            <span className="bg-orange-500 text-white text-xs font-black px-2 py-1 rounded shadow-md">
              -{discount}%
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Category */}
        <p className="text-xs text-gray-500 mb-1">{product.category}</p>

        {/* Name */}
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight mb-2 min-h-[2.5rem]">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-2">
          <div className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={11}
                className={
                  i < Math.round(product.rating)
                    ? "fill-amber-400 text-amber-400"
                    : "fill-gray-200 text-gray-200"
                }
              />
            ))}
          </div>
          <span className="text-xs text-gray-500">({product.reviews})</span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-emerald-600 font-bold text-lg">
            {product.price} грн
          </span>
          {product.oldPrice && (
            <span className="text-gray-400 text-sm line-through">
              {product.oldPrice} грн
            </span>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onAddToCart(product)}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <ShoppingCart size={14} />
            Купити
          </button>
          {onQuickBuy && (
            <button
              onClick={() => onQuickBuy(product)}
              className="w-10 h-10 bg-[#D4AF37] hover:bg-[#C19B2E] text-white rounded-lg transition-colors flex items-center justify-center"
              title="Швидке замовлення"
            >
              <Zap size={16} className="fill-white" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
