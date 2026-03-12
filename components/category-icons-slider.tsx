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

  // Auto-scroll active category into view
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const activeButton = container.querySelector(`[data-category="${activeCategory}"]`) as HTMLElement;
    if (activeButton) {
      activeButton.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [activeCategory]);

  if (isLoading) {
    return (
      <div className="sticky top-[68px] bg-white border-b border-gray-100 py-4 z-[60] shadow-sm">
        <div className="flex items-center justify-center h-[88px]">
          <div className="animate-pulse text-gray-400 text-sm">Завантаження категорій...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-[68px] bg-white border-b border-gray-100 py-3 z-[60] shadow-sm">
      <div className="w-full">
        <div
          ref={scrollRef}
          className="flex items-start overflow-x-auto scrollbar-hide px-2 sm:px-4 gap-2"
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
                      : "bg-gray-100 group-hover:bg-emerald-50"
                  }
                `}
              >
                <Icon
                  size={20}
                  className={`
                    transition-colors duration-200
                    ${isActive ? "text-white" : "text-gray-600 group-hover:text-emerald-600"}
                  `}
                />
              </div>
              
              <span
                className={`
                  text-[9px] sm:text-[10px] font-semibold text-center leading-tight transition-colors duration-200 px-1 line-clamp-2 break-words
                  ${isActive ? "text-emerald-600" : "text-gray-600 group-hover:text-emerald-600"}
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
