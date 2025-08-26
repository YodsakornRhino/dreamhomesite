"use client"

import { getAuthInstance } from "@/lib/auth"
import { sendEmailVerification } from "firebase/auth"

export async function sendVerificationEmail() {
  try {
    const auth = getAuthInstance()
    const user = auth.currentUser

    if (!user) {
      throw new Error("No signed-in user found")
    }

    console.log("Sending verification email to:", user.email)
    console.log("User email verified:", user.emailVerified)

    // Configure the verification email settings
    const actionCodeSettings = {
      url: `${window.location.origin}/verify-email?verified=true`,
      handleCodeInApp: false, // Use regular web page opening
    }

    await sendEmailVerification(user, actionCodeSettings)
    console.log("Verification email sent successfully")

    return { success: true, message: "Verification email sent successfully" }
  } catch (error: any) {
    console.error("Error sending verification email:", error)
    throw new Error(`Failed to send verification email: ${error.message}`)
  }
}
