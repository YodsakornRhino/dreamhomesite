"use client"

import { useState, useEffect } from "react"
import type { User } from "firebase/auth"
import { onAuthStateChange } from "@/lib/auth"

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") {
      setLoading(false)
      return
    }

    let unsubscribe: (() => void) | undefined

    const initAuth = () => {
      try {
        console.log("Initializing auth state listener...")

        unsubscribe = onAuthStateChange((user) => {
          console.log("Auth state changed:", user ? `User: ${user.email}` : "No user")
          setUser(user)
          setLoading(false)
          setError(null)
        })

        console.log("Auth state listener initialized successfully")
      } catch (error) {
        console.error("Error initializing auth:", error)
        setError(error instanceof Error ? error.message : "Failed to initialize auth")
        setLoading(false)
      }
    }

    // Add a small delay to ensure DOM is ready
    const timer = setTimeout(initAuth, 100)

    return () => {
      clearTimeout(timer)
      if (unsubscribe) {
        console.log("Cleaning up auth listener")
        unsubscribe()
      }
    }
  }, [])

  return { user, loading, error }
}
