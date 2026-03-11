// @ts-nocheck
"use client";

import { Home, Grid3x3, User, ShoppingBag, Sparkles } from "lucide-react";
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
      isActive: pathname === "/",
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
      icon: Sparkles,
      label: "Гід",
      href: "/#guide",
      isActive: pathname === "/" && hash.includes("guide"),
      ariaLabel: "Дізнатися про гід",
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
    <div className="fixed bottom-0 left-0 right-0 bg-[#0F2D2A]/95 border-t border-[#1F6B5E]/40 backdrop-blur z-50 md:hidden">
      <nav className="flex justify-around items-center py-2" aria-label="Нижня навігація">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center p-2 rounded-2xl transition-colors ${
              item.isActive
                ? "text-[#C9B27C]"
                : "text-white/70 hover:text-white"
            }`}
            aria-label={item.ariaLabel}
            aria-current={item.isActive ? "page" : undefined}
            prefetch={false}
          >
            <item.icon size={20} />
            <span className="text-xs mt-1 font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
