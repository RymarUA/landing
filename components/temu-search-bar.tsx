"use client";

import { Search, Heart, MessageCircle, X, HelpCircle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/lib/site-config";
import { useWishlist } from "@/components/wishlist-context";
import type { CatalogProduct } from "@/lib/instagram-catalog";

// Highlight component from shared
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-amber-200 text-gray-900 rounded px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}
import { TelegramIcon } from "@/components/icons/telegram-icon";
import { ViberIcon } from "@/components/icons/viber-icon";
import { TikTokIcon } from "@/components/icons/tiktok-icon";
import { CategoryIconsSlider } from "@/components/category-icons-slider";

interface TemuSearchBarProps {
  products?: CatalogProduct[];
  hasAnnouncement?: boolean;
}

export function TemuSearchBar({
  products = [],
  hasAnnouncement = false,
}: TemuSearchBarProps) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<CatalogProduct[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Всі");
  const [suggestionsPosition, setSuggestionsPosition] = useState({ top: 0, left: 0, width: 0 });
  const searchRef = useRef<HTMLFormElement>(null);
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

  // Sync category with URL hash
  useEffect(() => {
    const syncFromHash = () => {
      const hash = window.location.hash;
      const catMatch = hash.match(/category=([^&#]*)/);
      if (catMatch) {
        const cat = decodeURIComponent(catMatch[1].trim());
        setActiveCategory(cat);
      }
    };
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    window.location.hash = `category=${encodeURIComponent(category)}`;
    
    // Scroll to catalog section smoothly
    const catalogSection = document.getElementById('catalog');
    if (catalogSection) {
      catalogSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

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
      
      // Update position for portal
      if (filtered.length > 0 && searchRef.current) {
        const rect = searchRef.current.getBoundingClientRect();
        setSuggestionsPosition({
          top: rect.bottom + window.scrollY + 8,
          left: rect.left + window.scrollX,
          width: rect.width
        });
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery, products]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Store current scroll position
      const scrollY = window.scrollY;
      
      // Use only query parameters, no hash
      const url = new URL(window.location.href);
      url.searchParams.set('q', searchQuery);
      url.hash = ''; // Clear hash completely
      window.history.pushState({}, '', url);
      
      // Restore scroll position immediately
      window.scrollTo(0, scrollY);
      
      // Trigger catalog update with custom event
      window.dispatchEvent(new CustomEvent('searchupdate', { detail: { query: searchQuery } }));
      
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (productName: string) => {
    setSearchQuery(productName);
    setShowSuggestions(false);
    
    // Store current scroll position
    const scrollY = window.scrollY;
    
    // Use only query parameters, no hash
    const url = new URL(window.location.href);
    url.searchParams.set('q', productName);
    url.hash = ''; // Clear hash completely
    window.history.pushState({}, '', url);
    
    // Restore scroll position immediately
    window.scrollTo(0, scrollY);
    
    // Trigger catalog update with custom event
    window.dispatchEvent(new CustomEvent('searchupdate', { detail: { query: productName } }));
  };

  return (
    <div className={`sticky left-0 right-0 z-[100] text-white ${hasAnnouncement ? 'top-10' : 'top-0'}`}>
      <div className="border-b border-emerald-900/10 bg-emerald-900/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-1.5 flex items-center gap-2 sm:gap-3">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0"
            aria-label="Повернутися на головну"
          >
            <span className="inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border-2 border-[#D4AF37]/50 bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md">
              ЗС
            </span>
            <div className="hidden sm:block leading-tight">
              <div className="font-heading text-sm md:text-base text-white font-bold">
                Здоров&apos;я Сходу
              </div>
              <div className="text-[10px] md:text-[11px] text-white/70 font-medium">
                Ритуали турботи щодня
              </div>
            </div>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl" ref={searchRef}>
            <div className="relative">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={(e) => {
                // Prevent scroll on focus
                e.preventDefault();
                const scrollY = window.scrollY;
                
                // Use multiple methods to prevent scroll
                document.body.style.overflow = 'hidden';
                setTimeout(() => {
                  window.scrollTo(0, scrollY);
                  document.body.style.overflow = '';
                }, 100);
                
                // Show suggestions if applicable
                if (searchQuery.trim().length >= 2 && suggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              placeholder="Пошук: чаї, пластирі, масла..."
              aria-placeholder="Пошук товарів&amp;hellip;"
              className="w-full h-9 md:h-10 pl-9 sm:pl-11 pr-3 sm:pr-4 rounded-full bg-white text-xs sm:text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] shadow-sm"
              style={{ scrollMarginTop: '0px' }}
            />
            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
          </div>
        </form>

          
          {/* Support Button with Dropdown */}
          <div className="relative" ref={supportRef}>
            <button
              onClick={() => setShowSupport(!showSupport)}
              className="flex items-center gap-1 sm:gap-2 rounded-full border border-white/20 bg-white/10 px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold text-white/90 hover:bg-white/20 transition shadow-sm"
              aria-label="Зв'язатися з нами"
            >
              <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden md:inline">Підтримка</span>
            </button>

            {showSupport && (
              <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 min-w-[200px]">
                {siteConfig.telegramUsername && (
                  <a
                    href={`https://t.me/${siteConfig.telegramUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 transition-colors text-gray-900"
                    onClick={() => setShowSupport(false)}
                  >
                    <div className="text-gray-700">
                      <TelegramIcon size={20} />
                    </div>
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
                    <div className="text-gray-700">
                      <ViberIcon size={20} />
                    </div>
                    <span className="text-sm font-semibold">Viber</span>
                  </a>
                )}
                {siteConfig.tiktokUsername && (
                  <a
                    href={`https://www.tiktok.com/@${siteConfig.tiktokUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 transition-colors text-gray-900 border-t border-gray-100"
                    onClick={() => setShowSupport(false)}
                  >
                    <div className="text-gray-700">
                      <TikTokIcon size={20} />
                    </div>
                    <span className="text-sm font-semibold">TikTok</span>
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

          {/* FAQ Link */}
          <Link
            href="/faq"
            className="flex items-center gap-1 sm:gap-2 rounded-full border border-white/20 bg-white/10 px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold text-white/90 hover:bg-white/20 transition shadow-sm"
            aria-label="Часті запитання"
          >
            <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden md:inline">FAQ</span>
          </Link>

          {/* Wishlist */}
          <Link
            href="/wishlist"
            className="relative flex items-center gap-1 sm:gap-2 rounded-full border border-white/20 bg-white/10 px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold text-white/90 hover:bg-white/20 transition shadow-sm"
            aria-label="Переглянути список бажань"
          >
            <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden md:inline">Бажання</span>
            {count > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-red-500 text-[9px] sm:text-[10px] font-bold text-white shadow-md">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Categories - only on home page */}
      {pathname === "/" && (
        <CategoryIconsSlider
          onCategoryChange={handleCategoryChange}
          initialCategory={activeCategory}
        />
      )}
      
      {/* Search Suggestions Portal - render outside DOM to avoid z-index issues */}
      {showSuggestions && suggestions.length > 0 && typeof window !== 'undefined' && createPortal(
        <div 
          className="fixed bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-h-[400px] overflow-y-auto"
          style={{
            top: `${suggestionsPosition.top}px`,
            left: `${suggestionsPosition.left}px`,
            width: `${suggestionsPosition.width}px`,
            zIndex: 9999
          }}
        >
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
                <p className="text-sm font-bold text-[#FF4444]">
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
        </div>,
        document.body
      )}
    </div>
  );
}
