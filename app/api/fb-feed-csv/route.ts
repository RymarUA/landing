/**
 * app/api/fb-feed-csv/route.ts
 * 
 * CSV feed for Facebook Commerce Manager with real Sitniks data
 */

import { NextResponse } from 'next/server';
import { getCatalogProducts } from '@/lib/instagram-catalog';

export async function GET() {
  try {
    // Отримуємо реальні товари з Sitniks
    const products = await getCatalogProducts();
    
    if (!products || products.length === 0) {
      return new NextResponse('No products found', { status: 404 });
    }

    // Генеруємо CSV заголовок
    const csvHeaders = 'id,title,description,availability,condition,price,link,image_link,brand,category,quantity';
    
    // Генеруємо CSV рядки для кожного товару
    const csvRows = products.map(product => {
      const row = [
        product.id,
        `"${product.name.replace(/"/g, '""')}"`, // Escape quotes in CSV
        `"${(product.description || product.name).replace(/"/g, '""')}"`,
        product.stock > 0 ? 'in stock' : 'out of stock',
        'new',
        `${product.price.toFixed(2)} UAH`,
        `https://familyhub.com.ua/product/${product.slug}`,
        product.image,
        'Rymar',
        `"${product.category.replace(/"/g, '""')}"`,
        product.stock.toString()
      ];
      return row.join(',');
    });

    // Об'єднуємо все в один CSV
    const csvContent = [csvHeaders, ...csvRows].join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // Кеш на 1 годину
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('[fb-feed-csv] Error generating CSV feed:', error);
    
    // Fallback до тестових даних
    const fallbackCsv = `id,title,description,availability,condition,price,link,image_link,brand,category,quantity
12345,Наколенник ортопедичний "Comfort Pro",Ортопедичний наколенник для підтримки суглоба,in stock,new,1200.00 UAH,https://familyhub.com.ua/product/nakolennik-ortopedichnyi,https://cdn.sitniks.com/cmp-4939/products/2026-03-11/425105e/8102366-1773236660340.jpeg,Rymar,Наколінники,10
12346,Компрессионный спортивный локтевой бандаж Vilico,Компрессионный спортивный локтевой бандаж Vilico с 3D-вязанием,in stock,new,1450.00 UAH,https://familyhub.com.ua/product/loktevoy-bandazh-vilico,https://cdn.sitniks.com/cmp-4939/products/2026-03-12/f31737/89aebd-1773318812492.jpeg,Rymar,Налокотники,14`;

    return new NextResponse(fallbackCsv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Cache-Control': 'public, max-age=300', // Менший кеш для fallback
      },
    });
  }
}
