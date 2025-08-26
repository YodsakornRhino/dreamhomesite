import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app"
import { getAnalytics, type Analytics } from "firebase/analytics"

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDb_QTKrHNQZVQ-Pi1_vzuNvWyu9DBR46o",
  authDomain: "dreamhome-2025.firebaseapp.com",
  projectId: "dreamhome-2025",
  storageBucket: "dreamhome-2025.firebasestorage.app",
  messagingSenderId: "261505025685",
  appId: "1:261505025685:web:f65a447dcd44f85fa93d9c",
  measurementId: "G-VZL6HX0EWT",
}

let app: FirebaseApp | null = null
let analytics: Analytics | null = null

export const getFirebaseApp = (): FirebaseApp => {
  if (typeof window === "undefined") {
    throw new Error("Firebase can only be initialized on the client side")
  }

  if (!app) {
    try {
      app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
      console.log("Firebase app initialized successfully")

      // Initialize Analytics only in browser environment
      if (typeof window !== "undefined" && !analytics) {
        analytics = getAnalytics(app)
        console.log("Firebase Analytics initialized successfully")
      }
    } catch (error) {
      console.error("Error initializing Firebase app:", error)
      throw error
    }
  }

  return app
}

export const getFirebaseAnalytics = (): Analytics | null => {
  if (typeof window === "undefined") {
    return null
  }

  if (!analytics && app) {
    try {
      analytics = getAnalytics(app)
    } catch (error) {
      console.error("Error initializing Firebase Analytics:", error)
    }
  }

  return analytics
}

export default getFirebaseApp
