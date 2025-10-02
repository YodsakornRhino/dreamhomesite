"use client"

import type React from "react"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"
import type { User } from "firebase/auth"
// AuthContext.tsx (ส่วน import เพิ่ม)
import { updateProfile } from "firebase/auth"
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from "@/lib/auth"
import { sendVerificationEmail } from "@/lib/send-verification"
import { setDocument } from "@/lib/firestore"
import { useToast } from "@/hooks/use-toast"

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<User>
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
  const { toast } = useToast()

  const updateUserStatus = useCallback(
    async (uid: string, state: "online" | "offline") => {
      try {
        const { serverTimestamp } = await import("firebase/firestore")
        await setDocument("users", uid, {
          status: {
            state,
            lastActiveAt: serverTimestamp(),
          },
        })
      } catch (statusError) {
        console.error(`Error updating user status to ${state}:`, statusError)
      }
    },
    [],
  )

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

  // AuthContext.tsx (แทนที่เฉพาะฟังก์ชัน handleSignUp)
  const handleSignUp = async (
    email: string,
    password: string,
    name: string,
  ): Promise<User> => {
    try {
      setError(null)
      console.log("Creating user account for:", email)

      const userCredential = await createUserWithEmailAndPassword(email, password)
      const user = userCredential.user
      console.log("User account created successfully")

      // ✅ อัปเดตชื่อบน Auth (displayName)
      try {
        await updateProfile(user, { displayName: name })
      } catch (e) {
        console.error("Error updating displayName:", e)
        // ไม่ต้อง throw เพื่อไม่ให้ signup ล้ม
      }

      // ✅ ใช้ serverTimestamp สำหรับ createdAt/updatedAt
      const { serverTimestamp } = await import("firebase/firestore")
      const now = serverTimestamp()

      // ✅ ส่งอีเมลยืนยัน (ลองก่อน หากพลาดไม่ทำให้ signup ล้ม)
      try {
        console.log("Attempting to send verification email...")
        await sendVerificationEmail()
        console.log("Verification email sent successfully")
      } catch (verificationError) {
        console.error("Error sending verification email:", verificationError)
        // แจ้งเตือนได้ แต่ไม่ throw
      }

      // ✅ สร้าง/อัปเดตเอกสาร users/{uid} ด้วยฟิลด์ตั้งต้น
      try {
        await setDocument("users", user.uid, {
          uid: user.uid,
          name,
          email,
          emailVerified: user.emailVerified ?? false,
          photoURL: user.photoURL ?? null,
          providerId: user.providerData?.[0]?.providerId ?? "password",
          role: "user", // ค่าเริ่มต้น ปรับได้ภายหลัง
          preferences: {
            // โครงสร้างที่ “เพิ่มได้ที่หลัง”
            language: "th",
            theme: "light",
            notifications: true,
          },
          createdAt: now,
          updatedAt: now,
          status: {
            state: "offline",
            lastActiveAt: now,
          },
        })
        console.log("User data stored in Firestore")
      } catch (firestoreError) {
        console.error("Error storing user data:", firestoreError)
        // ไม่ throw เพื่อไม่ให้ขั้นตอนก่อนหน้าล้ม
      }

      return user
    } catch (error) {
      console.error("Error signing up:", error)
      throw error
    }
  }


  const handleSignOut = useCallback(async () => {
    try {
      setError(null)
      if (user?.uid) {
        await updateUserStatus(user.uid, "offline")
      }
      await signOut()
    } catch (error) {
      console.error("Error signing out:", error)
      throw error
    }
  }, [updateUserStatus, user?.uid])

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

        // Update Firestore when email is verified
        if (user.emailVerified) {
          try {
            const { serverTimestamp } = await import("firebase/firestore")
            await setDocument("users", user.uid, {
              emailVerified: true,
              updatedAt: serverTimestamp(),
            })
          } catch (e) {
            console.error("Error updating email verification status:", e)
          }
        }
      }
    } catch (error) {
      console.error("Error refreshing user:", error)
    }
  }

  // Automatically sign out after 10 minutes of inactivity
  useEffect(() => {
    if (!user) return

    const INACTIVITY_LIMIT = 10 * 60 * 1000 // 10 minutes
    let timeout: ReturnType<typeof setTimeout>

    const resetTimer = () => {
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        toast({
          title: "ออกจากระบบอัตโนมัติ",
          description: "ไม่มีการใช้งานนานเกิน 10 นาที",
        })
        handleSignOut()
          .catch((err) =>
            console.error("Auto sign out failed:", err),
          )
          .finally(() => {
            try {
              localStorage.setItem(
                "session-timeout",
                Date.now().toString(),
              )
            } catch (e) {
              console.error("Failed to access localStorage:", e)
            }
            window.location.reload()
          })
      }, INACTIVITY_LIMIT)
      if (user?.uid) {
        void updateUserStatus(user.uid, "online")
      }
    }

    const events = [
      "mousemove",
      "keydown",
      "mousedown",
      "touchstart",
      "scroll",
    ]

    events.forEach((event) =>
      document.addEventListener(event, resetTimer),
    )

    resetTimer()

    return () => {
      clearTimeout(timeout)
      events.forEach((event) =>
        document.removeEventListener(event, resetTimer),
      )
    }
  }, [handleSignOut, toast, updateUserStatus, user])

  useEffect(() => {
    const currentUid = user?.uid
    if (!currentUid) return
    if (typeof window === "undefined") return

    let interval: ReturnType<typeof setInterval> | undefined

    const markOnline = () => updateUserStatus(currentUid, "online")
    const markOffline = () => updateUserStatus(currentUid, "offline")

    void markOnline()

    interval = setInterval(() => {
      void markOnline()
    }, 60_000)

    const handleBeforeUnload = () => {
      void markOffline()
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      if (interval) {
        clearInterval(interval)
      }
      void markOffline()
    }
  }, [updateUserStatus, user?.uid])

  // Refresh the page in all tabs when session timeout occurs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "session-timeout") {
        window.location.reload()
      }
    }

    window.addEventListener("storage", handleStorage)
    return () => window.removeEventListener("storage", handleStorage)
  }, [])

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
