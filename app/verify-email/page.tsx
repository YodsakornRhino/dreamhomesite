"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, Mail, AlertCircle, Loader2, RefreshCw } from "lucide-react"
import { useAuthContext } from "@/contexts/AuthContext"
import { sendVerificationEmail } from "@/lib/send-verification"
import { useToast } from "@/hooks/use-toast"

export default function VerifyEmailPage() {
  const { user, loading } = useAuthContext()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [isResending, setIsResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const isVerified = searchParams.get("verified") === "true"

  useEffect(() => {
    // If user is not logged in, redirect to home
    if (!loading && !user) {
      router.push("/")
      return
    }

    // If user is already verified, redirect to home
    if (user?.emailVerified) {
      toast({
        title: "อีเมลได้รับการยืนยันแล้ว",
        description: "บัญชีของคุณพร้อมใช้งานแล้ว",
      })
      router.push("/")
      return
    }
  }, [user, loading, router, toast])

  useEffect(() => {
    // Handle cooldown timer
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const handleResendVerification = async () => {
    if (!user || isResending || resendCooldown > 0) return

    setIsResending(true)
    try {
      await sendVerificationEmail()
      toast({
        title: "ส่งอีเมลยืนยันแล้ว",
        description: "กรุณาตรวจสอบอีเมลของคุณ",
      })
      setResendCooldown(60) // 60 seconds cooldown
    } catch (error: any) {
      console.error("Error resending verification:", error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถส่งอีเมลยืนยันได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      })
    } finally {
      setIsResending(false)
    }
  }

  const handleGoHome = () => {
    router.push("/")
  }

  const handleRefreshStatus = () => {
    window.location.reload()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>กำลังตรวจสอบสถานะ...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          {isVerified ? (
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          ) : (
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
          )}

          <div>
            <CardTitle className="text-xl font-bold">{isVerified ? "ยืนยันอีเมลสำเร็จ!" : "ยืนยันอีเมลของคุณ"}</CardTitle>
            <CardDescription className="mt-2">
              {isVerified ? "บัญชีของคุณได้รับการยืนยันแล้ว" : "เราได้ส่งลิงค์ยืนยันไปยังอีเมลของคุณแล้ว"}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {isVerified ? (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>ยินดีด้วย!</strong> อีเมลของคุณได้รับการยืนยันแล้ว คุณสามารถใช้งานบัญชีได้เต็มรูปแบบ
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">อีเมลยืนยันถูกส่งไปยัง:</p>
                <p className="font-medium text-blue-600 break-all">{user.email}</p>
              </div>

              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800 text-sm">
                  <strong>คำแนะนำ:</strong>
                  <ul className="mt-2 space-y-1 text-xs">
                    <li>• ตรวจสอบโฟลเดอร์ Spam หากไม่พบอีเมล</li>
                    <li>• ลิงค์ยืนยันจะหมดอายุใน 24 ชั่วโมง</li>
                    <li>• คลิกลิงค์ในอีเมลเพื่อยืนยันบัญชี</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </>
          )}

          <div className="space-y-3">
            {isVerified ? (
              <Button onClick={handleGoHome} className="w-full">
                <CheckCircle className="mr-2 h-4 w-4" />
                เริ่มใช้งาน DreamHome
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleResendVerification}
                  disabled={isResending || resendCooldown > 0}
                  variant="outline"
                  className="w-full"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      กำลังส่ง...
                    </>
                  ) : resendCooldown > 0 ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      ส่งใหม่ได้ใน {resendCooldown} วินาที
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      ส่งอีเมลยืนยันใหม่
                    </>
                  )}
                </Button>

                <Button onClick={handleRefreshStatus} variant="ghost" className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  ตรวจสอบสถานะการยืนยัน
                </Button>
              </>
            )}

            <Button onClick={handleGoHome} variant="ghost" className="w-full text-gray-600">
              กลับหน้าหลัก
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
