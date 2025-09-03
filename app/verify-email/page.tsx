"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Mail, CheckCircle, AlertCircle, RefreshCw, Send, Clock, Home, Loader2 } from "lucide-react"
import { useAuthContext } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

function VerifyEmailContent() {
  const { user, sendVerificationEmail, refreshUser } = useAuthContext()
  const { toast } = useToast()
  const searchParams = useSearchParams()

  const [isResending, setIsResending] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [lastSentTime, setLastSentTime] = useState<number | null>(null)

  const isVerified = searchParams.get("verified") === "true"

  useEffect(() => {
    if (isVerified) {
      void refreshUser()
    }
  }, [isVerified, refreshUser])

  useEffect(() => {
    // Start cooldown timer if we have a last sent time
    if (lastSentTime) {
      const elapsed = Date.now() - lastSentTime
      const remaining = Math.max(0, 60000 - elapsed) // 60 second cooldown
      setCooldown(Math.ceil(remaining / 1000))
    }
  }, [lastSentTime])

  useEffect(() => {
    // Countdown timer
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [cooldown])

  const handleResendEmail = async () => {
    if (cooldown > 0) return

    setIsResending(true)
    try {
      await sendVerificationEmail()
      setLastSentTime(Date.now())
      setCooldown(60)

      toast({
        title: "ส่งอีเมลยืนยันแล้ว!",
        description: "กรุณาตรวจสอบอีเมลของคุณ (รวมถึงโฟลเดอร์ Spam)",
      })
    } catch (error: any) {
      console.error("Error resending verification email:", error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถส่งอีเมลยืนยันได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      })
    } finally {
      setIsResending(false)
    }
  }

  const handleRefreshStatus = async () => {
    setIsRefreshing(true)
    try {
      await refreshUser()

      if (user?.emailVerified) {
        toast({
          title: "ยืนยันอีเมลสำเร็จ!",
          description: "บัญชีของคุณได้รับการยืนยันแล้ว",
        })
      } else {
        toast({
          title: "ยังไม่ได้ยืนยัน",
          description: "กรุณาตรวจสอบอีเมลและคลิกลิงค์ยืนยัน",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error refreshing user status:", error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถตรวจสอบสถานะได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  // Show success message if user came from email verification link
  if (isVerified || user?.emailVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-green-800">ยืนยันอีเมลสำเร็จ!</CardTitle>
              <CardDescription className="text-gray-600 mt-2">บัญชีของคุณได้รับการยืนยันแล้ว</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>ยินดีต้อนรับสู่ DreamHome!</strong>
                <br />
                ตอนนี้คุณสามารถใช้งานฟีเจอร์ทั้งหมดได้แล้ว
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">คุณสามารถ:</p>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• บันทึกอสังหาริมทรัพย์ที่ชื่นชอบ</li>
                <li>• ติดต่อเจ้าของโดยตรง</li>
                <li>• รับการแจ้งเตือนอสังหาริมทรัพย์ใหม่</li>
                <li>• เข้าถึงฟีเจอร์พิเศษทั้งหมด</li>
              </ul>
            </div>

            <Link href="/" className="block">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                <Home className="mr-2 h-4 w-4" />
                กลับสู่หน้าหลัก
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show verification pending page
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-blue-800">ยืนยันอีเมลของคุณ</CardTitle>
            <CardDescription className="text-gray-600 mt-2">เราได้ส่งลิงค์ยืนยันไปยังอีเมลของคุณแล้ว</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {user && (
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">อีเมลที่ลงทะเบียน:</p>
              <Badge variant="outline" className="text-sm font-medium">
                {user.email}
              </Badge>
              <div className="mt-2">
                <Badge variant={user.emailVerified ? "default" : "secondary"}>
                  {user.emailVerified ? "ยืนยันแล้ว" : "รอการยืนยัน"}
                </Badge>
              </div>
            </div>
          )}

          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>สำคัญ:</strong> กรุณาตรวจสอบอีเมลของคุณ (รวมถึงโฟลเดอร์ Spam) และคลิกลิงค์ยืนยัน
            </AlertDescription>
          </Alert>

          <div className="space-y-2 text-sm text-gray-600">
            <p className="font-medium">คำแนะนำ:</p>
            <ul className="space-y-1 ml-4">
              <li>• ตรวจสอบโฟลเดอร์ Spam หรือ Junk</li>
              <li>• ลิงค์ยืนยันจะหมดอายุใน 24 ชั่วโมง</li>
              <li>• หากไม่พบอีเมล ให้ส่งใหม่ด้านล่าง</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleResendEmail}
              disabled={isResending || cooldown > 0}
              className="w-full"
              variant="outline"
            >
              {isResending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังส่ง...
                </>
              ) : cooldown > 0 ? (
                <>
                  <Clock className="mr-2 h-4 w-4" />
                  ส่งใหม่ได้ในอีก {cooldown} วินาที
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  ส่งอีเมลยืนยันใหม่
                </>
              )}
            </Button>

            <Button
              onClick={handleRefreshStatus}
              disabled={isRefreshing}
              className="w-full bg-transparent"
              variant="outline"
            >
              {isRefreshing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังตรวจสอบ...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  ตรวจสอบสถานะการยืนยัน
                </>
              )}
            </Button>

            <Link href="/" className="block">
              <Button variant="ghost" className="w-full">
                <Home className="mr-2 h-4 w-4" />
                กลับสู่หน้าหลัก
              </Button>
            </Link>
          </div>

          {/* Debug information (remove in production) */}
          {process.env.NODE_ENV === "development" && user && (
            <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
              <p>
                <strong>Debug Info:</strong>
              </p>
              <p>User ID: {user.uid}</p>
              <p>Email: {user.email}</p>
              <p>Email Verified: {user.emailVerified ? "Yes" : "No"}</p>
              <p>Creation Time: {user.metadata.creationTime}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}
