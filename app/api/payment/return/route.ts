/**
 * app/api/payment/return/route.ts
 * 
 * WayForPay returnUrl handler - receives POST from WayForPay and redirects to success page
 * 
 * WayForPay sends users back via POST form submission with payment details.
 * This endpoint receives the POST, extracts the order reference, and redirects to /checkout/success
 */

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    // Extract order reference from WayForPay response
    const orderReference = formData.get("orderReference") as string;
    const transactionStatus = formData.get("transactionStatus") as string;
    
    console.log("[payment-return] Received from WayForPay:", {
      orderReference,
      transactionStatus,
    });
    
    // Extract original order number from payment attempt ID
    // Format: ORDER-123_p1234567890 → ORDER-123
    const originalOrderNumber = orderReference?.includes('_p') 
      ? orderReference.split('_p')[0] 
      : orderReference;
    
    // Redirect to success page with GET
    const successUrl = new URL("/checkout/success", req.url);
    successUrl.searchParams.set("ref", originalOrderNumber || "unknown");
    successUrl.searchParams.set("method", "online");
    
    // Pass full orderReference for payment verification
    if (orderReference) {
      successUrl.searchParams.set("orderReference", orderReference);
    }
    
    if (transactionStatus) {
      successUrl.searchParams.set("status", transactionStatus);
    }
    
    console.log("[payment-return] Redirecting to:", successUrl.toString());
    
    return NextResponse.redirect(successUrl, 303); // 303 See Other - POST to GET redirect
    
  } catch (error) {
    console.error("[payment-return] Error processing return:", error);
    
    // Fallback redirect to success page
    const fallbackUrl = new URL("/checkout/success", req.url);
    fallbackUrl.searchParams.set("ref", "error");
    fallbackUrl.searchParams.set("method", "online");
    
    return NextResponse.redirect(fallbackUrl, 303);
  }
}

// Also handle GET requests (in case WayForPay changes behavior)
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const orderReference = searchParams.get("orderReference") || searchParams.get("ref");
  
  const originalOrderNumber = orderReference?.includes('_p') 
    ? orderReference.split('_p')[0] 
    : orderReference;
  
  const successUrl = new URL("/checkout/success", req.url);
  successUrl.searchParams.set("ref", originalOrderNumber || "unknown");
  successUrl.searchParams.set("method", "online");
  
  return NextResponse.redirect(successUrl, 303);
}
