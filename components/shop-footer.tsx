// @ts-nocheck
"use client";
import Link from "next/link";
import { Instagram, Phone } from "lucide-react";
import { TikTokIcon } from "./icons/tiktok-icon";
import { siteConfig } from "@/lib/site-config";

export function ShopFooter() {
  return (
    <footer className="bg-emerald-900 text-white py-8 px-4 mt-auto">
      <div className="max-w-6xl mx-auto">
        {/* 4 колонки: Каталог, Підтримка, Контакти, Соціальні мережі */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          
          {/* 1. Каталог - тільки категорії */}
          <div>
            <div className="font-bold text-sm mb-3 text-white uppercase tracking-wide">Каталог</div>
            <div className="flex flex-col gap-2">
              {siteConfig.catalogCategories
                .filter((c) => c !== "Всі")
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

          {/* 2. Підтримка */}
          <div>
            <div className="font-bold text-sm mb-3 text-white uppercase tracking-wide">Підтримка</div>
            <div className="flex flex-col gap-2">
              <a href="/about" className="text-white/70 hover:text-[#D4AF37] text-sm transition-colors">
                Повернення товару
              </a>
              <a href="/about" className="text-white/70 hover:text-[#D4AF37] text-sm transition-colors">
                Умови доставки
              </a>
              <a href="/about" className="text-white/70 hover:text-[#D4AF37] text-sm transition-colors">
                Оплата
              </a>
              <a href="/about" className="text-white/70 hover:text-[#D4AF37] text-sm transition-colors">
                Гарантія
              </a>
            </div>
          </div>

          {/* 3. Контакти */}
          <div>
            <div className="font-bold text-sm mb-3 text-white uppercase tracking-wide">Контакти</div>
            <div className="flex flex-col gap-2">
              {siteConfig.phone && (
                <a
                  href={`tel:${siteConfig.phone}`}
                  className="flex items-center gap-2 text-white/70 hover:text-[#D4AF37] text-sm transition-colors"
                >
                  <Phone size={14} className="text-[#D4AF37]" />
                  {siteConfig.phone}
                </a>
              )}
              <p className="text-white/70 text-sm">м. Одеса, Україна</p>
              <p className="text-white/70 text-sm">Пн-Пт: 9:00 - 17:00</p>
            </div>
          </div>

          {/* 4. Соціальні мережі */}
          <div>
            <div className="font-bold text-sm mb-3 text-white uppercase tracking-wide">Соціальні мережі</div>
            <div className="flex flex-col gap-2">
              {siteConfig.instagramUsername && (
                <a
                  href={`https://www.instagram.com/${siteConfig.instagramUsername}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-white/70 hover:text-[#D4AF37] text-sm transition-colors"
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
                  className="flex items-center gap-2 text-white/70 hover:text-[#D4AF37] text-sm transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                  </svg>
                  Telegram
                </a>
              )}
              {siteConfig.tiktokUsername && (
                <a
                  href={`https://www.tiktok.com/@${siteConfig.tiktokUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-white/70 hover:text-[#D4AF37] text-sm transition-colors"
                >
                  <TikTokIcon size={14} />
                  TikTok
                </a>
              )}
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
