// @ts-nocheck
"use client";
import { Instagram, Phone } from "lucide-react";
import { TikTokIcon } from "./icons/tiktok-icon";
import { siteConfig } from "@/lib/site-config";

export function ShopFooter() {
  return (
    <footer className="bg-emerald-900 text-white py-6 sm:py-8 px-3 sm:px-4 mt-auto">
      <div className="max-w-6xl mx-auto">
        {/* 4 колонки */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-4 sm:mb-6">
          {/* 1. Магазин */}
          <div>
            <div className="font-bold text-xs sm:text-sm mb-2 sm:mb-3 text-white uppercase tracking-wide">Наш магазин</div>
            <p className="text-white/80 text-xs sm:text-sm leading-relaxed">
              {siteConfig.name} — це перевірені товари, приємне обслуговування та швидка доставка по всій Україні.
            </p>
            <div className="mt-3 space-y-1.5 text-[10px] sm:text-xs text-white/70">
              <p className="flex items-center gap-1.5 sm:gap-2">
                <span className="inline-flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-white/10 text-[10px] sm:text-[11px] text-[#D4AF37] font-semibold">
                  24/7
                </span>
                Онлайн-підтримка
              </p>
              <p className="flex items-center gap-1.5 sm:gap-2">
                <span className="inline-flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-white/10 text-[10px] sm:text-[11px] text-[#D4AF37] font-semibold">
                  48h
                </span>
                Середній час доставки
              </p>
            </div>
          </div>

          {/* 2. Підтримка */}
          <div>
            <div className="font-bold text-xs sm:text-sm mb-2 sm:mb-3 text-white uppercase tracking-wide">Підтримка</div>
            <div className="flex flex-col gap-1.5 sm:gap-2">
              <a href="/about" className="text-white/70 hover:text-[#D4AF37] text-xs sm:text-sm transition-colors">
                Повернення
              </a>
              <a href="/about" className="text-white/70 hover:text-[#D4AF37] text-xs sm:text-sm transition-colors">
                Доставка
              </a>
              <a href="/about" className="text-white/70 hover:text-[#D4AF37] text-xs sm:text-sm transition-colors">
                Оплата
              </a>
              <a href="/about" className="text-white/70 hover:text-[#D4AF37] text-xs sm:text-sm transition-colors">
                Гарантія
              </a>
            </div>
          </div>

          {/* 3. Контакти */}
          <div>
            <div className="font-bold text-xs sm:text-sm mb-2 sm:mb-3 text-white uppercase tracking-wide">Контакти</div>
            <div className="flex flex-col gap-1.5 sm:gap-2">
              {siteConfig.phone && (
                <a
                  href={`tel:${siteConfig.phone}`}
                  className="flex items-center gap-1.5 sm:gap-2 text-white/70 hover:text-[#D4AF37] text-xs sm:text-sm transition-colors"
                >
                  <Phone size={12} className="sm:w-3.5 sm:h-3.5 text-[#D4AF37]" />
                  {siteConfig.phone}
                </a>
              )}
              <p className="text-white/70 text-xs sm:text-sm">м. Одеса, Україна</p>
              <p className="text-white/70 text-xs sm:text-sm">Пн-Пт: 9:00 - 17:00</p>
            </div>
          </div>

          {/* 4. Соціальні мережі */}
          <div>
            <div className="font-bold text-xs sm:text-sm mb-2 sm:mb-3 text-white uppercase tracking-wide">Соцмережі</div>
            <div className="flex flex-col gap-1.5 sm:gap-2">
              {siteConfig.instagramUsername && (
                <a
                  href={`https://www.instagram.com/${siteConfig.instagramUsername}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 sm:gap-2 text-white/70 hover:text-[#D4AF37] text-xs sm:text-sm transition-colors"
                >
                  <Instagram size={12} className="sm:w-3.5 sm:h-3.5" />
                  Instagram
                </a>
              )}
              {siteConfig.telegramUsername && (
                <a
                  href={`https://t.me/${siteConfig.telegramUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 sm:gap-2 text-white/70 hover:text-[#D4AF37] text-xs sm:text-sm transition-colors"
                >
                  <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="currentColor" viewBox="0 0 24 24">
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
                  className="flex items-center gap-1.5 sm:gap-2 text-white/70 hover:text-[#D4AF37] text-xs sm:text-sm transition-colors"
                >
                  <TikTokIcon size={12} className="sm:w-3.5 sm:h-3.5" />
                  TikTok
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Нижня частина */}
        <div className="pt-3 sm:pt-4 border-t border-white/20 flex flex-col sm:flex-row items-center justify-between gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-white/60">
          <p>© 2026 {siteConfig.name}. Всі права захищені.</p>
          <p>Доставка по всій Україні</p>
        </div>
      </div>
    </footer>
  );
}
