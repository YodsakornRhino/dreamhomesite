"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertCircle, ArrowRight, CheckCircle2, ClipboardList, FileText, NotebookPen } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuthContext } from "@/contexts/AuthContext"
import { subscribeToDocument } from "@/lib/firestore"

interface DocumentItem {
  id: string
  name: string
  description: string
}

const REQUIRED_DOCUMENTS: DocumentItem[] = [
  {
    id: "buyer-id-card",
    name: "สำเนาบัตรประชาชนผู้ซื้อ",
    description: "ถ่ายสำเนาบัตรประชาชนของผู้ซื้อพร้อมลงลายมือชื่อรับรองสำเนาถูกต้อง",
  },
  {
    id: "house-registration",
    name: "สำเนาทะเบียนบ้าน",
    description: "ทะเบียนบ้านปัจจุบันของผู้ซื้อหรือคู่สมรส (ถ้ามี)",
  },
  {
    id: "financial-statement",
    name: "เอกสารแสดงรายได้",
    description: "สลิปเงินเดือนหรือหนังสือรับรองรายได้ย้อนหลังอย่างน้อย 3 เดือน",
  },
  {
    id: "bank-statement",
    name: "รายการเดินบัญชี",
    description: "Statement บัญชีเงินฝากย้อนหลัง 6 เดือนเพื่อประกอบการพิจารณาสินเชื่อ",
  },
]

const OPTIONAL_DOCUMENTS: DocumentItem[] = [
  {
    id: "marriage-certificate",
    name: "สำเนาทะเบียนสมรสหรือใบหย่า",
    description: "กรณีสมรสหรือหย่าจำเป็นต้องแสดงความยินยอมจากคู่สมรส",
  },
  {
    id: "other-income",
    name: "เอกสารรายได้เพิ่มเติม",
    description: "เช่น สัญญาเช่า หรือเอกสารยืนยันรายได้อื่น ๆ ที่ช่วยเพิ่มความน่าเชื่อถือ",
  },
]

export default function BuyerSendDocumentsPage() {
  const searchParams = useSearchParams()
  const propertyId = searchParams.get("propertyId")
  const router = useRouter()
  const { user, loading } = useAuthContext()

  const [sellerConfirmed, setSellerConfirmed] = useState(false)
  const [modalDismissed, setModalDismissed] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  const progressPreview = useMemo(() => {
    return `${REQUIRED_DOCUMENTS.length} เอกสารหลัก + ${OPTIONAL_DOCUMENTS.length} เอกสารเพิ่มเติม`
  }, [])

  useEffect(() => {
    if (!propertyId) {
      setSellerConfirmed(false)
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
          setSellerConfirmed(confirmed)
        })
      } catch (error) {
        console.error("Failed to subscribe buyer send documents", error)
      }
    })()

    return () => {
      isMounted = false
      unsubscribe?.()
    }
  }, [propertyId])

  useEffect(() => {
    if (sellerConfirmed && !modalDismissed) {
      setModalOpen(true)
    }
  }, [sellerConfirmed, modalDismissed])

  const handleCloseModal = (open: boolean) => {
    setModalOpen(open)
    if (!open) {
      setModalDismissed(true)
    }
  }

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/")
    }
  }, [loading, router, user])

  return (
    <>
      <Dialog open={modalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ผู้ขายยืนยันเอกสารเรียบร้อยแล้ว
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              นัดหมายส่งมอบเอกสารตัวจริงกับผู้ขายผ่านแชทหรือโทรศัพท์ เพื่อดำเนินการขั้นตอนต่อไปกับทีมงาน DreamHome
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end">
            <Button onClick={() => handleCloseModal(false)} className="bg-blue-600 text-white hover:bg-blue-700">
              รับทราบ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="min-h-[70vh] bg-gray-50 py-10">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                  <ClipboardList className="h-4 w-4" />
                  ขั้นตอนของผู้ซื้อ
                </div>
                <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
                  รายการเอกสารที่ต้องเตรียมก่อนส่งให้ทีมงาน
                </h1>
                <p className="max-w-2xl text-sm text-gray-600 sm:text-base">
                  ทบทวนรายการเอกสารที่จำเป็นทั้งหมดเพื่อเตรียมพร้อมก่อนนัดส่งกับผู้ขาย เมื่อผู้ขายตรวจสอบรายการครบถ้วนแล้ว คุณจะได้รับแจ้งเตือนให้ส่งเอกสารตัวจริงแบบตัวต่อตัว
                </p>
                {propertyId && (
                  <div className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-xs font-medium text-slate-600">
                    <NotebookPen className="h-4 w-4 text-blue-500" />
                    รหัสประกาศ
                    <span className="font-semibold text-slate-900">{propertyId}</span>
                  </div>
                )}
                {sellerConfirmed && (
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" />
                      ผู้ขายพร้อมรับเอกสารตัวจริงแล้ว
                    </div>
                    <Button
                      asChild
                      size="sm"
                      className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      <Link
                        href={
                          propertyId
                            ? `/buy/home-inspection?propertyId=${propertyId}`
                            : "/buy/home-inspection"
                        }
                      >
                        ไปหน้าตรวจรับบ้านจริง
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-start gap-2 rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
                <div className="flex items-center gap-2 font-semibold">
                  <FileText className="h-5 w-5" />
                  เอกสารที่ต้องเตรียม
                </div>
                <p>{progressPreview}</p>
                <p className="text-xs text-blue-600/80">เตรียมสำเนาและตัวจริงให้ครบทุกชุด</p>
              </div>
            </div>
          </div>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <FileText className="h-5 w-5 text-blue-500" />
                เอกสารที่ต้องเตรียม (บังคับ)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {REQUIRED_DOCUMENTS.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <div className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-gray-900">{doc.name}</p>
                    <p className="text-sm text-gray-600">{doc.description}</p>
                  </div>
                </div>
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
                <div
                  key={doc.id}
                  className="flex items-start gap-4 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/60 p-4"
                >
                  <div className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-emerald-700">{doc.name}</p>
                    <p className="text-sm text-emerald-700/80">{doc.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-none bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                คำแนะนำก่อนส่งเอกสาร
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-600">
              <p>• เตรียมเอกสารตัวจริงทุกชุดเพื่อให้ผู้ขายตรวจสอบก่อนส่งต่อให้ทีมงาน DreamHome</p>
              <p>• ถ่ายสำเนาและลงลายมือชื่อรับรองสำเนาถูกต้องทุกหน้า</p>
              <p>• เก็บหลักฐานการส่งมอบและนัดหมายเวลาร่วมกับผู้ขายผ่านระบบแชท</p>
            </CardContent>
          </Card>

          <div className="flex flex-col items-start justify-between gap-4 rounded-3xl bg-white p-6 shadow-sm sm:flex-row sm:items-center">
            <div className="space-y-1 text-sm text-gray-600">
              <p className="font-semibold text-gray-900">เมื่อเตรียมเอกสารครบถ้วน</p>
              <p>
                ติดต่อผู้ขายเพื่อกำหนดวันเวลาในการส่งมอบเอกสารตัวจริง ทีมงาน DreamHome จะช่วยดูแลขั้นตอนถัดไปให้จนเสร็จสิ้น
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild variant="outline">
                <Link href="/buy">ย้อนกลับไปดูประกาศอื่น</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
