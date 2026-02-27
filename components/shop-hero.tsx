"use client";
import { Instagram, Send, Facebook } from "lucide-react";

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
              className="h-24 w-auto md:h-40"   // Вариант 4 — очень большой, премиум-вид
            />

            {/* Название магазина — крупнее и ярче */}
            <h1 className="text-5xl md:text-7xl font-extrabold text-rose-600 tracking-tight">
              FamilyHub Market
            </h1>

            {/* Подзаголовок — чуть меньше и серый */}
            <p className="text-xl md:text-2xl text-gray-700 font-medium max-w-3xl">
              Доставка ексклюзивних товарів з Китаю в Україну
            </p>

            {/* Бейджик Одесса */}
            {/* Обновленный бейджик */}
            <div className="inline-flex items-center gap-2 bg-rose-50 text-rose-600 text-sm font-bold px-5 py-2 rounded-full mt-2 tracking-wide uppercase border border-rose-100">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              ОДЕСА · ДОСТАВКА ПО УКРАЇНІ
            </div>
          </div>
        </div>

        {/* Product grid — все 4 карточки строго одинаковые */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-16">
          {/* Кросівки */}
          <div className="relative rounded-2xl overflow-hidden shadow-lg group">
            <img
              src="https://lrggyvioreorxttbasgi.supabase.co/storage/v1/object/public/app-assets/9586/images/1772177782851-sneakers-hero"
              alt="Жіночі кросівки"
              className="w-full h-64 md:h-80 object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
              <span className="text-white font-bold text-lg md:text-xl">Одяг</span>
              <div className="text-rose-300 font-black text-xl md:text-2xl">від 850 грн</div>
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

        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center gap-6 px-8 py-5 bg-gradient-to-r from-rose-50 to-pink-50 rounded-full shadow-md border border-rose-100">
            <h3 className="text-5xl font-extrabold text-rose-600">500+</h3>
            <div>
              <p className="text-lg font-medium text-gray-800">задоволених клієнтів</p>
              <p className="text-sm text-gray-600">з Одеси та всієї України</p>
            </div>
          </div>
        </div>

        {/* CTA Buttons — одинаковые по ширине и размеру */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          {/* Instagram */}
          <a
            href="https://www.instagram.com/familyhub_market/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold px-10 py-5 rounded-2xl shadow-xl hover:shadow-rose-300 hover:scale-105 transition-all duration-300 text-xl min-w-[260px] md:min-w-[280px]"
          >
            <Instagram size={28} />
            Наш Instagram
          </a>

          {/* Facebook */}
          <a
            href="https://www.facebook.com/familyhubmarketod"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold px-10 py-5 rounded-2xl shadow-xl hover:shadow-blue-300 hover:scale-105 transition-all duration-300 text-xl min-w-[260px] md:min-w-[280px]"
          >
            <Facebook size={28} />
            Наш Facebook
          </a>
        </div>
      </div>
    </section>
  );
}