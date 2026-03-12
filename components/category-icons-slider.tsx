// @ts-nocheck
"use client";

import { useState, useRef, useEffect } from "react";
import { siteConfig } from "@/lib/site-config";
import { 
  Coffee, 
  Flame, 
  Flower2, 
  Heart, 
  Droplet, 
  Baby, 
  Gift,
  Grid3x3
} from "lucide-react";

interface CategoryIconsSliderProps {
  onCategoryChange?: (category: string) => void;
  initialCategory?: string;
}

// Map categories to icons
const CATEGORY_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  "Всі": Grid3x3,
  "Чаї та настої": Coffee,
  "Зігріваючі пластирі": Flame,
  "Ароматерапія": Flower2,
  "Ортези та підтримка": Heart,
  "Масла і бальзами": Droplet,
  "Дитячі протоколи": Baby,
  "Подарункові сети": Gift,
};

export function CategoryIconsSlider({
  onCategoryChange,
  initialCategory = "Всі",
}: CategoryIconsSliderProps) {
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const scrollRef = useRef<HTMLDivElement>(null);

  const categories = siteConfig.catalogCategories;

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

  return (
    <div className="bg-white border-b border-gray-100 py-4">
      <div
        ref={scrollRef}
        className="flex overflow-x-auto scrollbar-hide px-4 gap-6"
        style={{
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {categories.map((category) => {
          const isActive = activeCategory === category;
          const Icon = CATEGORY_ICONS[category] || Grid3x3;
          
          return (
            <button
              key={category}
              data-category={category}
              onClick={() => handleCategoryClick(category)}
              className="flex flex-col items-center gap-2 flex-shrink-0 group"
            >
              {/* Circular Icon */}
              <div
                className={`
                  w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200
                  ${
                    isActive
                      ? "bg-emerald-600 shadow-lg shadow-emerald-200"
                      : "bg-gray-100 group-hover:bg-emerald-50"
                  }
                `}
              >
                <Icon
                  size={28}
                  className={`
                    transition-colors duration-200
                    ${isActive ? "text-white" : "text-gray-600 group-hover:text-emerald-600"}
                  `}
                />
              </div>
              
              {/* Label */}
              <span
                className={`
                  text-xs font-semibold text-center max-w-[80px] leading-tight transition-colors duration-200
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
  );
}
