"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Star, Truck } from "lucide-react";
import { motion } from "framer-motion";
import type { CatalogProduct } from "@/lib/instagram-catalog";
import { useWishlist } from "@/components/wishlist-context";
import { useCart, type CartItem } from "@/components/cart-context";
import { OptimizedImage } from "@/components/optimized-image";
import { useProductTracking } from "@/hooks/use-product-tracking";

// Advanced StarRating component from shared
// import { StarRating } from "@/components/star-rating";
// function StarRating({ rating, count, size = 11 }: { rating: number; count: number; size?: number }) {
//   const fullStars = Math.floor(rating);
//   const hasHalfStar = rating % 1 >= 0.3 && rating % 1 < 0.8;
//   
//   return (
//     <div className="flex items-center gap-0.5">
//       {Array.from({ length: 5 }).map((_, i) => {
//         const isFull = i < fullStars;
//         const isHalf = i === fullStars && hasHalfStar;
//         
//         return (
//           <div key={i} className="relative" style={{ width: size, height: size }}>
//             <Star
//               size={size}
//               className={
//                 isFull
//                   ? "fill-[#FF8C00] text-[#FF8C00]"
//                   : "fill-gray-200 text-gray-200"
//               }
//             />
//             {isHalf && (
//               <div className="absolute inset-0 overflow-hidden" style={{ width: `${size / 2}px` }}>
//                 <Star
//                   size={size}
//                   className="fill-[#FF8C00] text-[#FF8C00]"
//                 />
//               </div>
//             )}
//           </div>
//         );
//       })}
//       <span className="text-xs text-gray-400 ml-0.5">({count}+)</span>
//     </div>
//   );
// }

interface ModernProductCardProps {
  product: CatalogProduct;
  onAddToCart: (product: CatalogProduct) => void;
  searchQuery?: string;
  priority?: boolean;
  compact?: boolean;
}

