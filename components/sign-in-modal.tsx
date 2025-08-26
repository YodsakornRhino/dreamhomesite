"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Loader2, Mail, Lock, AlertCircle } from "lucide-react"
import { useAuthContext } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"

interface SignInModalProps {
  isOpen: boolean
  onClose: () => void
  onSwitchToSignUp: () => void
}

export default function SignInModal({ isOpen, onClose, onSwitchToSignUp }: SignInModalProps) {
  const { signIn, resetPassword } = useAuthContext()
  const { toast } = useToast()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [error, setError] = useState("")
  const [showForgotPassword, setShowForgotPassword] = useState(false)

  const validateForm = () => {
    if (!email.trim()) {
      setError("กรุณากรอกอีเมล")
      return false
    }
    if (!email.includes("@")) {
      setError("รูปแบบอีเมลไม่ถูกต้อง")
      return false
    }
    if (!password.trim()) {
      setError("กรุณากรอกรหัสผ่าน")
      return false
    }
    if (password.length < 6) {
      setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร")
      return false
    }
    return true
  }

  const getFirebaseErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case "auth/user-not-found":
        return "ไม่พบผู้ใช้งานนี้ในระบบ"
      case "auth/wrong-password":
        return "รหัสผ่านไม่ถูกต้อง"
      case "auth/invalid-email":
        return "รูปแบบอีเมลไม่ถูกต้อง"
      case "auth/user-disabled":
        return "บัญชีผู้ใช้นี้ถูกปิดใช้งาน"
      case "auth/too-many-requests":
        return "มีการพยายามเข้าสู่ระบบมากเกินไป กรุณาลองใหม่ในภายหลัง"
      case "auth/invalid-credential":
        return "ข้อมูลการเข้าสู่ระบบไม่ถูกต้อง"
      default:
        return "เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง"
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    try {
      await signIn(email, password)
      toast({
        title: "เข้าสู่ระบบสำเร็จ",
        description: `ยินดีต้อนรับกลับ ${email}`,
      })
      onClose()
      setEmail("")
      setPassword("")
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
    if (!email.trim()) {
      setError("กรุณากรอกอีเมลก่อนขอรีเซ็ตรหัสผ่าน")
      return
    }
    if (!email.includes("@")) {
      setError("รูปแบบอีเมลไม่ถูกต้อง")
      return
    }

    setIsResettingPassword(true)
    setError("")

    try {
      await resetPassword(email)
      toast({
        title: "ส่งอีเมลรีเซ็ตรหัสผ่านแล้ว",
        description: `กรุณาตรวจสอบอีเมล ${email} เพื่อรีเซ็ตรหัสผ่าน`,
      })
      setShowForgotPassword(false)
    } catch (error: any) {
      console.error("Reset password error:", error)
      const errorMessage = getFirebaseErrorMessage(error.code)
      setError(errorMessage)
      toast({
        title: "ส่งอีเมลรีเซ็ตรหัสผ่านไม่สำเร็จ",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsResettingPassword(false)
    }
  }

  const handleClose = () => {
    setEmail("")
    setPassword("")
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
            {showForgotPassword ? "กรอกอีเมลของคุณเพื่อรับลิงก์รีเซ็ตรหัสผ่าน" : "เข้าสู่ระบบเพื่อใช้งาน DreamHome"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={showForgotPassword ? handleForgotPassword : handleSubmit} className="space-y-3 sm:space-y-4">
          {error && (
            <Alert variant="destructive" className="py-2 sm:py-3">
              <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
              <AlertDescription className="text-xs sm:text-sm">{error}</AlertDescription>
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
            {isLoading || isResettingPassword ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                {showForgotPassword ? "กำลังส่งอีเมล..." : "กำลังเข้าสู่ระบบ..."}
              </>
            ) : showForgotPassword ? (
              "ส่งอีเมลรีเซ็ตรหัสผ่าน"
            ) : (
              "เข้าสู่ระบบ"
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
                className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                กลับไปหน้าเข้าสู่ระบบ
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
