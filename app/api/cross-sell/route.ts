import { NextRequest, NextResponse } from "next/server";
import { getCrossSellRecommendations } from "@/lib/cross-sell-recommendations";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const cartItems: Array<{ id: number }> = body.cartItems ?? [];
    const maxPrice: number = body.maxPrice ?? 500;
    const limit: number = body.limit ?? 3;

    const recommendations = await getCrossSellRecommendations(cartItems, maxPrice, limit);
    return NextResponse.json(recommendations);
  } catch {
    return NextResponse.json([]);
  }
}
