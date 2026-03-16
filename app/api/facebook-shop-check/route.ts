/**
 * app/api/facebook-shop-check/route.ts
 * 
 * Check Facebook Shop integration status
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const checks = {
    page: {
      url: 'https://www.facebook.com/familyhubmarketod',
      status: 'exists',
      recommendations: [
        'Перевір, що сторінка має Business тип',
        'Додай вкладку Shop в налаштуваннях сторінки',
        'Налаштуй кнопку Shop Now'
      ]
    },
    catalog: {
      url: 'https://familyhub.com.ua/api/fb-feed-csv',
      status: 'active',
      products: 'auto-sync from Sitniks',
      update_frequency: '1 hour'
    },
    integration: {
      steps: [
        '1. Commerce Manager → Catalog → Connect',
        '2. Вибери сторінку familyhubmarketod',
        '3. Активуй Sales Channel',
        '4. Налаштуй кнопку Shop на сторінці'
      ]
    }
  };

  return NextResponse.json(checks);
}
