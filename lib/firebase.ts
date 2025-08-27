import {
  initializeApp,
  getApps,
  getApp,
  type FirebaseApp,
} from "firebase/app"
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics"

const firebaseConfig = {
  apiKey: "AIzaSyDb_QTKrHNQZVQ-Pi1_vzuNvWyu9DBR46o",
  authDomain: "dreamhome-2025.firebaseapp.com",
  projectId: "dreamhome-2025",
  storageBucket: "dreamhome-2025.firebasestorage.app",
  messagingSenderId: "261505025685",
  appId: "1:261505025685:web:f65a447dcd44f85fa93d9c",
  measurementId: "G-VZL6HX0EWT",
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
