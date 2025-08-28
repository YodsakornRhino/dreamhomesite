// profile-modal.tsx
"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { useAuthContext } from "@/contexts/AuthContext"
import { getDocument, setDocument } from "@/lib/firestore"
import { updateProfile } from "firebase/auth"
import { Loader2, User as UserIcon, Mail, Image as ImageIcon, CheckCircle, AlertCircle } from "lucide-react"

type Preferences = {
  language?: "th" | "en" | string
  theme?: "system" | "light" | "dark" | string
  notifications?: boolean
  [k: string]: any
}

type FormState = {
  name: string
  email: string
  photoURL: string
  preferences: Preferences
}

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user } = useAuthContext()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>("")
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    photoURL: "",
    preferences: { language: "th", theme: "system", notifications: true },
  })

  const initials = useMemo(() => {
    if (!form.name) return (user?.email ?? "U").slice(0, 2).toUpperCase()
    return form.name.split(" ").map(s => s[0]).join("").slice(0, 2).toUpperCase()
  }, [form.name, user?.email])

  const handleChange = (key: keyof FormState, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }))
    setError("")
  }

  const handlePrefChange = (key: keyof Preferences, value: any) => {
    setForm(prev => ({ ...prev, preferences: { ...prev.preferences, [key]: value } }))
    setError("")
  }

  // โหลดข้อมูลโปรไฟล์จาก Firestore ตาม uid
  useEffect(() => {
    const load = async () => {
      if (!isOpen || !user?.uid) return
      try {
        setLoading(true)
        setError("")
        const snap = await getDocument("users", user.uid)
        if (snap?.exists()) {
          const data = snap.data() as any
          setForm({
            name: data?.name ?? user.displayName ?? "",
            email: data?.email ?? user.email ?? "",
            photoURL: data?.photoURL ?? user.photoURL ?? "",
            preferences: {
              language: data?.preferences?.language ?? "th",
              theme: data?.preferences?.theme ?? "system",
              notifications: data?.preferences?.notifications ?? true,
              ...data?.preferences,
            },
          })
        } else {
          // ถ้ายังไม่มีเอกสารใน users/{uid} ให้เติมจาก Auth ไว้ก่อน
          setForm({
            name: user.displayName ?? "",
            email: user.email ?? "",
            photoURL: user.photoURL ?? "",
            preferences: { language: "th", theme: "system", notifications: true },
          })
        }
      } catch (e: any) {
        console.error(e)
        setError(e?.message ?? "โหลดโปรไฟล์ไม่สำเร็จ")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [isOpen, user?.uid])

  const validate = () => {
    if (!form.name.trim()) return "กรุณากรอกชื่อ"
    if (form.name.trim().length < 2) return "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร"
    if (!form.email) return "ไม่พบอีเมลผู้ใช้"
    return ""
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const msg = validate()
    if (msg) {
      setError(msg)
      return
    }
    if (!user?.uid) {
      setError("ไม่พบผู้ใช้ที่ลงชื่อเข้าใช้")
      return
    }

    setSaving(true)
    try {
      // อัปเดต displayName / photoURL บน Firebase Auth (ถ้ามีการเปลี่ยน)
      if (user.displayName !== form.name || user.photoURL !== form.photoURL) {
        try {
          await updateProfile(user, {
            displayName: form.name,
            photoURL: form.photoURL || null,
          })
        } catch (e) {
          console.warn("updateProfile failed (not blocking):", e)
        }
      }

      // ใช้ merge: true (ตั้งไว้ใน setDocument ของคุณแล้ว) + updatedAt
      const { serverTimestamp } = await import("firebase/firestore")
      await setDocument("users", user.uid, {
        uid: user.uid,
        name: form.name,
        email: form.email, // read-only ในฟอร์มนี้
        photoURL: form.photoURL || null,
        preferences: {
          language: form.preferences?.language ?? "th",
          theme: form.preferences?.theme ?? "system",
          notifications: !!form.preferences?.notifications,
        },
        updatedAt: serverTimestamp(),
      })

      toast({
        title: "บันทึกโปรไฟล์สำเร็จ",
        description: "ข้อมูลของคุณอัปเดตเรียบร้อยแล้ว",
      })
      onClose()
    } catch (e: any) {
      console.error(e)
      setError(e?.message ?? "บันทึกโปรไฟล์ไม่สำเร็จ")
      toast({
        title: "บันทึกไม่สำเร็จ",
        description: "กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    if (saving) return
    setError("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      {/* ✅ ขนาด/สไตล์เท่ากับ sign-up modal */}
      <DialogContent className="w-[95vw] max-w-[400px] sm:max-w-[450px] md:max-w-[500px] max-h-[95vh] overflow-y-auto">
        <DialogHeader className="space-y-2 sm:space-y-3">
          <DialogTitle className="text-lg sm:text-xl md:text-2xl font-bold text-center">โปรไฟล์ผู้ใช้</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm md:text-base text-center text-gray-600">
            แก้ไขข้อมูลบัญชี DreamHome ของคุณ
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="py-2 sm:py-3">
            <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
            <AlertDescription className="text-xs sm:text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-5 w-24 bg-gray-200 rounded" />
            <div className="h-10 bg-gray-200 rounded" />
            <div className="h-5 w-24 bg-gray-200 rounded" />
            <div className="h-10 bg-gray-200 rounded" />
            <div className="h-10 bg-gray-200 rounded" />
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-3 sm:space-y-4">
            {/* Name */}
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="name" className="text-xs sm:text-sm font-medium">ชื่อ-นามสกุล</Label>
              <div className="relative">
                <UserIcon className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="กรอกชื่อ-นามสกุล"
                  className="pl-8 sm:pl-10 h-9 sm:h-10 md:h-11 text-xs sm:text-sm"
                  disabled={saving}
                />
              </div>
            </div>

            {/* Email (read-only) */}
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="email" className="text-xs sm:text-sm font-medium">อีเมล</Label>
              <div className="relative">
                <Mail className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  readOnly
                  className="pl-8 sm:pl-10 h-9 sm:h-10 md:h-11 text-xs sm:text-sm bg-gray-50"
                />
              </div>
            </div>

            {/* Photo URL */}
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="photoURL" className="text-xs sm:text-sm font-medium">รูปโปรไฟล์ (URL)</Label>
              <div className="relative">
                <ImageIcon className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                <Input
                  id="photoURL"
                  value={form.photoURL}
                  onChange={(e) => handleChange("photoURL", e.target.value)}
                  placeholder="เช่น https://..."
                  className="pl-8 sm:pl-10 h-9 sm:h-10 md:h-11 text-xs sm:text-sm"
                  disabled={saving}
                />
              </div>
              {/* ตัวอย่าง preview แบบง่าย */}
              {form.photoURL ? (
                <img
                  src={form.photoURL}
                  alt="preview"
                  className="mt-2 h-14 w-14 rounded-full object-cover border"
                />
              ) : (
                <div className="mt-2 h-14 w-14 rounded-full bg-gray-100 border flex items-center justify-center text-xs font-semibold">
                  {initials}
                </div>
              )}
            </div>

            {/* Preferences */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1 sm:space-y-2">
                <Label className="text-xs sm:text-sm font-medium">ภาษา</Label>
                <select
                  value={form.preferences.language ?? "th"}
                  onChange={(e) => handlePrefChange("language", e.target.value)}
                  className="h-9 sm:h-10 md:h-11 text-xs sm:text-sm px-3 border rounded-md bg-white"
                  disabled={saving}
                >
                  <option value="th">ไทย</option>
                  <option value="en">English</option>
                </select>
              </div>

              <div className="space-y-1 sm:space-y-2">
                <Label className="text-xs sm:text-sm font-medium">ธีม</Label>
                <select
                  value={form.preferences.theme ?? "system"}
                  onChange={(e) => handlePrefChange("theme", e.target.value)}
                  className="h-9 sm:h-10 md:h-11 text-xs sm:text-sm px-3 border rounded-md bg-white"
                  disabled={saving}
                >
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
            </div>

            {/* Save */}
            <Button
              type="submit"
              className="w-full h-8 sm:h-9 md:h-10 text-xs sm:text-sm bg-blue-600 hover:bg-blue-700"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  บันทึกโปรไฟล์
                </>
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
