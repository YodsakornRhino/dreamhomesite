import { getAuth, type Auth } from "firebase/auth"
import { firebaseApp } from "./firebase"

let authInstance: Auth | null = null

export const getAuthInstance = (): Auth => {
  if (typeof window === "undefined") {
    throw new Error("Auth can only be used on the client side")
  }

  if (!authInstance) {
    authInstance = getAuth(firebaseApp)
  }

  return authInstance
}

// Re-export Firebase Auth functions with our auth instance
export const signInWithEmailAndPassword = async (email: string, password: string) => {
  const { signInWithEmailAndPassword: firebaseSignIn } = await import("firebase/auth")
  const auth = getAuthInstance()
  return firebaseSignIn(auth, email, password)
}

export const createUserWithEmailAndPassword = async (email: string, password: string) => {
  const { createUserWithEmailAndPassword: firebaseSignUp } = await import("firebase/auth")
  const auth = getAuthInstance()
  return firebaseSignUp(auth, email, password)
}

export const signOut = async () => {
  const { signOut: firebaseSignOut } = await import("firebase/auth")
  const auth = getAuthInstance()
  return firebaseSignOut(auth)
}

export const sendPasswordResetEmail = async (email: string) => {
  const { sendPasswordResetEmail: firebaseSendPasswordResetEmail } = await import("firebase/auth")
  const auth = getAuthInstance()
  return firebaseSendPasswordResetEmail(auth, email)
}

export const onAuthStateChanged = (callback: (user: any) => void) => {
  if (typeof window === "undefined") {
    return () => {}
  }

  const auth = getAuthInstance()
  const { onAuthStateChanged: firebaseOnAuthStateChanged } = require("firebase/auth")
  return firebaseOnAuthStateChanged(auth, callback)
}
