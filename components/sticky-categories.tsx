// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { CategoryIconsSlider } from "@/components/category-icons-slider";
import { usePathname, useRouter } from "next/navigation";

export function StickyCategories() {
  const pathname = usePathname();
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("Всі");

  // Sync with URL hash
  useEffect(() => {
    const syncFromHash = () => {
      const hash = window.location.hash;
      const catMatch = hash.match(/category=([^&#]*)/);
      if (catMatch) {
        const cat = decodeURIComponent(catMatch[1].trim());
        setActiveCategory(cat);
      }
    };
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    window.location.hash = `category=${encodeURIComponent(category)}`;
    
    // Scroll to catalog section smoothly
    const catalogSection = document.getElementById('catalog');
    if (catalogSection) {
      catalogSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Only show on home page
  if (pathname !== "/") return null;

  return (
    <CategoryIconsSlider
      onCategoryChange={handleCategoryChange}
      initialCategory={activeCategory}
    />
  );
}
