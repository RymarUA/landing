/**
 * Test endpoint for debugging WayForPay webhooks
 * POST /api/test/webhook-test
 */

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[webhook-test] Received payload:", JSON.stringify(body, null, 2));
    
    // Log headers
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headers[key] = value;
    });
    console.log("[webhook-test] Headers:", JSON.stringify(headers, null, 2));
    
    return NextResponse.json({ 
      success: true, 
      message: "Webhook received successfully",
      payload: body,
      headers
    });
  } catch (error) {
    console.error("[webhook-test] Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to parse webhook" 
    }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: "Webhook test endpoint is working. Send POST requests here to test webhook handling."
  });
}
