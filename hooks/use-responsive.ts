// @ts-nocheck
import { useState, useEffect } from 'react';

// Брейкпоінти для різних розмірів екрану
export const BREAKPOINTS = {
  xs: 0,      // Телефон (маленький)
  sm: 640,    // Телефон (великий)
  md: 768,    // Планшет
  lg: 1024,   // Ноутбук
  xl: 1280,   // Десктоп
  '2xl': 1536 // Великий десктоп
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

// Типи для розмірів екрану
export type ScreenSize = 'mobile' | 'tablet' | 'desktop' | 'large';

// Хук для визначення поточного розміру екрану
export function useResponsive() {
  const [screenSize, setScreenSize] = useState<ScreenSize>('desktop');
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setWindowSize({ width, height });
      
      // Визначаємо тип екрану
      if (width < BREAKPOINTS.md) {
        setScreenSize('mobile');
      } else if (width < BREAKPOINTS.lg) {
        setScreenSize('tablet');
      } else if (width < BREAKPOINTS.xl) {
        setScreenSize('desktop');
      } else {
        setScreenSize('large');
      }
    };

    // Встановлюємо початкові значення
    handleResize();

    // Додаємо listener для зміни розміру
    window.addEventListener('resize', handleResize);
    
    // Очищення listener при розмонтуванні
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Утиліти для перевірки брейкпоінтів
  const is = {
    xs: windowSize.width >= BREAKPOINTS.xs && windowSize.width < BREAKPOINTS.sm,
    sm: windowSize.width >= BREAKPOINTS.sm && windowSize.width < BREAKPOINTS.md,
    md: windowSize.width >= BREAKPOINTS.md && windowSize.width < BREAKPOINTS.lg,
    lg: windowSize.width >= BREAKPOINTS.lg && windowSize.width < BREAKPOINTS.xl,
    xl: windowSize.width >= BREAKPOINTS.xl && windowSize.width < BREAKPOINTS['2xl'],
    '2xl': windowSize.width >= BREAKPOINTS['2xl'],
    
    // Зручні перевірки
    mobile: windowSize.width < BREAKPOINTS.md,
    tablet: windowSize.width >= BREAKPOINTS.md && windowSize.width < BREAKPOINTS.lg,
    desktop: windowSize.width >= BREAKPOINTS.lg,
    
    // Діапазони
    below: {
      sm: windowSize.width < BREAKPOINTS.sm,
      md: windowSize.width < BREAKPOINTS.md,
      lg: windowSize.width < BREAKPOINTS.lg,
      xl: windowSize.width < BREAKPOINTS.xl,
      '2xl': windowSize.width < BREAKPOINTS['2xl']
    },
    above: {
      xs: windowSize.width >= BREAKPOINTS.xs,
      sm: windowSize.width >= BREAKPOINTS.sm,
      md: windowSize.width >= BREAKPOINTS.md,
      lg: windowSize.width >= BREAKPOINTS.lg,
      xl: windowSize.width >= BREAKPOINTS.xl,
      '2xl': windowSize.width >= BREAKPOINTS['2xl']
    }
  };

  return {
    screenSize,
    windowSize,
    is,
    breakpoints: BREAKPOINTS
  };
}

// Допоміжна функція для отримання значень залежно від розміру екрану
export function getResponsiveValue<T>(values: Partial<Record<Breakpoint | ScreenSize, T>>, currentSize: ScreenSize, currentBreakpoint: Breakpoint): T | undefined {
  // Спочатку перевіряємо точний розмір екрану
  if (values[currentSize] !== undefined) {
    return values[currentSize];
  }
  
  // Потім перевіряємо поточний брейкпоінт
  if (values[currentBreakpoint] !== undefined) {
    return values[currentBreakpoint];
  }
  
  // Шукаємо найближчий менший брейкпоінт
  const breakpointOrder: Breakpoint[] = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs'];
  const currentIndex = breakpointOrder.indexOf(currentBreakpoint);
  
  for (let i = currentIndex - 1; i >= 0; i--) {
    const bp = breakpointOrder[i];
    if (values[bp] !== undefined) {
      return values[bp];
    }
  }
  
  return undefined;
}
