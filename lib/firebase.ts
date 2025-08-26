"use client"

import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics"

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
      // Check if Firebase app already exists
      const existingApps = getApps()
      if (existingApps.length > 0) {
        app = existingApps[0]
      } else {
        app = initializeApp(firebaseConfig)
      }

      console.log("Firebase app initialized successfully")

      // Initialize Analytics if supported and not already initialized
      if (!analytics) {
        isSupported()
          .then((supported) => {
            if (supported && app) {
              analytics = getAnalytics(app)
              console.log("Firebase Analytics initialized successfully")
            }
          })
          .catch((error) => {
            console.warn("Firebase Analytics initialization failed:", error)
          })
      }
    } catch (error) {
      console.error("Error initializing Firebase app:", error)
      throw error
    }
  }

  return app
}

export const getFirebaseAnalytics = (): Analytics | null => {
  return analytics
}

export default getFirebaseApp
