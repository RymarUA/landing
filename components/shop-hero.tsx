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
    color: "from-slate-600/75 to-slate-900/85",
    textColor: "text-sky-200",
    image: "https://lrggyvioreorxttbasgi.supabase.co/storage/v1/object/public/app-assets/9586/images/1772177782851-sneakers-hero",
    catalogSlug: "Для чоловіків",
  },
  {
    label: "Для жінок",
    sub: "від 750 грн",
    color: "from-rose-400/75 to-rose-800/85",
    textColor: "text-rose-100",
    image: "https://lrggyvioreorxttbasgi.supabase.co/storage/v1/object/public/app-assets/9586/images/1772177782851-sneakers-hero",
    catalogSlug: "Для жінок",
  },
  {
    label: "Для дітей",
    sub: "від 350 грн",
    color: "from-amber-400/75 to-amber-700/85",
    textColor: "text-amber-100",
    image: "https://lrggyvioreorxttbasgi.supabase.co/storage/v1/object/public/app-assets/9586/images/1772177785940-toys-product",
    catalogSlug: "Для дітей",
  },
  {
    label: "Іграшки",
    sub: "від 120 грн",
    color: "from-orange-400/75 to-orange-700/85",
    textColor: "text-orange-100",
    image: "https://lrggyvioreorxttbasgi.supabase.co/storage/v1/object/public/app-assets/9586/images/1772177785940-toys-product",
    catalogSlug: "Іграшки",
  },
  {
    label: "Для дому",
    sub: "від 95 грн",
    color: "from-teal-500/75 to-teal-800/85",
    textColor: "text-teal-100",
    image: "https://lrggyvioreorxttbasgi.supabase.co/storage/v1/object/public/app-assets/9586/images/1772177786810-home-accessories",
    catalogSlug: "Дім",
  },
  {
    label: "Для авто",
    sub: "від 120 грн",
    color: "from-stone-500/75 to-stone-800/85",
    textColor: "text-stone-200",
    image: "https://lrggyvioreorxttbasgi.supabase.co/storage/v1/object/public/app-assets/9586/images/1772177787276-auto-accessories",
    catalogSlug: "Авто",
  },
];

