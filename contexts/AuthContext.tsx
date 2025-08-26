"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "firebase/auth"
import {
  signIn as authSignIn,
  signUp as authSignUp,
  logOut as authLogOut,
  resetPassword as authResetPassword,
  onAuthStateChange,
} from "@/lib/auth"

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  logOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuthContext = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
        console.log("Starting Firebase Auth initialization...")

        unsubscribe = onAuthStateChange((user) => {
          console.log("Auth state changed:", user ? `User logged in: ${user.email}` : "User logged out")
          setUser(user)
          setLoading(false)
          setError(null)
        })

        console.log("Firebase Auth initialization completed successfully")
      } catch (error) {
        console.error("Error initializing Firebase Auth:", error)
        setError(error instanceof Error ? error.message : "Failed to initialize Firebase Auth")
        setLoading(false)
      }
    }

    // Add a delay to ensure Firebase is properly loaded
    const timer = setTimeout(initAuth, 200)

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
      await authSignIn(email, password)
    } catch (error) {
      console.error("Sign in error in context:", error)
      throw error
    }
  }

  const signUp = async (email: string, password: string) => {
    if (!isClient) {
      throw new Error("Auth operations can only be performed on the client side")
    }

    try {
      await authSignUp(email, password)
    } catch (error) {
      console.error("Sign up error in context:", error)
      throw error
    }
  }

  const logOut = async () => {
    if (!isClient) {
      throw new Error("Auth operations can only be performed on the client side")
    }

    try {
      await authLogOut()
    } catch (error) {
      console.error("Log out error in context:", error)
      throw error
    }
  }

  const resetPassword = async (email: string) => {
    if (!isClient) {
      throw new Error("Auth operations can only be performed on the client side")
    }

    try {
      await authResetPassword(email)
    } catch (error) {
      console.error("Reset password error in context:", error)
      throw error
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    error,
    signIn,
    signUp,
    logOut,
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
          logOut: async () => {},
          resetPassword: async () => {},
        }}
      >
        {children}
      </AuthContext.Provider>
    )
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
