/**
 * app/api/feed-test/route.ts
 * 
 * Simple endpoint to test URL accessibility
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const testResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    domain: 'familyhub.com.ua',
    endpoints: {
      xml: 'https://familyhub.com.ua/api/fb-feed',
      xml_test: 'https://familyhub.com.ua/api/fb-feed-test',
      xml_simple: 'https://familyhub.com.ua/api/fb-feed-simple',
      xml_google: 'https://familyhub.com.ua/api/fb-feed-google',
      csv: 'https://familyhub.com.ua/api/fb-feed-csv'
    },
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  };

  return NextResponse.json(testResponse);
}
