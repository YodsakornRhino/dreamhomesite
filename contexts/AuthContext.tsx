"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "firebase/auth"
import {
  signIn as authSignIn,
  signUp as authSignUp,
  signOutUser,
  resetPassword as authResetPassword,
  onAuthStateChange,
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
  const [isClient, setIsClient] = useState(false)

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) {
      return
    }

    let unsubscribe: (() => void) | undefined

    const initAuth = () => {
      try {
        console.log("Initializing Firebase Auth state listener...")

        unsubscribe = onAuthStateChange((user) => {
          console.log("Auth state changed:", user ? `User: ${user.email}` : "No user")
          setUser(user)
          setLoading(false)
          setError(null)
        })

        console.log("Firebase Auth state listener initialized successfully")
      } catch (error) {
        console.error("Error initializing Firebase Auth:", error)
        setError(error instanceof Error ? error.message : "Failed to initialize Firebase Auth")
        setLoading(false)
      }
    }

    // Add a delay to ensure Firebase is properly loaded
    const timer = setTimeout(initAuth, 500)

    return () => {
      clearTimeout(timer)
      if (unsubscribe) {
        console.log("Cleaning up auth listener")
        unsubscribe()
      }
    }
  }, [isClient])

  const signIn = async (email: string, password: string) => {
    if (!isClient) {
      throw new Error("Auth operations can only be performed on the client side")
    }

    try {
      setError(null)
      await authSignIn(email, password)
    } catch (error) {
      console.error("Sign in error in context:", error)
      setError(error instanceof Error ? error.message : "Sign in failed")
      throw error
    }
  }

  const signUp = async (email: string, password: string) => {
    if (!isClient) {
      throw new Error("Auth operations can only be performed on the client side")
    }

    try {
      setError(null)
      await authSignUp(email, password)
    } catch (error) {
      console.error("Sign up error in context:", error)
      setError(error instanceof Error ? error.message : "Sign up failed")
      throw error
    }
  }

  const signOut = async () => {
    if (!isClient) {
      throw new Error("Auth operations can only be performed on the client side")
    }

    try {
      setError(null)
      await signOutUser()
    } catch (error) {
      console.error("Sign out error in context:", error)
      setError(error instanceof Error ? error.message : "Sign out failed")
      throw error
    }
  }

  const resetPassword = async (email: string) => {
    if (!isClient) {
      throw new Error("Auth operations can only be performed on the client side")
    }

    try {
      setError(null)
      await authResetPassword(email)
    } catch (error) {
      console.error("Reset password error in context:", error)
      setError(error instanceof Error ? error.message : "Reset password failed")
      throw error
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
  }

  // Show loading state until client-side initialization is complete
  if (!isClient) {
    return (
      <AuthContext.Provider
        value={{
          user: null,
          loading: true,
          error: null,
          signIn: async () => {},
          signUp: async () => {},
          signOut: async () => {},
          resetPassword: async () => {},
        }}
      >
        {children}
      </AuthContext.Provider>
    )
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