export function ModernProductCard({ 
  product, 
  onAddToCart,
  priority,
  compact = false,
}: ModernProductCardProps) {
  const { has, toggle, hydrated } = useWishlist();
  const { addItem, items } = useCart();
  const router = useRouter();
  const { trackClick } = useProductTracking();
  const inWishlist = hydrated && has(product.id);
  const [heartPulse, setHeartPulse] = useState(false);

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(product.id);
    setHeartPulse(true);
    setTimeout(() => setHeartPulse(false), 600);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToCart(product);
  };

  const handleQuickBuy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Добавляем товар только если его еще нет в корзине
    const existingItem = items.find((item: CartItem) => (item.productId ?? item.id) === product.id);
    if (!existingItem) {
      addItem({
        id: product.id,
        productId: product.id,
        variationId: product.variationId,
        name: product.name,
        price: product.price,
        image: product.image,
        size: product.sizes[0] ?? null,
        oldPrice: product.oldPrice ?? null,
      }, false); // Отключаем Toast для кнопки "Купити"
    }
    
    router.push("/checkout");
  };

  const discount = product.oldPrice 
    ? Math.round((1 - product.price / product.oldPrice) * 100) 
    : 0;

  const reviewCountRaw = product.reviews as number | string | undefined;
  const reviewCount = Number.isFinite(reviewCountRaw)
    ? (reviewCountRaw as number)
    : Number.parseInt(String(reviewCountRaw ?? ""), 10) || 0;

  const handleCardClick = () => {
    console.log('[ProductCard] Tracking click:', product.id, product.name);
    trackClick({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
    });
  };

  // Compact mode for carousel
  if (compact) {
    return (
      <Link
        href={`/product/${product.id}`}
        onClick={handleCardClick}
        className="group bg-white rounded-md overflow-hidden border border-gray-100 hover:shadow-md transition-shadow duration-200 cursor-pointer flex flex-col h-full"
      >
        {/* Compact Image */}
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
          
          {/* Новинка badge for compact mode */}

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

        {/* Compact Info */}
        <div className="p-1.5 flex flex-col flex-1">
          <div className="flex flex-col flex-1">
            {/* Title - single line */}
            <h3 className="text-[13px] font-semibold text-gray-900 line-clamp-2 leading-tight mb-1 flex-1">
              {product.name}
            </h3>

            {/* Rating - compact */}
            <div className="flex items-center gap-0.5 mb-1">
              <Star size={11} className="fill-[#FF8C00] text-[#FF8C00]" />
              <span className="text-[11px] font-bold text-gray-900">{product.rating.toFixed(1)}</span>
              <span className="text-[10px] text-gray-400">({reviewCount}+)</span>
            </div>

            {/* Badges - ХІТ and Free Shipping */}
            {(product.isHit || product.freeShipping) && (
              <div className="flex flex-wrap gap-1 mb-1.5 mt-auto">
                {product.isHit && (
                  <span className="bg-[#FF8C00] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                    ★ ХІТ
                  </span>
                )}
                {product.freeShipping && (
                  <span className="bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                    Безкоштовна доставка
                  </span>
                )}
              </div>
            )}

            {/* Price - bold and prominent */}
            <div className="mb-1">
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

            {/* Single compact button */}
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="w-full bg-[#FF8C00] hover:bg-[#FF7A00] disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-1.5 px-2 rounded-md transition-colors text-[11px] mt-auto"
            >
              Купити зараз
            </button>
          </div>
        </div>
      </Link>
    );
  }

  // Regular mode
  return (
    <Link
      href={`/product/${product.id}`}
      onClick={handleCardClick}
      className="group bg-white rounded-md overflow-hidden border border-gray-100 hover:shadow-md transition-shadow duration-200 cursor-pointer flex flex-col h-full"
    >
      {/* Зображення товару */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        <OptimizedImage
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          priority={priority}
        />
        
        {/* ТІЛЬКИ знижка зверху зліва як на Temu */}
        {discount > 0 && (
          <div className="absolute top-1.5 left-1.5 bg-[#E31C25] text-white text-xs font-black px-2 py-0.5 rounded shadow-sm z-10">
            -{discount}%
          </div>
        )}
        
        {/* Бейджик Новинка на фото */}
        {product.isNew && (
          <div className="absolute top-1.5 left-1.5 bg-yellow-500 text-white text-xs font-black px-2 py-0.5 rounded shadow-sm z-10" style={{ marginTop: discount > 0 ? '2.2rem' : '0' }}>
            Новинка
          </div>
        )}

        {/* Wishlist button зверху праворуч */}
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
      <div className="p-1.5 flex flex-col flex-1">
        <div className="flex flex-col flex-1">
          {/* Назва товару */}
          <h3 className="text-[13px] font-semibold text-gray-900 line-clamp-2 leading-tight mb-1 flex-1">
            {product.name}
          </h3>

          {/* Рейтинг */}
          <div className="flex items-center gap-0.5 mb-1">
            <Star size={11} className="fill-[#FF8C00] text-[#FF8C00]" />
            <span className="text-[11px] font-bold text-gray-900">{product.rating.toFixed(1)}</span>
            <span className="text-[10px] text-gray-400">({reviewCount} відгуків)</span>
          </div>

          {/* Теги ХІТ та Безкоштовна доставка ПІД фото */}
          {(product.isHit || product.freeShipping) && (
            <div className="flex flex-wrap gap-1 mb-1.5 mt-auto">
              {product.isHit && (
                <span className="bg-[#FF8C00] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                  ★ ХІТ
                </span>
              )}
              {product.freeShipping && (
                <span className="bg-[#2E7D32] text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                  <Truck size={10} />
                  Безкоштовна доставка
                </span>
              )}
            </div>
          )}

          {/* Ціна */}
          <div className="mb-2">
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

          {/* Компактні кнопки як на Temu */}
          <div className="mt-auto grid grid-cols-2 gap-1">
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="bg-white border-2 border-[#FF8C00] text-[#FF8C00] hover:bg-[#FF8C00] hover:text-white disabled:bg-gray-100 disabled:border-gray-300 disabled:text-gray-400 font-bold py-1.5 px-2 rounded-md transition-colors text-xs uppercase"
            >
              В кошик
            </button>
            <button
              onClick={handleQuickBuy}
              disabled={product.stock === 0}
              className="bg-[#FF8C00] hover:bg-[#FF7A00] disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-1.5 px-2 rounded-md transition-colors text-xs uppercase"
            >
              Купити
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
