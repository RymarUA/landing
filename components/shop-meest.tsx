"use client";
import { Package, Clock, MapPin, CheckCircle } from "lucide-react";

export function ShopMeest() {
  const steps = [
    { icon: <Package size={22} />, title: "Замовлення з Китаю", desc: "Ми відбираємо товари від перевірених постачальників" },
    { icon: <Clock size={22} />, title: "Доставка Meest", desc: "Посилка летить через Meest Express — швидко та надійно" },
    { icon: <MapPin size={22} />, title: "Отримання в Одесі", desc: "Забираєте у відділенні або замовляєте кур'єра" },
    { icon: <CheckCircle size={22} />, title: "Розпакування разом", desc: "Знімаємо відео розпакування — ви бачите товар до отримання" },
  ];

  return (
    <section className="bg-white py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          {/* Left: image */}
          <div className="relative">
            <div className="bg-gradient-to-br from-rose-50 to-pink-100 rounded-3xl p-6 flex items-center justify-center min-h-64">
              <div className="text-center">
                <div className="text-7xl mb-4">📦</div>
                <div className="bg-white rounded-2xl shadow-md px-6 py-4 inline-block">
                  <div className="text-xs text-gray-400 mb-1">Meest Express</div>
                  <div className="font-black text-gray-900 text-lg">Ваша посилка в дорозі!</div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-green-600 text-sm font-semibold">Відстежується онлайн</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -top-3 -right-3 bg-rose-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow">
              Meest Partner
            </div>
          </div>

          {/* Right: steps */}
          <div>
            <div className="inline-flex items-center gap-2 bg-rose-50 text-rose-500 text-xs font-semibold px-3 py-1 rounded-full mb-4 tracking-widest uppercase">
              Як це працює
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-6">
              Розпакування<br />
              <span className="text-rose-500">прямо з Meest</span>
            </h2>
            <div className="space-y-4">
              {steps.map((step, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center">
                    {step.icon}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-sm">{step.title}</div>
                    <div className="text-gray-500 text-sm">{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div className="text-amber-700 font-semibold text-sm">🎥 Знімаємо відео розпакування кожної посилки — ніяких сюрпризів!</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
