"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle2, ClipboardList, FileText, NotebookPen } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuthContext } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { subscribeToDocument, updateDocument } from "@/lib/firestore"
import { cancelPropertyPurchase } from "@/lib/property-purchase"

interface DocumentItem {
  id: string
  name: string
  description: string
}

const REQUIRED_DOCUMENTS: DocumentItem[] = [
  {
    id: "purchase-agreement",
    name: "สัญญาจะซื้อจะขาย",
    description: "ตรวจสอบรายละเอียดสัญญาและให้ทั้งสองฝ่ายลงนามครบถ้วน",
  },
  {
    id: "ownership-proof",
    name: "เอกสารสิทธิ์/โฉนด",
    description: "ยืนยันความถูกต้องของเอกสารสิทธิ์และแนบสำเนาที่ลงนามเรียบร้อย",
  },
  {
    id: "seller-id-card",
    name: "สำเนาบัตรประชาชนผู้ขาย",
    description: "เตรียมสำเนาบัตรประชาชนพร้อมลงลายมือชื่อรับรองสำเนาถูกต้องทุกหน้า",
  },
  {
    id: "tax-documents",
    name: "เอกสารภาษีและค่าธรรมเนียม",
    description: "รวบรวมเอกสารภาษีที่เกี่ยวข้อง เช่น ภาษีที่ดิน ภาษีธุรกิจเฉพาะ หรือภาษีเงินได้",
  },
]

const OPTIONAL_DOCUMENTS: DocumentItem[] = [
  {
    id: "power-of-attorney",
    name: "หนังสือมอบอำนาจ (ถ้ามี)",
    description: "กรณีมอบหมายตัวแทนไปดำเนินการแทน ต้องมีหนังสือมอบอำนาจพร้อมพยาน",
  },
  {
    id: "additional-attachments",
    name: "เอกสารประกอบเพิ่มเติม",
    description: "เอกสารอื่น ๆ ที่ทีมงานหรือผู้ซื้อร้องขอเพิ่มเติมสำหรับการพิจารณา",
  },
]

const allDocuments = [...REQUIRED_DOCUMENTS, ...OPTIONAL_DOCUMENTS]

