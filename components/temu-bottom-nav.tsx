// @ts-nocheck
"use client";

import { Home, Grid3x3, User, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function TemuBottomNav() {
  const pathname = usePathname();
  const [hash, setHash] = useState("");

  useEffect(() => {
    setHash(window.location.hash);
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

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
      isActive: pathname === "/cart",
      ariaLabel: "Відкрити кошик",
    },
    {
      icon: User,
      label: "Профіль",
      href: "/profile",
      isActive: pathname?.includes("profile"),
      ariaLabel: "Профіль клієнта",
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-emerald-900/95 border-t border-emerald-700/40 backdrop-blur-lg z-[100] pb-[env(safe-area-inset-bottom)] shadow-2xl">
      <nav className="flex justify-around items-center py-2 px-2" aria-label="Нижня навігація">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all min-w-[72px] ${
              item.isActive
                ? "text-[#D4AF37] bg-white/10"
                : "text-white/70 hover:text-white hover:bg-white/5"
            }`}
            aria-label={item.ariaLabel}
            aria-current={item.isActive ? "page" : undefined}
            prefetch={false}
          >
            <item.icon size={22} className="mb-1" />
            <span className="text-[11px] font-semibold">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
