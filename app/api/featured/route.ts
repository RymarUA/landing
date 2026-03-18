import { NextResponse } from "next/server";
import { getCachedFeaturedHits } from "@/lib/cached-data";

export const revalidate = 120;

export async function GET() {
  try {
    const hits = await getCachedFeaturedHits(10);
    return NextResponse.json({
      success: true,
      products: hits,
      source: "cache",
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[api/featured] Failed to load featured hits", error);
    return NextResponse.json({ success: false, error: "FAILED_TO_LOAD" }, { status: 500 });
  }
}
