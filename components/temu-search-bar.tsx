"use client";

import { Search, Heart, MessageCircle, HelpCircle, Package, Grid3x3, ChevronDown, Truck, Activity, Bandage, Shield, Vibrate, Droplets, Shirt, Menu } from "lucide-react";
import { useState, useEffect, useRef, useMemo, useLayoutEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/lib/site-config";
import { useWishlist } from "@/components/wishlist-context";
import type { CatalogProduct } from "@/lib/instagram-catalog";

// Highlight component from shared
// function Highlight({ text, query }: { text: string; query: string }) {
//   if (!query.trim()) return <>{text}</>;
//   
//   const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
//   const parts = text.split(regex);
//   
//   return (
//     <>
//       {parts.map((part, i) =>
//         part.toLowerCase() === query.toLowerCase() ? (
//           <mark key={i} className="bg-amber-200 text-gray-900 rounded px-0.5">
//             {part}
//           </mark>
//         ) : (
//           <span key={i}>{part}</span>
//         )
//       )}
//     </>
//   );
// }

// Функція для автоматичного підбору іконки на основі назви категорії
function getCategoryIcon(categoryName: string): React.ComponentType<{ size?: number; className?: string }> {
  const name = categoryName.toLowerCase();
  
  if (name.includes("всі") || name.includes("все")) return Grid3x3;
  if (name.includes("доставк") || name.includes("доставка")) return Truck;
  if (name.includes("наколінник") || name.includes("коліно") || name.includes("наколінники")) return Activity;
  if (name.includes("пластир") || name.includes("пластирі")) return Bandage;
  if (name.includes("налокотник") || name.includes("лікоть") || name.includes("налокотники")) return Shield;
  if (name.includes("бандаж") || name.includes("бандажі")) return Shield;
  if (name.includes("масаж")) return Vibrate;
  if (name.includes("маз") || name.includes("гел") || name.includes("крем")) return Droplets;
  if (name.includes("білизна") || name.includes("компресі")) return Shirt;
  if (name.includes("інше") || name.includes("other")) return Package;
  
  return Package;
}
import { TelegramIcon } from "@/components/icons/telegram-icon";
import { ViberIcon } from "@/components/icons/viber-icon";
import { TikTokIcon } from "@/components/icons/tiktok-icon";
import { CategoryIconsSlider } from "@/components/category-icons-slider";

interface TemuSearchBarProps {
  products?: CatalogProduct[];
  // hasAnnouncement?: boolean;
}

export function TemuSearchBar({
  products = [],
  // hasAnnouncement = false,
}: TemuSearchBarProps) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [catalogCategories, setCatalogCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState("Всі");
  const [suggestionsPosition, setSuggestionsPosition] = useState({ top: 0, left: 0, width: 0 });
  const [supportPosition, setSupportPosition] = useState({ top: 0, left: 0 });
  const [catalogPosition, setCatalogPosition] = useState({ top: 0, left: 0 });
  const [mobileMenuPosition, setMobileMenuPosition] = useState({ top: 0, right: 0 });
  const searchRef = useRef<HTMLFormElement>(null);
  const supportRef = useRef<HTMLDivElement>(null);
  const catalogRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const { count } = useWishlist();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
      if (supportRef.current && !supportRef.current.contains(event.target as Node)) {
        setShowSupport(false);
      }
      if (catalogRef.current && !catalogRef.current.contains(event.target as Node)) {
        setShowCatalog(false);
      }
      // For mobile menu, check if click is outside the button itself
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        // Don't close if clicking inside the portal dropdown
        const target = event.target as Element;
        const isInsideMobileDropdown = target.closest('[data-mobile-menu-dropdown]');
        if (!isInsideMobileDropdown) {
          setShowMobileMenu(false);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load catalog categories
  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await fetch("/api/categories");
        const data = await response.json();
        
        if (data.success && data.categories) {
          setCatalogCategories(data.categories);
        }
      } catch (error) {
        console.error("Failed to load categories:", error);
      }
    }
    
    loadCategories();
  }, []);

  // Sync category with URL query and hash
  useEffect(() => {
    const syncFromURL = () => {
      const url = new URL(window.location.href);
      
      // Handle category from query parameter (new format)
      const categoryParam = url.searchParams.get('category');
      if (categoryParam) {
        const cat = decodeURIComponent(categoryParam.trim());
        setActiveCategory(cat);
        return;
      }
      
      // Fallback to hash for compatibility
      const hash = window.location.hash;
      const catMatch = hash.match(/category=([^&#]*)/);
      if (catMatch) {
        const cat = decodeURIComponent(catMatch[1].trim());
        setActiveCategory(cat);
      }
    };
    syncFromURL();
    window.addEventListener("hashchange", syncFromURL);
    window.addEventListener("popstate", syncFromURL);
    return () => {
      window.removeEventListener("hashchange", syncFromURL);
      window.removeEventListener("popstate", syncFromURL);
    };
  }, []);

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    
    // Update URL without page reload
    const url = new URL(window.location.href);
    if (category === "Всі") {
      url.searchParams.delete('category');
    } else {
      url.searchParams.set('category', category);
    }
    url.hash = 'catalog';
    window.history.replaceState({}, '', url.toString());
    
    // Scroll to catalog section
    const catalogElement = document.getElementById('catalog');
    if (catalogElement) {
      catalogElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    // Close catalog dropdown if it's open
    setShowCatalog(false);
  };

  const handleCatalogCategoryClick = (category: string) => {
    handleCategoryChange(category);
  };

  // Use useMemo to prevent re-renders
  const suggestions = useMemo(() => {
    if (searchQuery.trim().length >= 2) {
      const query = searchQuery.toLowerCase();
      return products
        .filter((p) => 
          p.name.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query)
        )
        .slice(0, 5);
    }
    return [];
  }, [searchQuery, products]);

  const updateMobileMenuPosition = useCallback(() => {
    if (typeof window === "undefined" || !mobileMenuRef.current) return;
    const rect = mobileMenuRef.current.getBoundingClientRect();
    setMobileMenuPosition({
      top: rect.bottom + 8,
      right: window.innerWidth - rect.right,
    });
  }, []);

  const updateSupportPosition = useCallback(() => {
    if (typeof window === "undefined" || !supportRef.current) return;
    const rect = supportRef.current.getBoundingClientRect();
    setSupportPosition({
      top: rect.bottom + 8,
      left: rect.right - 200,
    });
  }, []);

  const updateCatalogPosition = useCallback(() => {
    if (typeof window === "undefined" || !catalogRef.current) return;
    const rect = catalogRef.current.getBoundingClientRect();
    setCatalogPosition({
      top: rect.bottom + 8,
      left: rect.left,
    });
  }, []);

  const updateSuggestionsPosition = useCallback(() => {
    if (typeof window === "undefined" || !searchRef.current) return;
    const rect = searchRef.current.getBoundingClientRect();
    setSuggestionsPosition({
      top: rect.bottom + 8,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  // Update mobile menu dropdown position
  useLayoutEffect(() => {
    if (!showMobileMenu) return;
    const handleReposition = () => updateMobileMenuPosition();
    updateMobileMenuPosition();
    window.addEventListener("scroll", handleReposition, true);
    window.addEventListener("resize", handleReposition);
    return () => {
      window.removeEventListener("scroll", handleReposition, true);
      window.removeEventListener("resize", handleReposition);
    };
  }, [showMobileMenu, updateMobileMenuPosition]);

  // Update support dropdown position
  useLayoutEffect(() => {
    if (!showSupport) return;
    const handleReposition = () => updateSupportPosition();
    updateSupportPosition();
    window.addEventListener("scroll", handleReposition, true);
    window.addEventListener("resize", handleReposition);
    return () => {
      window.removeEventListener("scroll", handleReposition, true);
      window.removeEventListener("resize", handleReposition);
    };
  }, [showSupport, updateSupportPosition]);

  // Update catalog dropdown position
  useLayoutEffect(() => {
    if (!showCatalog) return;
    const handleReposition = () => updateCatalogPosition();
    updateCatalogPosition();
    window.addEventListener("scroll", handleReposition, true);
    window.addEventListener("resize", handleReposition);
    return () => {
      window.removeEventListener("scroll", handleReposition, true);
      window.removeEventListener("resize", handleReposition);
    };
  }, [showCatalog, updateCatalogPosition]);

  // Update suggestions visibility and position
  useLayoutEffect(() => {
    const shouldShow = suggestions.length > 0 && searchQuery.trim().length >= 2;
    
    if (shouldShow) {
      setShowSuggestions(true);
      
      updateSuggestionsPosition();
    } else {
      setShowSuggestions(false);
    }
  }, [suggestions, searchQuery, updateSuggestionsPosition]);

  useLayoutEffect(() => {
    if (!showSuggestions) return;
    const handleReposition = () => updateSuggestionsPosition();
    window.addEventListener("scroll", handleReposition, true);
    window.addEventListener("resize", handleReposition);
    return () => {
      window.removeEventListener("scroll", handleReposition, true);
      window.removeEventListener("resize", handleReposition);
    };
  }, [showSuggestions, updateSuggestionsPosition]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Use only query parameters, no hash
      const url = new URL(window.location.href);
      url.searchParams.set('q', searchQuery);
      url.hash = ''; // Clear hash completely
      window.history.pushState({}, '', url);
      
      // Trigger catalog update with custom event
      window.dispatchEvent(new CustomEvent('searchupdate', { detail: { query: searchQuery } }));
      
      setShowSuggestions(false);
    }
  };

  // const handleSuggestionClick = (product: CatalogProduct) => {
  //   setShowSuggestions(false);
  //   
  //   // Navigate to product page using window.location
  //   window.location.href = `/product/${product.id}`;
  // };

  return (
    <div 
      className="text-white"
    >
      <div className="border-b border-emerald-900/10">
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

          {/* Search - larger on mobile */}
          <div className="flex-1 relative" style={{ zIndex: 1001 }}>
            <form onSubmit={handleSearch} className="relative" ref={searchRef}>
            <div className="relative">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                // Show suggestions
                if (searchQuery.trim().length >= 2 && suggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              onKeyDown={(e) => {
                // Prevent default scroll behavior for certain keys
                if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                  e.preventDefault();
                }
              }}
              placeholder="Пошук: чаї, пластирі, масла..."
              aria-placeholder="Пошук товарів&hellip;"
              className="w-full h-10 md:h-10 pl-10 pr-3 rounded-full bg-white text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] shadow-sm sm:pl-11 sm:pr-4"
              inputMode="search"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              enterKeyHint="search"
              spellCheck="false"
            />
            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
          </div>
          </form>
          </div>

          {/* Desktop Navigation - hidden on mobile */}
          <div className="hidden sm:flex items-center gap-2 sm:gap-3">
            {/* Catalog Dropdown - only when not on home page */}
            {pathname !== "/" && (
              <div className="relative" ref={catalogRef}>
                <button
                  onClick={() => setShowCatalog(!showCatalog)}
                  className="flex items-center gap-1 sm:gap-2 rounded-full border border-white/20 bg-white/10 px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold text-white/90 hover:bg-white/20 transition shadow-sm"
                  aria-label="Каталог товарів"
                >
                  <Grid3x3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden md:inline">Каталог</span>
                  <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
              </div>
            )}

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

            {/* Nova Poshta Tracking - hide when on tracking page */}
            {pathname !== "/tracking" && (
              <Link
                href="/tracking"
                className="flex items-center gap-1 sm:gap-2 rounded-full border border-white/20 bg-white/10 px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold text-white/90 hover:bg-white/20 transition shadow-sm"
                aria-label="Відстежити посилку Новою Поштою"
              >
                <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden md:inline">Відстежити посилку</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="sm:hidden relative" ref={mobileMenuRef}>
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2 py-1.5 text-[10px] font-semibold text-white/90 hover:bg-white/20 transition shadow-sm"
              aria-label="Меню"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Categories - only on home page */}
      {pathname === "/" && (
        <CategoryIconsSlider
          onCategoryChange={handleCategoryChange}
          initialCategory={activeCategory}
        />
      )}
      
      {/* Search Suggestions - render at component level with highest z-index */}
      {showSuggestions && suggestions.length > 0 && (
        <div 
          className="fixed bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-h-[400px] overflow-y-auto"
          style={{
            top: `${suggestionsPosition.top}px`,
            left: `${suggestionsPosition.left}px`,
            width: `${suggestionsPosition.width}px`,
            zIndex: 10000,
            pointerEvents: 'auto'
          }}
          onClick={(e) => {
            console.log('Container clicked!', e.target);
          }}
        >
          {suggestions.map((product) => (
            <div
              key={product.id}
              role="button"
              tabIndex={0}
              onMouseDown={(e) => {
                e.preventDefault();
                console.log('MouseDown on product!', product.id);
                setShowSuggestions(false);
                setTimeout(() => {
                  window.location.href = `/product/${product.id}`;
                }, 0);
              }}
              className="w-full flex items-center gap-3 p-3 hover:bg-emerald-50 transition-colors text-left border-b border-gray-50 last:border-b-0 cursor-pointer"
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
            </div>
          ))}
        </div>
      )}
      
      {/* Support Dropdown Portal - render outside DOM to avoid z-index issues */}
      {showSupport && typeof window !== 'undefined' && createPortal(
        <div 
          className="fixed bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-[10000] min-w-[200px]"
          style={{
            top: `${supportPosition.top}px`,
            left: `${supportPosition.left}px`,
            pointerEvents: 'auto'
          }}
        >
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
        </div>,
        document.body
      )}

      {/* Mobile Menu Dropdown Portal - render outside DOM to avoid z-index issues */}
      {showMobileMenu && typeof window !== 'undefined' && createPortal(
        <div 
          data-mobile-menu-dropdown
          className="fixed bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-[10000] min-w-[200px]"
          style={{
            top: `${mobileMenuPosition.top}px`,
            right: `${mobileMenuPosition.right}px`,
            pointerEvents: 'auto'
          }}
        >
          {/* Catalog Dropdown - only when not on home page */}
          {pathname !== "/" && (
            <button
              onClick={() => {
                setShowCatalog(!showCatalog);
                setShowMobileMenu(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 transition-colors text-gray-900 text-left"
            >
              <div className="text-emerald-600">
                <Grid3x3 size={18} />
              </div>
              <span className="text-sm font-semibold">Каталог</span>
            </button>
          )}

          {/* Support Button */}
          <a
            href={`https://t.me/${siteConfig.telegramUsername || 'health_east'}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 transition-colors text-gray-900 text-left border-t border-gray-100"
            onClick={() => setShowMobileMenu(false)}
          >
            <div className="text-gray-700">
              <MessageCircle size={18} />
            </div>
            <span className="text-sm font-semibold">Підтримка</span>
          </a>

          {/* FAQ Link */}
          <Link
            href="/faq"
            className="flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 transition-colors text-gray-900 border-t border-gray-100"
            onClick={() => setShowMobileMenu(false)}
          >
            <div className="text-gray-700">
              <HelpCircle size={18} />
            </div>
            <span className="text-sm font-semibold">FAQ</span>
          </Link>

          {/* Wishlist */}
          <Link
            href="/wishlist"
            className="flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 transition-colors text-gray-900 border-t border-gray-100"
            onClick={() => setShowMobileMenu(false)}
          >
            <div className="text-gray-700">
              <Heart size={18} />
            </div>
            <span className="text-sm font-semibold">Бажання</span>
            {count > 0 && (
              <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>

          {/* Nova Poshta Tracking - hide when on tracking page */}
          {pathname !== "/tracking" && (
            <Link
              href="/tracking"
              className="flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 transition-colors text-gray-900 border-t border-gray-100"
              onClick={() => setShowMobileMenu(false)}
            >
              <div className="text-gray-700">
                <Package size={18} />
              </div>
              <span className="text-sm font-semibold">Відстежити посилку</span>
            </Link>
          )}
        </div>,
        document.body
      )}

      {/* Catalog Dropdown Portal - render outside DOM to avoid z-index issues */}
      {showCatalog && typeof window !== 'undefined' && createPortal(
        <div 
          className="fixed bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-[10000] min-w-[220px] max-h-[400px] overflow-y-auto"
          style={{
            top: `${catalogPosition.top}px`,
            left: `${catalogPosition.left}px`,
            pointerEvents: 'auto'
          }}
        >
          {catalogCategories.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500">
              Завантаження категорій...
            </div>
          ) : (
            catalogCategories.map((category) => {
              const Icon = getCategoryIcon(category);
              return (
                <button
                  key={category}
                  onClick={() => handleCatalogCategoryClick(category)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 transition-colors text-gray-900 text-left border-t border-gray-100 first:border-t-0"
                >
                  <div className="text-emerald-600">
                    <Icon size={18} />
                  </div>
                  <span className="text-sm font-semibold">{category}</span>
                </button>
              );
            })
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
