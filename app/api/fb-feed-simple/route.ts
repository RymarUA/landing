/**
 * app/api/fb-feed-simple/route.ts
 * 
 * Simple XML feed without Google Product namespace
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const testXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Rymar Product Feed</title>
    <link>https://familyhub.com.ua</link>
    <description>Product feed for Facebook Commerce Manager</description>
    <lastBuildDate>Mon, 16 Mar 2026 12:00:00 GMT</lastBuildDate>
    <item>
      <id>12345</id>
      <title>Наколенник ортопедичний "Comfort Pro"</title>
      <description>Ортопедичний наколенник для підтримки суглоба</description>
      <availability>in stock</availability>
      <condition>new</condition>
      <price>1200.00 UAH</price>
      <link>https://familyhub.com.ua/product/nakolennik-ortopedichnyi</link>
      <image_link>https://cdn.sitniks.com/cmp-4939/products/2026-03-11/425105e/8102366-1773236660340.jpeg</image_link>
      <brand>Rymar</brand>
      <category>Наколінники</category>
      <quantity>10</quantity>
    </item>
    <item>
      <id>12346</id>
      <title>Компрессионный спортивный локтевой бандаж Vilico</title>
      <description>Компрессионный спортивный локтевой бандаж Vilico с 3D-вязанием</description>
      <availability>in stock</availability>
      <condition>new</condition>
      <price>1450.00 UAH</price>
      <link>https://familyhub.com.ua/product/loktevoy-bandazh-vilico</link>
      <image_link>https://cdn.sitniks.com/cmp-4939/products/2026-03-12/f31737/89aebd-1773318812492.jpeg</image_link>
      <brand>Rymar</brand>
      <category>Налокотники</category>
      <quantity>14</quantity>
    </item>
  </channel>
</rss>`;

  return new NextResponse(testXml, {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
