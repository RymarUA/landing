"use client";
import { Instagram, Facebook } from "lucide-react";

// TikTok SVG icon (not in lucide-react)
function TikTokIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.73a4.85 4.85 0 0 1-1.01-.04z"/>
    </svg>
  );
}

export function ShopHero() {
  return (
    <section className="bg-white pt-12 pb-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header с логотипом и названием — выделяем название */}
        <div className="text-center mb-12">
          <div className="flex flex-col items-center gap-4">
            {/* Логотип */}
            <img
              src="/logo.png"
              alt="FamilyHub Market"
              className="h-24 w-auto md:h-40"
            />

            {/* Название магазина — крупнее и ярче */}
            <h1 className="text-5xl md:text-7xl font-extrabold text-rose-600 tracking-tight">
              FamilyHub Market
            </h1>

            {/* Бейджик доставка */}
            <div className="inline-flex items-center gap-2 bg-rose-50 text-rose-600 text-sm font-bold px-5 py-2 rounded-full mt-2 tracking-wide uppercase border border-rose-100">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              ДОСТАВКА ПО УКРАЇНІ
            </div>
          </div>
        </div>

        {/* Product grid — 6 карточек: 3 одяг + 3 других */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-16">
          {/* Одяг — Для чоловіків */}
          <div className="relative rounded-2xl overflow-hidden shadow-lg group">
            <img
              src="https://lrggyvioreorxttbasgi.supabase.co/storage/v1/object/public/app-assets/9586/images/1772177782851-sneakers-hero"
              alt="Для чоловіків"
              className="w-full h-64 md:h-80 object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
              <span className="text-white font-bold text-lg md:text-xl">Для чоловіків</span>
              <div className="text-rose-300 font-black text-xl md:text-2xl">від 850 грн</div>
            </div>
          </div>

          {/* Одяг — Для жінок */}
          <div className="relative rounded-2xl overflow-hidden shadow-lg group">
            <img
              src="https://lrggyvioreorxttbasgi.supabase.co/storage/v1/object/public/app-assets/9586/images/1772177782851-sneakers-hero"
              alt="Для жінок"
              className="w-full h-64 md:h-80 object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
              <span className="text-white font-bold text-lg md:text-xl">Для жінок</span>
              <div className="text-pink-300 font-black text-xl md:text-2xl">від 750 грн</div>
            </div>
          </div>

          {/* Одяг — Для дітей */}
          <div className="relative rounded-2xl overflow-hidden shadow-lg group">
            <img
              src="https://lrggyvioreorxttbasgi.supabase.co/storage/v1/object/public/app-assets/9586/images/1772177785940-toys-product"
              alt="Для дітей"
              className="w-full h-64 md:h-80 object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
              <span className="text-white font-bold text-lg md:text-xl">Для дітей</span>
              <div className="text-yellow-300 font-black text-xl md:text-2xl">від 350 грн</div>
            </div>
          </div>

          {/* Іграшки */}
          <div className="relative rounded-2xl overflow-hidden shadow-md group">
            <img
              src="https://lrggyvioreorxttbasgi.supabase.co/storage/v1/object/public/app-assets/9586/images/1772177785940-toys-product"
              alt="Іграшки"
              className="w-full h-64 md:h-80 object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
              <span className="text-white font-bold text-lg md:text-xl">Іграшки</span>
              <div className="text-yellow-300 font-black text-xl md:text-2xl">від 120 грн</div>
            </div>
          </div>

          {/* Для дому */}
          <div className="relative rounded-2xl overflow-hidden shadow-md group">
            <img
              src="https://lrggyvioreorxttbasgi.supabase.co/storage/v1/object/public/app-assets/9586/images/1772177786810-home-accessories"
              alt="Дім"
              className="w-full h-64 md:h-80 object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
              <span className="text-white font-bold text-lg md:text-xl">Для дому</span>
              <div className="text-blue-300 font-black text-xl md:text-2xl">від 95 грн</div>
            </div>
          </div>

          {/* Для авто */}
          <div className="relative rounded-2xl overflow-hidden shadow-md group">
            <img
              src="https://lrggyvioreorxttbasgi.supabase.co/storage/v1/object/public/app-assets/9586/images/1772177787276-auto-accessories"
              alt="Авто"
              className="w-full h-64 md:h-80 object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
              <span className="text-white font-bold text-lg md:text-xl">Для авто</span>
              <div className="text-green-300 font-black text-xl md:text-2xl">від 150 грн</div>
            </div>
          </div>
        </div>

        {/* CTA Buttons — 3 кнопки одинакового размера */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center flex-wrap">
          {/* Instagram */}
          <a
            href="https://www.instagram.com/familyhub_market/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold px-8 py-4 rounded-2xl shadow-xl hover:shadow-rose-300 hover:scale-105 transition-all duration-300 text-lg w-full sm:w-auto sm:min-w-[220px]"
          >
            <Instagram size={24} />
            Наш Instagram
          </a>

          {/* Facebook */}
          <a
            href="https://www.facebook.com/familyhubmarketod"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold px-8 py-4 rounded-2xl shadow-xl hover:shadow-blue-300 hover:scale-105 transition-all duration-300 text-lg w-full sm:w-auto sm:min-w-[220px]"
          >
            <Facebook size={24} />
            Наш Facebook
          </a>

          {/* TikTok */}
          <a
            href="https://www.tiktok.com/@familyhub_market"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 bg-gradient-to-r from-gray-900 to-gray-700 text-white font-bold px-8 py-4 rounded-2xl shadow-xl hover:shadow-gray-400 hover:scale-105 transition-all duration-300 text-lg w-full sm:w-auto sm:min-w-[220px]"
          >
            <TikTokIcon size={24} />
            Наш TikTok
          </a>
        </div>
      </div>
    </section>
  );
}
