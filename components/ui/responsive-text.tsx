// @ts-nocheck
import React from 'react';
import { useResponsive } from '@/hooks/use-responsive';
import { cn } from '@/lib/utils';

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

// Адаптивний текстовий компонент
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

// Компонент для адаптивного заголовка
interface ResponsiveHeadingProps {
  children: React.ReactNode;
  className?: string;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  size?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
}

export function ResponsiveHeading({
  children,
  className,
  level = 2,
  size
}: ResponsiveHeadingProps) {
  const { screenSize } = useResponsive();
  
  const defaultSizes = {
    1: { mobile: 'text-2xl', tablet: 'text-3xl', desktop: 'text-4xl' },
    2: { mobile: 'text-xl', tablet: 'text-2xl', desktop: 'text-3xl' },
    3: { mobile: 'text-lg', tablet: 'text-xl', desktop: 'text-2xl' },
    4: { mobile: 'text-base', tablet: 'text-lg', desktop: 'text-xl' },
    5: { mobile: 'text-sm', tablet: 'text-base', desktop: 'text-lg' },
    6: { mobile: 'text-xs', tablet: 'text-sm', desktop: 'text-base' }
  };
  
  const headingSizes = size || defaultSizes[level];
  const sizeClass = headingSizes[screenSize] || headingSizes.mobile || 'text-base';
  
  const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
  
  return (
    <HeadingTag className={cn(
      'font-black text-gray-900',
      sizeClass,
      className
    )}>
      {children}
    </HeadingTag>
  );
}

// Компонент для адаптивної іконки
interface ResponsiveIconProps {
  size?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  className?: string;
  children: React.ReactNode;
}

export function ResponsiveIcon({
  size = {
    mobile: 16,
    tablet: 18,
    desktop: 20
  },
  className,
  children
}: ResponsiveIconProps) {
  const { screenSize } = useResponsive();
  
  const iconSize = size[screenSize] || size.mobile || 16;
  
  return (
    <div 
      className={cn('flex items-center justify-center', className)}
      style={{ fontSize: `${iconSize}px` }}
    >
      {children}
    </div>
  );
}
