"use client";

import { Home, Grid3x3, User, ShoppingBag } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useCart } from "@/components/cart-context";

export function TemuBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { items } = useCart();

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

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
      badge: totalItems,
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
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg pb-safe">
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
                ${item.isActive ? "text-orange-500" : "text-gray-500"}
              `}
            >
              <div className="relative">
                <Icon className="w-6 h-6" />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
