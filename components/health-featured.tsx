// @ts-nocheck
"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { useCart } from "@/components/cart-context";
import { siteConfig } from "@/lib/site-config";
import type { CatalogProduct } from "@/lib/instagram-catalog";
import { blurProps } from "@/lib/utils";

const INITIAL_VISIBLE = 8;
const LOAD_STEP = 8;
const FALLBACK_CATEGORIES = ["Всі"] as const;

function ProductCard({
  product,
  onAdd,
  added,
}: {
  product: CatalogProduct;
  onAdd: (p: CatalogProduct) => void;
  added: boolean;
}) {
  const discount = product.oldPrice
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : null;

  return (
    <div className="group rounded-2xl border border-[#E7EFEA] bg-white shadow-[0_10px_30px_rgba(15,45,42,0.08)] transition hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(15,45,42,0.12)]">
      <div className="relative p-4">
        {product.badge && (
          <span className="absolute left-4 top-4 rounded-full bg-[#C9B27C] px-3 py-1 text-[11px] font-semibold text-[#0F2D2A]">
            {product.badge}
          </span>
        )}
        {discount && (
          <span className="absolute right-4 top-4 rounded-full bg-[#1F6B5E] px-3 py-1 text-[11px] font-semibold text-white">
            -{discount}%
          </span>
        )}
        <div className="relative h-44 overflow-hidden rounded-xl bg-[#F1F5F3]">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              {...blurProps()}
            />
          ) : (
            <div className="h-full w-full bg-[linear-gradient(135deg,_#E7EFEA,_#F6F4EF)]" />
          )}
        </div>
      </div>
      <div className="px-4 pb-5">
        <p className="text-[11px] uppercase tracking-[0.18em] text-[#8B6B3E]">
          {product.category}
        </p>
        <Link
          href={`/product/${product.id}`}
          className="mt-2 block text-sm font-semibold text-[#24312E] line-clamp-2"
        >
          {product.name}
        </Link>

        <div className="mt-2 flex items-center gap-1 text-xs text-[#7A8A84]">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={12}
              className={
                i < Math.round(product.rating)
                  ? "fill-[#C9B27C] text-[#C9B27C]"
                  : "fill-[#E7EFEA] text-[#E7EFEA]"
              }
            />
          ))}
          <span className="ml-1">({product.reviews})</span>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-lg font-bold text-[#0F2D2A]">
            {product.price.toLocaleString("uk-UA")} ₴
          </span>
          {product.oldPrice && (
            <span className="text-xs text-[#7A8A84] line-through">
              {product.oldPrice.toLocaleString("uk-UA")} ₴
            </span>
          )}
        </div>

        <button
          onClick={() => onAdd(product)}
          className={`mt-4 w-full rounded-xl px-4 py-2 text-sm font-semibold transition ${
            added
              ? "bg-[#C9B27C] text-[#0F2D2A]"
              : "bg-[#1F6B5E] text-white hover:bg-[#0F2D2A]"
          }`}
          aria-label={`${added ? "Товар додано до кошика" : "Додати до кошика"}: ${product.name}`}
        >
          {added ? "Додано ✓" : "До кошика"}
        </button>
      </div>
    </div>
  );
}

export function HealthFeatured({ products }: { products: CatalogProduct[] }) {
  const { addItem } = useCart();
  const searchParams = useSearchParams();
  const categories = (siteConfig.catalogCategories?.length
    ? siteConfig.catalogCategories
    : FALLBACK_CATEGORIES) as readonly string[];
  const initialCategory = searchParams.get("category") ?? categories[0];
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());
  const timerRefs = useRef<NodeJS.Timeout[]>([]);

  const searchQuery = (searchParams.get("search") ?? "").trim();

  useEffect(() => {
    const paramCategory = searchParams.get("category");
    if (paramCategory) {
      setActiveCategory(paramCategory);
    } else {
      setActiveCategory(categories[0]);
    }
  }, [categories, searchParams]);

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE);
  }, [activeCategory, searchQuery]);

  useEffect(() => () => {
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];
  }, []);

  const filtered = useMemo(() => {
    let list = products;
    if (activeCategory && activeCategory !== categories[0]) {
      list = list.filter((p) => p.category === activeCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((p) =>
        `${p.name} ${p.description} ${p.category}`.toLowerCase().includes(q),
      );
    }
    return [...list].sort((a, b) => {
      if (a.isHit === b.isHit) return b.rating - a.rating;
      return a.isHit ? -1 : 1;
    });
  }, [products, activeCategory, searchQuery, categories]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const handleAdd = (product: CatalogProduct) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      size: product.sizes[0] ?? null,
      oldPrice: product.oldPrice ?? null,
    });
    setAddedIds((prev) => new Set(prev).add(product.id));
    const timeoutId = setTimeout(() => {
      setAddedIds((prev) => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }, 1400);
    timerRefs.current.push(timeoutId);
  };

  return (
    <section className="bg-white py-14" id="featured">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8B6B3E]">Рекомендоване</p>
            <h2 className="mt-2 font-heading text-2xl md:text-3xl text-[#0F2D2A]">
              Топ товари для здорового життя
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                  activeCategory === cat
                    ? "bg-[#1F6B5E] text-white"
                    : "bg-[#F6F4EF] text-[#7A8A84] hover:text-[#1F6B5E]"
                }`}
                aria-pressed={activeCategory === cat}
                aria-label={`Фільтрувати за категорією: ${cat}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {searchQuery && (
          <p className="mt-4 text-sm text-[#7A8A84]">
            Показуємо результати за запитом: <span className="font-semibold text-[#24312E]">{searchQuery}</span>
          </p>
        )}

        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {visible.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAdd={handleAdd}
              added={addedIds.has(product.id)}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="mt-10 rounded-2xl border border-[#E7EFEA] bg-[#F6F4EF] p-8 text-center text-sm text-[#7A8A84]">
            Нічого не знайшли. Змініть категорію або пошуковий запит.
          </div>
        )}

        {hasMore && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => setVisibleCount((c) => c + LOAD_STEP)}
              className="rounded-full border border-[#1F6B5E] px-6 py-3 text-sm font-semibold text-[#1F6B5E] hover:bg-[#1F6B5E] hover:text-white transition"
            >
              Показати ще
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

