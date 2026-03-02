"use client";
import { useState, useEffect, useRef } from "react";
import { Instagram, ShoppingCart, X, Star, ChevronLeft, ChevronRight, Flame, Sparkles } from "lucide-react";
import { useCart } from "@/components/cart-context";

/* ─── Types ─────────────────────────────────────── */
type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  oldPrice: number | null;
  image: string;
  badge: string | null;
  badgeColor: string;
  sizes: string[];
  rating: number;
  reviews: number;
  stock: number;
  description: string;
  isNew?: boolean;
  isHit?: boolean;
};

/* ─── Data ───────────────────────────────────────── */
const products: Product[] = [
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
    rating: 4.9,
    reviews: 48,
    stock: 3,
    description: "Легкі та зручні кросівки Nike Air — репліка преміум-якості. Дихаюча сітка, амортизуюча підошва. Ідеально для щоденного носіння та спорту.",
    isHit: true,
  },
  {
    id: 2,
    name: "Кросівки Adidas Ultraboost",
    category: "Для жінок",
    price: 950,
    oldPrice: null,
    image: "https://lrggyvioreorxttbasgi.supabase.co/storage/v1/object/public/app-assets/9586/images/1772177782851-sneakers-hero",
    badge: "Новинка",
    badgeColor: "bg-rose-400",
    sizes: ["36", "37", "38", "39"],
    rating: 4.8,
    reviews: 32,
    stock: 7,
    description: "Стильні жіночі кросівки Adidas Ultraboost з покращеною підошвою Boost. Максимальний комфорт при ходьбі та бігу.",
    isNew: true,
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
    rating: 4.7,
    reviews: 19,
    stock: 5,
    description: "М'який та приємний до тіла дитячий костюм з гіпоалергенних матеріалів. Зручний крій, еластичний пояс. Безпечні барвники.",
    isNew: true,
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
    rating: 5.0,
    reviews: 61,
    stock: 12,
    description: "Розвиваючий набір іграшок у стилі Монтессорі. Розвиває дрібну моторику, логічне мислення та творчість. Вік 1–4 роки.",
    isHit: true,
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
    rating: 4.6,
    reviews: 14,
    stock: 20,
    description: "Пухнастий плюшевий ведмедик — ідеальний подарунок для дитини. М'яке наповнення, безпечні матеріали, можна прати.",
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
    rating: 4.5,
    reviews: 27,
    stock: 15,
    description: "Стильний і функціональний органайзер для дому. Компактний дизайн, 6 відділень. Підходить для кухні, ванної чи офісу.",
    isNew: true,
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
    rating: 4.8,
    reviews: 33,
    stock: 8,
    description: "Набір із 6 ароматичних декоративних свічок. Аромати: ваніль, сандалове дерево, лаванда. Час горіння — до 30 год.",
    isHit: true,
  },
  {
    id: 7,
    name: "Тримач для телефону в авто",
    category: "Авто",
    price: 195,
    oldPrice: null,
    image: "https://lrggyvioreorxttbasgi.supabase.co/storage/v1/object/public/app-assets/9586/images/1772177787276-auto-accessories",
    badge: "Топ",
    badgeColor: "bg-rose-500",
    sizes: [],
    rating: 4.9,
    reviews: 72,
    stock: 4,
    description: "Магнітний тримач для телефону на дефлектор або лобове скло. Сумісний з усіма смартфонами. Надійна фіксація.",
    isHit: true,
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
    rating: 4.4,
    reviews: 18,
    stock: 30,
    description: "Стильний ароматизатор для авто на дефлектор. Доступні аромати: New Car, Ocean, Vanilla. Тривалість дії — 2–3 місяці.",
  },
];

const categories = ["Всі", "Для чоловіків", "Для жінок", "Для дітей", "Іграшки", "Дім", "Авто"];
const newArrivals = products.filter((p) => p.isNew || p.isHit).slice(0, 6);

/* ─── Stars component ─────────────────────────────── */
function StarRow({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={11}
          className={i < Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}
        />
      ))}
      <span className="text-xs text-gray-400 ml-0.5">({count})</span>
    </div>
  );
}

