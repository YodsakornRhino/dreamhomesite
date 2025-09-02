"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import ChatWidget from "@/components/chat-widget"
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
        <h1 className="text-4xl font-bold">Sell Your Property with DreamHome</h1>
        <p className="text-lg text-gray-600">
          Reach buyers, manage inquiries, and close deals faster.
        </p>
      </header>
      <ul className="grid gap-4 text-left sm:grid-cols-3">
        <li className="flex items-start gap-2">
          <Check className="h-5 w-5 text-green-500 mt-1" />
          <span>List your property for free</span>
        </li>
        <li className="flex items-start gap-2">
          <Check className="h-5 w-5 text-green-500 mt-1" />
          <span>Connect with qualified buyers</span>
        </li>
        <li className="flex items-start gap-2">
          <Check className="h-5 w-5 text-green-500 mt-1" />
          <span>Track messages and offers easily</span>
        </li>
      </ul>
      <div className="flex justify-center gap-4">
        <Button onClick={() => setIsSignInOpen(true)}>Sign In</Button>
        <Button variant="outline" onClick={() => setIsSignUpOpen(true)}>
          Sign Up
        </Button>
      </div>
      <ChatWidget />
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

