// @ts-nocheck
"use client";
import { useState } from "react";
import Link from "next/link";
import { Instagram, MapPin, Phone, ChevronRight, Check, Loader2 } from "lucide-react";
import { siteConfig } from "@/lib/site-config";

// Build category links from siteConfig — stays in sync with catalog tabs and Sitniks
const catalogLinks = siteConfig.catalogCategories
  .filter((c) => c !== "Всі")
  .map((label) => ({ label, href: `/?category=${encodeURIComponent(label)}#catalog`, "aria-label": `Перейти до категорії '${label}'` }));

const infoLinks = [
  { label: "Про нас", href: "/about" },
  { label: "Доставка та оплата", href: "#tracking" },
  { label: "Умови повернення", href: "#faq" },
  { label: "Відстеження посилки", href: "#tracking" },
  { label: "Часті запитання", href: "#faq" },
];

export function ShopFooter() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [subLoading, setSubLoading] = useState(false);
  const [subError, setSubError] = useState("");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubLoading(true);
    setSubError("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setSubscribed(true);
        setEmail("");
      } else {
        const data = await res.json().catch(() => ({}));
        setSubError(data.error ?? "Помилка. Спробуйте ще раз.");
      }
    } catch {
      setSubError("Помилка мережі. Спробуйте ще раз.");
    } finally {
      setSubLoading(false);
    }
  };

  return (
    <footer className="relative overflow-hidden bg-emerald-900/95 backdrop-blur">
      {/* Top gradient border */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37]/60 to-transparent" />

      {/* Ambient glow — top right */}
      <div className="absolute top-0 right-0 w-[500px] h-[300px] rounded-full bg-[#D4AF37]/5 blur-3xl pointer-events-none" />
      {/* Ambient glow — bottom left */}
      <div className="absolute bottom-0 left-0 w-[400px] h-[250px] rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">

          {/* ── Brand ── */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3 mb-3">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#D4AF37]/50 bg-emerald-700 text-white text-lg font-bold shadow-md flex-shrink-0">
                ЗС
              </span>
              <div className="leading-tight">
                <div className="text-xl font-bold text-white">
                  Здоров&apos;я Сходу
                </div>
                <div className="text-xs text-white/70 font-medium">
                  Ритуали турботи щодня
                </div>
              </div>
            </div>
            <p className="text-white/70 text-sm leading-relaxed mb-3">
              Ритуали східної медицини для дому та клініки. Персональні рекомендації від експертів.
            </p>

            {/* Social icons */}
            <div className="flex gap-2">
              {siteConfig.instagramUsername && (
                <a
                  href={`https://www.instagram.com/${siteConfig.instagramUsername}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white/90 hover:bg-white/20 transition shadow-sm flex items-center gap-2"
                  title="Instagram"
                >
                  <Instagram size={14} />
                  <span className="hidden sm:inline">Instagram</span>
                </a>
              )}
              {siteConfig.telegramUsername && (
                <a
                  href={`https://t.me/${siteConfig.telegramUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white/90 hover:bg-white/20 transition shadow-sm flex items-center gap-2"
                  title="Telegram"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                  </svg>
                  <span className="hidden sm:inline">Telegram</span>
                </a>
              )}
            </div>
          </div>

          {/* ── Catalog ── */}
          <div>
            <div className="font-bold text-xs mb-3 text-white/60 uppercase tracking-widest">Каталог</div>
            <ul className="space-y-1.5">
              {catalogLinks.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="flex items-center gap-2 text-white/70 hover:text-[#D4AF37] text-sm transition-colors group"
                  >
                    <ChevronRight size={12} className="text-[#D4AF37]/0 group-hover:text-[#D4AF37] transition-all -ml-1 group-hover:ml-0" />
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Info ── */}
          <div>
            <div className="font-bold text-xs mb-3 text-white/60 uppercase tracking-widest">Інформація</div>
            <ul className="space-y-1.5">
              {infoLinks.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="flex items-center gap-2 text-white/70 hover:text-[#D4AF37] text-sm transition-colors group"
                  >
                    <ChevronRight size={12} className="text-[#D4AF37]/0 group-hover:text-[#D4AF37] transition-all -ml-1 group-hover:ml-0" />
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>

            <div className="mt-4 space-y-1.5">
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <MapPin size={14} className="text-[#D4AF37] flex-shrink-0" />
                Україна
              </div>
              {siteConfig.phone && (
                <div className="flex items-center gap-2 text-white/70 text-sm">
                  <Phone size={13} className="text-[#D4AF37] flex-shrink-0" />
                  <a href={`tel:${siteConfig.phone}`} className="hover:text-[#D4AF37] transition-colors">
                    {siteConfig.phone}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* ── Newsletter ── */}
          <div>
            <div className="font-bold text-xs mb-3 text-white/60 uppercase tracking-widest">Знижки на пошту</div>
            <p className="text-white/70 text-sm mb-3 leading-relaxed">
              Підпишіться та першими дізнавайтесь про акції та нові надходження.
            </p>

            {subscribed ? (
              <div className="flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 rounded-full px-4 py-3 text-sm font-semibold">
                <Check size={15} />
                Дякуємо за підписку!
              </div>  
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setSubError(""); }}
                  placeholder="your@email.com"
                  required
                  disabled={subLoading}
                  className="w-full bg-white text-gray-900 placeholder-gray-500 rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] shadow-sm transition disabled:opacity-60"
                />
                {subError && (
                  <p className="text-red-300 text-xs px-1">{subError}</p>
                )}
                <button
                  type="submit"
                  disabled={subLoading}
                  className="w-full flex items-center justify-center gap-2 bg-[#D4AF37] hover:bg-[#C49B2D] disabled:opacity-60 text-emerald-900 font-bold py-3 rounded-full text-sm transition-colors shadow-md"
                >
                  {subLoading ? (
                    <><Loader2 size={14} className="animate-spin" /> Завантаження…</>
                  ) : (
                    "Підписатися"
                  )}
                </button>
              </form>
            )}

            <p className="text-white/50 text-xs mt-3">
              Без спаму. Відписатися можна будь-коли.
            </p>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div className="pt-4 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-white/50 text-xs">© 2026 {siteConfig.name}. Всі права захищені.</p>
          <div className="flex items-center gap-4 text-white/50 text-xs">
            <a href="#" className="hover:text-white/70 transition-colors">Політика конфіденційності</a>
            <span>·</span>
            <a href="#" className="hover:text-white/70 transition-colors">Умови використання</a>
            <span>·</span>
            <span>Доставка по всій Україні</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