/* ─── Product Modal ───────────────────────────────── */
function ProductModal({ product, onClose, onAddToCart }: {
  product: Product;
  onClose: () => void;
  onAddToCart: (p: Product) => void;
}) {
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] ?? null);

  // Close on ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const discount = product.oldPrice
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative bg-white w-full sm:max-w-2xl sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-gray-100 transition-colors"
        >
          <X size={18} className="text-gray-600" />
        </button>

        <div className="flex flex-col sm:flex-row overflow-y-auto">
          {/* Image */}
          <div className="relative sm:w-80 flex-shrink-0">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-56 sm:h-full object-cover"
            />
            {product.badge && (
              <span className={`absolute top-3 left-3 ${product.badgeColor} text-white text-xs font-black px-2.5 py-1 rounded-full`}>
                {product.badge}
              </span>
            )}
            {discount && (
              <span className="absolute top-3 right-3 bg-amber-400 text-gray-900 text-xs font-black px-2.5 py-1 rounded-full">
                -{discount}%
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 p-6 flex flex-col gap-4">
            <div>
              <p className="text-xs font-semibold text-rose-500 uppercase tracking-widest mb-1">{product.category}</p>
              <h2 className="text-xl font-black text-gray-900 leading-snug">{product.name}</h2>
            </div>

            <StarRow rating={product.rating} count={product.reviews} />

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-gray-900">{product.price} грн</span>
              {product.oldPrice && (
                <span className="text-lg text-gray-400 line-through">{product.oldPrice} грн</span>
              )}
            </div>

            {/* Stock warning */}
            {product.stock <= 5 && (
              <div className="flex items-center gap-2 text-amber-600 text-sm font-semibold bg-amber-50 px-3 py-2 rounded-xl">
                <Flame size={14} />
                Залишилось лише {product.stock} шт.!
              </div>
            )}

            {/* Description */}
            <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>

            {/* Sizes */}
            {product.sizes.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Розмір</p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className={`w-10 h-10 rounded-xl text-sm font-bold border-2 transition-all ${
                        selectedSize === s
                          ? "border-rose-500 bg-rose-500 text-white"
                          : "border-gray-200 text-gray-600 hover:border-rose-300"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-auto pt-2">
              <button
                onClick={() => { onAddToCart(product); onClose(); }}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-bold py-3.5 rounded-2xl transition-colors text-sm"
              >
                <ShoppingCart size={16} />
                До кошика
              </button>
              <a
                href="https://www.instagram.com/direct/new/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-bold py-3.5 rounded-2xl transition-colors text-sm"
              >
                <Instagram size={16} />
                Замовити
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Horizontal scroll section ─────────────────── */
function HorizontalScroll({ items, onOpen }: { items: Product[]; onOpen: (p: Product) => void }) {
  const ref = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!ref.current) return;
    ref.current.scrollBy({ left: dir === "left" ? -280 : 280, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <button
        onClick={() => scroll("left")}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-9 h-9 bg-white shadow-lg rounded-full flex items-center justify-center hover:bg-rose-50 transition-colors hidden sm:flex"
      >
        <ChevronLeft size={18} className="text-gray-600" />
      </button>

      <div
        ref={ref}
        className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide snap-x snap-mandatory"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {items.map((product) => (
          <div
            key={product.id}
            onClick={() => onOpen(product)}
            className="flex-shrink-0 w-52 bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group snap-start"
          >
            <div className="relative overflow-hidden">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-2 left-2 flex gap-1">
                {product.isNew && (
                  <span className="bg-rose-500 text-white text-xs font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles size={9} /> NEW
                  </span>
                )}
                {product.isHit && !product.isNew && (
                  <span className="bg-amber-400 text-gray-900 text-xs font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Flame size={9} /> ХІТ
                  </span>
                )}
              </div>
            </div>
            <div className="p-3">
              <p className="text-xs text-gray-400 mb-0.5">{product.category}</p>
              <p className="text-sm font-bold text-gray-900 leading-tight mb-1 line-clamp-2">{product.name}</p>
              <StarRow rating={product.rating} count={product.reviews} />
              <div className="flex items-baseline gap-1.5 mt-1.5">
                <span className="text-rose-500 font-black text-base">{product.price} грн</span>
                {product.oldPrice && (
                  <span className="text-gray-400 text-xs line-through">{product.oldPrice} грн</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => scroll("right")}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-9 h-9 bg-white shadow-lg rounded-full flex items-center justify-center hover:bg-rose-50 transition-colors hidden sm:flex"
      >
        <ChevronRight size={18} className="text-gray-600" />
      </button>
    </div>
  );
}

/* ─── Main Catalog ───────────────────────────────── */
export function ShopCatalog() {
  const [active, setActive] = useState("Всі");
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const { addItem } = useCart();

  const filtered = active === "Всі" ? products : products.filter((p) => p.category === active);

  const handleAddToCart = (product: Product) => {
    addItem({ id: product.id, name: product.name, price: product.price, image: product.image });
    setAddedIds((prev) => new Set(prev).add(product.id));
    setTimeout(() => {
      setAddedIds((prev) => { const n = new Set(prev); n.delete(product.id); return n; });
    }, 1200);
  };

  return (
    <>
      {/* Modal */}
      {modalProduct && (
        <ProductModal
          product={modalProduct}
          onClose={() => setModalProduct(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* ── New Arrivals / Hits ── */}
      <section id="new-arrivals" className="bg-white py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={18} className="text-rose-500" />
                <span className="text-xs font-bold text-rose-500 uppercase tracking-widest">Щойно додано</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-gray-900">Нові надходження та хіти</h2>
            </div>
            <button
              onClick={() => setActive("Всі")}
              className="text-sm text-rose-500 font-semibold hover:underline hidden sm:block"
            >
              Всі товари →
            </button>
          </div>
          <HorizontalScroll items={newArrivals} onOpen={setModalProduct} />
        </div>
      </section>

      {/* ── Main Catalog ── */}
      <section id="catalog" className="bg-gray-50 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">Каталог товарів</h2>
            <p className="text-gray-500">Оберіть категорію та натисніть на товар для деталей</p>
          </div>

          {/* Filter tabs */}
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActive(cat)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  active === cat
                    ? "bg-rose-500 text-white shadow-md shadow-rose-200"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-rose-300 hover:text-rose-500"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Product grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {filtered.map((product) => {
              const discount = product.oldPrice
                ? Math.round((1 - product.price / product.oldPrice) * 100)
                : null;

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer"
                  onClick={() => setModalProduct(product)}
                >
                  {/* Image */}
                  <div className="relative overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white text-gray-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                        Детальніше
                      </span>
                    </div>

                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {product.badge && (
                        <span className={`${product.badgeColor} text-white text-xs font-black px-2 py-0.5 rounded-full`}>
                          {product.badge}
                        </span>
                      )}
                    </div>
                    {discount && (
                      <span className="absolute top-2 right-2 bg-amber-400 text-gray-900 text-xs font-black px-2 py-0.5 rounded-full">
                        -{discount}%
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-3">
                    <div className="text-xs text-gray-400 mb-0.5">{product.category}</div>
                    <div className="text-sm font-bold text-gray-900 leading-tight mb-1.5 line-clamp-2">{product.name}</div>

                    {/* Rating */}
                    <StarRow rating={product.rating} count={product.reviews} />

                    {/* Stock warning */}
                    {product.stock <= 5 && (
                      <div className="flex items-center gap-1 text-amber-600 text-xs font-semibold mt-1.5">
                        <Flame size={10} />
                        Залишилось {product.stock} шт.
                      </div>
                    )}

                    {/* Sizes */}
                    {product.sizes.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {product.sizes.map((s) => (
                          <span key={s} className="text-xs border border-gray-200 rounded-lg px-1.5 py-0.5 text-gray-500">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Price */}
                    <div className="flex items-baseline gap-2 mt-2 mb-3">
                      <span className="text-rose-500 font-black text-base">{product.price} грн</span>
                      {product.oldPrice && (
                        <span className="text-gray-400 text-xs line-through">{product.oldPrice} грн</span>
                      )}
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <a
                        href="https://www.instagram.com/direct/new/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1 flex-1 bg-rose-50 hover:bg-rose-500 text-rose-500 hover:text-white text-xs font-bold py-2.5 rounded-xl transition-all duration-200"
                      >
                        <Instagram size={13} />
                        Замовити
                      </a>
                      <button
                        onClick={() => handleAddToCart(product)}
                        className={`flex items-center justify-center w-9 h-9 rounded-xl text-xs font-bold transition-all duration-200 flex-shrink-0 ${
                          addedIds.has(product.id)
                            ? "bg-green-500 text-white scale-110"
                            : "bg-gray-100 hover:bg-gray-900 text-gray-500 hover:text-white"
                        }`}
                        title="До кошика"
                      >
                        <ShoppingCart size={14} className={addedIds.has(product.id) ? "animate-bounce" : ""} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
