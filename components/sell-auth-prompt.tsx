"use client"

import { useState } from "react"
import {
  BarChart3,
  Building2,
  CalendarCheck,
  Check,
  MessageCircle,
  Sparkles,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import SignInModal from "@/components/sign-in-modal"
import SignUpModal from "@/components/sign-up-modal"

export default function SellAuthPrompt() {
  const [isSignInOpen, setIsSignInOpen] = useState(false)
  const [isSignUpOpen, setIsSignUpOpen] = useState(false)

  const switchToSignUp = () => {
    setIsSignInOpen(false)
    setIsSignUpOpen(true)
  }

  const switchToSignIn = () => {
    setIsSignUpOpen(false)
    setIsSignInOpen(true)
  }

  return (
    <section className="relative isolate flex w-full justify-center overflow-hidden bg-slate-950 py-16 sm:py-20 lg:min-h-[calc(100vh-8rem)]">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(94,234,212,0.28),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(129,140,248,0.32),transparent_50%)]" />
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" />
      </div>
      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="flex flex-col justify-center space-y-8 text-left text-white">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-sm font-medium uppercase tracking-wide backdrop-blur">
              <Sparkles className="h-4 w-4" />
              เครื่องมือขายสำหรับมืออาชีพ
            </div>
            <header className="space-y-4">
              <h1 className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
                ขายอสังหาริมทรัพย์ของคุณกับ DreamHome
              </h1>
              <p className="max-w-2xl text-base text-white/80 sm:text-lg">
                เข้าถึงผู้ซื้อที่พร้อมตัดสินใจ จัดการคำถาม และปิดการขายได้เร็วขึ้นด้วยแดชบอร์ดที่ออกแบบมาเพื่อผู้ขายมืออาชีพโดยเฉพาะ
              </p>
            </header>
            <ul className="grid gap-4 text-sm text-white/90 sm:grid-cols-2">
              <li className="flex items-start gap-3 rounded-2xl border border-white/20 bg-white/5 p-5">
                <Check className="mt-0.5 h-5 w-5 text-emerald-300" />
                <div>
                  <p className="font-semibold">ลงประกาศฟรี</p>
                  <p className="text-white/70">เริ่มต้นได้ทันที พร้อมตัวเลือกอัปเกรดเมื่อต้องการโปรโมตพิเศษ</p>
                </div>
              </li>
              <li className="flex items-start gap-3 rounded-2xl border border-white/20 bg-white/5 p-5">
                <Check className="mt-0.5 h-5 w-5 text-emerald-300" />
                <div>
                  <p className="font-semibold">ผู้ซื้อคุณภาพ</p>
                  <p className="text-white/70">คัดกรองคำค้นยอดนิยม ช่วยให้ประกาศของคุณไปอยู่ตรงหน้ากลุ่มเป้าหมาย</p>
                </div>
              </li>
              <li className="flex items-start gap-3 rounded-2xl border border-white/20 bg-white/5 p-5">
                <Check className="mt-0.5 h-5 w-5 text-emerald-300" />
                <div>
                  <p className="font-semibold">จัดการข้อความง่าย</p>
                  <p className="text-white/70">ตอบแชทและข้อเสนอจากผู้สนใจได้แบบเรียลไทม์ในที่เดียว</p>
                </div>
              </li>
              <li className="flex items-start gap-3 rounded-2xl border border-white/20 bg-white/5 p-5">
                <Check className="mt-0.5 h-5 w-5 text-emerald-300" />
                <div>
                  <p className="font-semibold">รายงานสวยงาม</p>
                  <p className="text-white/70">ติดตามจำนวนการเข้าชมและยอดผู้สนใจแบบละเอียดเพื่อปรับกลยุทธ์</p>
                </div>
              </li>
            </ul>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button size="lg" onClick={() => setIsSignInOpen(true)} className="bg-white text-slate-900 hover:bg-slate-100">
                เริ่มต้นเข้าสู่ระบบ
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setIsSignUpOpen(true)}
                className="border-white/40 bg-transparent text-white hover:bg-white/10"
              >
                สมัครสมาชิกใหม่
              </Button>
            </div>
          </div>
          <div className="grid gap-6">
            <div className="rounded-3xl border border-white/15 bg-white/10 p-6 shadow-2xl shadow-emerald-500/10 backdrop-blur">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-wide text-white/60">ภาพรวมประกาศ</p>
                  <p className="text-2xl font-semibold text-white">แดชบอร์ดผู้ขาย DreamHome</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/20 text-emerald-200">
                  <BarChart3 className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-white/60">ประกาศทั้งหมด</p>
                  <p className="mt-2 text-2xl font-semibold text-white">24</p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-emerald-200">
                    <TrendingUp className="h-4 w-4" />
                    +12% สัปดาห์นี้
                  </div>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-white/60">ผู้สนใจใหม่</p>
                  <p className="mt-2 text-2xl font-semibold text-white">128</p>
                  <p className="mt-3 text-xs text-white/70">ตอบกลับภายใน 3 นาทีโดยเฉลี่ย</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-white/60">นัดชมวันนี้</p>
                  <p className="mt-2 text-2xl font-semibold text-white">5</p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-white/70">
                    <CalendarCheck className="h-4 w-4 text-emerald-200" />
                    ซิงค์กับ Google Calendar
                  </div>
                </div>
              </div>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-white/20 via-white/5 to-white/10 p-6 text-white shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-wide text-white/60">ประกาศเด่นวันนี้</p>
                    <p className="mt-1 text-xl font-semibold">คอนโดใจกลางเมือง</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white">
                    <Building2 className="h-6 w-6" />
                  </div>
                </div>
                <div className="mt-6 space-y-3 text-sm text-white/80">
                  <p>2 ห้องนอน · 68 ตร.ม. · ใกล้ BTS ทองหล่อ</p>
                  <div className="flex items-center justify-between text-base font-semibold text-white">
                    <span>฿6.9M</span>
                    <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium">ยอดเข้าชม 1,254</span>
                  </div>
                </div>
              </div>
              <div className="rounded-3xl border border-white/15 bg-white/10 p-6 text-white shadow-xl backdrop-blur">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-400/20 text-indigo-100">
                    <MessageCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-wide text-white/60">ฟีดกิจกรรม</p>
                    <p className="text-lg font-semibold">การตอบกลับล่าสุด</p>
                  </div>
                </div>
                <ul className="mt-6 space-y-4 text-sm text-white/80">
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 h-2 w-2 rounded-full bg-emerald-300" />
                    <div>
                      <p className="font-semibold text-white">คุณบีมยืนยันนัดชม</p>
                      <p className="text-white/60">พรุ่งนี้ 10:30 น. - โครงการ The Crest สุขุมวิท</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 h-2 w-2 rounded-full bg-sky-300" />
                    <div>
                      <p className="font-semibold text-white">แชทใหม่จากคุณตาล</p>
                      <p className="text-white/60">สนใจสอบถามคอนโดศรีนครินทร์ เพิ่มภาพห้องนั่งเล่น</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 h-2 w-2 rounded-full bg-purple-300" />
                    <div>
                      <p className="font-semibold text-white">ข้อเสนอราคา</p>
                      <p className="text-white/60">฿4.2M สำหรับบ้านเดี่ยวแจ้งวัฒนะ - รอตรวจสอบเอกสาร</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      <SignInModal
        isOpen={isSignInOpen}
        onClose={() => setIsSignInOpen(false)}
        onSwitchToSignUp={switchToSignUp}
      />
      <SignUpModal
        isOpen={isSignUpOpen}
        onClose={() => setIsSignUpOpen(false)}
        onSwitchToSignIn={switchToSignIn}
      />
    </section>
  )
}

