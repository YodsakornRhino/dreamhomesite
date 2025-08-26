import {
  getAuth,
  signInWithEmailAndPassword as firebaseSignIn,
  createUserWithEmailAndPassword as firebaseSignUp,
  signOut as firebaseSignOut,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  sendEmailVerification as firebaseSendEmailVerification,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  type Auth,
  type User,
} from "firebase/auth"
import { firebaseApp } from "./firebase"

let authInstance: Auth | null = null

const getAuthInstance = (): Auth => {
  if (typeof window === "undefined") {
    throw new Error("Auth can only be used on the client side")
  }

  if (!authInstance) {
    authInstance = getAuth(firebaseApp)
  }

  return authInstance
}

// Sign in with email and password
export const signInWithEmailAndPassword = async (email: string, password: string) => {
  const auth = getAuthInstance()
  return firebaseSignIn(auth, email, password)
}

// Sign up with email and password
export const createUserWithEmailAndPassword = async (email: string, password: string) => {
  const auth = getAuthInstance()
  return firebaseSignUp(auth, email, password)
}

// Send email verification
export const sendEmailVerification = async (user: User) => {
  return firebaseSendEmailVerification(user, {
    url: `${window.location.origin}/?verified=true`,
    handleCodeInApp: false,
  })
}

// Sign out
export const signOut = async () => {
  const auth = getAuthInstance()
  return firebaseSignOut(auth)
}

// Send password reset email
export const sendPasswordResetEmail = async (email: string) => {
  const auth = getAuthInstance()
  return firebaseSendPasswordResetEmail(auth, email, {
    url: `${window.location.origin}/`,
    handleCodeInApp: false,
  })
}

// Auth state change listener
export const onAuthStateChanged = (callback: (user: User | null) => void) => {
  if (typeof window === "undefined") {
    return () => {}
  }

  const auth = getAuthInstance()
  return firebaseOnAuthStateChanged(auth, callback)
}

export { getAuthInstance }
