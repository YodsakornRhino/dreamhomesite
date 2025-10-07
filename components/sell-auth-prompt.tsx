"use client"

import { useMemo, useState } from "react"
import { Check, MessageSquare, Rocket, Users } from "lucide-react"

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

  const sellingHighlights = useMemo(
    () => [
      {
        icon: Check,
        title: "ลงประกาศฟรี",
        description: "เผยแพร่ทรัพย์ของคุณให้ผู้ซื้อเห็นได้ทันทีโดยไม่มีค่าใช้จ่ายแอบแฝง",
      },
      {
        icon: MessageSquare,
        title: "ตอบกลับผู้ซื้อได้ไว",
        description: "ระบบแชทในแพลตฟอร์มช่วยให้คุณปิดการขายได้เร็วขึ้น",
      },
      {
        icon: Users,
        title: "ผู้ซื้อคุณภาพ",
        description: "เข้าถึงฐานลูกค้าที่ผ่านการยืนยันตัวตนและมีความสนใจจริง",
      },
      {
        icon: Rocket,
        title: "แดชบอร์ดจัดการง่าย",
        description: "อัปเดตราคา สถานะ และสื่อประกอบได้จากที่เดียว",
      },
    ],
    [],
  )

  return (
    <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 text-white shadow-2xl">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('/placeholder.jpg')] bg-cover bg-center opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/95 via-slate-900/85 to-emerald-900/85" />
        </div>

        <div className="relative z-10 flex flex-col gap-10 px-6 py-10 sm:px-10 lg:flex-row lg:items-center lg:py-16">
          <div className="max-w-xl space-y-6 lg:w-1/2">
            <span className="inline-flex items-center rounded-full bg-white/15 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-100">
              ขายง่าย ได้ผลจริง
            </span>
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                ขายอสังหาริมทรัพย์ของคุณกับ DreamHome
              </h1>
              <p className="text-base text-slate-200 sm:text-lg">
                เข้าถึงผู้ซื้อที่กำลังมองหาทรัพย์จริง พร้อมเครื่องมือช่วยจัดการประกาศ ข้อความ และข้อเสนอในที่เดียว
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-sm font-medium text-emerald-100">เวลาลงประกาศเฉลี่ย</p>
                <p className="mt-1 text-2xl font-semibold text-white">ไม่ถึง 5 นาที</p>
                <p className="text-xs text-emerald-100/80">สร้างและเผยแพร่ประกาศได้ในไม่กี่คลิก</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-sm font-medium text-emerald-100">เครื่องมือครบในที่เดียว</p>
                <p className="mt-1 text-2xl font-semibold text-white">แดชบอร์ดแบบเรียลไทม์</p>
                <p className="text-xs text-emerald-100/80">ติดตามผู้สนใจและปรับปรุงประกาศได้ทันที</p>
              </div>
            </div>
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <Button size="lg" className="bg-emerald-500 text-slate-900 hover:bg-emerald-400" onClick={() => setIsSignInOpen(true)}>
                เข้าสู่ระบบเพื่อเริ่มขาย
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/40 bg-white/10 text-white backdrop-blur hover:bg-white/20"
                onClick={() => setIsSignUpOpen(true)}
              >
                สมัครสมาชิกฟรี
              </Button>
            </div>
            <p className="text-xs text-slate-200/80">
              ยังไม่มีบัญชี? สมัครสมาชิกเพื่อเริ่มต้นขายภายในไม่กี่นาที
            </p>
          </div>

          <div className="w-full rounded-3xl bg-white/10 p-6 backdrop-blur lg:w-1/2">
            <h2 className="text-xl font-semibold text-white">สิ่งที่คุณจะได้รับ</h2>
            <div className="mt-6 grid gap-4">
              {sellingHighlights.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-white/30 hover:bg-white/10"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-200">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-white">{title}</p>
                    <p className="text-sm text-slate-100/80">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

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
    </div>
  )
}

