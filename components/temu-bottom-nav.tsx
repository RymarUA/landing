"use client";

import { Home, Grid3x3, User, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "./cart-context";

export function TemuBottomNav() {
  const pathname = usePathname();
  const [hash, setHash] = useState("");
  const { totalCount } = useCart();

  useEffect(() => {
    setHash(window.location.hash);
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // Показывать навигацию только на главной странице
  const shouldShow = pathname === "/";
  
  if (!shouldShow) {
    return null;
  }

  const navItems = [
    {
      icon: Home,
      label: "Головна",
      href: "/",
      isActive: pathname === "/" && !hash.includes("catalog"),
      ariaLabel: "Перейти на головну",
    },
    {
      icon: Grid3x3,
      label: "Каталог",
      href: "/#catalog",
      isActive: pathname === "/" && hash.includes("catalog"),
      ariaLabel: "Переглянути каталог",
    },
    {
      icon: ShoppingBag,
      label: "Кошик",
      href: "/cart",
      isActive: pathname.includes("cart"),
      ariaLabel: "Кошик покупок",
    },
    {
      icon: User,
      label: "Профіль",
      href: "/profile",
      isActive: pathname.includes("profile"),
      ariaLabel: "Профіль клієнта",
    },
  ];

  return (
    <div data-bottom-nav className="fixed bottom-0 left-0 right-0 bg-emerald-900/95 lg:bg-emerald-900/85 border-t border-emerald-700/40 backdrop-blur-lg z-[100] pb-[env(safe-area-inset-bottom)] shadow-2xl lg:shadow-xl">
      <nav className="flex justify-around items-center py-2 px-2 lg:py-1.5 lg:px-4" aria-label="Нижня навігація">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex flex-col items-center justify-center p-2 rounded-2xl transition-all min-w-[72px] lg:min-w-[64px] lg:p-1.5 ${
              item.isActive
                ? "text-[#D4AF37] bg-white/10 lg:bg-white/5"
                : "text-white/70 hover:text-white hover:bg-white/5 lg:hover:bg-white/3"
            }`}
            aria-label={item.ariaLabel}
            aria-current={item.isActive ? "page" : undefined}
            prefetch={false}
          >
            <div className="relative">
              <item.icon size={22} className="mb-1 lg:size-18 lg:mb-0.5" />
              {item.label === "Кошик" && totalCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center">
                  {totalCount > 99 ? "99+" : totalCount}
                </span>
              )}
            </div>
            <span className="text-[11px] font-semibold lg:text-[10px]">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
