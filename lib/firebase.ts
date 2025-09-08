import {
  initializeApp,
  getApps,
  getApp,
  type FirebaseApp,
} from "firebase/app"
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics"

const firebaseConfig = {
  apiKey: "AIzaSyBJ7ZhGhalGcNXLkL5jTyY-f6RxmeAX3aY",
  authDomain: "phoneauth-ea2ba.firebaseapp.com",
  projectId: "phoneauth-ea2ba",
  storageBucket: "phoneauth-ea2ba.firebasestorage.app",
  messagingSenderId: "1056879765097",
  appId: "1:1056879765097:web:6fdc489c1222e59b23a4f8",
  measurementId: "G-MYX5GDLKNE"
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
