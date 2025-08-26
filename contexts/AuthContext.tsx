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

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
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
        await new Promise((resolve) => setTimeout(resolve, 100))

        unsubscribe = onAuthStateChanged((user: User | null) => {
          console.log("Auth state changed:", user?.email || "No user")
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

  const handleSignUp = async (email: string, password: string) => {
    try {
      setError(null)
      await createUserWithEmailAndPassword(email, password)
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

  const value = {
    user,
    loading,
    error,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
    resetPassword: handleResetPassword,
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
