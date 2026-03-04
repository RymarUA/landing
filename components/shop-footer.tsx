"use client";
import { useState } from "react";
import Link from "next/link";
import { Instagram, Facebook, MapPin, Phone, Mail, ChevronRight, Check, Heart, Loader2 } from "lucide-react";
import { siteConfig } from "@/lib/site-config";

function TikTokIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.73a4.85 4.85 0 0 1-1.01-.04z" />
    </svg>
  );
}

// Build category links from siteConfig — stays in sync with catalog tabs and Sitniks
const catalogLinks = siteConfig.catalogCategories
  .filter((c) => c !== "Всі")
  .map((label) => ({ label, href: `/#catalog#category=${encodeURIComponent(label)}` }));

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
    <footer
      className="relative overflow-hidden"
      style={{
        background: "linear-gradient(160deg, #1c1917 0%, #292524 50%, #1c1917 100%)",
      }}
    >
      {/* Top warm gradient border */}
      <div className="h-px bg-gradient-to-r from-transparent via-orange-500/60 to-transparent" />

      {/* Warm ambient glow — top right */}
      <div className="absolute top-0 right-0 w-[500px] h-[300px] rounded-full bg-orange-500/5 blur-3xl pointer-events-none" />
      {/* Warm ambient glow — bottom left */}
      <div className="absolute bottom-0 left-0 w-[400px] h-[250px] rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

          {/* ── Brand ── */}
          <div className="sm:col-span-2 lg:col-span-1">
            <img src="/logo.png" alt="FamilyHub Market" className="h-12 w-auto mb-4" />
            <div className="text-xl font-black mb-3 text-white">
              FamilyHub<span className="text-orange-400">Market</span>
            </div>
            <p className="text-stone-400 text-sm leading-relaxed mb-5">
              Якісні товари для всієї родини з доставкою Новою Поштою по всій Україні.
            </p>

            {/* Social icons */}
            <div className="flex gap-3">
              <a
                href="https://www.instagram.com/familyhub_market/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center hover:scale-110 transition-transform shadow-lg shadow-rose-900/30"
                title="Instagram"
              >
                <Instagram size={17} className="text-white" />
              </a>
              <a
                href="https://www.facebook.com/familyhubmarketod"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center hover:scale-110 transition-transform shadow-lg shadow-blue-900/30"
                title="Facebook"
              >
                <Facebook size={17} className="text-white" />
              </a>
              <a
                href="https://www.tiktok.com/@familyhub_market"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-stone-700 hover:bg-stone-600 border border-stone-600 rounded-xl flex items-center justify-center hover:scale-110 transition-all text-white"
                title="TikTok"
              >
                <TikTokIcon size={17} />
              </a>
            </div>
          </div>

          {/* ── Catalog ── */}
          <div>
            <div className="font-bold text-xs mb-5 text-stone-400 uppercase tracking-widest">Каталог</div>
            <ul className="space-y-2.5">
              {catalogLinks.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="flex items-center gap-2 text-stone-400 hover:text-orange-400 text-sm transition-colors group"
                  >
                    <ChevronRight size={12} className="text-orange-500/0 group-hover:text-orange-500 transition-all -ml-1 group-hover:ml-0" />
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Info ── */}
          <div>
            <div className="font-bold text-xs mb-5 text-stone-400 uppercase tracking-widest">Інформація</div>
            <ul className="space-y-2.5">
              {infoLinks.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="flex items-center gap-2 text-stone-400 hover:text-orange-400 text-sm transition-colors group"
                  >
                    <ChevronRight size={12} className="text-orange-500/0 group-hover:text-orange-500 transition-all -ml-1 group-hover:ml-0" />
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>

            <div className="mt-6 space-y-2.5">
              <div className="flex items-center gap-2 text-stone-400 text-sm">
                <MapPin size={13} className="text-orange-400 flex-shrink-0" />
                Одеса, Україна
              </div>
              <div className="flex items-center gap-2 text-stone-400 text-sm">
                <Phone size={13} className="text-orange-400 flex-shrink-0" />
                <a href="tel:+380936174140" className="hover:text-orange-400 transition-colors">
                  +38 (093) 617-41-40
                </a>
              </div>
              <div className="flex items-center gap-2 text-stone-400 text-sm">
                <Mail size={13} className="text-orange-400 flex-shrink-0" />
                <a href="mailto:info@familyhubmarket.ua" className="hover:text-orange-400 transition-colors">
                  info@familyhubmarket.ua
                </a>
              </div>
            </div>
          </div>

          {/* ── Newsletter ── */}
          <div>
            <div className="font-bold text-xs mb-5 text-stone-400 uppercase tracking-widest">Знижки на пошту</div>
            <p className="text-stone-400 text-sm mb-4 leading-relaxed">
              Підпишіться та першими дізнавайтесь про акції та нові надходження.
            </p>

            {subscribed ? (
              <div className="flex items-center gap-2 bg-green-500/15 border border-green-500/25 text-green-400 rounded-xl px-4 py-3 text-sm font-semibold">
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
                  className="w-full bg-stone-800 border border-stone-700 text-white placeholder-stone-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/40 transition disabled:opacity-60"
                />
                {subError && (
                  <p className="text-red-400 text-xs px-1">{subError}</p>
                )}
                <button
                  type="submit"
                  disabled={subLoading}
                  className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm transition-colors shadow-lg shadow-orange-900/30"
                >
                  {subLoading ? (
                    <><Loader2 size={14} className="animate-spin" /> Завантаження…</>
                  ) : (
                    "Підписатися"
                  )}
                </button>
              </form>
            )}

            <p className="text-stone-600 text-xs mt-3">
              Без спаму. Відписатися можна будь-коли.
            </p>

            <Link
              href="/wishlist"
              className="mt-4 flex items-center gap-2 text-stone-500 hover:text-orange-400 text-sm transition-colors group"
            >
              <Heart size={13} className="text-orange-500 group-hover:fill-orange-400 transition-all" />
              Список бажань
            </Link>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div className="border-t border-stone-700/50 pt-8 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-stone-600 text-xs">© 2026 FamilyHub Market. Всі права захищені.</p>
          <div className="flex items-center gap-4 text-stone-600 text-xs">
            <a href="#" className="hover:text-stone-400 transition-colors">Політика конфіденційності</a>
            <span>·</span>
            <a href="#" className="hover:text-stone-400 transition-colors">Умови використання</a>
            <span>·</span>
            <span>Доставка по всій Україні</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
