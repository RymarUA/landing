/**
 * app/api/fb-feed/route.ts
 *
 * API endpoint для генерації XML-фіда для Facebook Commerce Manager.
 * 
 * Використання:
 *   GET /api/fb-feed - повертає XML фід з усіма товарами з Sitniks CRM
 * 
 * Налаштування в Facebook Commerce Manager:
 *   1. Data Sources -> Add items -> Data Feed
 *   2. Вставити URL: https://yourdomain.com/api/fb-feed
 *   3. Розклад оновлень: щогодини
 * 
 * Вимоги до товарів у Sitniks:
 *   - Обов'язково: title, price, image
 *   - Рекомендовано: description, category
 *   - Унікальний ID: id (з Sitniks)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCatalogProducts } from '@/lib/instagram-catalog';
import { CatalogProduct } from '@/lib/instagram-catalog';

// Типи для Facebook Product Feed
interface FacebookProduct {
  id: string;
  title: string;
  description: string;
  availability: 'in stock' | 'out of stock';
  condition: 'new' | 'refurbished' | 'used';
  price: string;
  link: string;
  image_link: string;
  brand?: string;
  category?: string;
  quantity?: string;
  sale_price?: string;
  sale_price_effective_date?: string;
}

function generateFacebookFeed(products: CatalogProduct[]): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://localhost:3000';
  const today = new Date().toISOString().split('T')[0];

  const xmlProducts = products.map(product => {
    const fbProduct: FacebookProduct = {
      id: product.id.toString(),
      title: product.name,
      description: product.description || product.name,
      availability: product.stock > 0 ? 'in stock' : 'out of stock',
      condition: 'new',
      price: `${product.price.toFixed(2)} UAH`,
      link: `${baseUrl}/product/${product.slug}`,
      image_link: product.image,
      brand: 'Rymar', // Можна винести в налаштування
      category: product.category,
      quantity: product.stock > 0 ? product.stock.toString() : '0',
    };

    // Додаємо стару ціну якщо є знижка
    if (product.oldPrice && product.oldPrice > product.price) {
      fbProduct.sale_price = `${product.price.toFixed(2)} UAH`;
      fbProduct.price = `${product.oldPrice.toFixed(2)} UAH`;
      // Правильний формат дати для Facebook: YYYY-MM-DDT00:00/YYYY-MM-DDT23:59
      fbProduct.sale_price_effective_date = `${today}T00:00/${today}T23:59`;
    }

    const productXml = Object.entries(fbProduct)
      .filter(([_, value]) => value !== undefined && value !== '')
      .map(([key, value]) => {
        const xmlValue = String(value)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
        return `    <g:${key}>${xmlValue}</g:${key}>`;
      })
      .join('\n');

    return `  <item>\n${productXml}\n  </item>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>Rymar Product Feed</title>
    <link>${baseUrl}</link>
    <description>Product feed for Facebook Commerce Manager</description>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${xmlProducts}
  </channel>
</rss>`;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function GET(_request: NextRequest) {
  try {
    console.log('[fb-feed] Starting feed generation...');
    
    // Отримуємо товари з Sitniks
    const products = await getCatalogProducts();
    
    if (!products || products.length === 0) {
      console.warn('[fb-feed] No products found');
      return new NextResponse('No products found', { status: 404 });
    }

    console.log(`[fb-feed] Found ${products.length} products`);
    
    // Генеруємо XML
    const xml = generateFacebookFeed(products);
    
    // Повертаємо XML з правильними headers для Facebook
    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Кеш на 1 годину
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
    
  } catch (error) {
    console.error('[fb-feed] Error generating feed:', error);
    
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
<error>
  <message>Failed to generate product feed</message>
  <timestamp>${new Date().toISOString()}</timestamp>
</error>`,
      {
        status: 500,
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
        },
      }
    );
  }
}

// Для дебагу - можна викликати в браузері
export async function POST(request: NextRequest) {
  return GET(request);
}
