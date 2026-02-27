"use client";
import { Instagram, Send } from "lucide-react";

export function ShopHero() {
  return (
    <section className="bg-white pt-10 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-rose-50 text-rose-500 text-xs font-semibold px-3 py-1 rounded-full mb-4 tracking-widest uppercase">
            <span className="w-2 h-2 bg-rose-400 rounded-full animate-pulse"></span>
            Одеса · Доставка по Україні
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight mb-3">
            Стильні товари<br />
            <span className="text-rose-500">з Китаю в Одесу</span>
          </h1>
          <p className="text-gray-500 text-base md:text-lg max-w-xl mx-auto">
            Жіночі кросівки, дитячі іграшки, аксесуари для дому та авто — все з доставкою через Meest
          </p>
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          <div className="col-span-2 row-span-2 relative rounded-2xl overflow-hidden shadow-md group">
            <img
              src="https://lrggyvioreorxttbasgi.supabase.co/storage/v1/object/public/app-assets/9586/images/1772177782851-sneakers-hero"
              alt="Жіночі кросівки"
              className="w-full h-64 md:h-80 object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
              <span className="text-white font-bold text-sm">Кросівки</span>
              <div className="text-rose-300 font-black text-lg">від 850 грн</div>
            </div>
          </div>
          <div className="relative rounded-2xl overflow-hidden shadow-md group">
            <img
              src="https://lrggyvioreorxttbasgi.supabase.co/storage/v1/object/public/app-assets/9586/images/1772177785940-toys-product"
              alt="Іграшки"
              className="w-full h-32 md:h-36 object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
              <span className="text-white font-bold text-xs">Іграшки</span>
              <div className="text-yellow-300 font-black text-sm">від 120 грн</div>
            </div>
          </div>
          <div className="relative rounded-2xl overflow-hidden shadow-md group">
            <img
              src="https://lrggyvioreorxttbasgi.supabase.co/storage/v1/object/public/app-assets/9586/images/1772177786810-home-accessories"
              alt="Дім"
              className="w-full h-32 md:h-36 object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
              <span className="text-white font-bold text-xs">Для дому</span>
              <div className="text-blue-300 font-black text-sm">від 95 грн</div>
            </div>
          </div>
          <div className="relative rounded-2xl overflow-hidden shadow-md group">
            <img
              src="https://lrggyvioreorxttbasgi.supabase.co/storage/v1/object/public/app-assets/9586/images/1772177787276-auto-accessories"
              alt="Авто"
              className="w-full h-32 md:h-36 object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
              <span className="text-white font-bold text-xs">Для авто</span>
              <div className="text-green-300 font-black text-sm">від 150 грн</div>
            </div>
          </div>
          <div className="col-span-2 md:col-span-2 bg-gray-50 rounded-2xl flex items-center justify-center p-4">
            <div className="text-center">
              <div className="text-3xl font-black text-gray-900">500+</div>
              <div className="text-gray-500 text-sm">задоволених клієнтів</div>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="https://www.instagram.com/direct/new/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold px-8 py-4 rounded-2xl shadow-lg hover:shadow-rose-200 hover:scale-105 transition-all duration-200 text-base"
          >
            <Instagram size={20} />
            Написати в Direct
          </a>
          <a
            href="https://t.me/your_shop"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-[#229ED9] text-white font-bold px-8 py-4 rounded-2xl shadow-lg hover:shadow-blue-200 hover:scale-105 transition-all duration-200 text-base"
          >
            <Send size={20} />
            Відкрити Telegram
          </a>
        </div>
      </div>
    </section>
  );
}
