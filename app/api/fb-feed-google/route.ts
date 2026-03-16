/**
 * app/api/fb-feed-google/route.ts
 * 
 * Google Shopping format feed - most compatible with Facebook
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const testXml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:g="http://base.google.com/ns/1.0">
  <title>Rymar Product Feed</title>
  <link href="https://familyhub.com.ua" rel="alternate"/>
  <updated>2026-03-16T12:00:00Z</updated>
  <author>
    <name>Rymar</name>
  </author>
  <entry>
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
  </entry>
  <entry>
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
  </entry>
</feed>`;

  return new NextResponse(testXml, {
    status: 200,
    headers: {
      'Content-Type': 'application/atom+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
