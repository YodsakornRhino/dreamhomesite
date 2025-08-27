"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "firebase/auth"
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from "@/lib/auth"
import { sendVerificationEmail } from "@/lib/send-verification"

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<User>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  sendVerificationEmail: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let unsubscribe: (() => void) | undefined

    const initAuth = async () => {
      try {
        // Wait for client-side hydration
        await new Promise((resolve) => setTimeout(resolve, 200))

        unsubscribe = onAuthStateChanged((user: User | null) => {
          console.log("Auth state changed:", user?.email || "No user")
          if (user) {
            console.log("User email verified:", user.emailVerified)
          }
          setUser(user)
          setLoading(false)
          setError(null)
        })
      } catch (error) {
        console.error("Error initializing auth:", error)
        setError("Failed to initialize authentication")
        setLoading(false)
      }
    }

    initAuth()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  const handleSignIn = async (email: string, password: string) => {
    try {
      setError(null)
      await signInWithEmailAndPassword(email, password)
    } catch (error) {
      console.error("Error signing in:", error)
      throw error
    }
  }

  const handleSignUp = async (email: string, password: string): Promise<User> => {
    try {
      setError(null)
      console.log("Creating user account for:", email)

      const userCredential = await createUserWithEmailAndPassword(email, password)
      console.log("User account created successfully")

      // Wait a moment for the user to be fully created
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Send email verification using the new system
      try {
        console.log("Attempting to send verification email...")
        await sendVerificationEmail()
        console.log("Verification email sent successfully")
      } catch (verificationError) {
        console.error("Error sending verification email:", verificationError)
        // Don't throw here, user is still created successfully
        // But we should notify the user about the email issue
      }

      return userCredential.user
    } catch (error) {
      console.error("Error signing up:", error)
      throw error
    }
  }

  const handleSignOut = async () => {
    try {
      setError(null)
      await signOut()
    } catch (error) {
      console.error("Error signing out:", error)
      throw error
    }
  }

  const handleResetPassword = async (email: string) => {
    try {
      setError(null)
      await sendPasswordResetEmail(email)
    } catch (error) {
      console.error("Error resetting password:", error)
      throw error
    }
  }

  const handleSendVerificationEmail = async () => {
    try {
      setError(null)
      await sendVerificationEmail()
    } catch (error) {
      console.error("Error sending verification email:", error)
      throw error
    }
  }

  const refreshUser = async () => {
    try {
      if (user) {
        await user.reload()
        // Force a re-render by updating the user state
        setUser({ ...user })
      }
    } catch (error) {
      console.error("Error refreshing user:", error)
    }
  }

  const value = {
    user,
    loading,
    error,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
    resetPassword: handleResetPassword,
    sendVerificationEmail: handleSendVerificationEmail,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider")
  }
  return context
}
