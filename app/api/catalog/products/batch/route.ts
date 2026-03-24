import { NextRequest, NextResponse } from "next/server";
import { getCatalogProductById } from "@/lib/instagram-catalog";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const idsParam = searchParams.get("ids");

    if (!idsParam) {
      return NextResponse.json(
        { error: "Missing ids parameter" },
        { status: 400 }
      );
    }

    // Parse comma-separated IDs
    const ids = idsParam
      .split(",")
      .map(id => parseInt(id.trim(), 10))
      .filter(id => !isNaN(id));

    if (ids.length === 0) {
      return NextResponse.json(
        { error: "No valid product IDs provided" },
        { status: 400 }
      );
    }

    // Limit to prevent abuse
    if (ids.length > 50) {
      return NextResponse.json(
        { error: "Too many IDs requested (max 50)" },
        { status: 400 }
      );
    }

    // Fetch all products in parallel
    const products = await Promise.allSettled(
      ids.map(async (id) => {
        const product = await getCatalogProductById(id);
        return product;
      })
    );

    // Process results and filter out failures
    const successfulProducts = products
      .filter((result): result is PromiseFulfilledResult<any> => 
        result.status === "fulfilled" && result.value != null
      )
      .map(result => result.value);

    return NextResponse.json({
      products: successfulProducts,
      totalRequested: ids.length,
      totalFound: successfulProducts.length
    });

  } catch (error) {
    console.error("[API /catalog/products/batch] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
