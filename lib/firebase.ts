// lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app"

const firebaseConfig = {
  apiKey: "AIzaSyDb_QTKrHNQZVQ-Pi1_vzuNvWyu9DBR46o",
  authDomain: "dreamhome-2025.firebaseapp.com",
  projectId: "dreamhome-2025",
  storageBucket: "dreamhome-2025.firebasestorage.app",
  messagingSenderId: "261505025685",
  appId: "1:261505025685:web:f65a447dcd44f85fa93d9c",
  measurementId: "G-VZL6HX0EWT",
}

export const firebaseApp: FirebaseApp =
  getApps().length ? getApp() : initializeApp(firebaseConfig)

// โหลด analytics เฉพาะฝั่ง client และแบบ dynamic เท่านั้น (กัน SSR แตก)
export async function initAnalytics() {
  if (typeof window === "undefined") return null
  const { isSupported, getAnalytics } = await import("firebase/analytics")
  if (await isSupported()) {
    return getAnalytics(firebaseApp)
  }
  return null
}
