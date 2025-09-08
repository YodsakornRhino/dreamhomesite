// src/components/profile-modal.tsx
"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Loader2, Mail, IdCard, Image as ImageIcon, Save, X, User as UserIcon,
  Phone as PhoneIcon, Send, CheckCheck, RotateCw, CheckCircle
} from "lucide-react"
import { useAuthContext } from "@/contexts/AuthContext"
import { getDocument, setDocument, getDocuments } from "@/lib/firestore"
import { useToast } from "@/hooks/use-toast"
import {
  updateProfile, RecaptchaVerifier, linkWithPhoneNumber,
  PhoneAuthProvider, updatePhoneNumber, type ConfirmationResult,
} from "firebase/auth"
import { getAuthInstance } from "@/lib/auth"
import { normalizePhoneNumber } from "@/lib/utils"

type ProfileModalProps = { isOpen: boolean; onClose: () => void }

// ต้องมี <div id="recaptcha-container-root" /> ใน layout.tsx
const CAPTCHA_ID = "recaptcha-container-root"

const OTP_COOLDOWN_MS = 60_000
const THROTTLE_PENALTY_MS = 10 * 60_000

let globalRecaptcha: RecaptchaVerifier | null = null
let globalRecaptchaInitPromise: Promise<RecaptchaVerifier> | null = null

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const fmtDateTime = (ts: number) =>
  new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "medium", timeZone: "Asia/Bangkok" }).format(ts)
const fmtTime = (ts: number) =>
  new Intl.DateTimeFormat("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Bangkok", hour12: false }).format(ts)

