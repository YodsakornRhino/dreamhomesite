"use client"

import { useState, useEffect } from "react"
import type { User } from "firebase/auth"
import { onAuthStateChanged } from "@/lib/auth"

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

        unsubscribe = onAuthStateChanged((authUser: User | null) => {
          console.log("Auth state changed:", authUser ? `User: ${authUser.email}` : "No user")
          setUser(authUser)
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
