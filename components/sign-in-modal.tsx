"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react"
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

  const handleSignIn = async (e: React.FormEvent) => {
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email.trim()) {
      setError("กรุณากรอกอีเมลเพื่อรีเซ็ตรหัสผ่าน")
      return
    }

    if (!email.includes("@")) {
      setError("รูปแบบอีเมลไม่ถูกต้อง")
      return
    }

    setIsResettingPassword(true)

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
      <DialogContent className="w-[95vw] max-w-[400px] sm:max-w-[450px] md:max-w-[500px] mx-auto p-3 sm:p-4 md:p-6 max-h-[95vh] overflow-y-auto rounded-lg">
        <DialogHeader className="space-y-2 sm:space-y-3">
          <DialogTitle className="text-lg sm:text-xl md:text-2xl font-bold text-center text-gray-900">
            {showForgotPassword ? "รีเซ็ตรหัสผ่าน" : "เข้าสู่ระบบ"}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm md:text-base text-center text-gray-600 px-1 sm:px-2">
            {showForgotPassword ? "กรอกอีเมลของคุณเพื่อรับลิงก์รีเซ็ตรหัสผ่าน" : "เข้าสู่ระบบเพื่อใช้งาน DreamHome"}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="text-xs sm:text-sm">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form
          onSubmit={showForgotPassword ? handleForgotPassword : handleSignIn}
          className="space-y-3 sm:space-y-4 md:space-y-5"
        >
          <div className="space-y-1 sm:space-y-2">
            <Label htmlFor="email" className="text-xs sm:text-sm md:text-base font-medium text-gray-700">
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
                className="pl-8 sm:pl-10 h-9 sm:h-10 md:h-11 text-xs sm:text-sm md:text-base w-full"
                disabled={isLoading || isResettingPassword}
                required
              />
            </div>
          </div>

          {!showForgotPassword && (
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="password" className="text-xs sm:text-sm md:text-base font-medium text-gray-700">
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
                  className="pl-8 sm:pl-10 pr-8 sm:pr-10 h-9 sm:h-10 md:h-11 text-xs sm:text-sm md:text-base w-full"
                  disabled={isLoading}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-2 sm:px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" />
                  ) : (
                    <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-9 sm:h-10 md:h-11 bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm md:text-base font-medium transition-colors"
            disabled={isLoading || isResettingPassword}
          >
            {isLoading || isResettingPassword ? (
              <>
                <Loader2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                <span className="text-xs sm:text-sm md:text-base">
                  {showForgotPassword ? "กำลังส่งอีเมล..." : "กำลังเข้าสู่ระบบ..."}
                </span>
              </>
            ) : (
              <span className="text-xs sm:text-sm md:text-base">
                {showForgotPassword ? "ส่งอีเมลรีเซ็ตรหัสผ่าน" : "เข้าสู่ระบบ"}
              </span>
            )}
          </Button>
        </form>

        <div className="space-y-3 sm:space-y-4">
          {!showForgotPassword ? (
            <>
              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm md:text-base p-0 h-auto"
                  disabled={isLoading}
                >
                  ลืมรหัสผ่าน?
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-xs sm:text-sm">
                  <span className="px-2 sm:px-3 bg-white text-gray-500">ยังไม่มีบัญชี?</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={onSwitchToSignUp}
                className="w-full h-9 sm:h-10 md:h-11 border-blue-600 text-blue-600 hover:bg-blue-50 font-medium bg-transparent text-xs sm:text-sm md:text-base transition-colors"
                disabled={isLoading}
              >
                สมัครสมาชิก
              </Button>
            </>
          ) : (
            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={() => setShowForgotPassword(false)}
                className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm md:text-base p-0 h-auto"
                disabled={isResettingPassword}
              >
                กลับไปหน้าเข้าสู่ระบบ
              </Button>
            </div>
          )}
        </div>

        {/* Social Login Options */}
        {!showForgotPassword && (
          <div className="space-y-3">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-xs sm:text-sm">
                <span className="px-2 sm:px-3 bg-white text-gray-500">หรือเข้าสู่ระบบด้วย</span>
              </div>
            </div>

            <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-8 sm:h-9 md:h-10 bg-transparent text-xs sm:text-sm font-medium transition-colors hover:bg-gray-50 flex items-center justify-center"
                disabled={isLoading}
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="text-xs sm:text-sm">Google</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-8 sm:h-9 md:h-10 bg-transparent text-xs sm:text-sm font-medium transition-colors hover:bg-gray-50 flex items-center justify-center"
                disabled={isLoading}
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 fill-[#1877F2]" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span className="text-xs sm:text-sm">Facebook</span>
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
