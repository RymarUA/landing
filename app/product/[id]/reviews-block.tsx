// @ts-nocheck
"use client";

import { useState } from "react";
import { Star, ThumbsUp, ChevronDown, ChevronUp, User, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface Review {
  id: string;
  author: string;
  country?: string;
  date: string;
  rating: number;
  size?: string;
  color?: string;
  verified: boolean;
  title?: string;
  content: string;
  helpful: number;
  images?: string[];
}

interface ReviewsBlockProps {
  productId: number;
  rating: number;
  totalReviews: number;
  sizeDistribution?: {
    small: number;
    trueToSize: number;
    large: number;
  };
}

// Mock данные для демонстрации
const mockReviews: Review[] = [
  {
    id: "1",
    author: "Юрій Петренко",
    country: "Україна",
    date: "28 Sep 2025",
    rating: 5,
    size: "M",
    color: "Army Green",
    verified: true,
    title: "Чудові штани!",
    content: "Дуже задоволений покупкою. Якість матеріалу відмінна, сідять ідеально. Розмір відповідає заявленому. Рекомендую!",
    helpful: 12,
    images: []
  },
  {
    id: "2", 
    author: "Олександр Іванов",
    country: "Україна",
    date: "18 Mar 2026",
    rating: 5,
    size: "L",
    color: "Black",
    verified: true,
    title: "Чудова якість",
    content: "Відмінний продукт, ідеально сідає. Матеріал дуже комфортний і колір точно такий, як на фото.",
    helpful: 8,
    images: []
  },
  {
    id: "3",
    author: "Олена Петренко",
    country: "Україна",
    date: "15 Mar 2026", 
    rating: 4,
    size: "S",
    color: "Dark Brown",
    verified: true,
    content: "Хороші штани, але трохи більші за очікувані. Якісний матеріал, приємні на дотик. Колір повністю збігається з фото.",
    helpful: 5,
    images: []
  },
  {
    id: "4",
    author: "Марія Іваненко",
    country: "Україна",
    date: "10 Mar 2026",
    rating: 5,
    size: "M",
    color: "Navy Blue",
    verified: true,
    title: "Супер!",
    content: "Замовила для чоловіка, дуже задоволені. Якість на висоті, шви рівні, матеріал приємний. Доставка швидка.",
    helpful: 7,
    images: []
  },
  {
    id: "5",
    author: "Андрій Сидоренко",
    country: "Україна",
    date: "5 Mar 2026",
    rating: 4,
    size: "L",
    color: "Black",
    verified: true,
    content: "Добрі штани, але розмір трохи більший. Раджу брати на розмір менший. Якість матеріалу чудова.",
    helpful: 3,
    images: []
  },
  {
    id: "6",
    author: "Сергій Ковальчук",
    country: "Україна",
    date: "1 Mar 2026",
    rating: 5,
    size: "XL",
    color: "Gray",
    verified: true,
    title: "Ідеально!",
    content: "Чудові штани за розумною ціною. Матеріал якісний, пошив акуратний. Буду замовляти ще!",
    helpful: 15,
    images: []
  },
  {
    id: "7",
    author: "Тетяна Мельник",
    country: "Україна",
    date: "25 Feb 2026",
    rating: 5,
    size: "M",
    color: "Khaki",
    verified: true,
    content: "Дуже задоволена покупкою! Штани стильні та комфортні. Ідеально підходять для щоденного носіння.",
    helpful: 9,
    images: []
  }
];

const filterOptions = [
  { id: "recommended", label: "Рекомендовані" },
  { id: "recent", label: "Найновіші" }
];

export function ReviewsBlock({ productId, rating, totalReviews, sizeDistribution }: ReviewsBlockProps) {
  const [activeFilter, setActiveFilter] = useState("recommended");
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, boolean>>({});

  const filteredReviews = mockReviews.filter(review => {
    switch (activeFilter) {
      case "recommended":
        return review.rating >= 4;
      case "recent":
        return true; // В реальном приложении здесь будет сортировка по дате
      case "comfortable":
        return review.content.toLowerCase().includes("comfort") || 
               review.content.toLowerCase().includes("зручн") ||
               review.rating >= 4;
      default:
        return true;
    }
  });

  const toggleReviewExpansion = (reviewId: string) => {
    setExpandedReviews(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reviewId)) {
        newSet.delete(reviewId);
      } else {
        newSet.add(reviewId);
      }
      return newSet;
    });
  };

  const handleHelpful = (reviewId: string) => {
    setHelpfulVotes(prev => ({
      ...prev,
      [reviewId]: !prev[reviewId]
    }));
  };

  const renderStars = (rating: number, size: number = 16) => (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const isFull = i < Math.floor(rating);
        const isHalf = i === Math.floor(rating) && rating % 1 >= 0.3 && rating % 1 < 0.8;
        
        return (
          <div key={i} className="relative" style={{ width: size, height: size }}>
            <Star
              size={size}
              className={isFull ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}
            />
            {isHalf && (
              <div className="absolute inset-0 overflow-hidden" style={{ width: `${size / 2}px` }}>
                <Star size={size} className="fill-amber-400 text-amber-400" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6">
      {/* Заголовок с рейтингом */}
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-3">Відгуки клієнтів</h2>
        
        {/* Общий рейтинг */}
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-2">
            {renderStars(rating, 20)}
            <span className="text-lg font-bold">{rating}</span>
          </div>
          <span className="text-gray-400">({totalReviews} відгук{totalReviews === 1 ? '' : totalReviews >= 2 && totalReviews <= 4 ? 'и' : 'ів'})</span>
        </div>

        {/* Бейдж верификации */}
        <div className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-semibold px-2 py-1 rounded-full mb-3">
          ✓ Усі відгуки від перевірених покупок
        </div>

        {/* Распределение размеров */}
        {sizeDistribution && (
          <div className="mb-4">
            <h3 className="text-sm font-bold text-gray-700 mb-3">Розподіл розмірів</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600 w-20">Маленькі</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-red-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${sizeDistribution.small}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-gray-700 w-8">{sizeDistribution.small}%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600 w-20">Відповідають</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-green-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${sizeDistribution.trueToSize}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-gray-700 w-8">{sizeDistribution.trueToSize}%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600 w-20">Великі</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-blue-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${sizeDistribution.large}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-gray-700 w-8">{sizeDistribution.large}%</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">91% клієнтів кажуть, що ці штани сидять ідеально</p>
          </div>
        )}

        {/* Фильтры */}
        <div className="flex flex-wrap gap-2 mb-4">
          {filterOptions.map(filter => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeFilter === filter.id
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Список отзывов */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredReviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="border-b border-gray-100 pb-4 last:border-0"
            >
              {/* Автор и дата */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <User size={16} className="text-gray-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{review.author}</span>
                      {review.country && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPin size={10} />
                          {review.country}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{review.date}</span>
                      {review.verified && (
                        <span className="text-green-600 font-semibold">✓ Перевірено</span>
                      )}
                    </div>
                  </div>
                </div>
                {renderStars(review.rating, 14)}
              </div>

              {/* Детали покупки */}
              {(review.size || review.color) && (
                <div className="text-xs text-gray-600 mb-2">
                  {review.color && <span>Колір: {review.color}</span>}
                  {review.color && review.size && <span> • </span>}
                  {review.size && <span>Розмір: {review.size}</span>}
                </div>
              )}

              {/* Заголовок отзыва */}
              {review.title && (
                <h4 className="font-semibold text-sm mb-2">{review.title}</h4>
              )}

              {/* Фото отзыва */}
              {review.images && review.images.length > 0 && (
                <div className="mb-2">
                  <div className="flex gap-2 overflow-x-auto">
                    {review.images.map((image, imgIdx) => (
                      <div key={imgIdx} className="flex-shrink-0 relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                        <Image 
                          src={image} 
                          alt={`Фото отзыва ${imgIdx + 1}`}
                          fill 
                          sizes="80px"
                          className="object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                          onClick={() => {
                            // В реальном приложении здесь будет открытие модального окна
                            console.log('Open image:', image);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Текст отзыва */}
              <div className="text-sm text-gray-700 leading-relaxed">
                {expandedReviews.has(review.id) || review.content.length <= 200 ? (
                  <p>{review.content}</p>
                ) : (
                  <p>{review.content.substring(0, 200)}...</p>
                )}
                
                {review.content.length > 200 && (
                  <button
                    onClick={() => toggleReviewExpansion(review.id)}
                    className="text-orange-500 hover:text-orange-600 text-xs font-semibold ml-2"
                  >
                    {expandedReviews.has(review.id) ? (
                      <>
                        Показати менше <ChevronUp size={12} className="inline" />
                      </>
                    ) : (
                      <>
                        Показати більше <ChevronDown size={12} className="inline" />
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Действия с отзывом */}
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <button
                  onClick={() => handleHelpful(review.id)}
                  className={`flex items-center gap-1 hover:text-orange-500 transition-colors ${
                    helpfulVotes[review.id] ? "text-orange-500 font-semibold" : ""
                  }`}
                >
                  <ThumbsUp size={12} className={helpfulVotes[review.id] ? "fill-orange-500" : ""} />
                  Корисно ({review.helpful + (helpfulVotes[review.id] ? 1 : 0)})
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Кнопка "Показати ще відгуки" */}
      {filteredReviews.length > 3 && (
        <div className="text-center mt-4">
          <button 
            onClick={() => {
              // В реальном приложении здесь будет загрузка еще отзывов
              console.log('Load more reviews');
            }}
            className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-full text-sm transition-colors"
          >
            Показати ще відгуки ({filteredReviews.length - 3}+)
          </button>
        </div>
      )}
    </div>
  );
}
