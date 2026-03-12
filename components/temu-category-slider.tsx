// @ts-nocheck
"use client";

import { useState, useRef, useEffect } from "react";
import { siteConfig } from "@/lib/site-config";

interface TemuCategorySliderProps {
  onCategoryChange?: (category: string) => void;
  initialCategory?: string;
}

export function TemuCategorySlider({
  onCategoryChange,
  initialCategory = "Всі",
}: TemuCategorySliderProps) {
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);

  const categories = siteConfig.catalogCategories;

  const handleCategoryClick = (category: string) => {
    setActiveCategory(category);
    onCategoryChange?.(category);
  };

  // Touch swipe handler for category navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const deltaX = touchEndX - touchStartX.current;
    const deltaY = Math.abs(touchEndY - touchStartY.current);
    
    // Only trigger if horizontal swipe is significant and vertical movement is minimal
    if (Math.abs(deltaX) > 60 && deltaY < 40) {
      const currentIndex = categories.indexOf(activeCategory as any);
      
      if (deltaX > 0 && currentIndex > 0) {
        // Swipe right - go to previous category
        handleCategoryClick(categories[currentIndex - 1]);
      } else if (deltaX < 0 && currentIndex < categories.length - 1) {
        // Swipe left - go to next category
        handleCategoryClick(categories[currentIndex + 1]);
      }
    }
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
    <div 
      className="sticky top-[52px] z-40 bg-white border-b border-gray-200 shadow-sm"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        ref={scrollRef}
        className="flex overflow-x-auto scrollbar-hide px-2 py-3 gap-2"
        style={{
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {categories.map((category) => {
          const isActive = activeCategory === category;
          return (
            <button
              key={category}
              data-category={category}
              onClick={() => handleCategoryClick(category)}
              className={`
                flex-shrink-0 px-7 py-3 rounded-full text-base font-black
                transition-all whitespace-nowrap min-w-fit shadow-sm
                ${
                  isActive
                    ? "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-200 scale-105"
                    : "bg-white text-gray-800 border-2 border-gray-300 hover:border-emerald-400 hover:text-emerald-600 hover:shadow-md"
                }
              `}
            >
              {category}
            </button>
          );
        })}
      </div>
    </div>
  );
}

