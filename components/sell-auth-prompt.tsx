"use client"

import { useState } from "react"
import Image from "next/image"
import { Check, Building2, Sparkles } from "lucide-react"
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
    <section className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 opacity-70" />
      <div className="relative grid items-stretch gap-10 p-8 sm:p-10 lg:grid-cols-[1.15fr_0.85fr] lg:p-12">
        <div className="flex flex-col justify-center space-y-6 text-left text-white">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1 text-sm font-medium backdrop-blur">
            <Sparkles className="h-4 w-4" />
            เครื่องมือขายสำหรับมืออาชีพ
          </div>
          <header className="space-y-3">
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
              ขายอสังหาริมทรัพย์ของคุณกับ DreamHome
            </h1>
            <p className="text-base text-white/80 sm:text-lg">
              เข้าถึงผู้ซื้อที่พร้อมตัดสินใจ จัดการคำถาม และปิดการขายได้เร็วขึ้นด้วยแดชบอร์ดที่ใช้งานง่าย
            </p>
          </header>
          <ul className="grid gap-4 text-sm text-white/90 sm:grid-cols-2">
            <li className="flex items-start gap-3 rounded-2xl border border-white/20 bg-white/5 p-4">
              <Check className="mt-0.5 h-5 w-5 text-emerald-300" />
              <div>
                <p className="font-semibold">ลงประกาศฟรี</p>
                <p className="text-white/70">เริ่มต้นได้ทันที พร้อมตัวเลือกอัปเกรดเมื่อต้องการโปรโมตพิเศษ</p>
              </div>
            </li>
            <li className="flex items-start gap-3 rounded-2xl border border-white/20 bg-white/5 p-4">
              <Check className="mt-0.5 h-5 w-5 text-emerald-300" />
              <div>
                <p className="font-semibold">ผู้ซื้อคุณภาพ</p>
                <p className="text-white/70">คัดกรองคำค้นยอดนิยม ช่วยให้ประกาศของคุณไปอยู่ตรงหน้ากลุ่มเป้าหมาย</p>
              </div>
            </li>
            <li className="flex items-start gap-3 rounded-2xl border border-white/20 bg-white/5 p-4">
              <Check className="mt-0.5 h-5 w-5 text-emerald-300" />
              <div>
                <p className="font-semibold">จัดการข้อความง่าย</p>
                <p className="text-white/70">ตอบแชทและข้อเสนอจากผู้สนใจได้แบบเรียลไทม์ในที่เดียว</p>
              </div>
            </li>
            <li className="flex items-start gap-3 rounded-2xl border border-white/20 bg-white/5 p-4">
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
        <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/40 via-purple-500/40 to-emerald-500/40 mix-blend-screen" />
          <Image
            src="/placeholder.jpg"
            alt="ลงประกาศขายอสังหาริมทรัพย์บน DreamHome"
            width={900}
            height={900}
            className="h-full w-full object-cover"
            priority
          />
          <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-black/60 p-4 text-white backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">แดชบอร์ดผู้ขาย DreamHome</p>
                <p className="text-xs text-white/70">จัดการประกาศและดูสถิติได้ครบ จบในที่เดียว</p>
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

