"use client";
import { Star } from "lucide-react";

const reviews = [
  {
    name: "Аліна К.",
    avatar: "А",
    color: "bg-rose-400",
    rating: 5,
    text: "Замовляла кросівки — прийшли точно в розмір, якість супер! Відео розпакування дуже сподобалось, все чесно.",
    product: "Кросівки Nike Air",
    date: "2 дні тому",
  },
  {
    name: "Марина Д.",
    avatar: "М",
    color: "bg-violet-400",
    rating: 5,
    text: "Купила іграшки для дитини — вона в захваті! Доставка через Meest швидка, все запаковано акуратно.",
    product: "Набір іграшок Монтессорі",
    date: "5 днів тому",
  },
  {
    name: "Оксана Р.",
    avatar: "О",
    color: "bg-amber-400",
    rating: 5,
    text: "Тримач для телефону в авто — просто знахідка! Ціна дуже приємна, якість не поступається магазинним.",
    product: "Тримач для телефону",
    date: "1 тиждень тому",
  },
  {
    name: "Катерина В.",
    avatar: "К",
    color: "bg-green-400",
    rating: 5,
    text: "Вже третє замовлення! Завжди все приходить вчасно, продавець на зв'язку, відповідає швидко в Direct.",
    product: "Декоративні свічки",
    date: "2 тижні тому",
  },
  {
    name: "Юлія С.",
    avatar: "Ю",
    color: "bg-blue-400",
    rating: 5,
    text: "Органайзер для дому — дуже зручний і стильний. Фото в Instagram відповідає реальності на 100%!",
    product: "Органайзер для дому",
    date: "3 тижні тому",
  },
  {
    name: "Наталія П.",
    avatar: "Н",
    color: "bg-pink-400",
    rating: 5,
    text: "Замовляла кросівки Adidas — якість чудова за такою ціною. Рекомендую всім подругам!",
    product: "Кросівки Adidas",
    date: "1 місяць тому",
  },
];

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
      ))}
    </div>
  );
}

export function ShopReviews() {
  return (
    <section className="bg-gray-50 py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-600 text-xs font-semibold px-3 py-1 rounded-full mb-4 tracking-widest uppercase">
            ⭐ Відгуки клієнтів
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">Що кажуть наші покупці</h2>
          <p className="text-gray-500">500+ задоволених клієнтів по всій Україні</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reviews.map((r, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 ${r.color} rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                  {r.avatar}
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-sm">{r.name}</div>
                  <div className="text-gray-400 text-xs">{r.date}</div>
                </div>
              </div>
              <Stars count={r.rating} />
              <p className="text-gray-600 text-sm mt-2 leading-relaxed">{r.text}</p>
              <div className="mt-3 text-xs text-rose-400 font-semibold">📦 {r.product}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
