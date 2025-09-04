import { NextRequest, NextResponse } from "next/server";
import { verifyOtp } from "@/lib/otp-store";

export async function POST(req: NextRequest) {
  try {
    const { phone, code } = await req.json();
    if (!phone || !code) {
      return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }
    const ok = verifyOtp(phone, code);
    if (!ok) {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("verify otp error", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
