"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Loader2, Mail, Lock, AlertCircle, LogIn, RefreshCw } from "lucide-react"
import { useAuthContext } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"

interface SignInModalProps {
  isOpen: boolean
  onClose: () => void
  onSwitchToSignUp: () => void
}

export default function SignInModal({ isOpen, onClose, onSwitchToSignUp }: SignInModalProps) {
  const { signIn, resetPassword, user, sendVerificationEmail } = useAuthContext()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [isSendingVerification, setIsSendingVerification] = useState(false)
  const [error, setError] = useState("")
  const [showForgotPassword, setShowForgotPassword] = useState(false)

  const validateForm = () => {
    if (!formData.email.trim()) {
      setError("กรุณากรอกอีเมล")
      return false
    }
    if (!formData.email.includes("@")) {
      setError("รูปแบบอีเมลไม่ถูกต้อง")
      return false
    }
    if (!formData.password.trim()) {
      setError("กรุณากรอกรหัสผ่าน")
      return false
    }
    return true
  }

  const getFirebaseErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case "auth/user-not-found":
        return "ไม่พบผู้ใช้งานนี้ในระบบ กรุณาตรวจสอบอีเมลหรือสมัครสมาชิกใหม่"
      case "auth/wrong-password":
        return "รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง"
      case "auth/invalid-email":
        return "รูปแบบอีเมลไม่ถูกต้อง"
      case "auth/user-disabled":
        return "บัญชีผู้ใช้นี้ถูกปิดใช้งาน กรุณาติดต่อผู้ดูแลระบบ"
      case "auth/too-many-requests":
        return "มีการพยายามเข้าสู่ระบบมากเกินไป กรุณาลองใหม่ในภายหลัง"
      case "auth/invalid-credential":
        return "ข้อมูลการเข้าสู่ระบบไม่ถูกต้อง กรุณาตรวจสอบอีเมลและรหัสผ่าน"
      default:
        return "เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง"
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    try {
      await signIn(formData.email, formData.password)
      toast({
        title: "เข้าสู่ระบบสำเร็จ",
        description: "ยินดีต้อนรับกลับสู่ DreamHome",
      })
      onClose()
      setFormData({ email: "", password: "" })
    } catch (error: any) {
      console.error("Sign in error:", error)
      const errorMessage = getFirebaseErrorMessage(error.code)
      setError(errorMessage)
      toast({
        title: "เข้าสู่ระบบไม่สำเร็จ",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!formData.email.trim()) {
      setError("กรุณากรอกอีเมลก่อนขอรีเซ็ตรหัสผ่าน")
      return
    }

    if (!formData.email.includes("@")) {
      setError("รูปแบบอีเมลไม่ถูกต้อง")
      return
    }

    setIsResettingPassword(true)
    setError("")

    try {
      await resetPassword(formData.email)
      toast({
        title: "ส่งลิงค์รีเซ็ตรหัสผ่านแล้ว",
        description: `กรุณาตรวจสอบอีเมล ${formData.email} เพื่อรีเซ็ตรหัสผ่าน`,
      })
      setShowForgotPassword(false)
    } catch (error: any) {
      console.error("Reset password error:", error)
      const errorMessage = getFirebaseErrorMessage(error.code)
      setError(errorMessage)
      toast({
        title: "ส่งลิงค์รีเซ็ตรหัสผ่านไม่สำเร็จ",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsResettingPassword(false)
    }
  }

  const handleSendVerificationEmail = async () => {
    if (!user) return

    setIsSendingVerification(true)
    try {
      await sendVerificationEmail(user)
      toast({
        title: "ส่งอีเมลยืนยันแล้ว",
        description: "กรุณาตรวจสอบอีเมลของคุณเพื่อยืนยันบัญชี",
      })
    } catch (error: any) {
      console.error("Send verification email error:", error)
      toast({
        title: "ส่งอีเมลยืนยันไม่สำเร็จ",
        description: "กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      })
    } finally {
      setIsSendingVerification(false)
    }
  }

  const handleClose = () => {
    setFormData({ email: "", password: "" })
    setError("")
    setShowPassword(false)
    setShowForgotPassword(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-[400px] sm:max-w-[450px] md:max-w-[500px] max-h-[95vh] overflow-y-auto">
        <DialogHeader className="space-y-2 sm:space-y-3">
          <DialogTitle className="text-lg sm:text-xl md:text-2xl font-bold text-center">
            {showForgotPassword ? "รีเซ็ตรหัสผ่าน" : "เข้าสู่ระบบ"}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm md:text-base text-center text-gray-600">
            {showForgotPassword ? "กรอกอีเมลเพื่อรับลิงค์รีเซ็ตรหัสผ่าน" : "เข้าสู่ระบบเพื่อใช้งาน DreamHome"}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={
            showForgotPassword
              ? (e) => {
                  e.preventDefault()
                  handleForgotPassword()
                }
              : handleSubmit
          }
          className="space-y-3 sm:space-y-4"
        >
          {error && (
            <Alert variant="destructive" className="py-2 sm:py-3">
              <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
              <AlertDescription className="text-xs sm:text-sm">{error}</AlertDescription>
            </Alert>
          )}

          {user && !user.emailVerified && (
            <Alert className="py-2 sm:py-3 border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600" />
              <AlertDescription className="text-xs sm:text-sm text-yellow-800">
                บัญชีของคุณยังไม่ได้รับการยืนยัน{" "}
                <button
                  type="button"
                  onClick={handleSendVerificationEmail}
                  disabled={isSendingVerification}
                  className="text-yellow-600 hover:text-yellow-800 underline font-medium"
                >
                  {isSendingVerification ? "กำลังส่ง..." : "ส่งอีเมลยืนยันอีกครั้ง"}
                </button>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-1 sm:space-y-2">
            <Label htmlFor="email" className="text-xs sm:text-sm font-medium">
              อีเมล
            </Label>
            <div className="relative">
              <Mail className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="กรอกอีเมลของคุณ"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="pl-8 sm:pl-10 h-9 sm:h-10 md:h-11 text-xs sm:text-sm"
                required
              />
            </div>
          </div>

          {!showForgotPassword && (
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="password" className="text-xs sm:text-sm font-medium">
                รหัสผ่าน
              </Label>
              <div className="relative">
                <Lock className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="กรอกรหัสผ่านของคุณ"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className="pl-8 sm:pl-10 pr-8 sm:pr-10 h-9 sm:h-10 md:h-11 text-xs sm:text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" />
                  ) : (
                    <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                  )}
                </button>
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-8 sm:h-9 md:h-10 text-xs sm:text-sm bg-blue-600 hover:bg-blue-700"
            disabled={isLoading || isResettingPassword}
          >
            {showForgotPassword ? (
              isResettingPassword ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                  กำลังส่งลิงค์...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  ส่งลิงค์รีเซ็ตรหัสผ่าน
                </>
              )
            ) : isLoading ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                กำลังเข้าสู่ระบบ...
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                เข้าสู่ระบบ
              </>
            )}
          </Button>

          {!showForgotPassword && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                ลืมรหัสผ่าน?
              </button>
            </div>
          )}

          {showForgotPassword && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                className="text-xs sm:text-sm text-gray-600 hover:text-gray-800 hover:underline"
              >
                กลับไปเข้าสู่ระบบ
              </button>
            </div>
          )}

          <div className="text-center pt-2 sm:pt-4 border-t">
            <p className="text-xs sm:text-sm text-gray-600">
              ยังไม่มีบัญชี?{" "}
              <button
                type="button"
                onClick={onSwitchToSignUp}
                className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
              >
                สมัครสมาชิก
              </button>
            </p>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
