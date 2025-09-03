import { NextResponse } from 'next/server'
import { verifyRecaptchaToken } from '@/lib/recaptcha'

export async function POST(req: Request) {
  try {
    const { token, action } = await req.json()
    if (!token) {
      return NextResponse.json({ error: 'missing-token' }, { status: 400 })
    }
    const score = await verifyRecaptchaToken(token, action || 'default')
    return NextResponse.json({ score })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'verification-failed' }, { status: 400 })
  }
}
