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
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">สมัครสมาชิก</DialogTitle>
          <DialogDescription className="text-center text-gray-600">สร้างบัญชีใหม่เพื่อเริ่มใช้งาน DreamHome</DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">ชื่อ</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="name"
                type="text"
                placeholder="กรอกชื่อของคุณ"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="pl-10"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">อีเมล</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="กรอกอีเมลของคุณ"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="pl-10"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">รหัสผ่าน</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="กรอกรหัสผ่าน (อย่างน้อย 6 ตัวอักษร)"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
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

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">ยืนยันรหัสผ่าน</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="กรอกรหัสผ่านอีกครั้ง"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                className="pl-10 pr-10"
                disabled={isLoading}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="terms"
              checked={agreeToTerms}
              onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
              disabled={isLoading}
            />
            <Label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer">
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

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                กำลังสมัครสมาชิก...
              </>
            ) : (
              "สมัครสมาชิก"
            )}
          </Button>
        </form>

        <div className="text-center text-sm text-gray-600">
          มีบัญชีอยู่แล้ว?{" "}
          <Button
            type="button"
            variant="link"
            onClick={onSwitchToSignIn}
            className="text-blue-600 hover:text-blue-700 p-0 h-auto font-medium"
            disabled={isLoading}
          >
            เข้าสู่ระบบ
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
