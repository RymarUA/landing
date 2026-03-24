"use client";

import { Home, Grid3x3, User, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import { useCart } from "./cart-context";

interface NavItem {
  icon: any;
  label: string;
  href: string;
  isActive: boolean;
  ariaLabel: string;
  onClick?: (e: React.MouseEvent) => void;
  renderAsButton?: boolean;
}

export function TemuBottomNav() {
  const pathname = usePathname();
  const [hash, setHash] = useState("");
  const { totalCount } = useCart();
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const updateHash = () => {
      const newHash = window.location.hash || "";
      setHash(newHash);
    };
    updateHash();
    window.addEventListener("hashchange", updateHash);
    return () => window.removeEventListener("hashchange", updateHash);
  }, []);

  const scrollCatalogIntoView = () => {
    const catalogElement = document.getElementById("catalog");
    if (!catalogElement) return false;

    const headerElement = document.getElementById("site-header");
    const headerHeight = headerElement?.getBoundingClientRect().height ?? 0;
    const additionalGap = 4; // визуальный отступ между заголовком и категорией

    const targetTop = catalogElement.getBoundingClientRect().top + window.scrollY - headerHeight - additionalGap;
    window.scrollTo({
      top: Math.max(targetTop, 0),
      behavior: "smooth",
    });

    const url = new URL(window.location.href);
    url.hash = "catalog";
    window.history.replaceState({}, "", url.toString());
    
    // Manually trigger hash update since replaceState doesn't trigger hashchange
    setHash("#catalog");

    return true;
  };

  const attemptCatalogScroll = useCallback(() => {
    let attempts = 0;
    const maxAttempts = 12;

    const tryScroll = () => {
      const success = scrollCatalogIntoView();
      if (!success && attempts < maxAttempts) {
        attempts++;
        scrollTimeoutRef.current = setTimeout(tryScroll, 150);
      }
    };

    // Clear any existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    tryScroll();
  }, []);

  const handleCatalogClick = (e: React.MouseEvent) => {
    e.preventDefault();
    attemptCatalogScroll();
  };

  const handleHomeClick = () => {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    url.hash = "";
    window.history.replaceState({}, "", url.toString());
    setHash("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    if (!hash.includes("catalog")) return;
    const timer = setTimeout(attemptCatalogScroll, 80);
    return () => clearTimeout(timer);
  }, [hash, attemptCatalogScroll]);

  // Cleanup timeout on component unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const shouldShow = pathname === "/";
  
  if (!shouldShow) {
    return null;
  }

  const navItems: NavItem[] = [
    {
      icon: Home,
      label: "Головна",
      href: "/",
      isActive: pathname === "/" && (hash === "" || hash === "#"),
      ariaLabel: "Перейти на головну",
      onClick: handleHomeClick,
      renderAsButton: true,
    },
    {
      icon: Grid3x3,
      label: "Каталог",
      href: "/#catalog",
      isActive: pathname === "/" && hash === "#catalog",
      ariaLabel: "Переглянути каталог",
      onClick: handleCatalogClick,
      renderAsButton: true,
    },
    {
      icon: ShoppingBag,
      label: "Кошик",
      href: "/cart",
      isActive: pathname.includes("/cart"),
      ariaLabel: "Кошик покупок",
    },
    {
      icon: User,
      label: "Профіль",
      href: "/profile",
      isActive: pathname.includes("/profile"),
      ariaLabel: "Профіль клієнта",
    },
  ];

  return (
    <div 
      data-bottom-nav 
      className="fixed bottom-0 left-0 right-0 bg-[#2E7D32]/95 border-t border-[#1B5E20]/40 backdrop-blur-lg z-[100] pb-[env(safe-area-inset-bottom)] shadow-2xl text-white"
    >
      <nav className="flex justify-around items-center py-1.5 px-2" aria-label="Нижня навігація">
        {navItems.map((item) => {
          if (item.renderAsButton) {
            // Для каталога используем кастомный обработчик
            return (
              <button
                key={item.href}
                onClick={item.onClick}
                className={`relative flex flex-col items-center justify-center p-1.5 rounded-2xl transition-all min-w-[68px] ${
                  item.isActive
                    ? "text-white bg-white/30"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
                aria-label={item.ariaLabel}
                aria-current={item.isActive ? "page" : undefined}
              >
                <div className="relative">
                  <item.icon size={20} className="mb-0.5" />
                </div>
                <span className="text-[10px] font-semibold">{item.label}</span>
              </button>
            );
          }
          
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={item.onClick}
              className={`relative flex flex-col items-center justify-center p-1.5 rounded-2xl transition-all min-w-[68px] ${
                item.isActive
                  ? "text-white bg-white/30"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
              aria-label={item.ariaLabel}
              aria-current={item.isActive ? "page" : undefined}
              prefetch={false}
            >
              <div className="relative">
                <item.icon size={20} className="mb-0.5" />
                {item.label === "Кошик" && totalCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[15px] h-[15px] flex items-center justify-center px-0.5">
                    {totalCount > 99 ? "99+" : totalCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
