"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";
import type { CatalogProduct } from "@/lib/instagram-catalog";

interface Props {
  products: CatalogProduct[];
  currentId: number;
}

export function RecentlyViewedBlock({ products, currentId }: Props) {
  const { ids, add } = useRecentlyViewed();

  useEffect(() => {
    add(currentId);
  }, [currentId, add]);

  const viewed = ids
    .filter((id) => id !== currentId)
    .slice(0, 6)
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean) as CatalogProduct[];

  if (viewed.length === 0) return null;

  return (
    <div className="mt-14">
      <h2 className="text-2xl font-black text-gray-900 mb-6">Нещодавно переглянуті</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {viewed.map((p) => (
          <Link
            key={p.id}
            href={`/product/${p.id}`}
            className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group"
          >
            <div className="relative h-36 overflow-hidden">
              <Image
                src={p.image}
                alt={p.name}
                fill
                sizes="(max-width: 768px) 50vw, 16vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-3">
              <p className="text-xs text-gray-400 mb-0.5 line-clamp-1">{p.category}</p>
              <p className="text-sm font-bold text-gray-900 leading-tight line-clamp-2 mb-1.5">{p.name}</p>
              <div className="flex items-center gap-0.5 mb-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={10}
                    className={i < Math.round(p.rating) ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}
                  />
                ))}
                <span className="text-xs text-gray-400 ml-0.5">({p.reviews})</span>
              </div>
              <p className="text-orange-500 font-semibold text-sm">{p.price.toLocaleString("uk-UA")} грн</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
