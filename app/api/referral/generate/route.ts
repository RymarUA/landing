import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "@/lib/auth-jwt";
import { generateReferralCode, updateSitniksCustomer } from "@/lib/sitniks-customers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("fhm_auth")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: any;
  try {
    payload = await verifyJwt(token, process.env.JWT_SECRET ?? "dev-secret-change-in-production");
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  if (!payload.sitniksCustomerId) {
    return NextResponse.json({ error: "No customer ID" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { customerId } = body;

    if (!customerId || customerId !== payload.sitniksCustomerId) {
      return NextResponse.json({ error: "Invalid customer ID" }, { status: 400 });
    }

    const referralCode = generateReferralCode(customerId);

    const updatedCustomer = await updateSitniksCustomer(customerId, {
      comment: `Referral code: ${referralCode}`
    });

    if (!updatedCustomer) {
      return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }

    return NextResponse.json({ referralCode, success: true });
  } catch (error) {
    console.error("[referral/generate] Error:", error);
    return NextResponse.json({ error: "Failed to generate" }, { status: 500 });
  }
}
