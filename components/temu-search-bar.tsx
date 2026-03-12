// @ts-nocheck
"use client";

import { Search, Phone, Flower } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

export function TemuSearchBar() {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/?search=${encodeURIComponent(searchQuery)}#catalog`;
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 border-b border-emerald-900/10 bg-emerald-900/95 text-white backdrop-blur">
      <div className="max-w-6xl mx-auto px-3 py-3 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2 flex-shrink-0" aria-label="Повернутися на головну">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#D4AF37]/50 bg-emerald-700 text-white text-sm font-semibold">
            ЗС
          </span>
          <div className="hidden sm:block leading-tight">
            <div className="font-heading text-base text-white">Здоровʼя Сходу</div>
            <div className="text-[11px] text-white/70">
              Ритуали турботи щодня
            </div>
          </div>
        </Link>

        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Пошук: чаї, пластирі, масла..."
              aria-label="Пошук товарів"
              className="w-full h-11 pl-11 pr-4 rounded-full bg-white text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          </div>
        </form>

        <Link
          href="/#catalog"
          className="hidden lg:inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#C19B2E]"
        >
          <Flower className="w-4 h-4" />
          Підібрати засіб
        </Link>

        {siteConfig.phone && (
          <a
            href={`tel:${siteConfig.phone}`}
            className="hidden md:flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white/90 hover:bg-white/20 transition"
            aria-label="Подзвонити у «Здоровʼя Сходу»"
          >
            <Phone className="w-4 h-4" />
            <span className="hidden lg:inline">{siteConfig.phone}</span>
          </a>
        )}
      </div>
    </div>
  );
}

