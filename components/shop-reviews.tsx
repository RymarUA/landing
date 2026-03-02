"use client";
/**
 * components/shop-reviews.tsx
 *
 * Photo review carousel with star ratings, verified badges and lightbox.
 * Reviews are static (replace with API/CMS calls in production).
 * Designed to be inserted between ShopCatalog and ShopNovaPoshta in app/page.tsx.
 */

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Star, ChevronLeft, ChevronRight, X, BadgeCheck, Instagram } from "lucide-react";

/* ─── Types ──────────────────────────────────────────── */
interface Review {
  id: number;
  name: string;
  city: string;
  rating: number;
  text: string;
  /** Product purchased */
  product: string;
  /** Relative date */
  date: string;
  /** Main review photo (from Supabase storage or external) */
  photo?: string;
  /** If the review came from Instagram */
  igHandle?: string;
  verified: boolean;
}

/* ─── Review data ─────────────────────────────────────── */
const IMG = "https://lrggyvioreorxttbasgi.supabase.co/storage/v1/object/public/app-assets/9586/images";

const REVIEWS: Review[] = [
  {
    id: 1,
    name: "Олена К.",
    city: "Одеса",
    rating: 5,
    text: "Замовляла Nike Air для чоловіка — якість вразила! Швидка доставка, відео розпакування отримала. Все точно як на фото. Дякую FamilyHub! 🙏",
    product: "Nike Air Replica (р.43)",
    date: "2 тижні тому",
    photo: `${IMG}/1772177782851-sneakers-hero`,
    verified: true,
  },
  {
    id: 2,
    name: "Максим Р.",
    city: "Київ",
    rating: 5,
    text: "Брав іграшки для дочки на день народження. Все в ідеальному стані, упаковано акуратно. Дівчинка в захваті! Замовлю ще 👍",
    product: "Іграшковий набір",
    date: "1 місяць тому",
    photo: `${IMG}/1772177785068-toys`,
    verified: true,
    igHandle: "@maksym_kyiv",
  },
  {
    id: 3,
    name: "Тетяна В.",
    city: "Харків",
    rating: 5,
    text: "Вже третє замовлення в цьому магазині. Завжди все приходить вчасно, якість відповідає опису. Рекомендую всім подругам!",
    product: "Сукня (р.M)",
    date: "3 тижні тому",
    photo: `${IMG}/1772177786612-women`,
    verified: true,
  },
  {
    id: 4,
    name: "Андрій П.",
    city: "Дніпро",
    rating: 5,
    text: "Замовляв автоаксесуари — прийшли швидко, все цілісно. Менеджер дав трек-номер зразу. Буду замовляти ще.",
    product: "Автомобільний ароматизатор",
    date: "5 днів тому",
    photo: `${IMG}/1772177787912-auto`,
    verified: true,
  },
  {
    id: 5,
    name: "Юлія М.",
    city: "Львів",
    rating: 5,
    text: "Замовила дитячий комбінезон — якість відмінна! Матеріал м'який, розмір точний. Дитина носить з задоволенням.",
    product: "Дитячий комбінезон (р.80)",
    date: "1 тиждень тому",
    photo: `${IMG}/1772177789034-children`,
    verified: true,
    igHandle: "@yulia_lviv_mom",
  },
  {
    id: 6,
    name: "Ірина Б.",
    city: "Запоріжжя",
    rating: 5,
    text: "Шикарний магазин! Зробила замовлення вперше, і вже стала постійним клієнтом. Кофта дуже гарна, якість супер 💖",
    product: "Жіноча кофта (р.S)",
    date: "2 дні тому",
    photo: `${IMG}/1772177790123-women2`,
    verified: true,
  },
];

/* ─── Stars ──────────────────────────────────────────── */
function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={13}
          className={i < rating ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}
        />
      ))}
    </div>
  );
}

