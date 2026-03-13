"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Heart, Star, ShoppingCart, Truck } from "lucide-react";
import type { CatalogProduct } from "@/lib/instagram-catalog";
import { useWishlist } from "@/components/wishlist-context";
import { useCart } from "@/components/cart-context";

interface ModernProductCardProps {
  product: CatalogProduct;
  onAddToCart: (product: CatalogProduct) => void;
  onClick?: (product: CatalogProduct) => void;
  searchQuery?: string;
  priority?: boolean;
  compact?: boolean;
}

export function ModernProductCard({ 
  product, 
  onAddToCart,
  onClick,
  priority,
  compact = false,
}: ModernProductCardProps) {
  const { has, toggle, hydrated } = useWishlist();
  const { addItem } = useCart();
  const router = useRouter();
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
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      size: product.sizes[0] ?? null,
      oldPrice: product.oldPrice ?? null,
    });
    router.push("/checkout");
  };

  const discount = product.oldPrice 
    ? Math.round((1 - product.price / product.oldPrice) * 100) 
    : 0;

  const reviewCountRaw = product.reviews as number | string | undefined;
  const reviewCount = Number.isFinite(reviewCountRaw)
    ? (reviewCountRaw as number)
    : Number.parseInt(String(reviewCountRaw ?? ""), 10) || 0;

  // Compact mode for carousel
  if (compact) {
    return (
      <div
        onClick={() => onClick?.(product)}
        className="group bg-white rounded-md sm:rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer flex flex-col h-full"
      >
        {/* Compact Image */}
        <div className="relative aspect-square bg-gray-50 overflow-hidden">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 16vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            priority={priority}
          />
          
          {/* Discount badge */}
          {discount > 0 && (
            <div className="absolute top-1 left-1 bg-[#FF4444] text-white text-[9px] sm:text-[10px] font-black px-1 py-0.5 rounded z-10">
              -{discount}%
            </div>
          )}

          {/* Wishlist button */}
          <button
            onClick={handleWishlistToggle}
            className="absolute top-1 right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors z-10"
            aria-label={inWishlist ? "Видалити з бажань" : "Додати в бажання"}
          >
            <Heart
              size={11}
              className={inWishlist ? "fill-red-500 text-red-500" : "text-gray-600"}
            />
          </button>

          {/* Out of stock */}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
              <span className="bg-white text-gray-900 font-bold px-1.5 py-0.5 rounded text-[8px] sm:text-[9px]">
                Немає в наявності
              </span>
            </div>
          )}
        </div>

        {/* Compact Info */}
        <div className="p-1.5 sm:p-2 flex flex-col flex-1">
          {/* Title - single line */}
          <h3 className="text-[10px] sm:text-xs font-medium text-gray-900 line-clamp-1 mb-1 leading-tight">
            {product.name}
          </h3>

          {/* Price - bold and prominent */}
          <div className="mb-1">
            <div className="flex items-baseline gap-1">
              <span className="text-xs sm:text-sm font-bold text-[#FF4444]">
                {product.price} грн
              </span>
              {product.oldPrice && (
                <span className="text-[8px] sm:text-[9px] text-gray-400 line-through">
                  {product.oldPrice}
                </span>
              )}
            </div>
          </div>

          {/* Rating - minimal */}
          <div className="flex items-center gap-0.5 mb-1">
            <Star size={9} className="fill-[#FF8C00] text-[#FF8C00] flex-shrink-0" />
            <span className="text-[9px] sm:text-[10px] font-bold text-gray-900">{product.rating.toFixed(1)}</span>
            <span className="text-[8px] sm:text-[9px] text-gray-400">({reviewCount})</span>
          </div>

          {/* Badges - ХІТ and Free Shipping */}
          {(product.isHit || product.freeShipping) && (
            <div className="flex flex-wrap gap-0.5 sm:gap-1 mb-1">
              {product.isHit && (
                <span className="bg-[#FF8C00] text-white text-[7px] sm:text-[8px] font-bold px-1 py-0.5 rounded">
                  ★ ХІТ
                </span>
              )}
              {product.freeShipping && (
                <span className="bg-emerald-600 text-white text-[7px] sm:text-[8px] font-bold px-1 py-0.5 rounded inline-flex items-center gap-0.5">
                  <Truck size={8} className="shrink-0" aria-hidden />
                  <span className="sm:hidden">Безкошт.</span>
                  <span className="hidden sm:inline">Безкоштовна доставка</span>
                </span>
              )}
            </div>
          )}

          {/* Single compact button */}
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="w-full bg-[#FF8C00] hover:bg-[#FF7A00] disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-1 sm:py-1.5 px-1 rounded transition-colors text-[9px] sm:text-[10px] mt-auto flex items-center justify-center gap-0.5 sm:gap-1"
          >
            <ShoppingCart size={10} className="sm:w-3 sm:h-3" />
            Додати в кошик
          </button>
        </div>
      </div>
    );
  }

  // Regular mode
  return (
    <div
      onClick={() => onClick?.(product)}
      className="group bg-white rounded-lg sm:rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer flex flex-col h-full"
    >
      {/* Зображення товару */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          priority={priority}
        />
        
        {/* ТІЛЬКИ знижка зверху зліва як на Temu */}
        {discount > 0 && (
          <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 bg-[#FF4444] text-white text-[10px] sm:text-[11px] font-black px-1.5 py-0.5 rounded z-10">
            -{discount}%
          </div>
        )}

        {/* Wishlist button зверху праворуч */}
        <button
          onClick={handleWishlistToggle}
          className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors z-10"
          aria-label={inWishlist ? "Видалити з бажань" : "Додати в бажання"}
        >
          <Heart
            size={13}
            className={inWishlist ? "fill-red-500 text-red-500" : "text-gray-600"}
          />
        </button>

        {/* Out of stock overlay */}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
            <span className="bg-white text-gray-900 font-bold px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-[10px] sm:text-xs">
              Немає в наявності
            </span>
          </div>
        )}
      </div>

      {/* Інформація про товар */}
      <div className="p-2 sm:p-3 flex flex-col flex-1">
        {/* Назва товару */}
        <h3 className="text-xs sm:text-sm font-medium text-gray-900 line-clamp-2 mb-1 sm:mb-1.5 leading-tight">
          {product.name}
        </h3>

        {/* Рейтинг та відгуки */}
        <div className="flex items-center gap-1 mb-1.5 sm:mb-2">
          <Star size={10} className="fill-[#FF8C00] text-[#FF8C00] flex-shrink-0" />
          <span className="text-[10px] sm:text-[11px] font-bold text-gray-900">{product.rating.toFixed(1)}</span>
          <span className="text-[9px] sm:text-[10px] text-gray-400 truncate">({reviewCount})</span>
        </div>

        {/* Теги ХІТ та Безкоштовна доставка ПІД фото */}
        {(product.isHit || product.freeShipping) && (
          <div className="flex flex-wrap gap-1 mb-1.5 sm:mb-2">
            {product.isHit && (
              <span className="bg-[#FF8C00] text-white text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded">
                ★ ХІТ
              </span>
            )}
            {product.freeShipping && (
              <span className="bg-emerald-600 text-white text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded inline-flex items-center gap-0.5 sm:gap-1">
                <Truck size={9} className="shrink-0 hidden sm:inline" aria-hidden />
                <span className="sm:hidden">Безкошт. дост.</span>
                <span className="hidden sm:inline">Безкоштовна доставка</span>
              </span>
            )}
          </div>
        )}

        {/* Ціна */}
        <div className="mb-2 sm:mb-2.5">
          <div className="flex items-baseline gap-1 flex-wrap">
            <span className="text-sm sm:text-base font-black text-[#FF4444]">
              {product.price} грн
            </span>
            {product.oldPrice && (
              <span className="text-[9px] sm:text-[10px] text-gray-400 line-through">
                {product.oldPrice} грн
              </span>
            )}
          </div>
        </div>

        {/* ДВІ КНОПКИ */}
        <div className="mt-auto space-y-1 sm:space-y-1.5">
          {/* Кнопка 1: Додати в кошик */}
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="w-full bg-white border-2 border-[#FF8C00] text-[#FF8C00] hover:bg-[#FF8C00] hover:text-white disabled:bg-gray-100 disabled:border-gray-300 disabled:text-gray-400 font-bold py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg transition-colors text-[10px] sm:text-xs flex items-center justify-center gap-1"
          >
            <ShoppingCart size={12} className="sm:w-[14px] sm:h-[14px]" />
            <span className="hidden sm:inline">Додати в кошик</span>
            <span className="sm:hidden">В кошик</span>
          </button>

          {/* Кнопка 2: Купити зараз (перехід до оформлення) */}
          <button
            onClick={handleQuickBuy}
            disabled={product.stock === 0}
            className="w-full bg-[#FF8C00] hover:bg-[#FF7A00] disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg transition-colors text-[10px] sm:text-xs"
          >
            Купити зараз
          </button>
        </div>
      </div>
    </div>
  );
}
