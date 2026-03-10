import type { MetadataRoute } from 'next/types';
import { getCatalogProducts } from '@/lib/instagram-catalog';
import { siteConfig } from '@/lib/site-config';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url;
  
  try {
    const products = await getCatalogProducts();
    
    const productUrls = products.map((product) => ({
      url: `${baseUrl}/product/${product.id}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }));
    
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 1,
      },
      {
        url: `${baseUrl}/checkout`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      },
      {
        url: `${baseUrl}/about`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.5,
      },
      ...productUrls,
    ];
  } catch (error) {
    console.error('[CRITICAL] Sitemap generation failed:', error);

    if (process.env.NODE_ENV === 'production') {
      // Fail fast so monitoring surfaces the issue (Next.js will log/alert)
      throw error;
    }

    // Development fallback: minimal sitemap to keep dev server running
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 1,
      },
    ];
  }
}