/* ─── Review Card ────────────────────────────────────── */
function ReviewCard({ review, onPhotoClick }: { review: Review; onPhotoClick: (r: Review) => void }) {
  return (
    <div className="flex-shrink-0 w-72 bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden snap-start flex flex-col">
      {/* Photo */}
      {review.photo && (
        <div
          className="relative h-48 overflow-hidden cursor-pointer group"
          onClick={() => onPhotoClick(review)}
        >
          <Image
            src={review.photo}
            alt={`Відгук від ${review.name}`}
            fill
            sizes="288px"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-gray-900 text-xs font-bold px-3 py-1.5 rounded-full shadow">
              Збільшити
            </span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4 flex flex-col gap-2.5 flex-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-sm font-black text-gray-900">{review.name}</span>
              {review.verified && (
                <BadgeCheck size={14} className="text-blue-500 flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <Stars rating={review.rating} />
              {review.igHandle && (
                <span className="text-xs text-rose-400 font-semibold flex items-center gap-0.5">
                  <Instagram size={10} />
                  {review.igHandle}
                </span>
              )}
            </div>
          </div>
          <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">{review.date}</span>
        </div>

        {/* Text */}
        <p className="text-sm text-gray-600 leading-relaxed flex-1">{review.text}</p>

        {/* Product badge */}
        <div className="flex items-center gap-1.5 mt-auto pt-2 border-t border-gray-50">
          <span className="text-xs text-gray-400">Товар:</span>
          <span className="text-xs font-semibold text-gray-700 truncate">{review.product}</span>
        </div>

        {/* City */}
        <span className="text-xs text-gray-400">{review.city}</span>
      </div>
    </div>
  );
}

/* ─── Lightbox ───────────────────────────────────────── */
function Lightbox({ review, onClose }: { review: Review; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden max-w-lg w-full animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow-md hover:bg-gray-100 transition-colors"
        >
          <X size={18} className="text-gray-600" />
        </button>
        {review.photo && (
          <div className="relative h-72 sm:h-96">
            <Image
              src={review.photo}
              alt={`Відгук від ${review.name}`}
              fill
              sizes="(max-width: 640px) 100vw, 512px"
              className="object-cover"
              priority
            />
          </div>
        )}
        <div className="p-5 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="font-black text-gray-900">{review.name}</span>
            {review.verified && <BadgeCheck size={15} className="text-blue-500" />}
            <Stars rating={review.rating} />
            <span className="text-xs text-gray-400 ml-auto">{review.date}</span>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{review.text}</p>
          <p className="text-xs text-gray-400 mt-1">Товар: <span className="font-semibold text-gray-600">{review.product}</span> · {review.city}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────── */
export function ShopReviews() {
  const [lightboxReview, setLightboxReview] = useState<Review | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -300 : 300, behavior: "smooth" });
  };

  const averageRating = (REVIEWS.reduce((s, r) => s + r.rating, 0) / REVIEWS.length).toFixed(1);

  return (
    <>
      {lightboxReview && (
        <Lightbox review={lightboxReview} onClose={() => setLightboxReview(null)} />
      )}

      <section id="reviews" className="bg-white py-16 px-4">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Star size={18} className="fill-amber-400 text-amber-400" />
                <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">Відгуки покупців</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-gray-900">
                Що кажуть наші клієнти
              </h2>
            </div>

            {/* Summary badge */}
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-2xl px-5 py-3 self-start sm:self-auto">
              <div className="text-center">
                <div className="text-3xl font-black text-amber-500 leading-none">{averageRating}</div>
                <Stars rating={5} />
              </div>
              <div className="border-l border-amber-200 pl-3">
                <p className="text-sm font-black text-gray-900">{REVIEWS.length}+ відгуків</p>
                <p className="text-xs text-gray-500">Верифіковані покупки</p>
              </div>
            </div>
          </div>

          {/* Carousel */}
          <div className="relative">
            <button
              onClick={() => scroll("left")}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-9 h-9 bg-white shadow-lg rounded-full items-center justify-center hover:bg-rose-50 transition-colors hidden sm:flex"
            >
              <ChevronLeft size={18} className="text-gray-600" />
            </button>

            <div
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {REVIEWS.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  onPhotoClick={setLightboxReview}
                />
              ))}

              {/* CTA card */}
              <div className="flex-shrink-0 w-72 bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-100 rounded-2xl flex flex-col items-center justify-center p-8 gap-4 snap-start">
                <div className="text-4xl">📸</div>
                <div className="text-center">
                  <p className="font-black text-gray-900 text-base mb-1">Поділіться своїм відгуком!</p>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Позначте нас у Instagram або залиште відгук — отримаєте знижку на наступне замовлення.
                  </p>
                </div>
                <a
                  href="https://www.instagram.com/familyhub_market/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm px-5 py-2.5 rounded-2xl transition-colors shadow-md shadow-rose-200"
                >
                  <Instagram size={15} />
                  Instagram
                </a>
              </div>
            </div>

            <button
              onClick={() => scroll("right")}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-9 h-9 bg-white shadow-lg rounded-full items-center justify-center hover:bg-rose-50 transition-colors hidden sm:flex"
            >
              <ChevronRight size={18} className="text-gray-600" />
            </button>
          </div>

          {/* Trust line */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
            {[
              { icon: "✅", label: "Верифіковані відгуки" },
              { icon: "📦", label: "Відео розпакування" },
              { icon: "🛡️", label: "30 днів гарантія" },
              { icon: "🚚", label: "Нова Пошта 1–3 дні" },
            ].map((b) => (
              <div key={b.label} className="flex items-center gap-1.5">
                <span>{b.icon}</span>
                <span className="font-medium">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
