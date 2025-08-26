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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            {showForgotPassword ? "รีเซ็ตรหัสผ่าน" : "เข้าสู่ระบบ"}
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600">
            {showForgotPassword ? "กรอกอีเมลของคุณเพื่อรับลิงก์รีเซ็ตรหัสผ่าน" : "เข้าสู่ระบบเพื่อใช้งาน DreamHome"}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={showForgotPassword ? handleForgotPassword : handleSignIn} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">อีเมล</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="กรอกอีเมลของคุณ"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                disabled={isLoading || isResettingPassword}
                required
              />
            </div>
          </div>

          {!showForgotPassword && (
            <div className="space-y-2">
              <Label htmlFor="password">รหัสผ่าน</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="กรอกรหัสผ่านของคุณ"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  disabled={isLoading}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={isLoading || isResettingPassword}
          >
            {isLoading || isResettingPassword ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {showForgotPassword ? "กำลังส่งอีเมล..." : "กำลังเข้าสู่ระบบ..."}
              </>
            ) : showForgotPassword ? (
              "ส่งอีเมลรีเซ็ตรหัสผ่าน"
            ) : (
              "เข้าสู่ระบบ"
            )}
          </Button>
        </form>

        <div className="space-y-4">
          {!showForgotPassword ? (
            <>
              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-blue-600 hover:text-blue-700"
                  disabled={isLoading}
                >
                  ลืมรหัสผ่าน?
                </Button>
              </div>

              <div className="text-center text-sm text-gray-600">
                ยังไม่มีบัญชี?{" "}
                <Button
                  type="button"
                  variant="link"
                  onClick={onSwitchToSignUp}
                  className="text-blue-600 hover:text-blue-700 p-0 h-auto font-medium"
                  disabled={isLoading}
                >
                  สมัครสมาชิก
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={() => setShowForgotPassword(false)}
                className="text-blue-600 hover:text-blue-700"
                disabled={isResettingPassword}
              >
                กลับไปหน้าเข้าสู่ระบบ
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
