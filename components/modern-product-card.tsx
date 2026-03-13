// @ts-nocheck
"use client";

import React from "react";
import Image from "next/image";
import { Heart, Star, ShoppingCart } from "lucide-react";
import type { CatalogProduct } from "@/lib/instagram-catalog";
import { useWishlist } from "@/components/wishlist-context";

interface ModernProductCardProps {
  product: CatalogProduct;
  onAddToCart: (product: CatalogProduct) => void;
  onClick: (product: CatalogProduct) => void;
  onQuickBuy: (product: CatalogProduct) => void;
  searchQuery?: string;
}

export function ModernProductCard({ 
  product, 
  onAddToCart,
  onQuickBuy,
  onClick,
}: ModernProductCardProps) {
  const { has, toggle, hydrated } = useWishlist();
  const inWishlist = hydrated && has(product.id);

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggle(product.id);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product);
  };

  const handleQuickBuy = (e: React.MouseEvent) => {
    e.stopPropagation();
    onQuickBuy(product);
  };

  const discount = product.oldPrice 
    ? Math.round((1 - product.price / product.oldPrice) * 100) 
    : 0;

  const deterministicValue = (seed: number, min: number, max: number, salt = 0) => {
    const range = max - min + 1;
    return min + Math.abs((seed + salt) % range);
  };

  const reviewCount = product.reviewCount ?? deterministicValue(product.id ?? 0, 100, 499, 7);

  return (
    <div
      onClick={() => onClick(product)}
      className="group bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer flex flex-col h-full"
    >
      {/* Зображення товару */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-cover"
        />
        
        {/* ТІЛЬКИ знижка зверху зліва як на Temu */}
        {discount > 0 && (
          <div className="absolute top-2 left-2 bg-[#FF4444] text-white text-[11px] font-black px-1.5 py-0.5 rounded z-10">
            -{discount}%
          </div>
        )}

        {/* Wishlist button зверху праворуч */}
        <button
          onClick={handleWishlistToggle}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors z-10"
          aria-label={inWishlist ? "Видалити з бажань" : "Додати в бажання"}
        >
          <Heart
            size={14}
            className={inWishlist ? "fill-red-500 text-red-500" : "text-gray-600"}
          />
        </button>

        {/* Out of stock overlay */}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
            <span className="bg-white text-gray-900 font-bold px-3 py-1.5 rounded-full text-xs">
              Немає в наявності
            </span>
          </div>
        )}
      </div>

      {/* Інформація про товар */}
      <div className="p-2 flex flex-col flex-1">
        {/* Назва товару */}
        <h3 className="text-xs font-medium text-gray-900 line-clamp-2 mb-1 leading-tight">
          {product.name}
        </h3>

        {/* Рейтинг та відгуки */}
        <div className="flex items-center gap-1 mb-2">
          <Star size={10} className="fill-[#FF8C00] text-[#FF8C00]" />
          <span className="text-[10px] font-bold text-gray-900">{product.rating.toFixed(1)}</span>
          <span className="text-[10px] text-gray-400">({reviewCount}+ відгуків)</span>
        </div>

        {/* Теги ХІТ та Безкоштовна доставка ПІД фото */}
        {(product.isHit || product.freeShipping) && (
          <div className="flex flex-wrap gap-1 mb-2">
            {product.isHit && (
              <span className="bg-[#FF8C00] text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                ★ ХІТ
              </span>
            )}
            {product.freeShipping && (
              <span className="bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                Безкоштовна доставка
              </span>
            )}
          </div>
        )}

        {/* Ціна */}
        <div className="mb-2">
          <div className="flex items-baseline gap-1">
            <span className="text-base font-black text-[#FF4444]">
              {product.price} грн
            </span>
            {product.oldPrice && (
              <span className="text-[10px] text-gray-400 line-through">
                {product.oldPrice} грн
              </span>
            )}
          </div>
        </div>

        {/* ДВІ КНОПКИ */}
        <div className="mt-auto space-y-1.5">
          {/* Кнопка 1: Додати в кошик */}
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="w-full bg-white border-2 border-[#FF8C00] text-[#FF8C00] hover:bg-[#FF8C00] hover:text-white disabled:bg-gray-100 disabled:border-gray-300 disabled:text-gray-400 font-bold py-2 px-3 rounded-lg transition-colors text-xs flex items-center justify-center gap-1.5"
          >
            <ShoppingCart size={14} />
            Додати в кошик
          </button>

          {/* Кнопка 2: Купити зараз (перехід до оформлення) */}
          <button
            onClick={handleQuickBuy}
            disabled={product.stock === 0}
            className="w-full bg-[#FF8C00] hover:bg-[#FF7A00] disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-2 px-3 rounded-lg transition-colors text-xs"
          >
            Купити зараз
          </button>
        </div>
      </div>
    </div>
  );
}
