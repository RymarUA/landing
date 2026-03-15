// @ts-nocheck
"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Grid3x3,
  Truck,
  Activity,
  Bandage,
  Shield,
  Vibrate,
  Droplets,
  Shirt,
  Package
} from "lucide-react";

interface CategoryIconsSliderProps {
  onCategoryChange?: (category: string) => void;
  initialCategory?: string;
}

interface CategoryData {
  name: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

// Функція для автоматичного підбору іконки на основі назви категорії
function getCategoryIcon(categoryName: string): React.ComponentType<{ size?: number; className?: string }> {
  const name = categoryName.toLowerCase();
  
  if (name.includes("всі") || name.includes("все")) return Grid3x3;
  if (name.includes("доставк")) return Truck;
  if (name.includes("наколінник") || name.includes("коліно")) return Activity;
  if (name.includes("пластир") || name.includes("пластир")) return Bandage;
  if (name.includes("налокотник") || name.includes("лікоть")) return Shield;
  if (name.includes("бандаж")) return Shield;
  if (name.includes("масаж")) return Vibrate;
  if (name.includes("маз") || name.includes("гел") || name.includes("крем")) return Droplets;
  if (name.includes("білизна") || name.includes("компресі")) return Shirt;
  if (name.includes("інше") || name.includes("other")) return Package;
  
  return Package;
}

export function CategoryIconsSlider({
  onCategoryChange,
  initialCategory = "Всі",
}: CategoryIconsSliderProps) {
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [categories, setCategories] = useState<string[]>(["Всі"]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Завантаження категорій з API
  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await fetch("/api/categories");
        const data = await response.json();
        
        if (data.success && data.categories) {
          setCategories(data.categories);
        }
      } catch (error) {
        console.error("Failed to load categories:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadCategories();
  }, []);

  useEffect(() => {
    setActiveCategory(initialCategory);
  }, [initialCategory]);

  const handleCategoryClick = (category: string) => {
    setActiveCategory(category);
    onCategoryChange?.(category);
  };

  // ✅ ВИПРАВЛЕННЯ: Scroll ТІЛЬКИ контейнера, НЕ всієї сторінки
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const activeButton = container.querySelector(`[data-category="${activeCategory}"]`) as HTMLElement;
    if (!activeButton) return;

    // Store page scroll position to prevent jumps
    const pageScrollY = window.scrollY;

    // Отримуємо позиції
    const containerRect = container.getBoundingClientRect();
    const buttonRect = activeButton.getBoundingClientRect();
    
    // Перевіряємо чи кнопка видима в контейнері
    const isVisible = 
      buttonRect.left >= containerRect.left &&
      buttonRect.right <= containerRect.right;

    // Скролимо ТІЛЬКИ якщо кнопка не видима
    if (!isVisible) {
      const scrollLeft = 
        activeButton.offsetLeft - 
        container.offsetWidth / 2 + 
        activeButton.offsetWidth / 2;

      // ✅ Скролимо контейнер, НЕ елемент!
      container.scrollTo({
        left: scrollLeft,
        behavior: 'smooth'
      });
    }

    // Restore page scroll position if it changed
    if (window.scrollY !== pageScrollY) {
      window.scrollTo(0, pageScrollY);
    }
  }, [activeCategory]);

  if (isLoading) {
    return (
      <div className="bg-white border-b border-gray-100 py-1.5 shadow-sm">
        <div className="flex items-center justify-center h-[60px]">
          <div className="animate-pulse text-gray-400 text-sm">Завантаження категорій...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-b border-gray-100 py-1.5 shadow-sm relative">
      <div className="w-full">
        <div
          ref={scrollRef}
          className="flex items-start overflow-x-auto overflow-y-hidden scrollbar-hide px-2 sm:px-4 gap-2"
          style={{
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
        {categories.map((category) => {
          const isActive = activeCategory === category;
          const Icon = getCategoryIcon(category);
          
          return (
            <button
              key={category}
              data-category={category}
              onClick={() => handleCategoryClick(category)}
              className="flex flex-col items-center justify-start flex-1 min-w-[80px] group"
            >
              <div
                className={`
                  w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-200 mb-1.5
                  ${
                    isActive
                      ? "bg-emerald-600 shadow-lg shadow-emerald-200"
                      : "bg-emerald-50 group-hover:bg-emerald-100 border border-emerald-200"
                  }
                `}
              >
                <Icon
                  size={20}
                  className={`
                    transition-colors duration-200
                    ${isActive ? "text-white" : "text-emerald-700 group-hover:text-emerald-800"}
                  `}
                />
              </div>
              
              <span
                className={`
                  text-[10px] sm:text-xs font-semibold text-center leading-tight transition-colors duration-200 px-1 line-clamp-2 break-words
                  ${isActive ? "text-emerald-700" : "text-emerald-700 group-hover:text-emerald-800"}
                `}
              >
                {category}
              </span>
            </button>
          );
        })}
        </div>
      </div>
    </div>
  );
}
