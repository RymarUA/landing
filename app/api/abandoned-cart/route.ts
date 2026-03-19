/**
 * app/api/abandoned-cart/route.ts
 *
 * Persistent abandoned cart API using KV storage.
 * Replaces in-memory timers with durable storage for serverless environments.
 */

import { NextRequest, NextResponse } from "next/server";
import { 
  scheduleAbandonedCartNotification, 
  cancelAbandonedCartNotification,
  type AbandonedCartEntry 
} from "@/lib/persistent-abandoned-cart";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate required fields
    if (!body.sessionId || !body.cartData) {
      return NextResponse.json(
        { error: "sessionId and cartData are required" },
        { status: 400 }
      );
    }

    const { sessionId, cartData, phone, email } = body;

    // Validate cart data
    if (!Array.isArray(cartData.items) || cartData.items.length === 0) {
      return NextResponse.json(
        { error: "Invalid cart data: items array required" },
        { status: 400 }
      );
    }

    // Schedule the abandoned cart notification
    await scheduleAbandonedCartNotification(
      sessionId,
      {
        items: cartData.items,
        totalPrice: cartData.totalPrice || 0,
      },
      phone,
      email
    );

    return NextResponse.json({ 
      success: true,
      message: "Abandoned cart notification scheduled",
      sessionId 
    });

  } catch (error) {
    console.error("[abandoned-cart] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const sessionId = url.searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId parameter is required" },
        { status: 400 }
      );
    }

    const cancelled = await cancelAbandonedCartNotification(sessionId);

    return NextResponse.json({ 
      success: true,
      cancelled,
      message: cancelled ? "Abandoned cart notification cancelled" : "No notification found"
    });

  } catch (error) {
    console.error("[abandoned-cart] DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