export default function SellerSendDocumentsPage() {
  const searchParams = useSearchParams()
  const propertyId = searchParams.get("propertyId")
  const router = useRouter()
  const { user, loading } = useAuthContext()
  const { toast } = useToast()

  const [checkedState, setCheckedState] = useState<Record<string, boolean>>(() => {
    return allDocuments.reduce<Record<string, boolean>>((acc, doc) => {
      acc[doc.id] = false
      return acc
    }, {})
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [remoteConfirmed, setRemoteConfirmed] = useState(false)
  const [buyerUid, setBuyerUid] = useState<string | null>(null)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [propertyTitle, setPropertyTitle] = useState<string | null>(null)
  const [isUnderPurchase, setIsUnderPurchase] = useState(false)

  const requiredCompletedCount = useMemo(
    () => REQUIRED_DOCUMENTS.filter((doc) => checkedState[doc.id]).length,
    [checkedState],
  )
  const optionalCompletedCount = useMemo(
    () => OPTIONAL_DOCUMENTS.filter((doc) => checkedState[doc.id]).length,
    [checkedState],
  )

  const requiredTotal = REQUIRED_DOCUMENTS.length
  const progress = requiredTotal > 0 ? Math.round((requiredCompletedCount / requiredTotal) * 100) : 0
  const allRequiredCompleted = requiredCompletedCount === requiredTotal

  useEffect(() => {
    if (!propertyId) {
      setRemoteConfirmed(false)
      return
    }

    let isMounted = true
    let unsubscribe: (() => void) | undefined

    void (async () => {
      try {
        unsubscribe = await subscribeToDocument("property", propertyId, (doc) => {
          if (!isMounted) return
          const data = (doc?.data() as Record<string, unknown> | null) ?? null
          const confirmed = Boolean(data?.sellerDocumentsConfirmed)
          const buyerId =
            typeof data?.confirmedBuyerId === "string" && data.confirmedBuyerId.trim().length > 0
              ? (data.confirmedBuyerId as string)
              : null
          setBuyerUid(buyerId)
          setRemoteConfirmed((previous) => {
            if (confirmed && !previous) {
              setCheckedState((current) => {
                const next = { ...current }
                for (const docItem of REQUIRED_DOCUMENTS) {
                  next[docItem.id] = true
                }
                return next
              })
            } else if (!confirmed && previous) {
              setCheckedState((current) => {
                const next = { ...current }
                for (const docItem of allDocuments) {
                  next[docItem.id] = false
                }
                return next
              })
            }
            return confirmed
          })
          setPropertyTitle(
            typeof data?.title === "string" && data.title.trim().length > 0
              ? (data.title as string)
              : null,
          )
          setIsUnderPurchase(Boolean(data?.isUnderPurchase))
        })
      } catch (error) {
        console.error("Failed to subscribe seller send documents", error)
      }
    })()

    return () => {
      isMounted = false
      unsubscribe?.()
    }
  }, [propertyId])

  const handleToggle = (docId: string, checked: boolean) => {
    if (remoteConfirmed) return
    setCheckedState((current) => ({
      ...current,
      [docId]: checked,
    }))
  }

  const handleCompleteChecklist = async () => {
    if (remoteConfirmed) {
      toast({
        title: "ยืนยันเรียบร้อยแล้ว",
        description: "คุณได้ยืนยันการตรวจสอบเอกสารสำหรับประกาศนี้แล้ว",
      })
      return
    }

    if (!user?.uid) {
      toast({
        variant: "destructive",
        title: "ไม่สามารถยืนยันได้",
        description: "กรุณาเข้าสู่ระบบในฐานะผู้ขาย",
      })
      return
    }

    if (!propertyId) {
      toast({
        variant: "destructive",
        title: "ไม่พบประกาศ",
        description: "กรุณาเปิดหน้าจากแชทของประกาศอีกครั้ง",
      })
      return
    }

    if (!allRequiredCompleted) {
      toast({
        variant: "destructive",
        title: "ตรวจสอบเอกสารไม่ครบ",
        description: "กรุณาตรวจสอบและติ๊กเอกสารบังคับให้ครบก่อนยืนยัน",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const updates: Promise<void>[] = [
        updateDocument("property", propertyId, {
          sellerDocumentsConfirmed: true,
        }),
        updateDocument(`users/${user.uid}/user_property`, propertyId, {
          sellerDocumentsConfirmed: true,
        }),
      ]

      if (buyerUid) {
        updates.push(
          updateDocument(`users/${buyerUid}/buyer_properties`, propertyId, {
            sellerDocumentsConfirmed: true,
          }),
        )
      }

      await Promise.all(updates)

      setRemoteConfirmed(true)
      toast({
        title: "บันทึกความคืบหน้าเรียบร้อย",
        description: "แจ้งผู้ซื้อให้เตรียมส่งเอกสารตัวจริงได้ทันที",
      })
    } catch (error) {
      console.error("Failed to confirm seller checklist", error)
      toast({
        variant: "destructive",
        title: "ยืนยันไม่สำเร็จ",
        description: error instanceof Error ? error.message : "กรุณาลองใหม่อีกครั้ง",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelPurchase = async () => {
    if (!propertyId) {
      toast({
        variant: "destructive",
        title: "ไม่พบประกาศ",
        description: "กรุณาเปิดหน้าจากแชทของประกาศอีกครั้ง",
      })
      return
    }

    if (!user?.uid) {
      toast({
        variant: "destructive",
        title: "ไม่สามารถยกเลิกได้",
        description: "กรุณาเข้าสู่ระบบในฐานะผู้ขาย",
      })
      return
    }

    if (!buyerUid) {
      toast({
        variant: "destructive",
        title: "ยังไม่มีผู้ซื้อ",
        description: "ประกาศนี้ยังไม่มีผู้ซื้อที่ยืนยันไว้",
      })
      return
    }

    setCancelling(true)
    try {
      await cancelPropertyPurchase(propertyId, "seller")
      toast({
        title: "ยกเลิกการซื้อเรียบร้อย",
        description: propertyTitle
          ? `ระบบคืนสถานะประกาศ ${propertyTitle} แล้ว`
          : "ระบบคืนสถานะประกาศเรียบร้อย",
      })
      setCancelDialogOpen(false)
    } catch (error) {
      console.error("Failed to cancel property purchase as seller", error)
      toast({
        variant: "destructive",
        title: "ยกเลิกไม่สำเร็จ",
        description: error instanceof Error ? error.message : "กรุณาลองใหม่อีกครั้ง",
      })
    } finally {
      setCancelling(false)
    }
  }

  const handleGoToHandover = () => {
    if (!remoteConfirmed) {
      toast({
        variant: "destructive",
        title: "กรุณายืนยันการตรวจสอบเอกสารก่อน",
        description: "กรุณาตรวจสอบและยืนยันเอกสารบังคับให้ครบ เพื่อปลดล็อกขั้นตอนกำหนดวันส่งมอบบ้าน",
      })
      return
    }

    const targetPath = propertyId
      ? `/sell/home-inspection?propertyId=${propertyId}`
      : "/sell/home-inspection"

    router.push(targetPath)
  }

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/")
    }
  }, [loading, router, user])

  return (
    <div className="min-h-[70vh] bg-gray-50 py-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold text-slate-900">ยกเลิกรายการซื้อสำหรับผู้ซื้อนี้</DialogTitle>
              <DialogDescription className="text-sm text-slate-600">
                ระบบจะลบข้อมูลการตรวจและแจ้งเตือนทั้งหมด เพื่อให้คุณรอผู้ซื้อรายถัดไปได้ทันที
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setCancelDialogOpen(false)} disabled={cancelling}>
                กลับไปก่อน
              </Button>
              <Button
                onClick={handleCancelPurchase}
                disabled={cancelling}
                className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
              >
                {cancelling ? "กำลังยกเลิก..." : "ยืนยันการยกเลิก"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                <ClipboardList className="h-4 w-4" />
                ขั้นตอนของผู้ขาย
              </div>
              <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
                ตรวจสอบเอกสารก่อนนัดส่งตัวจริงให้ผู้ซื้อ
              </h1>
              <p className="max-w-2xl text-sm text-gray-600 sm:text-base">
                เช็กเอกสารสำคัญที่ต้องเตรียมให้ครบถ้วนเพื่อให้ทีมงานและผู้ซื้อมั่นใจ เมื่อยืนยันแล้วระบบจะส่งการแจ้งเตือนไปหาผู้ซื้อทันที
              </p>
              {propertyId && (
                <div className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-xs font-medium text-slate-600">
                  <NotebookPen className="h-4 w-4 text-violet-500" />
                  รหัสประกาศ
                  <span className="font-semibold text-slate-900">{propertyId}</span>
                </div>
              )}
              {remoteConfirmed && (
                <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                  คุณได้ยืนยันการตรวจสอบเอกสารแล้ว
                </div>
              )}
              {buyerUid && isUnderPurchase && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCancelDialogOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50"
                >
                  ยกเลิกรายการซื้อ
                </Button>
              )}
            </div>
            <div className="flex flex-col items-start gap-2 rounded-2xl bg-violet-50 px-4 py-3 text-sm text-violet-700">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="h-5 w-5" />
                ความคืบหน้าเอกสาร
              </div>
              <p>
                {requiredCompletedCount} / {requiredTotal} เอกสารบังคับตรวจสอบแล้ว
              </p>
              <p className="text-xs text-violet-600/80">
                เอกสารเพิ่มเติมตรวจสอบแล้ว {optionalCompletedCount} รายการ
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>เปอร์เซ็นต์ความพร้อม</span>
              <span className="font-semibold text-gray-900">{progress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-200">
              <div
                className="h-2 rounded-full bg-violet-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <FileText className="h-5 w-5 text-violet-500" />
              เอกสารที่ต้องตรวจสอบ (บังคับ)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {REQUIRED_DOCUMENTS.map((doc) => (
              <label
                key={doc.id}
                htmlFor={doc.id}
                className="flex cursor-pointer items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-violet-400 hover:bg-violet-50/40"
              >
                <Checkbox
                  id={doc.id}
                  checked={checkedState[doc.id]}
                  onCheckedChange={(checked) => handleToggle(doc.id, checked === true)}
                  className="mt-1"
                  disabled={remoteConfirmed}
                />
                <div className="space-y-1">
                  <Label htmlFor={doc.id} className="text-base font-semibold text-gray-900">
                    {doc.name}
                  </Label>
                  <p className="text-sm text-gray-600">{doc.description}</p>
                </div>
              </label>
            ))}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <FileText className="h-5 w-5 text-emerald-500" />
              เอกสารเพิ่มเติม (ถ้ามี)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {OPTIONAL_DOCUMENTS.map((doc) => (
              <label
                key={doc.id}
                htmlFor={doc.id}
                className="flex cursor-pointer items-start gap-4 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/60 p-4 transition hover:border-emerald-400 hover:bg-emerald-50"
              >
                <Checkbox
                  id={doc.id}
                  checked={checkedState[doc.id]}
                  onCheckedChange={(checked) => handleToggle(doc.id, checked === true)}
                  className="mt-1"
                  disabled={remoteConfirmed}
                />
                <div className="space-y-1">
                  <Label htmlFor={doc.id} className="text-base font-semibold text-emerald-700">
                    {doc.name}
                  </Label>
                  <p className="text-sm text-emerald-700/80">{doc.description}</p>
                </div>
              </label>
            ))}
          </CardContent>
        </Card>

        <div className="flex flex-col items-start justify-between gap-4 rounded-3xl bg-white p-6 shadow-sm sm:flex-row sm:items-center">
          <div className="space-y-1 text-sm text-gray-600">
            <p className="font-semibold text-gray-900">เมื่อเอกสารบังคับครบถ้วนแล้ว</p>
            <p>กดยืนยันเพื่อแจ้งทีมงานและผู้ซื้อให้เตรียมนัดส่งเอกสารตัวจริง</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={handleCompleteChecklist}
              disabled={remoteConfirmed || !allRequiredCompleted || isSubmitting}
              className="bg-violet-600 text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-violet-300"
            >
              {remoteConfirmed ? "ยืนยันแล้ว" : "ยืนยันการตรวจสอบเอกสาร"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleGoToHandover}
              className="border-violet-200 text-violet-700 hover:bg-violet-50"
            >
              ไปขั้นตอนนัดหมายส่งมอบบ้าน
            </Button>
            {remoteConfirmed && propertyId && (
              <Link
                href={`/sell/home-inspection?propertyId=${propertyId}`}
                className="text-xs text-violet-600 underline"
              >
                แชร์ลิงก์ให้ผู้ซื้อร่วมตรวจบ้าน
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
