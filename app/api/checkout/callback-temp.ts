/**
 * app/api/checkout/callback/route.ts
 *
 * DEPRECATED: This endpoint has been moved to /api/webhooks/wayforpay
 * This file now redirects to the new webhook endpoint for backward compatibility.
 * 
 * Please update your WayForPay configuration to use:
 * serviceUrl: https://yourdomain.com/api/webhooks/wayforpay
 */

import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  console.warn("[checkout/callback] DEPRECATED: This endpoint has moved to /api/webhooks/wayforpay");
  
  // Get the request body and forward it
  const body = await req.text();
  const headers = new Headers();
  req.headers.forEach((value, key) => {
    headers.set(key, value);
  });
  
  // Forward to the new webhook endpoint
  const webhookUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/wayforpay`;
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: headers,
      body: body,
    });
    
    const responseText = await response.text();
    
    return new Response(responseText, {
      status: response.status,
      headers: response.headers,
    });
    
  } catch (error) {
    console.error("[checkout/callback] Failed to forward request:", error);
    return new Response(
      JSON.stringify({ error: "Webhook forwarding failed" }),
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json({
    message: "This webhook endpoint has been moved to /api/webhooks/wayforpay",
    newEndpoint: "/api/webhooks/wayforpay",
    status: "deprecated",
    action: "Please update your WayForPay configuration to use the new endpoint"
  });
}
