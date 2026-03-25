// @ts-nocheck
"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

interface ProductPageHeaderProps {
  productName: string;
  productId: string;
}

export function ProductPageHeader({ productName, productId }: ProductPageHeaderProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const desktopScrollRef = useRef<HTMLDivElement>(null);

  const tabs = [
    { id: "overview", label: "Огляд" },
    { id: "reviews", label: "Відгуки" },
    { id: "description", label: "Опис" },
    { id: "photos", label: "Фото" },
    { id: "recommended", label: "Рекомендації" },
  ];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    
    setTimeout(() => {
      if (tabId === "overview") {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      } else {
        const section = document.getElementById(tabId);
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

  // Intersection Observer для автоматического переключения tabs при скролле
  useEffect(() => {
    const sections = tabs.map(tab => document.getElementById(tab.id)).filter(Boolean);
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.id;
            if (tabs.find(tab => tab.id === sectionId)) {
              setActiveTab(sectionId);
            }
          }
        });
      },
      {
        rootMargin: '-100px 0px -60% 0px', // Секция считается активной, когда она занимает 40% экрана
        threshold: [0, 0.1, 0.5, 1]
      }
    );

    sections.forEach(section => observer.observe(section));

    return () => {
      sections.forEach(section => observer.unobserve(section));
    };
  }, [tabs]);

  // Отслеживание скролла для секции overview (когда вверху страницы)
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      // Если мы вверху страницы (меньше 200px), активируем overview
      if (scrollPosition < 200) {
        setActiveTab('overview');
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Проверяем при загрузке

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // ✅ Scroll ТІЛЬКИ контейнера
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    const container = isMobile ? mobileScrollRef.current : desktopScrollRef.current;
    if (!container) return;

    const activeButton = container.querySelector(`[data-tab="${activeTab}"]`) as HTMLElement;
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
  }, [activeTab]);

  return (
    <div className="bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-1.5 flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base text-stone-500 overflow-x-auto">
          <Link href="/" className="hover:text-orange-500 transition-colors whitespace-nowrap">Головна</Link>
          <span>/</span>
          <Link href="/#catalog" className="hover:text-orange-500 transition-colors whitespace-nowrap">Каталог</Link>
          <span>/</span>
          <span className="text-stone-900 font-medium truncate max-w-[120px] sm:max-w-[200px]">{productName}</span>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          {/* 📱 МОБІЛЬНА ВЕРСІЯ: Текстові вкладки */}
          <div className="md:hidden">
            <div
              ref={mobileScrollRef}
              className="flex px-2 py-1.5 gap-1.5 overflow-x-hidden"
            >
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    data-tab={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`
                      px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap
                      flex-shrink-0
                      ${isActive 
                        ? "bg-[#2E7D32] text-white shadow-md" 
                        : "bg-[#FAF9F4] text-[#4A4A4A] border border-[#E5E5E5]"
                      }
                    `}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 🖥️ DESKTOP ВЕРСІЯ: Текстові вкладки */}
          <div className="hidden md:block">
            <div className="w-full">
              <div
                ref={desktopScrollRef}
                className="flex items-center gap-6 sm:gap-8 px-4 overflow-x-hidden"
              >
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      data-tab={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`pb-3 px-1 text-sm font-semibold border-b-2 whitespace-nowrap flex-shrink-0 ${
                        isActive
                          ? "text-orange-500 border-orange-500"
                          : "text-gray-400 border-transparent hover:text-gray-600"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
