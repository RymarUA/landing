// @ts-nocheck
"use client";

import { useState, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, Flame, Sparkles } from "lucide-react";
import type { CatalogProduct } from "@/lib/types";

const PAGE_SIZE = 8;
const MAX_PRODUCTS = 32;

interface InfiniteProductFeedProps {
  category: string;
  currentProductId: number;
  relatedIds: number[];
  allProducts: CatalogProduct[];
}

function StarRow({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const isFull = i < Math.floor(rating);
        const isHalf = i === Math.floor(rating) && rating % 1 >= 0.3 && rating % 1 < 0.8;
        return (
          <div key={i} className="relative" style={{ width: 11, height: 11 }}>
            <Star
              size={11}
              className={isFull ? "fill-amber-400 text-amber-400" : "fill-stone-200 text-stone-200"}
            />
            {isHalf && (
              <div className="absolute inset-0 overflow-hidden" style={{ width: '5.5px' }}>
                <Star size={11} className="fill-amber-400 text-amber-400" />
              </div>
            )}
          </div>
        );
      })}
      <span className="text-xs text-stone-500 ml-0.5">({count})</span>
    </div>
  );
}

export function InfiniteProductFeed({
  category,
  currentProductId,
  relatedIds,
  allProducts,
}: InfiniteProductFeedProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const feedProducts = (() => {
    // Сначала пробуем товары из той же категории
    const sameCategoryProducts = allProducts.filter(
      (p) => {
        const isSameCategory = p.category?.trim().toLowerCase() === category?.trim().toLowerCase();
        const isNotCurrent = p.id !== currentProductId;
        const inStock = p.stock > 0;
        return isSameCategory && isNotCurrent && inStock;
      }
    ).slice(0, MAX_PRODUCTS);

    // Если в той же категории мало товаров (меньше 4), показываем товары из всех категорий
    if (sameCategoryProducts.length < 4) {
      const allCategoryProducts = allProducts.filter(
        (p) => {
          const isNotCurrent = p.id !== currentProductId;
          const inStock = p.stock > 0;
          return isNotCurrent && inStock;
        }
      ).slice(0, MAX_PRODUCTS);
      
      return allCategoryProducts;
    }

    return sameCategoryProducts;
  })();

  const visible = feedProducts.slice(0, visibleCount);
  const hasMore = visibleCount < feedProducts.length;

  // Убираем бесконечную прокрутку - используем только кнопку

  const loadMore = useCallback(() => {
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;
    setVisibleCount((c) => c + PAGE_SIZE);
    setTimeout(() => {
      loadingRef.current = false;
    }, 300);
  }, [hasMore]);

  if (feedProducts.length === 0) return null;

  return (
    <div className="mt-14">
      <h2 className="text-2xl font-black text-stone-900 mb-6">
        Рекомендовані товари
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {visible.map((product) => {
          const discount = product.oldPrice
            ? Math.round((1 - product.price / product.oldPrice) * 100)
            : null;
          return (
            <Link
              key={product.id}
              href={`/product/${product.id}`}
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group"
            >
              <div className="relative h-44 overflow-hidden bg-stone-100">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {(product.isHit || product.isNew) && (
                  <span className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                    {product.isNew && <Sparkles size={9} />}
                    {product.isHit && !product.isNew && <Flame size={9} />}
                    {product.isNew ? "Новинка" : "Хіт"}
                  </span>
                )}
                {discount && (
                  <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-full">
                    −{discount}%
                  </span>
                )}
              </div>
              <div className="p-3">
                <p className="text-xs text-stone-500 mb-0.5">{product.category}</p>
                <p className="text-sm font-bold text-stone-900 leading-tight mb-1.5 line-clamp-2">
                  {product.name}
                </p>
                <StarRow rating={product.rating} count={product.reviews} />
                <div className="flex items-baseline gap-2 mt-2">
                  {product.oldPrice && (
                    <span className="text-stone-400 text-sm line-through">
                      {product.oldPrice.toLocaleString("uk-UA")} грн
                    </span>
                  )}
                  <span className="font-black text-stone-900 text-base">
                    {product.price.toLocaleString("uk-UA")} грн
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      
      {/* Кнопка "Показати ще" */}
      {hasMore && (
        <div className="flex justify-center mt-8">
          <button
            onClick={loadMore}
            disabled={loadingRef.current}
            className="px-8 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-semibold rounded-xl transition-colors duration-200 shadow-sm hover:shadow-lg"
          >
            {loadingRef.current ? 'Завантаження...' : 'Показати ще'}
          </button>
        </div>
      )}
    </div>
  );
}
