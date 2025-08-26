"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Loader2, Mail, Lock, User, AlertCircle, CheckCircle } from "lucide-react"
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
      case "auth/weak-password":
        return "รหัสผ่านไม่ปลอดภัย กรุณาใช้รหัสผ่านที่แข็งแกร่งกว่านี้"
      case "auth/too-many-requests":
        return "มีการสมัครสมาชิกมากเกินไป กรุณาลองใหม่ในภายหลัง"
      case "auth/network-request-failed":
        return "เกิดข้อผิดพลาดเครือข่าย กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต"
      default:
        return "เกิดข้อผิดพลาดในการสมัครสมาชิก กรุณาลองใหม่อีกครั้ง"
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
      console.log("Starting signup process for:", formData.email)
      const user = await signUp(formData.email, formData.password)
      console.log("Signup successful, user created:", user.uid)

      // Show success message
      toast({
        title: "สมัครสมาชิกสำเร็จ!",
        description: `ยินดีต้อนรับ ${formData.name}! กำลังนำคุณไปยังหน้ายืนยันอีเมล`,
      })

      // Reset form and close modal
      setFormData({ name: "", email: "", password: "", confirmPassword: "" })
      setAgreeToTerms(false)
      onClose()

      // Small delay before redirect to ensure modal closes properly
      setTimeout(() => {
        window.location.href = "/verify-email"
      }, 500)
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

  const handleClose = () => {
    if (!isLoading) {
      setFormData({ name: "", email: "", password: "", confirmPassword: "" })
      setError("")
      setShowPassword(false)
      setShowConfirmPassword(false)
      setAgreeToTerms(false)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-[400px] sm:max-w-[450px] md:max-w-[500px] max-h-[95vh] overflow-y-auto">
        <DialogHeader className="space-y-2 sm:space-y-3">
          <DialogTitle className="text-lg sm:text-xl md:text-2xl font-bold text-center">สมัครสมาชิก</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm md:text-base text-center text-gray-600">
            สร้างบัญชีใหม่เพื่อเริ่มใช้งาน DreamHome
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {error && (
            <Alert variant="destructive" className="py-2 sm:py-3">
              <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
              <AlertDescription className="text-xs sm:text-sm">{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-1 sm:space-y-2">
            <Label htmlFor="name" className="text-xs sm:text-sm font-medium">
              ชื่อ-นามสกุล
            </Label>
            <div className="relative">
              <User className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
              <Input
                id="name"
                type="text"
                placeholder="กรอกชื่อ-นามสกุลของคุณ"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="pl-8 sm:pl-10 h-9 sm:h-10 md:h-11 text-xs sm:text-sm"
                required
                disabled={isLoading}
              />
            </div>
          </div>

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
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-1 sm:space-y-2">
            <Label htmlFor="password" className="text-xs sm:text-sm font-medium">
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
                className="pl-8 sm:pl-10 pr-8 sm:pr-10 h-9 sm:h-10 md:h-11 text-xs sm:text-sm"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" />
                ) : (
                  <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-1 sm:space-y-2">
            <Label htmlFor="confirmPassword" className="text-xs sm:text-sm font-medium">
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
                className="pl-8 sm:pl-10 pr-8 sm:pr-10 h-9 sm:h-10 md:h-11 text-xs sm:text-sm"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={isLoading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" />
                ) : (
                  <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-start space-x-2 sm:space-x-3 pt-2">
            <Checkbox
              id="terms"
              checked={agreeToTerms}
              onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
              className="mt-0.5"
              disabled={isLoading}
            />
            <Label htmlFor="terms" className="text-xs sm:text-sm text-gray-600 leading-relaxed cursor-pointer">
              ฉันยอมรับ{" "}
              <a href="/terms" className="text-blue-600 hover:text-blue-800 hover:underline">
                ข้อตกลงและเงื่อนไขการใช้งาน
              </a>{" "}
              และ{" "}
              <a href="/privacy" className="text-blue-600 hover:text-blue-800 hover:underline">
                นโยบายความเป็นส่วนตัว
              </a>
            </Label>
          </div>

          <Button
            type="submit"
            className="w-full h-8 sm:h-9 md:h-10 text-xs sm:text-sm bg-blue-600 hover:bg-blue-700"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                กำลังสมัครสมาชิก...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                สมัครสมาชิก
              </>
            )}
          </Button>

          <div className="text-center pt-2 sm:pt-4 border-t">
            <p className="text-xs sm:text-sm text-gray-600">
              มีบัญชีอยู่แล้ว?{" "}
              <button
                type="button"
                onClick={onSwitchToSignIn}
                className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                disabled={isLoading}
              >
                เข้าสู่ระบบ
              </button>
            </p>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
