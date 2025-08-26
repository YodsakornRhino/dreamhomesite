// lib/auth.ts
"use client"

import type { Auth, User, UserCredential } from "firebase/auth"
import { firebaseApp } from "./firebase"

let authInstance: Auth | null = null

export async function ensureAuth(): Promise<Auth> {
  if (typeof window === "undefined") {
    throw new Error("Auth can only be used on the client side")
  }
  if (authInstance) return authInstance

  // โหลดโมดูลแบบ dynamic เสมอ (กัน SSR/tree-shaking)
  const mod = await import("firebase/auth")
  const {
    initializeAuth,
    getAuth,
    browserLocalPersistence,
    indexedDBLocalPersistence,
    setPersistence,
  } = mod as typeof import("firebase/auth")

  try {
    // พยายาม init ชัดๆ (จะ register component ให้แน่นอน)
    authInstance = initializeAuth(firebaseApp, {
      persistence: [indexedDBLocalPersistence, browserLocalPersistence],
    })
  } catch {
    // ถ้า init ไปแล้ว (หรือเบราว์เซอร์ไม่รองรับ) ให้ดึงอินสแตนซ์เดิม
    authInstance = getAuth(firebaseApp)
    await setPersistence(authInstance, browserLocalPersistence)
  }

  return authInstance
}

// ---------- Helpers ทั้งหมดเรียกผ่าน ensureAuth() + dynamic import ----------
export async function onAuthStateChanged(cb: (user: User | null) => void): Promise<() => void> {
  const auth = await ensureAuth()
  const { onAuthStateChanged: fn } = await import("firebase/auth")
  return fn(auth, cb)
}

export async function signInWithEmailAndPassword(email: string, password: string): Promise<UserCredential> {
  const auth = await ensureAuth()
  const { signInWithEmailAndPassword: fn } = await import("firebase/auth")
  return fn(auth, email, password)
}

export async function createUserWithEmailAndPassword(email: string, password: string): Promise<UserCredential> {
  const auth = await ensureAuth()
  const { createUserWithEmailAndPassword: fn } = await import("firebase/auth")
  return fn(auth, email, password)
}

export async function sendPasswordResetEmail(email: string): Promise<void> {
  const auth = await ensureAuth()
  const { sendPasswordResetEmail: fn } = await import("firebase/auth")
  return fn(auth, email, { url: `${window.location.origin}/`, handleCodeInApp: false })
}

export async function sendEmailVerification(user?: User): Promise<void> {
  const auth = await ensureAuth()
  const u = user ?? auth.currentUser
  if (!u) throw new Error("No signed-in user")
  const { sendEmailVerification: fn } = await import("firebase/auth")
  return fn(u, { url: `${window.location.origin}/?verified=true`, handleCodeInApp: false })
}

export async function signOut(): Promise<void> {
  const auth = await ensureAuth()
  const { signOut: fn } = await import("firebase/auth")
  return fn(auth)
}

export async function reloadCurrentUser(): Promise<User | null> {
  const auth = await ensureAuth()
  if (!auth.currentUser) return null
  const { reload } = await import("firebase/auth")
  await reload(auth.currentUser)
  return auth.currentUser
}
