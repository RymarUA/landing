"use client";

import { useEffect } from "react";

export function CatalogHashHandler() {
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash.includes("catalog")) {
        const scrollWithRetry = () => {
          const catalogElement = document.getElementById("catalog");
          if (!catalogElement) {
            // Пробуем снова через 100мс, если элемент еще не загружен
            setTimeout(scrollWithRetry, 100);
            return;
          }

          const headerElement = document.getElementById("site-header");
          const headerHeight = headerElement?.getBoundingClientRect().height ?? 0;
          const additionalGap = 4;

          const targetTop = catalogElement.getBoundingClientRect().top + window.scrollY - headerHeight - additionalGap;
          window.scrollTo({
            top: Math.max(targetTop, 0),
            behavior: "smooth",
          });
        };

        // Начинаем прокрутку с небольшой задержкой для рендеринга
        setTimeout(scrollWithRetry, 100);
      }
    };

    // Обрабатываем текущий хеш и будущие изменения
    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  return null;
}
