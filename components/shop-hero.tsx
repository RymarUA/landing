"use client";
import { Instagram, Facebook, ChevronDown } from "lucide-react";

function TikTokIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.73a4.85 4.85 0 0 1-1.01-.04z" />
    </svg>
  );
}

const categories = [
  {
    label: "Для чоловіків",
    sub: "від 850 грн",
    color: "from-slate-700 to-slate-900",
    textColor: "text-sky-300",
    image: "https://lrggyvioreorxttbasgi.supabase.co/storage/v1/object/public/app-assets/9586/images/1772177782851-sneakers-hero",
    href: "#catalog",
  },
  {
    label: "Для жінок",
    sub: "від 750 грн",
    color: "from-rose-700 to-rose-900",
    textColor: "text-rose-200",
    image: "https://lrggyvioreorxttbasgi.supabase.co/storage/v1/object/public/app-assets/9586/images/1772177782851-sneakers-hero",
    href: "#catalog",
  },
  {
    label: "Для дітей",
    sub: "від 350 грн",
    color: "from-amber-600 to-amber-800",
    textColor: "text-amber-200",
    image: "https://lrggyvioreorxttbasgi.supabase.co/storage/v1/object/public/app-assets/9586/images/1772177785940-toys-product",
    href: "#catalog",
  },
  {
    label: "Іграшки",
    sub: "від 120 грн",
    color: "from-yellow-600 to-orange-700",
    textColor: "text-yellow-200",
    image: "https://lrggyvioreorxttbasgi.supabase.co/storage/v1/object/public/app-assets/9586/images/1772177785940-toys-product",
    href: "#catalog",
  },
  {
    label: "Для дому",
    sub: "від 95 грн",
    color: "from-emerald-700 to-teal-900",
    textColor: "text-emerald-200",
    image: "https://lrggyvioreorxttbasgi.supabase.co/storage/v1/object/public/app-assets/9586/images/1772177786810-home-accessories",
    href: "#catalog",
  },
  {
    label: "Для авто",
    sub: "від 120 грн",
    color: "from-gray-700 to-gray-900",
    textColor: "text-green-300",
    image: "https://lrggyvioreorxttbasgi.supabase.co/storage/v1/object/public/app-assets/9586/images/1772177787276-auto-accessories",
    href: "#catalog",
  },
];

export function ShopHero() {
  return (
    <section className="relative min-h-screen flex flex-col bg-gray-950 overflow-hidden">
      {/* ── Background collage ─────────────────────── */}
      <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 opacity-25">
        {categories.map((c, i) => (
          <div key={i} className="overflow-hidden">
            <img
              src={c.image}
              alt=""
              className="w-full h-full object-cover scale-110"
            />
          </div>
        ))}
      </div>
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950/80 via-gray-950/70 to-gray-950/90" />

      {/* ── Main content ──────────────────────────── */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pt-16 pb-8 text-center">
        {/* Logo */}
        <img
          src="/logo.png"
          alt="FamilyHub Market"
          className="h-20 md:h-28 w-auto mb-6 drop-shadow-2xl"
        />

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-4 leading-none">
          <span className="text-white">Family</span>
          <span className="text-rose-500">Hub</span>
          <br className="md:hidden" />
          <span className="text-white"> Market</span>
        </h1>

        {/* Tagline */}
        <p className="text-gray-300 text-lg md:text-xl max-w-xl mb-6 font-medium">
          Одяг, іграшки, товари для дому та авто —<br className="hidden md:block" />
          <span className="text-amber-400 font-bold"> доставка по всій Україні</span>
        </p>

        {/* Live badge */}
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-bold px-5 py-2 rounded-full mb-10">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
          </span>
          Нова Пошта · Доставка 1–3 дні
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-lg justify-center mb-12">
          <a
            href="#catalog"
            className="flex items-center justify-center gap-2 flex-1 bg-rose-500 hover:bg-rose-600 text-white font-black px-8 py-4 rounded-2xl shadow-xl shadow-rose-500/30 hover:shadow-rose-500/50 hover:scale-105 transition-all duration-300 text-lg"
          >
            Перейти до каталогу
          </a>
          <a
            href="https://www.instagram.com/familyhub_market/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 flex-1 bg-white/10 backdrop-blur-sm border border-white/30 hover:bg-white/20 text-white font-bold px-8 py-4 rounded-2xl transition-all duration-300 text-lg"
          >
            <Instagram size={22} />
            Instagram
          </a>
        </div>

        {/* Social row */}
        <div className="flex items-center gap-3 mb-10">
          <span className="text-gray-500 text-sm">Слідкуйте за нами:</span>
          <a
            href="https://www.instagram.com/familyhub_market/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 bg-white/10 hover:bg-rose-500/80 border border-white/20 rounded-xl flex items-center justify-center text-white transition-all duration-200 hover:scale-110"
            title="Instagram"
          >
            <Instagram size={18} />
          </a>
          <a
            href="https://www.facebook.com/familyhubmarketod"
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 bg-white/10 hover:bg-blue-600/80 border border-white/20 rounded-xl flex items-center justify-center text-white transition-all duration-200 hover:scale-110"
            title="Facebook"
          >
            <Facebook size={18} />
          </a>
          <a
            href="https://www.tiktok.com/@familyhub_market"
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 bg-white/10 hover:bg-white/30 border border-white/20 rounded-xl flex items-center justify-center text-white transition-all duration-200 hover:scale-110"
            title="TikTok"
          >
            <TikTokIcon size={18} />
          </a>
        </div>
      </div>

      {/* ── Category cards ────────────────────────── */}
      <div className="relative z-10 px-4 pb-16">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-gray-400 text-sm font-semibold uppercase tracking-widest mb-5">
            Категорії
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {categories.map((cat, i) => (
              <a
                key={i}
                href={cat.href}
                className="relative rounded-2xl overflow-hidden group cursor-pointer"
              >
                <img
                  src={cat.image}
                  alt={cat.label}
                  className="w-full h-28 md:h-32 object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${cat.color} opacity-70 group-hover:opacity-80 transition-opacity`} />
                <div className="absolute inset-0 flex flex-col items-center justify-end p-3 text-center">
                  <span className="text-white font-bold text-sm leading-tight">{cat.label}</span>
                  <span className={`${cat.textColor} text-xs font-black`}>{cat.sub}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll hint */}
      <a
        href="#new-arrivals"
        className="relative z-10 flex flex-col items-center gap-1 pb-6 text-gray-500 hover:text-white transition-colors"
      >
        <span className="text-xs">Гортайте вниз</span>
        <ChevronDown size={16} className="animate-bounce" />
      </a>
    </section>
  );
}
