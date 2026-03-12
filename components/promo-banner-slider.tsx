// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Gift, Truck, Percent } from "lucide-react";

interface PromoBanner {
  id: number;
  text: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  bgGradient: string;
}

const PROMO_BANNERS: PromoBanner[] = [
  {
    id: 1,
    text: "Подарунок при покупці від 1000 грн",
    icon: Gift,
    bgGradient: "from-emerald-600 to-emerald-700",
  },
  {
    id: 2,
    text: "Безкоштовна доставка від 800 грн",
    icon: Truck,
    bgGradient: "from-amber-600 to-amber-700",
  },
  {
    id: 3,
    text: "Знижка -15% на перше замовлення",
    icon: Percent,
    bgGradient: "from-red-600 to-red-700",
  },
];

export function PromoBannerSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % PROMO_BANNERS.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const handlePrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + PROMO_BANNERS.length) % PROMO_BANNERS.length);
  };

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % PROMO_BANNERS.length);
  };

  const currentBanner = PROMO_BANNERS[currentIndex];
  const Icon = currentBanner.icon;

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0,
    }),
  };

  return (
    <div className="relative w-full overflow-hidden rounded-2xl shadow-lg mb-6">
      <div className={`relative bg-gradient-to-r ${currentBanner.bgGradient} px-6 py-8 md:py-10`}>
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentBanner.id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="flex items-center justify-center gap-3 text-white"
          >
            <Icon size={28} className="flex-shrink-0" />
            <p className="text-lg md:text-xl font-bold text-center">{currentBanner.text}</p>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <button
          onClick={handlePrev}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-colors"
          aria-label="Попередній банер"
        >
          <ChevronLeft size={18} className="text-white" />
        </button>
        <button
          onClick={handleNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-colors"
          aria-label="Наступний банер"
        >
          <ChevronRight size={18} className="text-white" />
        </button>

        {/* Dots Indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {PROMO_BANNERS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setDirection(idx > currentIndex ? 1 : -1);
                setCurrentIndex(idx);
              }}
              className={`h-1.5 rounded-full transition-all ${
                idx === currentIndex ? "w-6 bg-white" : "w-1.5 bg-white/50"
              }`}
              aria-label={`Перейти до банера ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
