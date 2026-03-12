/**
 * app/admin/layout.tsx
 *
 * Окремий layout для адмін-панелі.
 * Не наслідує хедер/футер магазину.
 *
 * Інструкція:
 * 1. Цей файл → app/admin/layout.tsx
 * 2. admin-page.tsx → app/admin/page.tsx
 */

import type { Metadata } from "next/types";

export const metadata: Metadata = {
  title: "Адмін-панель — Семейный Магазин",
  robots: "noindex, nofollow", // пошукові системи не індексують
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    // Повністю ізольований від root layout
    <div>
      {children}
    </div>
  );
}

