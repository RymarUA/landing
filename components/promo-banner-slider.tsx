// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Gift, Truck, Percent } from "lucide-react";

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
    bgGradient: "from-[#2E7D32] to-[#1B5E20]",
  },
  {
    id: 2,
    text: "Знижка -15% на твое перше замовлення",
    icon: Percent,
    bgGradient: "from-[#F9A825] to-[#F57C00]",
  },
];

const SLIDE_INTERVAL = 5000;

export function PromoBannerSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!sliderRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsActive(entry.isIntersecting);
      },
      { threshold: 0.4 }
    );

    observer.observe(sliderRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (shouldReduceMotion) return;
    if (!isActive) return;

    const timer = window.setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % PROMO_BANNERS.length);
    }, SLIDE_INTERVAL);

    return () => window.clearInterval(timer);
  }, [isActive, shouldReduceMotion]);

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
    <div className="relative w-full overflow-hidden rounded-2xl shadow-lg mb-6" ref={sliderRef}>
      <motion.div 
        className={`relative bg-gradient-to-r ${currentBanner.bgGradient} px-6 py-5 md:py-6`} 
        aria-live="polite"
        layout
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentBanner.id}
            custom={direction}
            variants={variants}
            initial={shouldReduceMotion ? false : "enter"}
            animate={shouldReduceMotion ? { opacity: 1, x: 0 } : "center"}
            exit={shouldReduceMotion ? undefined : "exit"}
            transition={shouldReduceMotion ? { duration: 0 } : {
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="flex items-center justify-center gap-2.5 text-white"
          >
            <Icon size={22} className="flex-shrink-0" />
            <p className="text-base md:text-lg font-bold text-center">{currentBanner.text}</p>
          </motion.div>
        </AnimatePresence>

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
      </motion.div>
    </div>
  );
}
