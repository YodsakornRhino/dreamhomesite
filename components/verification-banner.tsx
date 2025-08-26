"use client"

import { useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { X, Mail, Send, Loader2 } from "lucide-react"
import { useAuthContext } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"

export default function VerificationBanner() {
  const { user, sendVerificationEmail } = useAuthContext()
  const { toast } = useToast()
  const [isHidden, setIsHidden] = useState(false)
  const [isResending, setIsResending] = useState(false)

  // Don't show if user is not logged in, email is verified, or banner is hidden
  if (!user || user.emailVerified || isHidden) {
    return null
  }

  const handleResendEmail = async () => {
    setIsResending(true)
    try {
      await sendVerificationEmail()
      toast({
        title: "ส่งอีเมลยืนยันแล้ว!",
        description: "กรุณาตรวจสอบอีเมลของคุณ",
      })
    } catch (error: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถส่งอีเมลยืนยันได้",
        variant: "destructive",
      })
    } finally {
      setIsResending(false)
    }
  }

  return (
    <Alert className="border-yellow-200 bg-yellow-50 mb-4">
      <Mail className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex-1">
          <span className="text-yellow-800">
            <strong>กรุณายืนยันอีเมลของคุณ</strong> เพื่อใช้งานฟีเจอร์ทั้งหมด
          </span>
        </div>
        <div className="flex items-center space-x-2 ml-4">
          <Button
            size="sm"
            variant="outline"
            onClick={handleResendEmail}
            disabled={isResending}
            className="text-yellow-800 border-yellow-300 hover:bg-yellow-100 bg-transparent"
          >
            {isResending ? (
              <>
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                กำลังส่ง...
              </>
            ) : (
              <>
                <Send className="mr-1 h-3 w-3" />
                ส่งใหม่
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsHidden(true)}
            className="text-yellow-600 hover:bg-yellow-100"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
