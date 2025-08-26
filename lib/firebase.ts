import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app"

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

// Initialize Firebase app
let firebaseApp: FirebaseApp

if (typeof window !== "undefined") {
  // Client-side initialization
  firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
} else {
  // Server-side - create a dummy app that won't be used
  firebaseApp = {} as FirebaseApp
}

export { firebaseApp }
export default firebaseApp
