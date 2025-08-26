"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, Loader2, Mail, Lock, User } from "lucide-react"
import { useAuthContext } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"

interface SignUpModalProps {
  isOpen: boolean
  onClose: () => void
  onSwitchToSignIn: () => void
}

export default function SignUpModal({ isOpen, onClose, onSwitchToSignIn }: SignUpModalProps) {
  const { signUp } = useAuthContext()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [agreeToTerms, setAgreeToTerms] = useState(false)

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("กรุณากรอกชื่อ")
      return false
    }

    if (formData.name.trim().length < 2) {
      setError("ชื่อต้องมีอย่างน้อย 2 ตัวอักษร")
      return false
    }

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

    if (formData.password.length < 6) {
      setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร")
      return false
    }

    if (!formData.confirmPassword.trim()) {
      setError("กรุณายืนยันรหัสผ่าน")
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน")
      return false
    }

    if (!agreeToTerms) {
      setError("กรุณายอมรับข้อตกลงและเงื่อนไขการใช้งาน")
      return false
    }

    return true
  }

  const getFirebaseErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case "auth/email-already-in-use":
        return "อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น"
      case "auth/invalid-email":
        return "รูปแบบอีเมลไม่ถูกต้อง"
      case "auth/operation-not-allowed":
        return "การสมัครสมาชิกถูกปิดใช้งาน"
      case "auth/weak-password":
        return "รหัสผ่านไม่ปลอดภัย กรุณาใช้รหัสผ่านที่แข็งแกร่งกว่า"
      case "auth/too-many-requests":
        return "มีการพยายามสมัครสมาชิกมากเกินไป กรุณาลองใหม่ในภายหลัง"
      default:
        return "เกิดข้อผิดพลาดในการสมัครสมาชิก กรุณาลองใหม่อีกครั้ง"
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      await signUp(formData.email, formData.password)
      toast({
        title: "สมัครสมาชิกสำเร็จ",
        description: `ยินดีต้อนรับ ${formData.name}! กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชี`,
      })
      onClose()
      resetForm()
    } catch (error: any) {
      console.error("Sign up error:", error)
      const errorMessage = getFirebaseErrorMessage(error.code)
      setError(errorMessage)
      toast({
        title: "สมัครสมาชิกไม่สำเร็จ",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    })
    setError("")
    setShowPassword(false)
    setShowConfirmPassword(false)
    setAgreeToTerms(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-[400px] sm:max-w-[450px] md:max-w-[500px] mx-auto p-3 sm:p-4 md:p-6 max-h-[95vh] overflow-y-auto rounded-lg">
        <DialogHeader className="space-y-2 sm:space-y-3">
          <DialogTitle className="text-lg sm:text-xl md:text-2xl font-bold text-center text-gray-900">
            สมัครสมาชิก
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm md:text-base text-center text-gray-600 px-1 sm:px-2">
            สร้างบัญชีใหม่เพื่อเริ่มใช้งาน DreamHome
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="text-xs sm:text-sm">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSignUp} className="space-y-3 sm:space-y-4 md:space-y-5">
          <div className="space-y-1 sm:space-y-2">
            <Label htmlFor="name" className="text-xs sm:text-sm md:text-base font-medium text-gray-700">
              ชื่อ
            </Label>
            <div className="relative">
              <User className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
              <Input
                id="name"
                type="text"
                placeholder="กรอกชื่อของคุณ"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="pl-8 sm:pl-10 h-9 sm:h-10 md:h-11 text-xs sm:text-sm md:text-base w-full"
                disabled={isLoading}
                required
              />
            </div>
          </div>

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
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="pl-8 sm:pl-10 h-9 sm:h-10 md:h-11 text-xs sm:text-sm md:text-base w-full"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <div className="space-y-1 sm:space-y-2">
            <Label htmlFor="password" className="text-xs sm:text-sm md:text-base font-medium text-gray-700">
              รหัสผ่าน
            </Label>
            <div className="relative">
              <Lock className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="กรอกรหัสผ่าน (อย่างน้อย 6 ตัวอักษร)"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
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

          <div className="space-y-1 sm:space-y-2">
            <Label htmlFor="confirmPassword" className="text-xs sm:text-sm md:text-base font-medium text-gray-700">
              ยืนยันรหัสผ่าน
            </Label>
            <div className="relative">
              <Lock className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="กรอกรหัสผ่านอีกครั้ง"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                className="pl-8 sm:pl-10 pr-8 sm:pr-10 h-9 sm:h-10 md:h-11 text-xs sm:text-sm md:text-base w-full"
                disabled={isLoading}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-2 sm:px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" />
                ) : (
                  <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex items-start space-x-2 sm:space-x-3">
            <Checkbox
              id="terms"
              checked={agreeToTerms}
              onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
              disabled={isLoading}
              className="mt-0.5 sm:mt-1 flex-shrink-0"
            />
            <Label htmlFor="terms" className="text-xs sm:text-sm text-gray-600 cursor-pointer leading-relaxed">
              ฉันยอมรับ{" "}
              <a href="/terms" className="text-blue-600 hover:text-blue-700 underline">
                ข้อตกลงและเงื่อนไขการใช้งาน
              </a>{" "}
              และ{" "}
              <a href="/privacy" className="text-blue-600 hover:text-blue-700 underline">
                นโยบายความเป็นส่วนตัว
              </a>
            </Label>
          </div>

          <Button
            type="submit"
            className="w-full h-9 sm:h-10 md:h-11 bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm md:text-base font-medium transition-colors"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                <span className="text-xs sm:text-sm md:text-base">กำลังสมัครสมาชิก...</span>
              </>
            ) : (
              <span className="text-xs sm:text-sm md:text-base">สมัครสมาชิก</span>
            )}
          </Button>
        </form>

        <div className="space-y-3 sm:space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-xs sm:text-sm">
              <span className="px-2 sm:px-3 bg-white text-gray-500">มีบัญชีอยู่แล้ว?</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={onSwitchToSignIn}
            className="w-full h-9 sm:h-10 md:h-11 border-blue-600 text-blue-600 hover:bg-blue-50 font-medium bg-transparent text-xs sm:text-sm md:text-base transition-colors"
            disabled={isLoading}
          >
            เข้าสู่ระบบ
          </Button>
        </div>

        {/* Social Login Options */}
        <div className="space-y-3">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-xs sm:text-sm">
              <span className="px-2 sm:px-3 bg-white text-gray-500">หรือสมัครด้วย</span>
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
      </DialogContent>
    </Dialog>
  )
}
