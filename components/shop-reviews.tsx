"use client";
import { Star, BadgeCheck } from "lucide-react";

const reviews = [
  {
    name: "Аліна К.",
    avatar: "А",
    color: "bg-rose-500",
    rating: 5,
    text: "Замовляла кросівки — прийшли точно в розмір, якість супер! Відео розпакування дуже сподобалось, все чесно.",
    product: "Кросівки Nike Air",
    productImage: "https://lrggyvioreorxttbasgi.supabase.co/storage/v1/object/public/app-assets/9586/images/1772177782851-sneakers-hero",
    date: "2 дні тому",
  },
  {
    name: "Марина Д.",
    avatar: "М",
    color: "bg-violet-500",
    rating: 5,
    text: "Купила іграшки для дитини — вона в захваті! Доставка Новою Поштою швидка, все запаковано акуратно.",
    product: "Набір іграшок Монтессорі",
    productImage: "https://lrggyvioreorxttbasgi.supabase.co/storage/v1/object/public/app-assets/9586/images/1772177785940-toys-product",
    date: "5 днів тому",
  },
  {
    name: "Оксана Р.",
    avatar: "О",
    color: "bg-amber-500",
    rating: 5,
    text: "Тримач для телефону в авто — просто знахідка! Ціна дуже приємна, якість не поступається магазинним.",
    product: "Тримач для телефону",
    productImage: "https://lrggyvioreorxttbasgi.supabase.co/storage/v1/object/public/app-assets/9586/images/1772177787276-auto-accessories",
    date: "1 тиждень тому",
  },
  {
    name: "Катерина В.",
    avatar: "К",
    color: "bg-emerald-500",
    rating: 5,
    text: "Вже третє замовлення! Завжди все приходить вчасно, продавець на зв'язку, відповідає швидко в Direct.",
    product: "Декоративні свічки",
    productImage: "https://lrggyvioreorxttbasgi.supabase.co/storage/v1/object/public/app-assets/9586/images/1772177786810-home-accessories",
    date: "2 тижні тому",
  },
  {
    name: "Юлія С.",
    avatar: "Ю",
    color: "bg-sky-500",
    rating: 5,
    text: "Органайзер для дому — дуже зручний і стильний. Фото в Instagram відповідає реальності на 100%!",
    product: "Органайзер для дому",
    productImage: "https://lrggyvioreorxttbasgi.supabase.co/storage/v1/object/public/app-assets/9586/images/1772177786810-home-accessories",
    date: "3 тижні тому",
  },
  {
    name: "Наталія П.",
    avatar: "Н",
    color: "bg-pink-500",
    rating: 5,
    text: "Замовляла кросівки Adidas — якість чудова за такою ціною. Рекомендую всім подругам!",
    product: "Кросівки Adidas",
    productImage: "https://lrggyvioreorxttbasgi.supabase.co/storage/v1/object/public/app-assets/9586/images/1772177782851-sneakers-hero",
    date: "1 місяць тому",
  },
];

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={13}
          className={i < count ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}
        />
      ))}
    </div>
  );
}

export function ShopReviews() {
  const avgRating = (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);

  return (
    <section id="reviews" className="bg-gray-50 py-16 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-600 text-xs font-bold px-4 py-2 rounded-full mb-4 uppercase tracking-widest">
            <Star size={13} className="fill-amber-500 text-amber-500" />
            Відгуки клієнтів
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">
            Нам довіряють покупці
          </h2>

          {/* Summary stats */}
          <div className="flex items-center justify-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-4xl font-black text-gray-900">{avgRating}</span>
              <div className="flex flex-col items-start">
                <Stars count={5} />
                <span className="text-xs text-gray-400">{reviews.length * 21}+ відгуків</span>
              </div>
            </div>
            <div className="h-10 w-px bg-gray-200 hidden sm:block" />
            <div className="flex items-center gap-2 text-gray-600 text-sm">
              <BadgeCheck size={18} className="text-rose-500" />
              <span>Всі відгуки — підтверджені покупці</span>
            </div>
          </div>
        </div>

        {/* Reviews grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {reviews.map((r, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col gap-4"
            >
              {/* Product mini */}
              <div className="flex items-center gap-3">
                <img
                  src={r.productImage}
                  alt={r.product}
                  className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                />
                <div>
                  <p className="text-xs font-semibold text-gray-500">Купила:</p>
                  <p className="text-xs font-bold text-gray-900 leading-tight">{r.product}</p>
                </div>
              </div>

              {/* Stars + verified */}
              <div className="flex items-center justify-between">
                <Stars count={r.rating} />
                <div className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                  <BadgeCheck size={12} />
                  Підтверджено
                </div>
              </div>

              {/* Text */}
              <p className="text-gray-700 text-sm leading-relaxed flex-1">"{r.text}"</p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-1 border-t border-gray-50">
                <div className={`w-8 h-8 ${r.color} rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0`}>
                  {r.avatar}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{r.name}</p>
                  <p className="text-xs text-gray-400">{r.date}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 text-center">
          <a
            href="https://www.instagram.com/familyhub_market/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-rose-500 hover:text-rose-600 font-semibold text-sm transition-colors"
          >
            Читати більше відгуків в Instagram →
          </a>
        </div>
      </div>
    </section>
  );
}
