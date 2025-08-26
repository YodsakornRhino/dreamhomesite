"use client"

import { getAuthInstance } from "@/lib/auth"
import { sendEmailVerification } from "firebase/auth"

export async function sendVerificationEmail() {
  const auth = getAuthInstance()
  const user = auth.currentUser

  if (!user) {
    throw new Error("No signed-in user")
  }

  // Configure the verification email settings
  const actionCodeSettings = {
    url: `${window.location.origin}/verify-email?verified=true`,
    handleCodeInApp: false, // Use regular web page opening
  }

  await sendEmailVerification(user, actionCodeSettings)
}
