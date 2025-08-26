"use client"

import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  type User,
  type Auth,
} from "firebase/auth"
import { getFirebaseApp } from "./firebase"

let authInstance: Auth | null = null

const getAuthInstance = (): Auth => {
  if (typeof window === "undefined") {
    throw new Error("Auth can only be used on the client side")
  }

  if (!authInstance) {
    try {
      const app = getFirebaseApp()
      authInstance = getAuth(app)
      console.log("Firebase Auth initialized successfully")
    } catch (error) {
      console.error("Error initializing Firebase Auth:", error)
      throw error
    }
  }

  return authInstance
}

export const signIn = async (email: string, password: string) => {
  try {
    const auth = getAuthInstance()
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    console.log("User signed in successfully:", userCredential.user.email)
    return userCredential.user
  } catch (error) {
    console.error("Sign in error:", error)
    throw error
  }
}

export const signUp = async (email: string, password: string) => {
  try {
    const auth = getAuthInstance()
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    console.log("User signed up successfully:", userCredential.user.email)
    return userCredential.user
  } catch (error) {
    console.error("Sign up error:", error)
    throw error
  }
}

export const signOutUser = async () => {
  try {
    const auth = getAuthInstance()
    await signOut(auth)
    console.log("User signed out successfully")
  } catch (error) {
    console.error("Sign out error:", error)
    throw error
  }
}

export const resetPassword = async (email: string) => {
  try {
    const auth = getAuthInstance()
    await sendPasswordResetEmail(auth, email)
    console.log("Password reset email sent to:", email)
  } catch (error) {
    console.error("Reset password error:", error)
    throw error
  }
}

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  if (typeof window === "undefined") {
    return () => {}
  }

  try {
    const auth = getAuthInstance()
    return onAuthStateChanged(auth, callback)
  } catch (error) {
    console.error("Error setting up auth state observer:", error)
    return () => {}
  }
}

export { getAuthInstance }