const resetAllRecaptchaWidgets = () => {
  try { const gre: any = (window as any)?.grecaptcha; if (gre?.reset) gre.reset() } catch {}
}
const getRootEl = () => (typeof document !== "undefined" ? document.getElementById(CAPTCHA_ID) : null)
const cleanupRecaptchaRoot = () => { const root = getRootEl(); if (!root) return; while (root.firstChild) root.removeChild(root.firstChild) }
const createFreshSlot = (): HTMLElement => {
  const root = getRootEl()
  if (!root) throw new Error('ไม่พบ reCAPTCHA root ใน DOM (layout.tsx ต้องมี <div id="recaptcha-container-root" />)')
  const slot = document.createElement("div")
  slot.id = `recaptcha-slot-${Date.now()}-${Math.random().toString(36).slice(2)}`
  slot.setAttribute("data-recaptcha-slot", "1")
  root.appendChild(slot)
  return slot
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user } = useAuthContext()
  const uid = user?.uid
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({ name: "", email: "", photoURL: "" })
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [mode, setMode] = useState<"link" | "update">("link")

  const [phoneVerified, setPhoneVerified] = useState(false)
  const [verifiedPhone, setVerifiedPhone] = useState("")

  // reCAPTCHA
  const [recaptchaReady, setRecaptchaReady] = useState(false)
  const [recaptchaStatus, setRecaptchaStatus] = useState<"idle" | "preparing" | "ready" | "error">("idle")

  // OTP state
  const confirmationResultRef = useRef<ConfirmationResult | null>(null)
  const verificationIdRef = useRef<string | null>(null)

  // นาฬิกา + คูลดาวน์
  const [nowTs, setNowTs] = useState<number>(Date.now())
  const [cooldownLeft, setCooldownLeft] = useState(0)
  const cooldownTimerRef = useRef<number | null>(null)

  const cooldownKey = useMemo(() => {
    const safePhone = (phone || "").replace(/\D/g, "")
    return `otpNextAllowedAt:${uid || "nouid"}:${safePhone}`
  }, [uid, phone])
  const lastSentKey = useMemo(() => {
    const safePhone = (phone || "").replace(/\D/g, "")
    return `otpLastSentAt:${uid || "nouid"}:${safePhone}`
  }, [uid, phone])

  const initials = useMemo(() => {
    const n = form.name?.trim() || user?.displayName || user?.email || "U"
    return n.slice(0, 2).toUpperCase()
  }, [form.name, user])

  // ---------------- helper: error ----------------
  const explainFirebaseError = (e: any) => {
    const code = e?.code || ""
    const serverMsg = e?.customData?.serverResponse?.error?.message || e?.message || ""
    console.error("Phone verify error:", code, serverMsg, e)
    if (code === "auth/invalid-phone-number" || serverMsg.includes("INVALID_PHONE_NUMBER")) return "รูปแบบเบอร์ไม่ถูกต้อง (เช่น +66912345678)"
    if (code === "auth/too-many-requests" || serverMsg.includes("QUOTA_EXCEEDED")) return "ขอรหัสบ่อยเกินไป ระบบขอให้รอสักครู่ก่อนส่งใหม่"
    if (code === "auth/credential-already-in-use" || code === "auth/phone-number-already-exists") return "เบอร์นี้ถูกใช้งานกับบัญชีอื่นแล้ว"
    if (serverMsg.includes("RECAPTCHA") || code.includes("recaptcha")) return "reCAPTCHA ไม่ผ่าน ตรวจสอบโดเมน/การตั้งค่าใน Firebase หรือปิด Ad-block แล้วลองใหม่"
    if (code === "auth/network-request-failed") return "เครือข่ายมีปัญหา กรุณาลองใหม่"
    if (code === "auth/app-not-authorized" || code === "auth/invalid-api-key") return "การตั้งค่า API Key/แอปไม่ถูกต้อง ตรวจสอบ Firebase config และ Authorized domains"
    if (code === "auth/internal-error") return "reCAPTCHA ไม่พร้อมใช้งานหรือตัวตรวจสอบถูกทำลาย สร้างใหม่แล้วลองอีกครั้ง"
    return "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง"
  }

  // ---------------- timer ----------------
  useEffect(() => {
    if (!isOpen) return
    const id = window.setInterval(() => setNowTs(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [isOpen])

  const tickCooldown = (nextAt: number) => {
    if (cooldownTimerRef.current) window.clearInterval(cooldownTimerRef.current)
    const update = () => {
      const left = Math.max(0, Math.ceil((nextAt - Date.now()) / 1000))
      setCooldownLeft(left)
      if (left === 0 && cooldownTimerRef.current) {
        window.clearInterval(cooldownTimerRef.current)
        cooldownTimerRef.current = null
      }
    }
    update()
    cooldownTimerRef.current = window.setInterval(update, 1000) as unknown as number
  }
  const startCooldown = (ms: number) => {
    const next = Date.now() + ms
    localStorage.setItem(cooldownKey, String(next))
    localStorage.setItem(lastSentKey, String(Date.now()))
    tickCooldown(next)
  }

  // ---------------- load profile ----------------
  useEffect(() => {
    if (!isOpen) return
    if (!uid) { setError("ไม่พบผู้ใช้ที่เข้าสู่ระบบ"); return }

    let cancelled = false
    ;(async () => {
      try {
        setLoading(true); setError(null)
        const snap = await getDocument("users", uid)
        const data = snap?.data?.() ?? {}
        const name = data?.name ?? user?.displayName ?? ""
        const email = data?.email ?? user?.email ?? ""
        const photoURL = data?.photoURL ?? user?.photoURL ?? ""
        const phoneNumber = data?.phoneNumber ?? user?.phoneNumber ?? ""
        const pv = data?.phoneVerified ?? Boolean(phoneNumber)

        setForm({ name, email, photoURL })
        setPhone(phoneNumber || "")
        setVerifiedPhone(phoneNumber || "")
        setPhoneVerified(Boolean(pv))
        setMode(phoneNumber ? "update" : "link")
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "โหลดโปรไฟล์ไม่สำเร็จ")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    const saved = Number(localStorage.getItem(cooldownKey) || 0)
    if (saved > Date.now()) tickCooldown(saved)

    return () => {
      cancelled = true
      setOtp(""); setOtpSent(false)
      if (cooldownTimerRef.current) window.clearInterval(cooldownTimerRef.current)
      confirmationResultRef.current = null
      verificationIdRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, uid])

  // ---------------- reCAPTCHA: always build fresh, render once ----------------
  const ensureRecaptcha = async (attempt = 1): Promise<RecaptchaVerifier> => {
    try { await globalRecaptcha?.clear?.() } catch {}
    globalRecaptcha = null

    if (globalRecaptchaInitPromise) return globalRecaptchaInitPromise

    const auth = getAuthInstance()
    if (!auth?.currentUser) throw new Error("ยังไม่ได้เข้าสู่ระบบ")

    const root = getRootEl()
    if (!root) throw new Error('ไม่พบ reCAPTCHA root ใน DOM (layout.tsx ต้องมี <div id="recaptcha-container-root" />)')

    setRecaptchaReady(false)
    setRecaptchaStatus("preparing")
    resetAllRecaptchaWidgets()
    cleanupRecaptchaRoot()
    const slot = createFreshSlot()

    globalRecaptchaInitPromise = (async () => {
      let verifier: RecaptchaVerifier
      try {
        // Firebase v10
        // @ts-ignore
        verifier = new RecaptchaVerifier(auth, slot, { size: "invisible" })
      } catch {
        // Firebase v9
        // @ts-ignore
        verifier = new RecaptchaVerifier(slot, { size: "invisible" }, auth)
      }

      try {
        await verifier.render()
        globalRecaptcha = verifier
        setRecaptchaStatus("ready")
        setRecaptchaReady(true)
        return verifier
      } catch (err) {
        try { verifier.clear() } catch {}
        resetAllRecaptchaWidgets()
        cleanupRecaptchaRoot()
        if (attempt < 3) {
          await sleep(250 * attempt * attempt)
          globalRecaptchaInitPromise = null
          return ensureRecaptcha(attempt + 1)
        }
        setRecaptchaStatus("error")
        throw err
      } finally {
        globalRecaptchaInitPromise = null
      }
    })()

    return globalRecaptchaInitPromise
  }

  useEffect(() => {
    if (!isOpen || !uid) return
    const id = window.setTimeout(() => {
      ensureRecaptcha().catch(() => setRecaptchaReady(false))
    }, 0)
    return () => window.clearTimeout(id)
  }, [isOpen, uid])

  const repairRecaptcha = async () => {
    try { await globalRecaptcha?.clear?.() } catch {}
    globalRecaptcha = null
    globalRecaptchaInitPromise = null
    setRecaptchaReady(false)
    setRecaptchaStatus("idle")
    resetAllRecaptchaWidgets()
    cleanupRecaptchaRoot()
    await sleep(100)
    try { await ensureRecaptcha() } catch (e) { setError(explainFirebaseError(e)) }
  }

  // -------------------- เช็คเบอร์ซ้ำใน Firestore --------------------
  const isPhoneTakenByOther = async (e164: string): Promise<boolean> => {
    try {
      const { where, limit } = await import("firebase/firestore")
      const docs = await getDocuments("users", where("phoneNumber", "==", e164), limit(1))
      if (docs.length === 0) return false
      const doc = docs[0]
      return doc.id !== uid
    } catch (e) {
      console.warn("Check phone unique failed:", e)
      return false
    }
  }

  // ---------------- Save profile ----------------
  const handleSaveProfile = async () => {
    if (!uid) return
    if (!form.name.trim()) { setError("กรุณากรอกชื่อ"); return }
    setSaving(true); setError(null)
    try {
      const { serverTimestamp } = await import("firebase/firestore")
      await setDocument("users", uid, {
        uid,
        name: form.name.trim(),
        email: form.email || user?.email || null,
        photoURL: form.photoURL || null,
        phoneNumber: verifiedPhone || null,
        phoneVerified: phoneVerified,
        updatedAt: serverTimestamp(),
      })
      try { await updateProfile(user!, { displayName: form.name.trim(), photoURL: form.photoURL || null }) } catch {}
      toast({ title: "บันทึกโปรไฟล์สำเร็จ" })
      onClose()
    } catch (e: any) {
      setError(e?.message ?? "บันทึกไม่สำเร็จ")
    } finally {
      setSaving(false)
    }
  }

  // ---------------- Send OTP ----------------
  const handleSendOtp = async () => {
    setError(null); setOtp("")
    const nextAllowed = Number(localStorage.getItem(cooldownKey) || 0)
    if (nextAllowed > Date.now()) { tickCooldown(nextAllowed); return }

    try {
      const auth = getAuthInstance()
      if (!auth.currentUser) throw new Error("ยังไม่ได้เข้าสู่ระบบ")

      const e164 = normalizePhoneNumber(phone)
      if (!/^\+\d{8,15}$/.test(e164)) { setError("รูปแบบเบอร์ไม่ถูกต้อง (เช่น +66912345678)"); return }

      // เช็คความซ้ำก่อนส่ง
      if (await isPhoneTakenByOther(e164)) {
        setError("เบอร์นี้ถูกใช้งานกับบัญชีอื่นแล้ว")
        toast({ title: "ส่งรหัสไม่สำเร็จ", description: "เบอร์นี้ถูกใช้งานกับบัญชีอื่นแล้ว", variant: "destructive" })
        return
      }

      // สร้าง reCAPTCHA พร้อมใช้งาน
      const verifier = await ensureRecaptcha()

      setSending(true)

      if (verifiedPhone) {
        const provider = new PhoneAuthProvider(auth)
        verificationIdRef.current = await provider.verifyPhoneNumber(e164, verifier)
        setMode("update")
      } else {
        confirmationResultRef.current = await linkWithPhoneNumber(auth.currentUser, e164, verifier)
        setMode("link")
      }

      setOtpSent(true)
      startCooldown(OTP_COOLDOWN_MS)
      if (e164 !== normalizePhoneNumber(verifiedPhone)) setPhoneVerified(false)
      toast({ title: "ส่งรหัสยืนยันแล้ว", description: "กรุณากรอก OTP ที่ได้รับ" })
    } catch (e: any) {
      const msg = explainFirebaseError(e)
      setError(msg)
      if (e?.code === "auth/too-many-requests") startCooldown(THROTTLE_PENALTY_MS)
    } finally {
      setSending(false)
    }
  }

  // ---------------- Confirm OTP ----------------
  const handleConfirmOtp = async () => {
    if (!uid) return
    setVerifying(true); setError(null)
    try {
      const auth = getAuthInstance()
      if (!auth.currentUser) throw new Error("ยังไม่ได้เข้าสู่ระบบ")

      const e164 = normalizePhoneNumber(phone)
      if (await isPhoneTakenByOther(e164)) {
        setError("เบอร์นี้ถูกใช้งานกับบัญชีอื่นแล้ว")
        return
      }

      if (mode === "link" && confirmationResultRef.current) {
        await confirmationResultRef.current.confirm(otp)
      } else if (mode === "update" && verificationIdRef.current) {
        const credential = PhoneAuthProvider.credential(verificationIdRef.current, otp)
        await updatePhoneNumber(auth.currentUser, credential)
      } else {
        throw new Error("ไม่มีข้อมูลการยืนยันที่ถูกต้อง")
      }

      await auth.currentUser.reload()
      const latest = auth.currentUser.phoneNumber ?? e164

      const { serverTimestamp } = await import("firebase/firestore")
      await setDocument("users", uid, { phoneNumber: latest, phoneVerified: true, updatedAt: serverTimestamp() })

      setVerifiedPhone(latest)
      setPhone(latest)
      setPhoneVerified(true)

      setOtpSent(false); setOtp("")
      toast({ title: "ยืนยันเบอร์สำเร็จ" })
    } catch (e: any) {
      const msg = explainFirebaseError(e)
      setError(msg)
    } finally {
      setVerifying(false)
    }
  }

  const nowLabel = fmtDateTime(nowTs)
  const nextAllowedAt = Number(localStorage.getItem(cooldownKey) || 0)
  const nextAllowedLabel = nextAllowedAt > nowTs ? fmtTime(nextAllowedAt) : null

  const isCurrentInputVerified =
    phoneVerified && verifiedPhone && normalizePhoneNumber(phone) === normalizePhoneNumber(verifiedPhone)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] max-w-[500px] max-h-[95vh] overflow-y-auto bg-white">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-lg sm:text-xl md:text-2xl font-bold text-center">โปรไฟล์</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm md:text-base text-center text-gray-600">
            ดูและแก้ไขข้อมูลบัญชีของคุณ
          </DialogDescription>
          <div className="text-center text-xs text-gray-500">เวลาในระบบ: {nowLabel} (ICT)</div>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="py-2">
            <AlertDescription className="text-xs sm:text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            <span className="ml-2 text-sm text-gray-500">กำลังโหลด...</span>
          </div>
        ) : (
          <form onSubmit={(e) => e.preventDefault()} noValidate className="space-y-4">
            {/* Avatar */}
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={form.photoURL} alt={form.name} />
                <AvatarFallback className="bg-blue-100 text-blue-700">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <div className="text-sm font-medium text-gray-900">{form.name || "—"}</div>
                <div className="text-xs text-gray-500">{form.email || "—"}</div>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-1">
              <Label htmlFor="name" className="text-xs sm:text-sm font-medium">ชื่อที่แสดง</Label>
              <div className="relative">
                <UserIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input id="name" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} className="pl-8" placeholder="เช่น Napat R." />
              </div>
            </div>

            {/* Email (read-only) */}
            <div className="space-y-1">
              <Label htmlFor="email" className="text-xs sm:text-sm font-medium">อีเมล (อ่านอย่างเดียว)</Label>
              <div className="relative">
                <Mail className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input id="email" value={form.email} disabled className="pl-8 bg-gray-50" />
              </div>
            </div>

            {/* Photo URL */}
            <div className="space-y-1">
              <Label htmlFor="photoURL" className="text-xs sm:text-sm font-medium">รูปโปรไฟล์ (URL)</Label>
              <div className="relative">
                <ImageIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input id="photoURL" value={form.photoURL} onChange={(e) => setForm(p => ({ ...p, photoURL: e.target.value }))} className="pl-8" placeholder="https://…" />
              </div>
            </div>

            {/* Phone verify */}
            <div className="space-y-2 p-3 border rounded-lg">
              <div className="flex items-center justify-between">
                <Label htmlFor="phone" className="text-xs sm:text-sm font-medium flex items-center gap-2">
                  <PhoneIcon className="h-4 w-4" />
                  เบอร์โทร ({verifiedPhone ? "เปลี่ยนเบอร์" : "เพิ่ม/ยืนยัน"})
                </Label>
                <div className="flex items-center gap-2">
                  {isCurrentInputVerified ? (
                    <span className="inline-flex items-center text-[11px] text-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      ยืนยันแล้ว
                    </span>
                  ) : verifiedPhone ? (
                    <span className="text-[11px] text-amber-600">กำลังเปลี่ยนเบอร์ – ต้องยืนยัน</span>
                  ) : (
                    <span className="text-[11px] text-gray-500">ยังไม่ยืนยัน</span>
                  )}
                  <span className="text-[11px] text-gray-500">
                    {recaptchaStatus === "preparing" && "กำลังเตรียม reCAPTCHA…"}
                    {recaptchaStatus === "ready" && "reCAPTCHA พร้อม"}
                    {recaptchaStatus === "error" && "reCAPTCHA มีปัญหา"}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="เช่น +66912345678 หรือ 0912345678"
                />
                <Button
                  type="button"
                  onClick={handleSendOtp}
                  variant="secondary"
                  disabled={!recaptchaReady || sending || verifying || cooldownLeft > 0}
                >
                  {!recaptchaReady || sending ? (
                    <><Loader2 className="h-4 w-4 mr-1 animate-spin" />{sending ? "กำลังส่ง..." : "กำลังเตรียม…"}</>
                  ) : cooldownLeft > 0 ? (
                    <>ส่งใหม่ใน {cooldownLeft}s</>
                  ) : (
                    <><Send className="h-4 w-4 mr-1" />ส่งรหัส</>
                  )}
                </Button>
                <Button type="button" variant="ghost" onClick={repairRecaptcha} title="ซ่อม reCAPTCHA">
                  <RotateCw className="h-4 w-4" />
                </Button>
              </div>

              {otpSent && (
                <div className="flex gap-2">
                  <Input id="otp" type="text" inputMode="numeric" pattern="\d*" autoComplete="one-time-code" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="กรอกรหัส OTP" />
                  <Button type="button" onClick={handleConfirmOtp} disabled={verifying} className="bg-blue-600 hover:bg-blue-700">
                    {verifying ? (<><Loader2 className="h-4 w-4 mr-1 animate-spin" />กำลังยืนยัน</>) : (<><CheckCheck className="h-4 w-4 mr-1" />ยืนยัน</>)}
                  </Button>
                </div>
              )}
            </div>

            {/* UID */}
            <div className="space-y-1">
              <Label htmlFor="uid" className="text-xs sm:text-sm font-medium">UID</Label>
              <div className="relative">
                <IdCard className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input id="uid" value={uid ?? ""} disabled className="pl-8 bg-gray-50" />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={onClose} className="text-gray-600">
                <X className="h-4 w-4 mr-1" />ยกเลิก
              </Button>
              <Button type="button" onClick={handleSaveProfile} className="bg-blue-600 hover:bg-blue-700" disabled={saving}>
                {saving ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />กำลังบันทึก...</>) : (<><Save className="h-4 w-4 mr-2" />บันทึก</>)}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
