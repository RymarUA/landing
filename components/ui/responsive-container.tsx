// @ts-nocheck
import React from 'react';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/hooks/use-responsive';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
  maxWidth?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
}

// Адаптивний контейнер, який автоматично підлаштовує відступи та максимальну ширину
export function ResponsiveContainer({
  children,
  className,
  size = 'lg',
  padding = {
    mobile: 'px-4',
    tablet: 'px-6',
    desktop: 'px-8'
  },
  maxWidth = {
    mobile: 'max-w-full',
    tablet: 'max-w-2xl',
    desktop: 'max-w-7xl'
  }
}: ResponsiveContainerProps) {
  const { screenSize } = useResponsive();

  const getContainerClasses = () => {
    const baseClasses = 'mx-auto transition-all duration-300';
    
    // Отступы в зависимости от размера экрана
    const paddingClass = padding[screenSize] || padding.mobile || 'px-4';
    
    // Максимальная ширина
    const maxWidthClass = maxWidth[screenSize] || maxWidth.mobile || 'max-w-full';
    
    // Размер контейнера
    const sizeClasses = {
      xs: 'max-w-xs',
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      '2xl': 'max-w-2xl',
      full: 'max-w-full'
    };
    
    return cn(
      baseClasses,
      paddingClass,
      sizeClasses[size],
      maxWidthClass,
      className
    );
  };

  return (
    <div className={getContainerClasses()}>
      {children}
    </div>
  );
}

// Компонент для адаптивної сітки
interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
}

export function ResponsiveGrid({
  children,
  className,
  cols = {
    mobile: 1,
    tablet: 2,
    desktop: 3
  },
  gap = {
    mobile: 'gap-4',
    tablet: 'gap-6',
    desktop: 'gap-8'
  }
}: ResponsiveGridProps) {
  const { screenSize } = useResponsive();

  const getGridClasses = () => {
    const colsCount = cols[screenSize] || cols.mobile || 1;
    const gapClass = gap[screenSize] || gap.mobile || 'gap-4';
    
    // Tailwind класи для сітки
    const gridColsClasses = {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
      5: 'grid-cols-5',
      6: 'grid-cols-6',
      12: 'grid-cols-12'
    };
    
    return cn(
      'grid',
      gridColsClasses[colsCount as keyof typeof gridColsClasses] || 'grid-cols-1',
      gapClass,
      className
    );
  };

  return (
    <div className={getGridClasses()}>
      {children}
    </div>
  );
}

// Компонент для адаптивного тексту
interface ResponsiveTextProps {
  children: React.ReactNode;
  className?: string;
  size?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
  weight?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
  as?: keyof JSX.IntrinsicElements;
}

export function ResponsiveText({
  children,
  className,
  size = {
    mobile: 'text-sm',
    tablet: 'text-base',
    desktop: 'text-lg'
  },
  weight = {
    mobile: 'font-normal',
    tablet: 'font-medium',
    desktop: 'font-semibold'
  },
  as: Component = 'p'
}: ResponsiveTextProps) {
  const { screenSize } = useResponsive();

  const getTextClasses = () => {
    const sizeClass = size[screenSize] || size.mobile || 'text-base';
    const weightClass = weight[screenSize] || weight.mobile || 'font-normal';
    
    return cn(sizeClass, weightClass, className);
  };

  return <Component className={getTextClasses()}>{children}</Component>;
}
