"use client"

import { useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle2, ClipboardList, FileText, NotebookPen } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

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

const allDocuments = [...REQUIRED_DOCUMENTS, ...OPTIONAL_DOCUMENTS]

export default function BuyerSendDocumentsPage() {
  const searchParams = useSearchParams()
  const propertyId = searchParams.get("propertyId")
  const { toast } = useToast()

  const [checkedState, setCheckedState] = useState<Record<string, boolean>>(() => {
    return allDocuments.reduce<Record<string, boolean>>((acc, doc) => {
      acc[doc.id] = false
      return acc
    }, {})
  })

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

  const handleToggle = (docId: string, checked: boolean) => {
    setCheckedState((current) => ({
      ...current,
      [docId]: checked,
    }))
  }

  const handleCompleteChecklist = () => {
    toast({
      title: "พร้อมส่งเอกสารแล้ว",
      description: "แจ้งผู้ขายผ่านแชทเพื่อเริ่มขั้นตอนส่งเอกสารได้เลย",
    })
  }

  return (
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
                เช็กลิสต์เอกสารสำหรับเตรียมส่งให้ทีมงาน
              </h1>
              <p className="max-w-2xl text-sm text-gray-600 sm:text-base">
                เลือกติ๊กเอกสารที่คุณเตรียมพร้อมแล้ว เพื่อให้ทั้งผู้ขายและทีมงานเห็นความคืบหน้าการซื้อแบบเรียลไทม์
                เมื่อครบถ้วนแล้วสามารถยืนยันเพื่อไปขั้นตอนถัดไปได้ทันที
              </p>
              {propertyId && (
                <div className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-xs font-medium text-slate-600">
                  <NotebookPen className="h-4 w-4 text-blue-500" />
                  รหัสประกาศ
                  <span className="font-semibold text-slate-900">{propertyId}</span>
                </div>
              )}
            </div>
            <div className="flex flex-col items-start gap-2 rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="h-5 w-5" />
                ความคืบหน้าเอกสาร
              </div>
              <p>
                {requiredCompletedCount} / {requiredTotal} เอกสารบังคับพร้อมแล้ว
              </p>
              <p className="text-xs text-blue-600/80">
                เอกสารเพิ่มเติมเตรียมแล้ว {optionalCompletedCount} รายการ
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
                className="h-2 rounded-full bg-blue-500 transition-all"
                style={{ width: `${progress}%` }}
              />
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
              <label
                key={doc.id}
                htmlFor={doc.id}
                className="flex cursor-pointer items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-blue-400 hover:bg-blue-50/40"
              >
                <Checkbox
                  id={doc.id}
                  checked={checkedState[doc.id]}
                  onCheckedChange={(checked) => handleToggle(doc.id, checked === true)}
                  className="mt-1"
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
            <p>แจ้งผู้ขายผ่านระบบแชทหรืออัปโหลดเอกสารผ่านช่องทางที่ทีมงานกำหนด</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild variant="outline">
              <Link href="/buy">ย้อนกลับไปดูประกาศอื่น</Link>
            </Button>
            <Button
              type="button"
              onClick={handleCompleteChecklist}
              disabled={!allRequiredCompleted}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              ยืนยันการเตรียมเอกสาร
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
