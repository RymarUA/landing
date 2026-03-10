import type { Metadata } from "next/types";
import Link from "next/link";
import {
  PackageSearch,
  ShoppingBag,
  Home,
  Phone,
} from "lucide-react";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: `404 - страница не найдена | ${siteConfig.name}`,
  description: `Страница не найдена. Вернитесь на главную страницу ${siteConfig.name}.`,
  robots: { index: false, follow: false },
};

const quickLinks = [
  { href: "/#catalog", label: "Каталог товаров", icon: ShoppingBag },
  { href: "/?category=Спортивное%20питание#catalog", label: "Спортивное питание", icon: ShoppingBag },
  { href: "/?category=Косметика#catalog", label: "Косметика", icon: ShoppingBag },
  { href: "/about", label: "О нас", icon: Home },
];

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F6F4EF] flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full text-center">
        <div className="relative mb-6 select-none">
          <p className="text-[120px] sm:text-[160px] font-heading leading-none text-[#E7EFEA] tracking-tighter">
            404
          </p>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 bg-white rounded-full shadow-xl flex items-center justify-center border-4 border-[#E7EFEA]">
              <PackageSearch size={40} className="text-[#1F6B5E]" />
            </div>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-heading text-[#0F2D2A] mb-3 leading-tight">
          �� ������� �� ��������
        </h1>
        <p className="text-[#7A8A84] text-base mb-8 max-w-sm mx-auto leading-relaxed">
          �������, ��������� �������� ��� ����� ����� �����������. �������� �� �������� �� ������ ���� ������� ��� ����������.
        </p>

        <Link
          href="/#catalog"
          className="inline-flex items-center justify-center gap-2.5 bg-[#1F6B5E] hover:bg-[#0F2D2A] text-white font-bold py-4 px-8 rounded-2xl transition-all duration-200 shadow-lg shadow-[#1F6B5E]/30 text-base mb-6"
        >
          <ShoppingBag size={20} className="shrink-0" />
          �� ��������
        </Link>

        <div className="flex items-center gap-3 text-[#C9B27C] mb-6">
          <div className="flex-1 h-px bg-[#E7EFEA]" />
          <span className="text-xs font-medium text-[#8B6B3E]">��� �������� ��</span>
          <div className="flex-1 h-px bg-[#E7EFEA]" />
        </div>

        <div className="grid grid-cols-2 gap-2.5 mb-10">
          {quickLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 bg-white hover:bg-[#E7EFEA] border border-[#E7EFEA] rounded-xl px-4 py-3 text-sm font-semibold text-[#24312E] transition-all duration-200 shadow-sm"
            >
              <Icon size={15} className="text-[#1F6B5E] shrink-0" />
              {label}
            </Link>
          ))}
        </div>

        {siteConfig.phone && (
          <div className="bg-white border border-[#E7EFEA] rounded-2xl px-5 py-4 shadow-sm flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-sm text-[#7A8A84]">
            <span className="font-semibold text-[#24312E]">������� ��������?</span>
            <a
              href={`tel:${siteConfig.phone}`}
              className="inline-flex items-center gap-1.5 text-[#1F6B5E] font-semibold transition-colors"
            >
              <Phone size={14} />
              {siteConfig.phone}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

