"use client";
import { useState } from "react";
import { Instagram, ShoppingCart } from "lucide-react";
import { useCart } from "@/components/cart-context";

const products = [
  {
    id: 1,
    name: "Кросівки Nike Air (репліка)",
    category: "Для чоловіків",
    price: 1200,
    oldPrice: 1800,
    image: "https://lrggyvioreorxttbasgi.supabase.co/storage/v1/object/public/app-assets/9586/images/1772177782851-sneakers-hero",
    badge: "Хіт",
    badgeColor: "bg-rose-500",
    sizes: ["36", "37", "38", "39", "40"],
  },
  {
    id: 2,
    name: "Кросівки Adidas Ultraboost",
    category: "Для жінок",
    price: 950,
    oldPrice: null,
    image: "https://lrggyvioreorxttbasgi.supabase.co/storage/v1/object/public/app-assets/9586/images/1772177782851-sneakers-hero",
    badge: "Новинка",
    badgeColor: "bg-violet-500",
    sizes: ["36", "37", "38", "39"],
  },
  {
    id: 9,
    name: "Дитячий костюм (зріст 92)",
    category: "Для дітей",
    price: 420,
    oldPrice: 580,
    image: "https://lrggyvioreorxttbasgi.supabase.co/storage/v1/object/public/app-assets/9586/images/1772177785940-toys-product",
    badge: "Знижка",
    badgeColor: "bg-amber-500",
    sizes: ["86", "92", "98", "104"],
  },
  {
    id: 3,
    name: "Набір іграшок Монтессорі",
    category: "Іграшки",
    price: 320,
    oldPrice: 450,
    image: "https://lrggyvioreorxttbasgi.supabase.co/storage/v1/object/public/app-assets/9586/images/1772177785940-toys-product",
    badge: "Знижка",
    badgeColor: "bg-amber-500",
    sizes: [],
  },
  {
    id: 4,
    name: "М'яка іграшка Ведмедик",
    category: "Іграшки",
    price: 180,
    oldPrice: null,
    image: "https://lrggyvioreorxttbasgi.supabase.co/storage/v1/object/public/app-assets/9586/images/1772177785940-toys-product",
    badge: null,
    badgeColor: "",
    sizes: [],
  },
  {
    id: 5,
    name: "Органайзер для дому",
    category: "Дім",
    price: 145,
    oldPrice: null,
    image: "https://lrggyvioreorxttbasgi.supabase.co/storage/v1/object/public/app-assets/9586/images/1772177786810-home-accessories",
    badge: null,
    badgeColor: "",
    sizes: [],
  },
  {
    id: 6,
    name: "Декоративні свічки (набір)",
    category: "Дім",
    price: 210,
    oldPrice: 280,
    image: "https://lrggyvioreorxttbasgi.supabase.co/storage/v1/object/public/app-assets/9586/images/1772177786810-home-accessories",
    badge: "Знижка",
    badgeColor: "bg-amber-500",
    sizes: [],
  },
  {
    id: 7,
    name: "Тримач для телефону в авто",
    category: "Авто",
    price: 195,
    oldPrice: null,
    image: "https://lrggyvioreorxttbasgi.supabase.co/storage/v1/object/public/app-assets/9586/images/1772177787276-auto-accessories",
    badge: "Топ",
    badgeColor: "bg-green-500",
    sizes: [],
  },
  {
    id: 8,
    name: "Ароматизатор для авто",
    category: "Авто",
    price: 120,
    oldPrice: null,
    image: "https://lrggyvioreorxttbasgi.supabase.co/storage/v1/object/public/app-assets/9586/images/1772177787276-auto-accessories",
    badge: null,
    badgeColor: "",
    sizes: [],
  },
];

const categories = ["Всі", "Для чоловіків", "Для жінок", "Для дітей", "Іграшки", "Дім", "Авто"];

export function ShopCatalog() {
  const [active, setActive] = useState("Всі");
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());
  const { addItem } = useCart();

  const filtered = active === "Всі" ? products : products.filter((p) => p.category === active);

  const handleAddToCart = (product: typeof products[0]) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
    });
    setAddedIds((prev) => new Set(prev).add(product.id));
    setTimeout(() => {
      setAddedIds((prev) => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }, 1000);
  };

  return (
    <section id="catalog" className="bg-gray-50 py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">Каталог товарів</h2>
          <p className="text-gray-500">Оберіть категорію та додайте товар у кошик</p>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                active === cat
                  ? "bg-rose-500 text-white shadow-md"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-rose-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {filtered.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 group"
            >
              <div className="relative overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {product.badge && (
                  <span className={`absolute top-2 left-2 ${product.badgeColor} text-white text-xs font-bold px-2 py-0.5 rounded-full`}>
                    {product.badge}
                  </span>
                )}
              </div>
              <div className="p-3">
                <div className="text-xs text-gray-400 mb-1">{product.category}</div>
                <div className="text-sm font-bold text-gray-900 leading-tight mb-2">{product.name}</div>
                {product.sizes.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {product.sizes.map((s) => (
                      <span key={s} className="text-xs border border-gray-200 rounded px-1.5 py-0.5 text-gray-500">{s}</span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-rose-500 font-black text-base">{product.price} грн</span>
                  {product.oldPrice && (
                    <span className="text-gray-400 text-xs line-through">{product.oldPrice} грн</span>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <a
                    href="https://www.instagram.com/direct/new/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1 flex-1 bg-rose-50 hover:bg-rose-500 text-rose-500 hover:text-white text-xs font-bold py-2 rounded-xl transition-all duration-200"
                  >
                    <Instagram size={13} />
                    Замовити
                  </a>
                  <button
                    onClick={() => handleAddToCart(product)}
                    className={`flex items-center justify-center px-2 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                      addedIds.has(product.id)
                        ? "bg-green-500 text-white scale-110"
                        : "bg-gray-100 hover:bg-rose-500 text-gray-500 hover:text-white"
                    }`}
                    title="До кошика"
                  >
                    <ShoppingCart size={14} className={addedIds.has(product.id) ? "animate-bounce" : ""} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
