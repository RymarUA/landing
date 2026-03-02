"use client";
import { useEffect, useState } from "react";
import { ShoppingCart, Menu, X } from "lucide-react";
import { useCart } from "@/components/cart-context";

export function StickyHeader() {
  const [visible, setVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { totalCount } = useCart();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { label: "Каталог", href: "#catalog" },
    { label: "Нові надходження", href: "#new-arrivals" },
    { label: "Відгуки", href: "#reviews" },
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
        <div className="flex items-center gap-3">
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
