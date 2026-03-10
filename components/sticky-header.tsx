"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingCart, Menu, X, Heart, Search, User, Instagram, Facebook } from "lucide-react";

function TikTokIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.73a4.85 4.85 0 0 1-1.01-.04z" />
    </svg>
  );
}
import { useCart } from "@/components/cart-context";
import { useWishlist } from "@/components/wishlist-context";

export function StickyHeader() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const { totalCount, openCart } = useCart();
  const { count: wishlistCount, hydrated } = useWishlist();

  const isWishlistActive = pathname === "/wishlist";

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Focus search input when opened */
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [searchOpen]);

  /* Close on Escape */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchOpen(false);
        setMenuOpen(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const router = useRouter();
  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (query.trim()) {
        router.push(`/?search=${encodeURIComponent(query.trim())}#catalog`);
        setSearchOpen(false);
      }
    },
    [query, router]
  );

  const navLinks = [
    { label: "Каталог", href: "#catalog" },
    { label: "Новинки", href: "#new-arrivals" },
    { label: "Відстеження", href: "#tracking" },
    { label: "Про нас", href: "/about" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        visible
          ? "translate-y-0 opacity-100 shadow-lg bg-white/95 backdrop-blur-md border-b border-gray-100"
          : "-translate-y-full opacity-0"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2 flex-shrink-0">
          <div className="relative h-8 w-20">
            <Image src="/logo.png" alt="FamilyHub Market" fill sizes="80px" className="object-contain" priority />
          </div>
          <span className="font-black text-gray-900 text-lg hidden sm:block">
            FamilyHub<span className="text-orange-500">Market</span>
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-gray-600 hover:text-orange-500 transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Search toggle */}
          <button
            onClick={() => setSearchOpen((v) => !v)}
            className="p-2 rounded-xl bg-gray-100 hover:bg-orange-50 hover:text-orange-500 transition-colors text-gray-600"
            title="Пошук"
            aria-label="Пошук"
          >
            <Search size={18} />
          </button>

          {/* Profile */}
          <Link
            href="/profile"
            className="p-2 rounded-xl bg-gray-100 hover:bg-orange-50 hover:text-orange-500 transition-colors text-gray-600"
            title="Особистий кабінет"
          >
            <User size={18} />
          </Link>

          <Link
            href="/wishlist"
            className={`relative p-2 rounded-xl transition-colors ${isWishlistActive ? "bg-orange-100 text-orange-600" : "bg-gray-100 hover:bg-orange-50"}`}
            title="Список бажань"
            aria-label="Список бажань"
          >
            <Heart
              size={18}
              className={wishlistCount > 0 && hydrated ? "text-orange-500 fill-orange-500" : "text-gray-600"}
            />
            {hydrated && wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-black rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-0.5">
                {wishlistCount}
              </span>
            )}
          </Link>

          <a
            href="#catalog"
            className="hidden sm:flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors"
          >
            Замовити
          </a>

          <button
            type="button"
            onClick={openCart}
            className="relative p-2 rounded-xl bg-gray-100 hover:bg-orange-50 transition-colors"
            aria-label="Відкрити кошик"
          >
            <ShoppingCart size={20} className="text-gray-600" />
            {totalCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-black rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-0.5">
                {totalCount}
              </span>
            )}
          </button>

          {/* Colored social icons — desktop only */}
          <div className="hidden lg:flex items-center gap-1.5 ml-1">
            <a
              href="https://www.instagram.com/familyhub_market/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white hover:scale-110 transition-transform"
              style={{ background: "linear-gradient(135deg,#f43f5e,#ec4899)" }}
              title="Instagram"
              aria-label="Instagram"
            >
              <Instagram size={15} />
            </a>
            <a
              href="https://www.facebook.com/familyhubmarketod"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white hover:scale-110 transition-transform"
              style={{ background: "linear-gradient(135deg,#3b82f6,#1d4ed8)" }}
              title="Facebook"
              aria-label="Facebook"
            >
              <Facebook size={15} />
            </a>
            <a
              href="https://www.tiktok.com/@familyhub_market"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white hover:scale-110 transition-transform"
              style={{ background: "#1c1917" }}
              title="TikTok"
              aria-label="TikTok"
            >
              <TikTokIcon size={15} />
            </a>
          </div>

          <button
            className="md:hidden p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Закрити меню" : "Відкрити меню"}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Search bar dropdown */}
      {searchOpen && (
        <div className="bg-white border-t border-gray-100 px-4 py-3 shadow-md">
          <form onSubmit={handleSearchSubmit} className="max-w-xl mx-auto flex gap-2">
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Пошук товарів… (напр. «Nike», «дитячі»)"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <button
              type="submit"
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
            >
              Знайти
            </button>
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <X size={18} className="text-gray-500" />
            </button>
          </form>
        </div>
      )}

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 flex flex-col gap-3">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="text-sm font-semibold text-gray-700 hover:text-orange-500 transition-colors py-1"
            >
              {l.label}
            </a>
          ))}
          <Link
            href="/profile"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-orange-500 transition-colors py-1"
          >
            <User size={16} />
            Особистий кабінет
          </Link>
          <Link
            href="/wishlist"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-orange-500 transition-colors py-1"
          >
            <Heart size={16} className={wishlistCount > 0 ? "text-orange-500 fill-orange-500" : ""} />
            Список бажань
            {hydrated && wishlistCount > 0 && (
              <span className="bg-orange-500 text-white text-xs font-black rounded-full px-1.5 py-0.5 leading-none">
                {wishlistCount}
              </span>
            )}
          </Link>
          <a
            href="#catalog"
            onClick={() => setMenuOpen(false)}
            className="mt-2 flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-4 py-3 rounded-xl transition-colors"
          >
            Замовити зараз
          </a>
        </div>
      )}
    </header>
  );
}

