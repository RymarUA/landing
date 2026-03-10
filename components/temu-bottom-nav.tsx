"use client";

import { Home, Grid3x3, User, ShoppingBag, Sparkles } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function TemuBottomNav() {
  const router = useRouter();
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
      label: "Главная",
      href: "/",
      isActive: pathname === "/",
    },
    {
      icon: Grid3x3,
      label: "Каталог",
      href: "/#catalog",
      isActive: pathname === "/" && hash.includes("catalog"),
    },
    {
      icon: Sparkles,
      label: "Гид",
      href: "/#guide",
      isActive: pathname === "/" && hash.includes("guide"),
    },
    {
      icon: ShoppingBag,
      label: "Корзина",
      href: "/cart",
      isActive: pathname === "/cart",
    },
    {
      icon: User,
      label: "Профиль",
      href: "/profile",
      isActive: pathname?.includes("profile"),
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden">
      <div className="flex justify-around items-center py-2">
        {navItems.map((item) => (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
              item.isActive
                ? "text-blue-600 bg-blue-50"
                : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
            }`}
          >
            <item.icon size={20} />
            <span className="text-xs mt-1">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}ൽ

