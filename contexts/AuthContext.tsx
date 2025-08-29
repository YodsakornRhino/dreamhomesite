"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "firebase/auth"
import {
  updateProfile,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  linkWithCredential,
} from "firebase/auth"
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  getAuthInstance,
} from "@/lib/auth"
import { sendVerificationEmail } from "@/lib/send-verification"
import { setDocument } from "@/lib/firestore"

interface ExtendedUser extends User {
  phoneNumber?: string
  phoneVerified?: boolean
}

interface AuthContextType {
  user: ExtendedUser | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<User>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  sendVerificationEmail: () => Promise<void>
  refreshUser: () => Promise<void>
  verifyPhone: {
    send: (phoneNumber: string) => Promise<string>
    confirm: (
      verificationId: string,
      code: string,
      phoneNumber: string,
    ) => Promise<void>
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ExtendedUser | null>(null)
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

  const verifyPhone = {
    send: async (phoneNumber: string) => {
      const auth = getAuthInstance()
      let verifier = (window as any).recaptchaVerifier as
        | RecaptchaVerifier
        | undefined
      if (!verifier) {
        verifier = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible",
        })
        await verifier.render()
        ;(window as any).recaptchaVerifier = verifier
      }
      const result = await signInWithPhoneNumber(auth, phoneNumber, verifier)
      return result.verificationId
    },
    confirm: async (
      verificationId: string,
      code: string,
      phoneNumber: string,
    ) => {
      const auth = getAuthInstance()
      const credential = PhoneAuthProvider.credential(verificationId, code)
      await linkWithCredential(auth.currentUser!, credential)
      await setDocument("users", auth.currentUser!.uid, {
        phoneNumber,
        phoneVerified: true,
      })
      setUser({ ...(auth.currentUser as ExtendedUser), phoneNumber, phoneVerified: true })
    },
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
    verifyPhone,
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
