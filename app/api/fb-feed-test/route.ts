/**
 * app/api/fb-feed-test/route.ts
 * 
 * Test endpoint to verify XML feed structure
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const testXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>Rymar Product Feed</title>
    <link>https://familyhub.com.ua</link>
    <description>Product feed for Facebook Commerce Manager</description>
    <lastBuildDate>Mon, 16 Mar 2026 12:00:00 GMT</lastBuildDate>
    <item>
      <g:id>12345</g:id>
      <g:title>Наколенник ортопедичний "Comfort Pro"</g:title>
      <g:description>Ортопедичний наколенник для підтримки суглоба</g:description>
      <g:availability>in stock</g:availability>
      <g:condition>new</g:condition>
      <g:price>1200.00 UAH</g:price>
      <g:link>https://familyhub.com.ua/product/nakolennik-ortopedichnyi</g:link>
      <g:image_link>https://cdn.sitniks.com/cmp-4939/products/2026-03-11/425105e/8102366-1773236660340.jpeg</g:image_link>
      <g:brand>Rymar</g:brand>
      <g:category>Наколінники</g:category>
      <g:quantity>10</g:quantity>
    </item>
    <item>
      <g:id>12346</g:id>
      <g:title>Компрессионный спортивный локтевой бандаж Vilico</g:title>
      <g:description>Компрессионный спортивный локтевой бандаж Vilico с 3D-вязанием</g:description>
      <g:availability>in stock</g:availability>
      <g:condition>new</g:condition>
      <g:price>1450.00 UAH</g:price>
      <g:link>https://familyhub.com.ua/product/loktevoy-bandazh-vilico</g:link>
      <g:image_link>https://cdn.sitniks.com/cmp-4939/products/2026-03-12/f31737/89aebd-1773318812492.jpeg</g:image_link>
      <g:brand>Rymar</g:brand>
      <g:category>Налокотники</g:category>
      <g:quantity>14</g:quantity>
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
