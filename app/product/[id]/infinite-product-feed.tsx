// @ts-nocheck
"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, Flame, Sparkles } from "lucide-react";
import type { CatalogProduct } from "@/lib/types";

const PAGE_SIZE = 8;

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

  const relatedSet = useMemo(() => new Set(relatedIds), [relatedIds]);

  const feedProducts = allProducts.filter(
    (p) =>
      p.category === category &&
      p.id !== currentProductId &&
      !relatedSet.has(p.id)
  );

  const visible = feedProducts.slice(0, visibleCount);
  const hasMore = visibleCount < feedProducts.length;

  const rafIdRef = useRef<number | null>(null);

  const loadMore = useCallback(() => {
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;
    setVisibleCount((c) => c + PAGE_SIZE);
    rafIdRef.current = requestAnimationFrame(() => {
      loadingRef.current = false;
    });
  }, [hasMore]);

  useEffect(() => {
    if (!hasMore || !sentinelRef.current) return;
    const el = sentinelRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "200px", threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  useEffect(() => () => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    loadingRef.current = false;
  }, []);

  if (feedProducts.length === 0) return null;

  return (
    <div className="mt-14">
      <h2 className="text-2xl font-black text-stone-900 mb-6">
        Більше з категорії «{category}»
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
                  <span className="absolute bottom-2 left-2 bg-rose-100 text-rose-600 text-xs font-black px-2 py-0.5 rounded-full">
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
      <div ref={sentinelRef} className="h-4 mt-4" aria-hidden />
    </div>
  );
}
