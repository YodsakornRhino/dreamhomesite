"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "firebase/auth"
import {
  ensureAuth,
  onAuthStateChanged as onAuthChanged,
  signInWithEmailAndPassword as signInAPI,
  createUserWithEmailAndPassword as signUpAPI,
  signOut as signOutAPI,
  sendPasswordResetEmail as resetAPI,
  reloadCurrentUser,
  sendEmailVerification as sendVerifyAPI,
} from "@/lib/auth"

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
    let unsub: undefined | (() => void)

    ;(async () => {
      try {
        await ensureAuth()
        unsub = await onAuthChanged((u) => {
          console.log("Auth state changed:", u?.email ?? "No user", "verified:", u?.emailVerified)
          setUser(u)
          setLoading(false)
          setError(null)
        })
      } catch (e) {
        console.error("Error initializing auth:", e)
        setError("Failed to initialize authentication")
        setLoading(false)
      }
    })()

    return () => unsub?.()
  }, [])

  const signIn = async (email: string, password: string) => {
    setError(null)
    await signInAPI(email, password)
  }

  const signUp = async (email: string, password: string) => {
    setError(null)
    const cred = await signUpAPI(email, password)
    try {
      // เว้นจังหวะเล็กน้อยเผื่อสถานะ session
      await new Promise((r) => setTimeout(r, 400))
      await sendVerifyAPI()
    } catch (e) {
      console.error("sendVerificationEmail failed:", e)
    }
    return cred.user
  }

  const signOut = async () => {
    setError(null)
    await signOutAPI()
  }

  const resetPassword = async (email: string) => {
    setError(null)
    await resetAPI(email)
  }

  const sendVerificationEmail = async () => {
    setError(null)
    await sendVerifyAPI()
  }

  const refreshUser = async () => {
    const u = await reloadCurrentUser()
    if (u) setUser({ ...u })
  }

  const value = {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    sendVerificationEmail,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuthContext must be used within an AuthProvider")
  return ctx
}
