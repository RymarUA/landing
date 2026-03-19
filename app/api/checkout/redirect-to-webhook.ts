/**
 * app/api/checkout/redirect-to-webhook.ts
 *
 * Redirects old WayForPay webhook endpoint to the new location.
 * This ensures backward compatibility while consolidating webhooks.
 */

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  console.log("[webhook-redirect] Redirecting old /api/checkout/callback to /api/webhooks/wayforpay");
  
  // Forward the request to the new webhook endpoint
  const webhookUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/wayforpay`;
  
  try {
    // Get the request body
    const body = await req.text();
    
    // Forward the request with all headers
    const headers = new Headers();
    req.headers.forEach((value, key) => {
      headers.set(key, value);
    });
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: headers,
      body: body,
    });
    
    // Return the response from the new webhook
    const responseText = await response.text();
    
    return new NextResponse(responseText, {
      status: response.status,
      headers: response.headers,
    });
    
  } catch (error) {
    console.error("[webhook-redirect] Failed to forward request:", error);
    return NextResponse.json(
      { error: "Webhook forwarding failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "This webhook endpoint has been moved to /api/webhooks/wayforpay",
    newEndpoint: "/api/webhooks/wayforpay",
    status: "redirected"
  });
}
