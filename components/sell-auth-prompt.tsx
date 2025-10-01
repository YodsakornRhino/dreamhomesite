"use client"

import { useState } from "react"
import { Check } from "lucide-react"
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
    <div className="max-w-4xl mx-auto p-8 space-y-8 text-center bg-gradient-to-b from-white to-slate-50 rounded-lg shadow">
      <header className="space-y-4">
        <h1 className="text-4xl font-bold">ขายอสังหาริมทรัพย์ของคุณกับ DreamHome</h1>
        <p className="text-lg text-gray-600">
          เข้าถึงผู้ซื้อ จัดการคำถาม และปิดการขายได้เร็วขึ้น
        </p>
      </header>
      <ul className="grid gap-4 text-left sm:grid-cols-3">
        <li className="flex items-start gap-2">
          <Check className="h-5 w-5 text-green-500 mt-1" />
          <span>ลงประกาศฟรี</span>
        </li>
        <li className="flex items-start gap-2">
          <Check className="h-5 w-5 text-green-500 mt-1" />
          <span>เชื่อมต่อกับผู้ซื้อที่มีคุณภาพ</span>
        </li>
        <li className="flex items-start gap-2">
          <Check className="h-5 w-5 text-green-500 mt-1" />
          <span>ติดตามข้อความและข้อเสนอได้อย่างง่ายดาย</span>
        </li>
      </ul>
      <div className="flex justify-center gap-4">
        <Button onClick={() => setIsSignInOpen(true)}>เข้าสู่ระบบ</Button>
        <Button variant="outline" onClick={() => setIsSignUpOpen(true)}>
          สมัครสมาชิก
        </Button>
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
    </div>
  )
}

