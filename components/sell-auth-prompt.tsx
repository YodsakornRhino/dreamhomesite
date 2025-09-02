"use client"

import { useState } from "react"
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
    <div className="max-w-4xl mx-auto p-4 space-y-6 text-center">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Sell Your Property with DreamHome</h1>
        <p className="text-gray-500">
          Sign in or create an account to start listing your properties for sale.
        </p>
      </header>
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

