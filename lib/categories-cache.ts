// @ts-nocheck
import { cache } from 'react';
import { siteConfig } from '@/lib/site-config';

const DEFAULT_BASE_URL = 'http://localhost:3000';

const buildCategoriesEndpoint = () => {
  // In development, always use localhost to avoid CORS
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000/api/categories';
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/api/categories`;
  }

  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return `${process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, '')}/api/categories`;
  }

  if (process.env.NEXT_PUBLIC_URL) {
    return `${process.env.NEXT_PUBLIC_URL.replace(/\/+$/, '')}/api/categories`;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/+$/, '')}/api/categories`;
  }

  const fallbackBase = siteConfig.url || DEFAULT_BASE_URL;
  return `${fallbackBase.replace(/\/+$/, '')}/api/categories`;
};

// Статичні категорії для миттєвого завантаження
export const getStaticCategories = () => {
  return [
    'Всі',
    'Хіти продажів',
    'Безкоштовна доставка',
    ...siteConfig.catalogCategories.filter(
      (cat) => cat !== 'Безкоштовна доставка' && cat !== 'Хіти продажів'
    ),
  ];
};

// Кешована функція для отримання категорій
export const getCategories = cache(async () => {
  const endpoint = buildCategoriesEndpoint();

  try {
    const response = await fetch(endpoint, {
      next: { revalidate: 300 }, // Кешувати на 5 хвилин
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch categories (status ${response.status})`);
    }
    
    const data = await response.json();
    return data.categories || getStaticCategories();
  } catch (error) {
    console.error(`[categories-cache] Error fetching categories from ${endpoint}:`, error);
    return getStaticCategories();
  }
});
