// @ts-nocheck
import Link from "next/link";
import {
  PackageSearch,
  ShoppingBag,
  Home,
  Phone,
  Instagram,
} from "lucide-react";

export const metadata: Metadata = {
  title: "404 — Сторінку не знайдено | FamilyHub Market",
  description: "Сторінка не існує. Перейдіть до каталогу товарів FamilyHub Market.",
  robots: { index: false, follow: false },
};

const quickLinks = [
  { href: "/#catalog", label: "Каталог товарів", icon: ShoppingBag },
  { href: "/#catalog?category=Одяг", label: "Одяг", icon: ShoppingBag },
  { href: "/#catalog?category=Іграшки", label: "Іграшки", icon: ShoppingBag },
  { href: "/about", label: "Про нас", icon: Home },
];

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fff9f5] to-[#fdf6f0] flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full text-center">

        {/* Animated 404 */}
        <div className="relative mb-6 select-none">
          <p className="text-[120px] sm:text-[160px] font-black leading-none text-orange-100 tracking-tighter">
            404
          </p>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 bg-white rounded-full shadow-xl flex items-center justify-center border-4 border-orange-100">
              <PackageSearch size={40} className="text-orange-500" />
            </div>
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3 leading-tight">
          Цю сторінку не знайдено
        </h1>
        <p className="text-gray-500 text-base mb-8 max-w-sm mx-auto leading-relaxed">
          Можливо, посилання застаріло або товар більше не доступний. 
          Перейдіть до каталогу та оберіть щось чудове!
        </p>

        {/* Primary CTA */}
        <Link
          href="/#catalog"
          className="inline-flex items-center justify-center gap-2.5 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-200 shadow-lg shadow-orange-200 hover:shadow-orange-300 hover:-translate-y-0.5 text-base mb-6"
        >
          <ShoppingBag size={20} className="shrink-0" />
          До каталогу
        </Link>

        {/* Divider */}
        <div className="flex items-center gap-3 text-gray-300 mb-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 font-medium">або перейдіть до</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Quick links grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-10">
          {quickLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 bg-white hover:bg-orange-50 border border-gray-100 hover:border-orange-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 hover:text-orange-600 transition-all duration-200 shadow-sm"
            >
              <Icon size={15} className="text-orange-400 shrink-0" />
              {label}
            </Link>
          ))}
        </div>

        {/* Contact strip */}
        <div className="bg-white border border-gray-100 rounded-2xl px-5 py-4 shadow-sm flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-sm text-gray-500">
          <span className="font-semibold text-gray-700">Потрібна допомога?</span>
          <a
            href="tel:+380936174140"
            className="inline-flex items-center gap-1.5 text-orange-500 hover:text-orange-600 font-semibold transition-colors"
          >
            <Phone size={14} />
            +38 (093) 617-41-40
          </a>
          <a
            href="https://www.instagram.com/familyhub_market/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-orange-500 hover:text-orange-600 font-semibold transition-colors"
          >
            <Instagram size={14} />
            Instagram
          </a>
        </div>

      </div>
    </div>
  );
}
