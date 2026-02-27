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

