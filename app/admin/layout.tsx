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

export const metadata = {
  title: "Адмін-панель — FamilyHub Market",
  robots: "noindex, nofollow", // пошукові системи не індексують
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    // Повністю ізольований від root layout
    <div suppressHydrationWarning>
      {children}
    </div>
  );
}
