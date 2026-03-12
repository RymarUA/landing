// @ts-nocheck
"use client";

import { Search, Heart, Flower, MessageCircle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/lib/site-config";
import { useWishlist } from "@/components/wishlist-context";
import type { CatalogProduct } from "@/lib/instagram-catalog";
import { TelegramIcon } from "@/components/icons/telegram-icon";
import { ViberIcon } from "@/components/icons/viber-icon";

interface TemuSearchBarProps {
  products?: CatalogProduct[];
}

export function TemuSearchBar({ products = [] }: TemuSearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<CatalogProduct[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const supportRef = useRef<HTMLDivElement>(null);
  const { count } = useWishlist();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
      if (supportRef.current && !supportRef.current.contains(event.target as Node)) {
        setShowSupport(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const query = searchQuery.toLowerCase();
      const filtered = products
        .filter((p) => 
          p.name.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query)
        )
        .slice(0, 5);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery, products]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/?search=${encodeURIComponent(searchQuery)}#catalog`;
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (productName: string) => {
    setSearchQuery(productName);
    setShowSuggestions(false);
    window.location.href = `/?search=${encodeURIComponent(productName)}#catalog`;
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[70] border-b border-emerald-900/10 bg-emerald-900/95 text-white backdrop-blur">
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

        <form onSubmit={handleSearch} className="flex-1" ref={searchRef}>
          <div className="relative">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.trim().length >= 2 && suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Пошук: чаї, пластирі, масла..."
              aria-label="Пошук товарів"
              className="w-full h-11 pl-11 pr-4 rounded-full bg-white text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            
            {/* Autocomplete Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 max-h-[400px] overflow-y-auto">
                {suggestions.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleSuggestionClick(product.name)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-emerald-50 transition-colors text-left border-b border-gray-50 last:border-b-0"
                  >
                    <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-500">{product.category}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-emerald-600">
                        {product.price} грн
                      </p>
                      {product.oldPrice && (
                        <p className="text-xs text-gray-400 line-through">
                          {product.oldPrice} грн
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </form>

        <Link
          href="/#catalog"
          className="hidden lg:inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#C19B2E]"
        >
          <Flower className="w-4 h-4" />
          Підібрати засіб
        </Link>

        {/* Support Button with Dropdown */}
        <div className="relative" ref={supportRef}>
          <button
            onClick={() => setShowSupport(!showSupport)}
            className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white/90 hover:bg-white/20 transition"
            aria-label="Зв'язатися з нами"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="hidden md:inline">Підтримка</span>
          </button>

          {showSupport && (
            <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 min-w-[180px]">
              {siteConfig.telegramUsername && (
                <a
                  href={`https://t.me/${siteConfig.telegramUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 transition-colors text-gray-900"
                  onClick={() => setShowSupport(false)}
                >
                  <TelegramIcon size={20} className="text-[#29a9eb]" />
                  <span className="text-sm font-semibold">Telegram</span>
                </a>
              )}
              {siteConfig.viberPhone && (
                <a
                  href={`viber://chat?number=${encodeURIComponent(siteConfig.viberPhone)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 transition-colors text-gray-900 border-t border-gray-100"
                  onClick={() => setShowSupport(false)}
                >
                  <ViberIcon size={20} className="text-[#7360f2]" />
                  <span className="text-sm font-semibold">Viber</span>
                </a>
              )}
              {siteConfig.phone && (
                <a
                  href={`tel:${siteConfig.phone}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 transition-colors text-gray-900 border-t border-gray-100"
                  onClick={() => setShowSupport(false)}
                >
                  <MessageCircle size={20} className="text-emerald-600" />
                  <span className="text-sm font-semibold">{siteConfig.phone}</span>
                </a>
              )}
            </div>
          )}
        </div>

        <Link
          href="/wishlist"
          className="relative flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white/90 hover:bg-white/20 transition"
          aria-label="Переглянути список бажань"
        >
          <Heart className="w-4 h-4" />
          <span className="hidden md:inline">Бажання</span>
          {count > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {count}
            </span>
          )}
        </Link>
      </div>
    </div>
  );
}

