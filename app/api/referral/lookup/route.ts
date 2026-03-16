import { NextRequest, NextResponse } from "next/server";
import { findCustomerByReferralCode } from "@/lib/sitniks-customers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { referralCode } = body;

    if (!referralCode || typeof referralCode !== 'string') {
      return NextResponse.json({ error: "Code required" }, { status: 400 });
    }

    const referrer = await findCustomerByReferralCode(referralCode);

    if (!referrer) {
      return NextResponse.json({ error: "Code not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      referrer: {
        id: referrer.id,
        fullname: referrer.fullname,
        email: referrer.email,
        referralCode: referrer.referralCode
      },
      success: true 
    });
  } catch (error) {
    console.error("[referral/lookup] Error:", error);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}
