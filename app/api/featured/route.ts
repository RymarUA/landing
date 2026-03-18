import { NextResponse } from "next/server";
import {
  getCachedFeaturedHits,
  getCachedFeaturedFreeShipping,
  getCachedFeaturedPromos,
} from "@/lib/cached-data";

export const dynamic = "force-dynamic";
export const revalidate = 120;

const FEATURED_LIMIT = 20;

const loaders = {
  hits: getCachedFeaturedHits,
  "free-shipping": getCachedFeaturedFreeShipping,
  promos: getCachedFeaturedPromos,
} as const;

type FeaturedType = keyof typeof loaders;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const typeParam = (url.searchParams.get("type") ?? "hits").toLowerCase() as FeaturedType;
    const limitParam = Number.parseInt(url.searchParams.get("limit") ?? "10", 10);

    const type: FeaturedType = typeParam in loaders ? typeParam : "hits";
    const limit = Number.isFinite(limitParam)
      ? Math.min(Math.max(1, limitParam), FEATURED_LIMIT)
      : 10;

    const products = await loaders[type](limit);

    return NextResponse.json({
      success: true,
      type,
      products,
      source: "cache",
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[api/featured] Failed to load featured products", error);
    return NextResponse.json({ success: false, error: "FAILED_TO_LOAD" }, { status: 500 });
  }
}
