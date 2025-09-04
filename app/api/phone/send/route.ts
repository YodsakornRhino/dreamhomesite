import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { setOtp } from "@/lib/otp-store";

const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER } = process.env;
const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();
    if (!phone) {
      return NextResponse.json({ error: "Missing phone" }, { status: 400 });
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setOtp(phone, code, 5 * 60 * 1000);
    if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_FROM_NUMBER) {
      await client.messages.create({
        body: `Your verification code is ${code}`,
        from: TWILIO_FROM_NUMBER,
        to: phone,
      });
    } else {
      console.warn("Twilio env vars missing; OTP not actually sent");
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("send otp error", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
