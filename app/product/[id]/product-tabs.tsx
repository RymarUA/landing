"use client";

import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

interface ProductTabsProps {
  productName: string;
  productId: number;
}

const tabs = [
  { id: "overview", label: "Огляд" },
  { id: "description", label: "Опис" },
  { id: "photos", label: "Фото" },
  { id: "reviews", label: "Відгуки" },
  { id: "recommended", label: "Рекомендації" }
];

export function ProductTabs({ productName, productId }: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState("overview");

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    console.log('Tab changed:', tab);
    
    // Прокрутка к соответствующему разделу
    setTimeout(() => {
      if (tab === "overview") {
        // Для "Огляд" - прокрутка к самому верху страницы
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      } else {
        // Для других табов - прокрутка к соответствующему разделу
        const section = document.getElementById(tab);
        if (section) {
          const offset = 128; // Высота search bar (64px) + breadcrumbs (40px) + tabs header (48px) + tabs navigation (24px)
          const elementPosition = section.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - offset;
          
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }
    }, 100);
  };

  return (
    <div className="bg-white border-b border-gray-100 sticky top-8 z-10">
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        {/* Верхняя навигация */}
        <div className="flex items-center justify-between py-3 sticky top-8 bg-white z-10">
          {/* Кнопка назад */}
          <Link
            href="/#catalog"
            className="flex items-center gap-1.5 text-xs sm:text-sm text-stone-500 hover:text-stone-700 transition-colors"
          >
            <ChevronLeft size={14} className="sm:w-4 sm:h-4" />
            Назад до каталогу
          </Link>

          {/* Пустое пространство для баланса */}
          <div></div>
        </div>

        {/* Табы */}
        <div className="flex items-center gap-6 sm:gap-8 pb-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-all ${
                activeTab === tab.id
                  ? "text-orange-500 border-orange-500"
                  : "text-gray-400 border-transparent hover:text-gray-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
