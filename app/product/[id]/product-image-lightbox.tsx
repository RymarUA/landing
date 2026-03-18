// @ts-nocheck
"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import type { PanInfo } from "framer-motion";
import { X } from "lucide-react";

interface Props {
  src: string;
  alt: string;
  images?: string[]; // Additional images for gallery
  children?: React.ReactNode;
  priority?: boolean;
}

export function ProductImageLightbox({ src, alt, images = [], children, priority = false }: Props) {
  const [open, setOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const allImages = useMemo(() => {
    const sanitized = [src, ...(images ?? [])].filter(Boolean);
    if (sanitized.length === 0) return [];
    if (sanitized.length === 1) {
      return [...sanitized, sanitized[0]];
    }
    return sanitized;
  }, [src, images]);

  const showControls = allImages.length > 1;
  const currentImage = allImages[currentIndex];

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    };
    document.addEventListener("keydown", handler, true);
    return () => document.removeEventListener("keydown", handler, true);
  }, [open]);

  const changeSlide = (delta: number) => {
    if (!showControls && delta !== 0) return;
    setDirection(delta);
    setCurrentIndex((prev) => {
      const next = (prev + delta + allImages.length) % allImages.length;
      return next;
    });
  };

  const handleNext = () => changeSlide(1);
  const handlePrevious = () => changeSlide(-1);

  const handleSelectIndex = (index: number) => {
    if (index === currentIndex) return;
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (!showControls) return;
    const swipeThreshold = 60;
    const velocityThreshold = 400;
    if (
      Math.abs(info.offset.x) > swipeThreshold ||
      Math.abs(info.velocity.x) > velocityThreshold
    ) {
      if (info.offset.x < 0) {
        handleNext();
      } else {
        handlePrevious();
      }
    }
  };

  return (
    <>
      <div className="space-y-4">
        {/* Main Image Container */}
        <div className="group relative">
          {showControls && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevious();
                }}
                className="hidden lg:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center rounded-full bg-white/90 text-stone-900 shadow-lg transition-all duration-200 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 z-20"
                aria-label="Попереднє зображення"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="hidden lg:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center rounded-full bg-white/90 text-stone-900 shadow-lg transition-all duration-200 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 z-20"
                aria-label="Наступне зображення"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          <div className="relative aspect-square w-full sm:rounded-2xl rounded-xl bg-stone-50">
            <motion.button
              key={currentImage + currentIndex}
              type="button"
              onClick={() => setOpen(true)}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              className="relative block h-full w-full cursor-zoom-in text-left overflow-hidden"
              aria-label="Збільшити зображення"
            >
              <Image
                src={currentImage}
                alt={alt}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-contain"
                priority={priority}
              />
              {children}
            </motion.button>
          </div>
        </div>

        {showControls && (
          <div className="flex justify-center gap-2">
            {allImages.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelectIndex(index)}
                aria-label={`Перейти до зображення ${index + 1}`}
                className={`h-2.5 w-2.5 rounded-full transition-all ${
                  index === currentIndex
                    ? "bg-stone-900 scale-110"
                    : "bg-stone-300 hover:bg-stone-400"
                }`}
              />
            ))}
          </div>
        )}

        {showControls && (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {allImages.map((image, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelectIndex(index)}
                className={`relative flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all ${
                  index === currentIndex
                    ? "border-orange-500 shadow-[0_8px_20px_rgba(249,115,22,0.25)]"
                    : "border-transparent hover:border-stone-200"
                }`}
                aria-label={`Перейти до зображення ${index + 1}`}
              >
                <Image
                  src={image}
                  alt={`${alt} - зображення ${index + 1}`}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {open && (
        <div
          className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Збільшене зображення"
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
            aria-label="Закрити"
          >
            <X size={24} />
          </button>
          
          {/* Lightbox Navigation */}
          {showControls && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevious();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
                aria-label="Попереднє зображення"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
                aria-label="Наступне зображення"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          <div className="relative w-full h-full max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="relative w-full h-full">
              <motion.div
                key={currentImage + currentIndex}
                className="absolute inset-0"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.15}
                onDragEnd={handleDragEnd}
              >
                <Image
                  src={currentImage}
                  alt={alt}
                  fill
                  sizes="100vw"
                  className="object-contain"
                />
              </motion.div>
            </div>

            {showControls && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/40 rounded-2xl p-2">
                {allImages.map((image, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSelectIndex(index)}
                    className={`relative flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden border-2 transition-all ${
                      index === currentIndex
                        ? "border-white"
                        : "border-transparent hover:border-white/50"
                    }`}
                    aria-label={`Перейти до зображення ${index + 1}`}
                  >
                    <Image
                      src={image}
                      alt={`${alt} - зображення ${index + 1}`}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
