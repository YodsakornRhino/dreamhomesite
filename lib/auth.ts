import type { User, UserCredential, Auth } from "firebase/auth"
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  onAuthStateChanged,
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

// Sign in with email and password
export const signIn = async (email: string, password: string): Promise<UserCredential> => {
  try {
    const auth = getAuthInstance()
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    console.log("User signed in successfully:", userCredential.user.email)
    return userCredential
  } catch (error) {
    console.error("Error signing in:", error)
    throw error
  }
}

// Sign up with email and password
export const signUp = async (email: string, password: string): Promise<UserCredential> => {
  try {
    const auth = getAuthInstance()
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    console.log("User signed up successfully:", userCredential.user.email)
    return userCredential
  } catch (error) {
    console.error("Error signing up:", error)
    throw error
  }
}

// Sign out
export const logOut = async (): Promise<void> => {
  try {
    const auth = getAuthInstance()
    await signOut(auth)
    console.log("User signed out successfully")
  } catch (error) {
    console.error("Error signing out:", error)
    throw error
  }
}

// Send password reset email
export const resetPassword = async (email: string): Promise<void> => {
  try {
    const auth = getAuthInstance()
    await sendPasswordResetEmail(auth, email)
    console.log("Password reset email sent to:", email)
  } catch (error) {
    console.error("Error sending password reset email:", error)
    throw error
  }
}

// Update user password
export const changePassword = async (newPassword: string): Promise<void> => {
  try {
    const auth = getAuthInstance()
    const user = auth.currentUser
    if (user) {
      await updatePassword(user, newPassword)
      console.log("Password updated successfully")
    } else {
      throw new Error("No user is currently signed in")
    }
  } catch (error) {
    console.error("Error updating password:", error)
    throw error
  }
}

// Get current user
export const getCurrentUser = (): User | null => {
  if (typeof window === "undefined") {
    return null
  }

  try {
    const auth = getAuthInstance()
    return auth.currentUser
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

// Auth state observer
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
