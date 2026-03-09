"use client";

import { Home, Grid3x3, User, ShoppingBag } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

export function TemuBottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    {
      icon: Home,
      label: "Головна",
      href: "/",
      isActive: pathname === "/",
    },
    {
      icon: Grid3x3,
      label: "Категорії",
      href: "/#catalog",
      isActive: pathname.includes("catalog"),
    },
    {
      icon: ShoppingBag,
      label: "Кошик",
      href: "/cart",
      isActive: pathname === "/cart",
    },
    {
      icon: User,
      label: "Профіль",
      href: "/cabinet",
      isActive: pathname.includes("cabinet"),
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-7xl mx-auto grid grid-cols-4 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`
                flex flex-col items-center justify-center gap-1 relative
                transition-colors
                ${item.isActive ? "text-amber-500" : "text-gray-500"}
              `}
            >
              <div className="relative flex items-center justify-center">
                <Icon className="w-6 h-6" />
              </div>
              <span className="text-xs font-medium text-center">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
