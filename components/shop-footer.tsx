// @ts-nocheck
"use client";
import Link from "next/link";
import { Instagram, Phone } from "lucide-react";
import { siteConfig } from "@/lib/site-config";

export function ShopFooter() {
  return (
    <footer className="bg-emerald-900 text-white py-8 px-4 mt-auto">
      <div className="max-w-6xl mx-auto">
        {/* Основна інформація в один рядок на desktop */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          
          {/* Бренд */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#D4AF37]/50 bg-emerald-700 text-white text-sm font-bold">
                ЗС
              </span>
              <div>
                <div className="text-base font-bold">Здоров&apos;я Сходу</div>
                <div className="text-xs text-white/70">Ритуали турботи щодня</div>
              </div>
            </div>
            <p className="text-white/70 text-sm">
              Ритуали східної медицини для дому та клініки.
            </p>
          </div>

          {/* Каталог - компактно */}
          <div>
            <div className="font-bold text-xs mb-2 text-white/80 uppercase">Каталог</div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              {siteConfig.catalogCategories
                .filter((c) => c !== "Всі")
                .slice(0, 6) // Тільки перші 6
                .map((cat) => (
                  <a
                    key={cat}
                    href={`/?category=${encodeURIComponent(cat)}#catalog`}
                    className="text-white/70 hover:text-[#D4AF37] text-sm transition-colors"
                  >
                    {cat}
                  </a>
                ))}
            </div>
          </div>

          {/* Контакти */}
          <div>
            <div className="font-bold text-xs mb-2 text-white/80 uppercase">Контакти</div>
            <div className="space-y-2">
              {siteConfig.phone && (
                <a
                  href={`tel:${siteConfig.phone}`}
                  className="flex items-center gap-2 text-white/70 hover:text-[#D4AF37] text-sm transition-colors"
                >
                  <Phone size={14} className="text-[#D4AF37]" />
                  {siteConfig.phone}
                </a>
              )}
              
              <div className="flex gap-2 pt-2">
                {siteConfig.instagramUsername && (
                  <a
                    href={`https://www.instagram.com/${siteConfig.instagramUsername}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full text-xs font-semibold transition"
                  >
                    <Instagram size={14} />
                    Instagram
                  </a>
                )}
                {siteConfig.telegramUsername && (
                  <a
                    href={`https://t.me/${siteConfig.telegramUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full text-xs font-semibold transition"
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                    </svg>
                    Telegram
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Нижня частина - одна лінія */}
        <div className="pt-4 border-t border-white/20 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/60">
          <p>© 2026 {siteConfig.name}. Всі права захищені.</p>
          <p>Доставка по всій Україні</p>
        </div>
      </div>
    </footer>
  );
}
