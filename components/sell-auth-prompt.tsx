"use client"

import { useState } from "react"
import { BarChart3, Building2, CalendarCheck, MessageCircle, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import SignInModal from "@/components/sign-in-modal"
import SignUpModal from "@/components/sign-up-modal"

const featureCards = [
  {
    title: "ลงประกาศฟรี",
    description: "เริ่มต้นได้ทันที พร้อมตัวเลือกอัปเกรดเมื่อต้องการโปรโมตพิเศษให้โดดเด่น",
    icon: Building2,
    accent: "bg-sky-500/20 text-sky-300",
  },
  {
    title: "ผู้ซื้อคุณภาพ",
    description: "คัดกรองคำค้นยอดนิยม ช่วยให้ประกาศของคุณไปอยู่ตรงหน้ากลุ่มเป้าหมาย",
    icon: BarChart3,
    accent: "bg-sky-500/20 text-sky-300",
  },
  {
    title: "จัดการข้อความง่าย",
    description: "ตอบแชทและข้อเสนอจากผู้สนใจได้แบบเรียลไทม์ในที่เดียว",
    icon: MessageCircle,
    accent: "bg-sky-500/20 text-sky-300",
  },
  {
    title: "นัดชมพร้อมกัน",
    description: "ซิงค์ตารางกับปฏิทินที่คุณใช้ จัดการการนัดหมายได้อย่างเป็นระบบ",
    icon: CalendarCheck,
    accent: "bg-sky-500/20 text-sky-300",
  },
]

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
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.35),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.25),transparent_55%)]" />
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xl" />
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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                size="lg"
                onClick={() => setIsSignInOpen(true)}
                className="bg-sky-500 text-white shadow-lg shadow-sky-500/30 transition hover:bg-sky-400"
              >
                เริ่มต้นเข้าสู่ระบบ
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setIsSignUpOpen(true)}
                className="border-white/50 bg-transparent text-white hover:bg-white/10"
              >
                สมัครสมาชิกใหม่
              </Button>
            </div>
          </div>
          <div className="grid gap-4 text-white sm:grid-cols-2">
            {featureCards.map(({ title, description, icon: Icon, accent }) => (
              <div
                key={title}
                className="flex h-full flex-col gap-3 rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur transition hover:border-sky-400/40 hover:bg-white/15"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white/70">{title}</p>
                  <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${accent}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
                <p className="text-sm text-white/80">{description}</p>
              </div>
            ))}
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
