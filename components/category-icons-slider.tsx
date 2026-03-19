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
  Flame
} from "lucide-react";

interface CategoryIconsSliderProps {
  onCategoryChange?: (category: string) => void;
  initialCategory?: string;
}

function getCategoryIcon(categoryName: string): React.ComponentType<{ size?: number; className?: string }> {
  const name = categoryName.toLowerCase();
  
  if (name.includes("всі") || name.includes("все")) return Grid3x3;
  if (name.includes("доставк")) return Truck;
  if (name.includes("наколінник") || name.includes("коліно")) return Activity;
  if (name.includes("пластир")) return Bandage;
  if (name.includes("налокотник") || name.includes("лікоть")) return Shield;
  if (name.includes("бандаж")) return Shield;
  if (name.includes("масаж")) return Vibrate;
  if (name.includes("маз") || name.includes("гел") || name.includes("крем")) return Droplets;
  if (name.includes("білизна") || name.includes("компресі")) return Shirt;
  if (name.includes("інше") || name.includes("other")) return Flame;
  
  return Flame;
}

export function CategoryIconsSlider({
  onCategoryChange,
  initialCategory = "Всі",
}: CategoryIconsSliderProps) {
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [categories, setCategories] = useState<string[]>(["Всі"]);
  const [isLoading, setIsLoading] = useState(true);
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const desktopScrollRef = useRef<HTMLDivElement>(null);

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

  // ✅ Scroll ТІЛЬКИ контейнера
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    const container = isMobile ? mobileScrollRef.current : desktopScrollRef.current;
    if (!container) return;

    const activeButton = container.querySelector(`[data-category="${activeCategory}"]`) as HTMLElement;
    if (!activeButton) return;

    const containerRect = container.getBoundingClientRect();
    const buttonRect = activeButton.getBoundingClientRect();
    
    const isVisible = 
      buttonRect.left >= containerRect.left &&
      buttonRect.right <= containerRect.right;

    if (!isVisible) {
      const scrollLeft = 
        activeButton.offsetLeft - 
        container.offsetWidth / 2 + 
        activeButton.offsetWidth / 2;

      container.scrollTo({
        left: scrollLeft,
        behavior: 'smooth'
      });
    }
  }, [activeCategory]);

  if (isLoading) {
    return (
      <div className="hidden md:block bg-white border-b border-gray-100 py-1.5 shadow-sm">
        <div className="flex items-center justify-center h-[60px]">
          <div className="animate-pulse text-gray-400 text-sm">Завантаження...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-b border-gray-100 py-1.5 shadow-sm">
      {/* 📱 МОБІЛЬНА ВЕРСІЯ: Текстові вкладки */}
      <div className="md:hidden">
        <div
          ref={mobileScrollRef}
          className="flex overflow-x-auto scrollbar-hide px-2 py-1.5 gap-1.5"
          style={{
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
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
                  px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all
                  ${isActive 
                    ? "bg-[#2E7D32] text-white shadow-md" 
                    : "bg-[#FAF9F4] text-[#4A4A4A] border border-[#E5E5E5]"
                  }
                `}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>

      {/* 🖥️ DESKTOP ВЕРСІЯ: Іконки */}
      <div className="hidden md:block">
        <div className="w-full">
          <div
            ref={desktopScrollRef}
            className="flex items-start overflow-x-auto scrollbar-hide px-4 gap-2"
            style={{
              WebkitOverflowScrolling: "touch",
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
                      w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 mb-1.5
                      ${isActive
                        ? "bg-[#2E7D32] shadow-lg"
                        : "bg-[#FAF9F4] group-hover:bg-[#F0EDE6] border border-[#E5E5E5]"
                      }
                    `}
                  >
                    <Icon
                      size={20}
                      className={`transition-colors ${isActive ? "text-white" : "text-[#4A4A4A]"}`}
                    />
                  </div>
                  
                  <span className={`text-xs font-semibold text-center px-1 line-clamp-2 ${isActive ? "text-[#1A1A1A]" : "text-[#4A4A4A]"}`}>
                    {category}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
