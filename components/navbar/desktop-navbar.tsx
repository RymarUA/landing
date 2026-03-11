// @ts-nocheck
"use client";
import { Logo } from "../Logo";
import { useCart } from "@/components/cart-context";
import { ShoppingCart, Search, Headphones, User, ChevronDown } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { siteConfig } from "@/lib/site-config";

export const DesktopNavbar = () => {
  const { totalCount, hydrated } = useCart();
  const [showCategories, setShowCategories] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const categories = siteConfig.catalogCategories.slice(1);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/?search=${encodeURIComponent(searchQuery)}#catalog`;
    }
  };

  return (
    <div className="w-full bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-6">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Logo />
          </Link>

          {/* Categories Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowCategories(!showCategories)}
              onBlur={() => setTimeout(() => setShowCategories(false), 200)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-orange-500 transition-colors"
            >
              Категорії
              <ChevronDown className={cn("w-4 h-4 transition-transform", showCategories && "rotate-180")} />
            </button>
            <AnimatePresence>
              {showCategories && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50"
                >
                  {categories.map((category) => (
                    <Link
                      key={category}
                      href={`/?category=${encodeURIComponent(category)}#catalog`}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-500 transition-colors"
                    >
                      {category}
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Пошук товарів..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
            </div>
          </form>

          {/* Right Icons */}
          <div className="flex items-center gap-4">
            {/* Cart */}
            <Link href="/cart" className="relative p-2 hover:bg-orange-50 rounded-full transition-colors group">
              <ShoppingCart className="w-5 h-5 text-gray-700 group-hover:text-orange-500" />
              <AnimatePresence>
                {hydrated && totalCount > 0 && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1"
                  >
                    {totalCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>

            {/* Support */}
            <Link href="/about" className="p-2 hover:bg-orange-50 rounded-full transition-colors group">
              <Headphones className="w-5 h-5 text-gray-700 group-hover:text-orange-500" />
            </Link>

            {/* Profile */}
            <Link href="/profile" className="p-2 hover:bg-orange-50 rounded-full transition-colors group">
              <User className="w-5 h-5 text-gray-700 group-hover:text-orange-500" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

