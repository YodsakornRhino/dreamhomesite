"use client"

import { useAuthContext } from "@/contexts/AuthContext"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, Mail } from "lucide-react"
import { useRouter } from "next/navigation"

export default function VerificationBanner() {
  const { user } = useAuthContext()
  const router = useRouter()

  // Don't show banner if user is not logged in or already verified
  if (!user || user.emailVerified) {
    return null
  }

  const handleGoToVerification = () => {
    router.push("/verify-email")
  }

  return (
    <Alert className="border-yellow-200 bg-yellow-50 mb-4">
      <AlertCircle className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Mail className="h-4 w-4 text-yellow-600" />
          <span className="text-yellow-800 text-sm">กรุณายืนยันอีเมลของคุณเพื่อใช้งานบัญชีได้เต็มรูปแบบ</span>
        </div>
        <Button
          onClick={handleGoToVerification}
          size="sm"
          variant="outline"
          className="ml-4 border-yellow-300 text-yellow-700 hover:bg-yellow-100 bg-transparent"
        >
          ยืนยันอีเมล
        </Button>
      </AlertDescription>
    </Alert>
  )
}
