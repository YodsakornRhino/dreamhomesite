import {
  initializeApp,
  getApps,
  getApp,
  type FirebaseApp,
} from "firebase/app"
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID!,
}

let firebaseApp: FirebaseApp

/**
 * Returns the singleton Firebase app instance, initializing it if necessary.
 */
export const getFirebaseApp = (): FirebaseApp => {
  if (!firebaseApp) {
    firebaseApp =
      getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
  }
  return firebaseApp
}

// Initialize the app immediately so modules importing firebaseApp work as before
firebaseApp = getFirebaseApp()

// Initialize Analytics only on client side
let analytics: Analytics | undefined
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(firebaseApp)
    }
  })
}

export { firebaseApp, analytics }
export default firebaseApp