export function ShopHero() {
  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden">

      {/* ── Soft peach-beige background ── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(145deg, #fdf6f0 0%, #fdecd8 30%, #fce8e0 60%, #fdf0e8 100%)",
        }}
      />

      {/* Soft organic glow shapes */}
      <div
        className="absolute top-[-80px] right-[-80px] w-[520px] h-[520px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(251,191,105,0.22) 0%, rgba(253,186,116,0.10) 55%, transparent 75%)",
        }}
      />
      <div
        className="absolute bottom-[-60px] left-[-60px] w-[420px] h-[420px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(253,186,116,0.18) 0%, transparent 65%)",
        }}
      />
      <div
        className="absolute top-[38%] left-[12%] w-[280px] h-[280px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(252,165,165,0.14) 0%, transparent 65%)",
        }}
      />

      {/* Subtle dot texture */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #92400e 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* ── Main content ── */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pt-16 pb-8 text-center">

        {/* Logo */}
        <img
          src="/logo.png"
          alt="FamilyHub Market"
          className="h-20 md:h-28 w-auto mb-6 drop-shadow"
        />

        {/* Headline */}
        <h1
          className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-4 leading-none"
          style={{ color: "#1c1917" }}
        >
          Family
          <span style={{ color: "#f97316" }}>Hub</span>
          <br className="md:hidden" />
          {" "}Market
        </h1>

        {/* Tagline */}
        <p
          className="text-lg md:text-xl max-w-xl mb-6 font-medium"
          style={{ color: "#78716c" }}
        >
          Одяг, іграшки, товари для дому та авто
        </p>

        {/* Live badge */}
        <div
          className="inline-flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-full mb-10"
          style={{
            background: "rgba(255,255,255,0.75)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(251,146,60,0.3)",
            color: "#78716c",
            boxShadow: "0 2px 12px rgba(249,115,22,0.10)",
          }}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
          </span>
          Доставка по всій Україні
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg justify-center mb-12">
          <a
            href="#catalog"
            className="flex items-center justify-center gap-3 flex-1 text-white font-bold px-8 py-5 rounded-2xl text-lg min-w-[240px] transition-all duration-300 hover:scale-[1.02]"
            style={{
              background: "linear-gradient(135deg, #f97316, #fb923c)",
              boxShadow: "0 8px 24px rgba(249,115,22,0.32)",
            }}
          >
            Перейти до каталогу
          </a>
          <a
            href="https://www.instagram.com/familyhub_market/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 flex-1 font-bold px-8 py-5 rounded-2xl text-lg min-w-[240px] transition-all duration-300 hover:scale-[1.02]"
            style={{
              background: "rgba(255,255,255,0.80)",
              backdropFilter: "blur(8px)",
              border: "1.5px solid rgba(251,146,60,0.30)",
              color: "#44403c",
              boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
            }}
          >
            <Instagram size={22} style={{ color: "#f43f5e" }} />
            Написати в Direct
          </a>
        </div>

        {/* Social row */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
          <span className="text-sm font-medium mr-1" style={{ color: "#a8a29e" }}>
            Слідкуйте за нами:
          </span>
          <a
            href="https://www.instagram.com/familyhub_market/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-11 h-11 rounded-xl flex items-center justify-center text-white transition-all duration-300 hover:scale-110"
            style={{
              background: "linear-gradient(135deg,#f43f5e,#ec4899)",
              boxShadow: "0 4px 12px rgba(244,63,94,0.28)",
            }}
            title="Instagram"
          >
            <Instagram size={20} />
          </a>
          <a
            href="https://www.facebook.com/familyhubmarketod"
            target="_blank"
            rel="noopener noreferrer"
            className="w-11 h-11 rounded-xl flex items-center justify-center text-white transition-all duration-300 hover:scale-110"
            style={{
              background: "linear-gradient(135deg,#3b82f6,#1d4ed8)",
              boxShadow: "0 4px 12px rgba(59,130,246,0.26)",
            }}
            title="Facebook"
          >
            <Facebook size={20} />
          </a>
          <a
            href="https://www.tiktok.com/@familyhub_market"
            target="_blank"
            rel="noopener noreferrer"
            className="w-11 h-11 rounded-xl flex items-center justify-center text-white transition-all duration-300 hover:scale-110"
            style={{
              background: "#1c1917",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}
            title="TikTok"
          >
            <TikTokIcon size={20} />
          </a>
        </div>
      </div>

      {/* ── Category cards ── */}
      <div className="relative z-10 px-4 pb-16">
        <div className="max-w-6xl mx-auto">
          <p
            className="text-center text-xs font-bold uppercase tracking-widest mb-5"
            style={{ color: "#a8a29e" }}
          >
            Категорії
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {categories.map((cat, i) => (
              <a
                key={i}
                href={`#catalog?category=${encodeURIComponent(cat.catalogSlug)}`}
                className="relative rounded-2xl overflow-hidden group cursor-pointer transition-all duration-300 hover:-translate-y-1"
                style={{ boxShadow: "0 4px 14px rgba(0,0,0,0.09)" }}
              >
                <img
                  src={cat.image}
                  alt={cat.label}
                  className="w-full h-28 md:h-32 object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${cat.color}`} />
                <div className="absolute inset-0 flex flex-col items-center justify-end p-3 text-center">
                  <span className="text-white font-bold text-sm leading-tight drop-shadow-sm">
                    {cat.label}
                  </span>
                  <span className={`${cat.textColor} text-xs font-black drop-shadow-sm`}>
                    {cat.sub}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll hint */}
      <a
        href="#new-arrivals"
        className="relative z-10 flex flex-col items-center gap-1 pb-8 transition-colors"
      >
        <span className="text-xs font-medium" style={{ color: "#a8a29e" }}>
          Гортайте вниз
        </span>
        <ChevronDown size={18} className="animate-bounce" style={{ color: "#a8a29e" }} />
      </a>
    </section>
  );
}
