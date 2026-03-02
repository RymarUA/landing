"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Menu, X, Heart, Search } from "lucide-react";
import { useCart } from "@/components/cart-context";
import { useWishlist } from "@/components/wishlist-context";

export function StickyHeader() {
  const [visible, setVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const { totalCount } = useCart();
  const { count: wishlistCount, hydrated } = useWishlist();

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

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (query.trim()) {
        // Navigate to catalog section with search param
        window.location.href = `/#catalog?search=${encodeURIComponent(query.trim())}`;
        setSearchOpen(false);
      }
    },
    [query]
  );

  const navLinks = [
    { label: "Каталог", href: "#catalog" },
    { label: "Новинки", href: "#new-arrivals" },
    { label: "Відстеження", href: "#tracking" },
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
          <img src="/logo.png" alt="FamilyHub Market" className="h-8 w-auto" />
          <span className="font-black text-gray-900 text-lg hidden sm:block">
            FamilyHub<span className="text-rose-500">Market</span>
          </span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-gray-600 hover:text-rose-500 transition-colors"
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
            className="p-2 rounded-xl bg-gray-100 hover:bg-rose-50 hover:text-rose-500 transition-colors text-gray-600"
            title="Пошук"
          >
            <Search size={18} />
          </button>

          {/* Wishlist */}
          <Link
            href="/wishlist"
            className="relative p-2 rounded-xl bg-gray-100 hover:bg-rose-50 transition-colors"
            title="Список бажань"
          >
            <Heart
              size={18}
              className={wishlistCount > 0 && hydrated ? "text-rose-500 fill-rose-500" : "text-gray-600"}
            />
            {hydrated && wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs font-black rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-0.5">
                {wishlistCount}
              </span>
            )}
          </Link>

          <a
            href="#catalog"
            className="hidden sm:flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors"
          >
            Замовити
          </a>

          {/* Cart indicator */}
          <a href="#" className="relative p-2 rounded-xl bg-gray-100 hover:bg-rose-50 transition-colors">
            <ShoppingCart size={20} className="text-gray-600" />
            {totalCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs font-black rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-0.5">
                {totalCount}
              </span>
            )}
          </a>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
            onClick={() => setMenuOpen((v) => !v)}
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
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
            <button
              type="submit"
              className="bg-rose-500 hover:bg-rose-600 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
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
              className="text-sm font-semibold text-gray-700 hover:text-rose-500 transition-colors py-1"
            >
              {l.label}
            </a>
          ))}
          <Link
            href="/wishlist"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-rose-500 transition-colors py-1"
          >
            <Heart size={16} className={wishlistCount > 0 ? "text-rose-500 fill-rose-500" : ""} />
            Список бажань
            {hydrated && wishlistCount > 0 && (
              <span className="bg-rose-500 text-white text-xs font-black rounded-full px-1.5 py-0.5 leading-none">
                {wishlistCount}
              </span>
            )}
          </Link>
          <a
            href="#catalog"
            onClick={() => setMenuOpen(false)}
            className="mt-2 flex items-center justify-center bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold px-4 py-3 rounded-xl transition-colors"
          >
            Замовити зараз
          </a>
        </div>
      )}
    </header>
  );
}
