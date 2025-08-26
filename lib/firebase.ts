import { initializeApp, getApps, getApp } from "firebase/app"
import { getAnalytics, isSupported } from "firebase/analytics"

const firebaseConfig = {
  apiKey: "AIzaSyDb_QTKrHNQZVQ-Pi1_vzuNvWyu9DBR46o",
  authDomain: "dreamhome-2025.firebaseapp.com",
  projectId: "dreamhome-2025",
  storageBucket: "dreamhome-2025.firebasestorage.app",
  messagingSenderId: "261505025685",
  appId: "1:261505025685:web:f65a447dcd44f85fa93d9c",
  measurementId: "G-VZL6HX0EWT",
}

// Initialize Firebase
let firebaseApp
if (getApps().length === 0) {
  firebaseApp = initializeApp(firebaseConfig)
} else {
  firebaseApp = getApp()
}

// Initialize Analytics only on client side
let analytics
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(firebaseApp)
    }
  })
}

export { firebaseApp, analytics }
export default firebaseApp
