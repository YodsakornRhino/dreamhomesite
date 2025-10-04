"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { ChangeEvent } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { format, parseISO } from "date-fns"
import {
  AlertCircle,
  Bell,
  BellRing,
  Calendar as CalendarIcon,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Compass,
  Image as ImageIcon,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  Wrench,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useAuthContext } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import useNotificationSound from "@/hooks/use-notification-sound"
import { subscribeToDocument } from "@/lib/firestore"
import {
  attachInspectionIssuePhotos,
  createInspectionChecklistItem,
  createInspectionIssue,
  deleteInspectionChecklistItem,
  markInspectionNotificationsRead,
  remindInspectionIssue,
  subscribeToInspectionChecklist,
  subscribeToInspectionIssues,
  subscribeToInspectionState,
  subscribeToInspectionNotifications,
  updateInspectionChecklistItem,
  updateInspectionState,
} from "@/lib/home-inspection"
import { mapDocumentToUserProperty } from "@/lib/user-property-mapper"
import type { ChatOpenEventDetail } from "@/types/chat"
import type {
  HomeInspectionChecklistItem,
  HomeInspectionIssue,
  HomeInspectionNotification,
  HomeInspectionState,
} from "@/types/home-inspection"
import type { UserProperty } from "@/types/user-property"
import { markUserNotificationsReadByRelated } from "@/lib/notifications"
import { getDownloadURL, uploadFile } from "@/lib/storage"
import { sanitizeFileName } from "@/lib/utils"

const buyerStatusMeta: Record<
  HomeInspectionChecklistItem["buyerStatus"],
  { label: string; tone: string; description: string }
> = {
  pending: {
    label: "รอตรวจ",
    tone: "bg-slate-100 text-slate-700 border-slate-200",
    description: "ยังไม่ได้ตรวจหรือบันทึกผล",
  },
  accepted: {
    label: "ผ่าน",
    tone: "bg-emerald-100 text-emerald-700 border-emerald-200",
    description: "ยืนยันว่าเรียบร้อย",
  },
  "follow-up": {
    label: "ขอตรวจซ้ำ",
    tone: "bg-purple-100 text-purple-700 border-purple-200",
    description: "ต้องการให้ผู้ขายปรับปรุงเพิ่ม",
  },
}

const sellerStatusMeta: Record<
  HomeInspectionChecklistItem["sellerStatus"],
  { label: string; tone: string; description: string }
> = {
  scheduled: {
    label: "พร้อมให้ตรวจ",
    tone: "bg-blue-100 text-blue-700 border-blue-200",
    description: "ผู้ขายระบุว่าจะเตรียมรายการนี้ให้ตรวจได้",
  },
  fixing: {
    label: "ผู้ขายกำลังแก้",
    tone: "bg-amber-100 text-amber-700 border-amber-200",
    description: "อยู่ระหว่างปรับปรุงตามข้อสังเกต",
  },
  done: {
    label: "ผู้ขายยืนยันแล้ว",
    tone: "bg-emerald-100 text-emerald-700 border-emerald-200",
    description: "ผู้ขายระบุว่ารายการนี้พร้อมส่งมอบ",
  },
}

const issueStatusMeta: Record<
  HomeInspectionIssue["status"],
  { label: string; tone: string; description: string }
> = {
  pending: {
    label: "รอตรวจสอบ",
    tone: "bg-amber-100 text-amber-700 border-amber-200",
    description: "ผู้ขายยังไม่ได้ตอบรับงานแก้ไข",
  },
  "in-progress": {
    label: "ผู้ขายกำลังแก้",
    tone: "bg-blue-100 text-blue-700 border-blue-200",
    description: "ผู้ขายรับเรื่องแล้วและอยู่ระหว่างแก้ไข",
  },
  "buyer-review": {
    label: "รอตรวจซ้ำ",
    tone: "bg-purple-100 text-purple-700 border-purple-200",
    description: "ผู้ขายแจ้งว่าแก้แล้วและรอผู้ซื้อยืนยัน",
  },
  completed: {
    label: "แก้ไขเสร็จแล้ว",
    tone: "bg-emerald-100 text-emerald-700 border-emerald-200",
    description: "รายการนี้ถูกปิดงานเรียบร้อย",
  },
}

const notificationCategoryMeta: Record<
  HomeInspectionNotification["category"],
  { label: string; tone: string }
> = {
  general: {
    label: "ทั่วไป",
    tone: "bg-slate-100 text-slate-700 border-slate-200",
  },
  schedule: {
    label: "นัดหมาย",
    tone: "bg-indigo-100 text-indigo-700 border-indigo-200",
  },
  checklist: {
    label: "เช็คลิสต์",
    tone: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  issue: {
    label: "แจ้งซ่อม",
    tone: "bg-purple-100 text-purple-700 border-purple-200",
  },
  note: {
    label: "บันทึก",
    tone: "bg-amber-100 text-amber-700 border-amber-200",
  },
}

const defaultState: HomeInspectionState = {
  handoverDate: null,
  handoverNote: "",
  lastUpdatedAt: null,
  lastUpdatedBy: null,
}

const safeFormatDate = (value: string) => {
  try {
    return format(parseISO(value), "d MMM yyyy")
  } catch (error) {
    console.error("Failed to format date", error)
    return value
  }
}

const safeFormatDateTime = (value: string) => {
  try {
    return format(parseISO(value), "d MMM yyyy HH:mm")
  } catch (error) {
    console.error("Failed to format datetime", error)
    return value
  }
}

export default function BuyerHomeInspectionPage() {
  const searchParams = useSearchParams()
  const propertyId = searchParams.get("propertyId")
  const router = useRouter()
  const { user, loading: authLoading } = useAuthContext()
  const { toast } = useToast()

  const [property, setProperty] = useState<UserProperty | null>(null)
  const [propertyLoading, setPropertyLoading] = useState(true)
  const [inspectionState, setInspectionState] = useState<HomeInspectionState>(defaultState)
  const [stateLoading, setStateLoading] = useState(true)
  const [checklistItems, setChecklistItems] = useState<HomeInspectionChecklistItem[]>([])
  const [checklistLoading, setChecklistLoading] = useState(true)
  const [issues, setIssues] = useState<HomeInspectionIssue[]>([])
  const [issuesLoading, setIssuesLoading] = useState(true)

  const [activeTab, setActiveTab] = useState<string>("overview")
  const [handoverDateInput, setHandoverDateInput] = useState("")
  const [handoverNoteInput, setHandoverNoteInput] = useState("")
  const [savingSchedule, setSavingSchedule] = useState(false)

  const [newChecklistTitle, setNewChecklistTitle] = useState("")
  const [newChecklistDescription, setNewChecklistDescription] = useState("")
  const [addingChecklist, setAddingChecklist] = useState(false)

  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [reportTitle, setReportTitle] = useState("")
  const [reportDescription, setReportDescription] = useState("")
  const [reportLocation, setReportLocation] = useState("")
  const [reportExpectedDate, setReportExpectedDate] = useState("")
  const [creatingIssue, setCreatingIssue] = useState(false)
  const [reportBeforePhotos, setReportBeforePhotos] = useState<
    { file: File; preview: string }[]
  >([])
  const beforePhotoInputRef = useRef<HTMLInputElement | null>(null)

  const [notifications, setNotifications] = useState<HomeInspectionNotification[]>([])
  const [notificationsLoading, setNotificationsLoading] = useState(true)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [checklistItemToDelete, setChecklistItemToDelete] =
    useState<HomeInspectionChecklistItem | null>(null)
  const [deletingChecklist, setDeletingChecklist] = useState(false)
  const [issueReminderState, setIssueReminderState] = useState<Record<string, boolean>>({})
  const notificationIdsRef = useRef<Set<string>>(new Set())
  const notificationsPrimedRef = useRef(false)
  const playNotificationSound = useNotificationSound()

  useEffect(() => {
    notificationIdsRef.current = new Set()
    notificationsPrimedRef.current = false
  }, [propertyId])

  useEffect(() => {
    return () => {
      reportBeforePhotos.forEach((entry) => URL.revokeObjectURL(entry.preview))
    }
  }, [reportBeforePhotos])

  useEffect(() => {
    if (!reportDialogOpen) {
      setReportBeforePhotos((prev) => {
        prev.forEach((entry) => URL.revokeObjectURL(entry.preview))
        return []
      })
      if (beforePhotoInputRef.current) {
        beforePhotoInputRef.current.value = ""
      }
    }
  }, [reportDialogOpen])

  useEffect(() => {
    const handleOpenNotifications = () => setNotificationsOpen(true)

    window.addEventListener("dreamhome:open-inspection-notifications", handleOpenNotifications)

    return () => {
      window.removeEventListener(
        "dreamhome:open-inspection-notifications",
        handleOpenNotifications,
      )
    }
  }, [])

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/")
    }
  }, [authLoading, router, user])

  useEffect(() => {
    if (!propertyId) {
      setProperty(null)
      setPropertyLoading(false)
      return
    }

    let active = true
    let unsubscribe: (() => void) | undefined
    setPropertyLoading(true)

    void (async () => {
      try {
        unsubscribe = await subscribeToDocument("property", propertyId, (doc) => {
          if (!active) return
          setProperty(doc ? mapDocumentToUserProperty(doc) : null)
          setPropertyLoading(false)
        })
      } catch (error) {
        console.error("Failed to subscribe property", error)
        if (!active) return
        setProperty(null)
        setPropertyLoading(false)
        toast({
          variant: "destructive",
          title: "ไม่สามารถโหลดข้อมูลประกาศได้",
          description: "กรุณาลองรีเฟรชหน้าหรือกลับไปเลือกประกาศใหม่",
        })
      }
    })()

    return () => {
      active = false
      unsubscribe?.()
    }
  }, [propertyId, toast])

  useEffect(() => {
    if (!propertyId) {
      setInspectionState(defaultState)
      setStateLoading(false)
      return
    }

    let active = true
    let unsubscribe: (() => void) | undefined
    setStateLoading(true)

    void (async () => {
      try {
        unsubscribe = await subscribeToInspectionState(propertyId, (state) => {
          if (!active) return
          setInspectionState(state)
          setStateLoading(false)
        })
      } catch (error) {
        console.error("Failed to subscribe inspection state", error)
        if (!active) return
        setInspectionState(defaultState)
        setStateLoading(false)
        toast({
          variant: "destructive",
          title: "ไม่สามารถโหลดข้อมูลนัดหมายได้",
          description: "ตรวจสอบการเชื่อมต่อแล้วลองใหม่อีกครั้ง",
        })
      }
    })()

    return () => {
      active = false
      unsubscribe?.()
    }
  }, [propertyId, toast])

  useEffect(() => {
    if (!propertyId) {
      setChecklistItems([])
      setChecklistLoading(false)
      return
    }

    let active = true
    let unsubscribe: (() => void) | undefined
    setChecklistLoading(true)

    void (async () => {
      try {
        unsubscribe = await subscribeToInspectionChecklist(propertyId, (items) => {
          if (!active) return
          setChecklistItems(items)
          setChecklistLoading(false)
        })
      } catch (error) {
        console.error("Failed to subscribe checklist", error)
        if (!active) return
        setChecklistItems([])
        setChecklistLoading(false)
        toast({
          variant: "destructive",
          title: "ไม่สามารถโหลดเช็คลิสต์ได้",
          description: "ลองรีเฟรชหน้าเพื่อเชื่อมต่อใหม่",
        })
      }
    })()

    return () => {
      active = false
      unsubscribe?.()
    }
  }, [propertyId, toast])

  useEffect(() => {
    if (!propertyId) {
      setIssues([])
      setIssuesLoading(false)
      return
    }

    let active = true
    let unsubscribe: (() => void) | undefined
    setIssuesLoading(true)

    void (async () => {
      try {
        unsubscribe = await subscribeToInspectionIssues(propertyId, (items) => {
          if (!active) return
          setIssues(items)
          setIssuesLoading(false)
        })
      } catch (error) {
        console.error("Failed to subscribe issues", error)
        if (!active) return
        setIssues([])
        setIssuesLoading(false)
        toast({
          variant: "destructive",
          title: "ไม่สามารถโหลดรายการแจ้งซ่อมได้",
          description: "กรุณาลองใหม่อีกครั้ง",
        })
      }
    })()

    return () => {
      active = false
      unsubscribe?.()
    }
  }, [propertyId, toast])

  useEffect(() => {
    if (!propertyId) {
      setNotifications([])
      setNotificationsLoading(false)
      return
    }

    let active = true
    let unsubscribe: (() => void) | undefined
    setNotificationsLoading(true)

    void (async () => {
      try {
        unsubscribe = await subscribeToInspectionNotifications(propertyId, "buyer", (items) => {
          if (!active) return
          setNotifications(items)
          setNotificationsLoading(false)
        })
      } catch (error) {
        console.error("Failed to subscribe notifications", error)
        if (!active) return
        setNotifications([])
        setNotificationsLoading(false)
        toast({
          variant: "destructive",
          title: "โหลดการแจ้งเตือนไม่สำเร็จ",
          description: "ลองรีเฟรชหน้าหรือเชื่อมต่อใหม่อีกครั้ง",
        })
      }
    })()

    return () => {
      active = false
      unsubscribe?.()
    }
  }, [propertyId, toast])

  useEffect(() => {
    const currentIds = new Set(notifications.map((item) => item.id))
    if (!notificationsPrimedRef.current) {
      notificationIdsRef.current = currentIds
      notificationsPrimedRef.current = true
      return
    }

    const previousIds = notificationIdsRef.current
    const hasNewUnread = notifications.some(
      (notification) => !notification.read && !previousIds.has(notification.id),
    )

    notificationIdsRef.current = currentIds

    if (hasNewUnread) {
      void playNotificationSound()
    }
  }, [notifications, playNotificationSound])

  useEffect(() => {
    if (stateLoading) return
    setHandoverDateInput(
      inspectionState.handoverDate ? inspectionState.handoverDate.slice(0, 10) : "",
    )
    setHandoverNoteInput(inspectionState.handoverNote ?? "")
  }, [inspectionState.handoverDate, inspectionState.handoverNote, stateLoading])

  const isLoading =
    authLoading ||
    propertyLoading ||
    stateLoading ||
    checklistLoading ||
    issuesLoading

  const scheduleLabel = useMemo(() => {
    if (!inspectionState.handoverDate) return "ยังไม่ได้เลือกวันนัดหมาย"
    return safeFormatDate(inspectionState.handoverDate)
  }, [inspectionState.handoverDate])

  const scheduleUpdatedAtLabel = useMemo(() => {
    if (!inspectionState.lastUpdatedAt) return null
    return safeFormatDateTime(inspectionState.lastUpdatedAt)
  }, [inspectionState.lastUpdatedAt])

  const propertyLocation = useMemo(() => {
    if (!property) return "ยังไม่ระบุสถานที่นัดหมาย"
    if (property.address) return property.address
    const segments = [property.city, property.province].filter(Boolean)
    return segments.join(", ") || "ยังไม่ระบุสถานที่นัดหมาย"
  }, [property])

  const sellerContact = useMemo(() => {
    if (!property) return "ยังไม่ระบุข้อมูลผู้ขาย"
    const segments = [property.sellerName, property.sellerPhone].filter(Boolean)
    return segments.join(" • ") || "ยังไม่ระบุข้อมูลผู้ขาย"
  }, [property])

  const overviewStats = useMemo(() => {
    const total = checklistItems.length
    const accepted = checklistItems.filter((item) => item.buyerStatus === "accepted").length
    const followUp = checklistItems.filter((item) => item.buyerStatus === "follow-up").length
    return {
      total,
      accepted,
      followUp,
      completion: total > 0 ? Math.round((accepted / total) * 100) : 0,
    }
  }, [checklistItems])

  const timelineEvents = useMemo(() => {
    const events: { id: string; title: string; description: string; date: string; tone: string }[] = []

    if (inspectionState.handoverDate) {
      events.push({
        id: "handover",
        title: "วันที่นัดส่งมอบ",
        description: scheduleLabel,
        date: inspectionState.handoverDate,
        tone: "border-emerald-200 bg-emerald-50",
      })
    }

    issues.forEach((issue) => {
      events.push({
        id: `${issue.id}-reported`,
        title: `รายงานปัญหา: ${issue.title}`,
        description: issue.location,
        date: issue.reportedAt,
        tone: "border-amber-200 bg-amber-50",
      })

      if (issue.expectedCompletion) {
        events.push({
          id: `${issue.id}-expected`,
          title: `กำหนดแก้ไขโดย ${issue.owner ?? "ผู้ขาย"}`,
          description: safeFormatDate(issue.expectedCompletion),
          date: issue.expectedCompletion,
          tone: "border-blue-200 bg-blue-50",
        })
      }

      if (issue.resolvedAt) {
        events.push({
          id: `${issue.id}-resolved`,
          title: `ปิดงาน: ${issue.title}`,
          description: `${issue.location} • ${safeFormatDate(issue.resolvedAt)}`,
          date: issue.resolvedAt,
          tone: "border-purple-200 bg-purple-50",
        })
      }
    })

    return events
      .filter((event) => !Number.isNaN(Date.parse(event.date)))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [inspectionState.handoverDate, issues, scheduleLabel])

  const unreadNotifications = useMemo(
    () => notifications.filter((notification) => !notification.read),
    [notifications],
  )

  useEffect(() => {
    if (!notificationsOpen || !propertyId) return
    const unreadIds = unreadNotifications.map((item) => item.id)
    if (unreadIds.length === 0) return

    void markInspectionNotificationsRead(propertyId, unreadIds, "buyer")
    if (user?.uid) {
      void markUserNotificationsReadByRelated(user.uid, unreadIds)
    }
  }, [notificationsOpen, propertyId, unreadNotifications, user?.uid])

  const handleSaveSchedule = async () => {
    if (!propertyId) return
    setSavingSchedule(true)
    try {
      await updateInspectionState(propertyId, {
        handoverDate: handoverDateInput ? `${handoverDateInput}T09:00:00` : null,
        handoverNote: handoverNoteInput,
        lastUpdatedBy: "buyer",
      })
      toast({
        title: "บันทึกวันนัดหมายแล้ว",
        description: "ระบบจะส่งแจ้งเตือนไปยังผู้ขายผ่านแชท DreamHome",
      })
    } catch (error) {
      console.error("Failed to save schedule", error)
      toast({
        variant: "destructive",
        title: "บันทึกวันนัดหมายไม่สำเร็จ",
        description: "กรุณาลองใหม่อีกครั้ง",
      })
    } finally {
      setSavingSchedule(false)
    }
  }

  const handleOpenChatPanel = () => {
    if (typeof window === "undefined") return

    const detail: ChatOpenEventDetail = property
      ? {
          participantId: property.userUid || undefined,
          propertyPreview: {
            propertyId: property.id,
            ownerUid: property.userUid,
            title: property.title,
            price: property.price,
            transactionType: property.transactionType,
            thumbnailUrl: property.photos?.[0] ?? undefined,
            address: property.address || undefined,
            city: property.city || undefined,
            province: property.province || undefined,
          },
        }
      : {}

    window.dispatchEvent(new CustomEvent<ChatOpenEventDetail>("dreamhome:open-chat", { detail }))
  }

  const handleUpdateBuyerStatus = async (
    id: string,
    status: HomeInspectionChecklistItem["buyerStatus"],
  ) => {
    if (!propertyId) return
    try {
      const item = checklistItems.find((entry) => entry.id === id)
      await updateInspectionChecklistItem(
        propertyId,
        id,
        { buyerStatus: status },
        { updatedBy: "buyer", itemTitle: item?.title },
      )
    } catch (error) {
      console.error("Failed to update buyer status", error)
      toast({
        variant: "destructive",
        title: "อัปเดตสถานะไม่สำเร็จ",
        description: "กรุณาลองใหม่อีกครั้ง",
      })
    }
  }

  const handleAddChecklistItem = async () => {
    if (!propertyId) return
    if (!newChecklistTitle.trim()) return

    setAddingChecklist(true)
    try {
      await createInspectionChecklistItem(
        propertyId,
        {
          title: newChecklistTitle.trim(),
          description: newChecklistDescription.trim() || "ระบุรายละเอียดสิ่งที่ต้องการตรวจ",
        },
        "buyer",
      )
      setNewChecklistTitle("")
      setNewChecklistDescription("")
      toast({
        title: "เพิ่มรายการตรวจเรียบร้อย",
        description: "DreamHome ได้แชร์รายการนี้ให้ผู้ขายแล้ว",
      })
    } catch (error) {
      console.error("Failed to add checklist item", error)
      toast({
        variant: "destructive",
        title: "ไม่สามารถเพิ่มรายการได้",
        description: "กรุณาลองใหม่อีกครั้ง",
      })
    } finally {
      setAddingChecklist(false)
    }
  }

  const handleChecklistDeleteClick = (item: HomeInspectionChecklistItem) => {
    setChecklistItemToDelete(item)
  }

  const handleConfirmDeleteChecklist = async () => {
    if (!propertyId || !checklistItemToDelete) return
    setDeletingChecklist(true)
    try {
      await deleteInspectionChecklistItem(propertyId, checklistItemToDelete.id, {
        removedBy: "buyer",
        itemTitle: checklistItemToDelete.title,
      })
      toast({
        title: "ลบรายการออกจากเช็คลิสต์แล้ว",
        description: "DreamHome แจ้งเตือนผู้ขายให้รับทราบ",
      })
      setChecklistItemToDelete(null)
    } catch (error) {
      console.error("Failed to delete checklist item", error)
      toast({
        variant: "destructive",
        title: "ไม่สามารถลบรายการได้",
        description: "กรุณาลองใหม่อีกครั้ง",
      })
    } finally {
      setDeletingChecklist(false)
    }
  }

  const handleReportBeforePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    if (files.length === 0) {
      setReportBeforePhotos((prev) => {
        prev.forEach((entry) => URL.revokeObjectURL(entry.preview))
        return []
      })
      return
    }

    const imageFiles = files.filter((file) => file.type.startsWith("image/"))

    if (imageFiles.length === 0) {
      toast({
        variant: "destructive",
        title: "อัปโหลดได้เฉพาะรูปภาพ",
      })
      setReportBeforePhotos((prev) => {
        prev.forEach((entry) => URL.revokeObjectURL(entry.preview))
        return []
      })
      return
    }

    setReportBeforePhotos((prev) => {
      prev.forEach((entry) => URL.revokeObjectURL(entry.preview))
      return imageFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }))
    })
  }

  const handleRemoveBeforePhoto = (preview: string) => {
    setReportBeforePhotos((prev) => {
      const next = prev.filter((entry) => entry.preview !== preview)
      const removed = prev.find((entry) => entry.preview === preview)
      if (removed) {
        URL.revokeObjectURL(removed.preview)
      }
      return next
    })
    if (beforePhotoInputRef.current && beforePhotoInputRef.current.files?.length === 1) {
      beforePhotoInputRef.current.value = ""
    }
  }

  const handleIssueReminderClick = async (issue: HomeInspectionIssue) => {
    if (!propertyId) return
    setIssueReminderState((prev) => ({ ...prev, [issue.id]: true }))
    try {
      await remindInspectionIssue(propertyId, issue.id, {
        triggeredBy: "buyer",
        issueTitle: issue.title,
      })
      toast({
        title: "ส่งการแจ้งเตือนให้ผู้ขายแล้ว",
        description: "ระบบจะกระตุ้นให้ผู้ขายอัปเดตความคืบหน้า",
      })
    } catch (error) {
      console.error("Failed to remind seller", error)
      toast({
        variant: "destructive",
        title: "เตือนผู้ขายไม่สำเร็จ",
        description: "กรุณาลองใหม่อีกครั้ง",
      })
    } finally {
      setIssueReminderState((prev) => {
        const next = { ...prev }
        delete next[issue.id]
        return next
      })
    }
  }

  const handleSubmitIssue = async () => {
    if (!propertyId) return
    if (!reportTitle.trim() || !reportLocation.trim()) {
      toast({
        variant: "destructive",
        title: "กรุณากรอกหัวข้อและตำแหน่ง",
      })
      return
    }

    setCreatingIssue(true)
    try {
      const issueId = await createInspectionIssue(
        propertyId,
        {
          title: reportTitle.trim(),
          location: reportLocation.trim(),
          description: reportDescription.trim() || undefined,
          expectedCompletion: reportExpectedDate
            ? `${reportExpectedDate}T09:00:00`
            : undefined,
        },
        "buyer",
      )
      if (reportBeforePhotos.length > 0) {
        const baseTimestamp = Date.now()
        const uploads = await Promise.all(
          reportBeforePhotos.map(async (entry, index) => {
            const safeOriginalName = entry.file.name || `before-${index + 1}.jpg`
            const storagePath = `inspection-issues/${propertyId}/${issueId}/before/${baseTimestamp}-${index}-${sanitizeFileName(safeOriginalName)}`
            const metadata =
              entry.file.type && entry.file.type.length > 0
                ? { contentType: entry.file.type }
                : undefined
            const uploadResult = await uploadFile(storagePath, entry.file, metadata)
            const fullPath = uploadResult.metadata.fullPath ?? storagePath
            const downloadUrl = await getDownloadURL(fullPath)
            return {
              url: downloadUrl,
              storagePath: fullPath,
              uploadedBy: "buyer" as const,
            }
          }),
        )

        await attachInspectionIssuePhotos(propertyId, issueId, "before", uploads, {
          issueTitle: reportTitle.trim(),
        })
      }
      setReportDialogOpen(false)
      setReportTitle("")
      setReportDescription("")
      setReportLocation("")
      setReportExpectedDate("")
      setReportBeforePhotos((prev) => {
        prev.forEach((entry) => URL.revokeObjectURL(entry.preview))
        return []
      })
      if (beforePhotoInputRef.current) {
        beforePhotoInputRef.current.value = ""
      }
      toast({
        title: "ส่งคำขอแก้ไขแล้ว",
        description: "ผู้ขายจะได้รับการแจ้งเตือนใน Defect Tracking",
      })
    } catch (error) {
      console.error("Failed to create issue", error)
      toast({
        variant: "destructive",
        title: "ไม่สามารถสร้างรายการแจ้งซ่อมได้",
        description: "กรุณาลองใหม่อีกครั้ง",
      })
    } finally {
      setCreatingIssue(false)
    }
  }

  if (!propertyId) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-slate-50 px-4">
        <Card className="max-w-lg border-none bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-slate-900">
              ต้องระบุรหัสประกาศ
            </CardTitle>
            <CardDescription className="text-sm text-slate-600">
              กรุณาเปิดลิงก์จากประกาศที่ได้รับการยืนยัน หรือระบุพารามิเตอร์ propertyId ใน URL
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-slate-50 px-4">
        <div className="flex flex-col items-center gap-3 text-slate-600">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-500" />
          <p className="text-sm">กำลังโหลดข้อมูลการตรวจรับบ้าน...</p>
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-slate-50 px-4">
        <Card className="max-w-lg border-none bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-slate-900">
              ไม่พบข้อมูลประกาศ
            </CardTitle>
            <CardDescription className="text-sm text-slate-600">
              ตรวจสอบว่าคุณมีสิทธิ์เข้าถึงประกาศนี้หรือยังไม่ได้ลบประกาศออกจากระบบ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="bg-indigo-600 text-white hover:bg-indigo-700">
              <Link href="/buy/send-documents">กลับไปหน้าส่งเอกสาร</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-4 rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
              <ClipboardList className="h-4 w-4" />
              ขั้นตอนตรวจรับบ้าน (ผู้ซื้อ)
            </div>
            {inspectionState.handoverDate ? (
              <Badge className="rounded-full border border-emerald-200 bg-emerald-50 text-[10px] font-semibold tracking-wide text-emerald-600">
                นัดหมายยืนยันแล้ว
              </Badge>
            ) : (
              <Badge className="rounded-full border border-amber-200 bg-amber-50 text-[10px] font-semibold tracking-wide text-amber-600">
                รอยืนยันวันส่งมอบ
              </Badge>
            )}
          </div>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3 lg:max-w-2xl">
              <h1 className="text-3xl font-semibold text-slate-900">เตรียมตรวจรับบ้านร่วมกับผู้ขายอย่างมั่นใจ</h1>
              <p className="text-sm text-slate-600 sm:text-base">
                DreamHome จะบันทึกนัดหมาย เช็คลิสต์ และรายการแก้ไขให้ผู้ซื้อและผู้ขายเห็นตรงกันแบบเรียลไทม์ เพื่อให้การส่งมอบเป็นไปอย่างราบรื่น
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                อัปเดตทุกการเปลี่ยนแปลงผ่านแชทรวมกับทีมขายได้ทันที
              </div>
              <div className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-xs font-medium text-slate-600">
                <Sparkles className="h-4 w-4 text-indigo-500" />
                ข้อมูลจริงจากประกาศ: {property.title}
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button
                  onClick={handleOpenChatPanel}
                  variant="outline"
                  className="flex items-center gap-2 rounded-full border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                >
                  <MessageCircle className="h-4 w-4" /> เปิดข้อความ
                </Button>
                <Button
                  onClick={() => setNotificationsOpen(true)}
                  variant="outline"
                  disabled={notificationsLoading && notifications.length === 0}
                  className="relative flex items-center gap-2 rounded-full border-amber-200 text-amber-700 hover:bg-amber-50"
                >
                  <Bell className="h-4 w-4" /> การแจ้งเตือน
                  {unreadNotifications.length > 0 && (
                    <span className="absolute -right-2 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-semibold text-white">
                      {unreadNotifications.length > 99 ? "99+" : unreadNotifications.length}
                    </span>
                  )}
                </Button>
              </div>
            </div>
            <Card className="w-full max-w-sm border-none bg-slate-900 text-slate-50 shadow-lg">
              <CardHeader className="space-y-2">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <CalendarIcon className="h-5 w-5 text-indigo-300" />
                  วันที่ผู้ซื้อเลือกไว้
                </CardTitle>
                <CardDescription className="text-sm text-slate-300">
                  {scheduleLabel} • {propertyLocation}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-slate-400">ผู้ขายติดต่อ</p>
                  <p className="font-medium text-slate-100">{sellerContact}</p>
                </div>
                <div className="rounded-2xl bg-slate-800/70 p-3">
                  <p className="text-xs text-slate-300">โน้ตถึงผู้ขาย</p>
                  <Textarea
                    value={handoverNoteInput}
                    onChange={(event) => setHandoverNoteInput(event.target.value)}
                    placeholder="ระบุสิ่งที่ต้องเตรียมหรือคำถามเพิ่มเติม"
                    className="mt-2 min-h-[72px] border-none bg-transparent text-slate-100 placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="preferred-date" className="text-xs text-slate-300">
                    ปรับวันที่สะดวก
                  </Label>
                  <Input
                    id="preferred-date"
                    type="date"
                    value={handoverDateInput}
                    onChange={(event) => setHandoverDateInput(event.target.value)}
                    className="border-none bg-slate-800 text-slate-100"
                  />
                  {scheduleUpdatedAtLabel && (
                    <p className="text-xs text-slate-400">อัปเดตล่าสุด {scheduleUpdatedAtLabel}</p>
                  )}
                </div>
                <Button
                  onClick={handleSaveSchedule}
                  disabled={savingSchedule}
                  className="w-full bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-60"
                >
                  บันทึกวันนัดหมาย
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex w-full flex-wrap justify-start gap-2 bg-transparent p-0">
            <TabsTrigger
              value="overview"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium data-[state=active]:border-indigo-600 data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
            >
              <CalendarIcon className="mr-2 h-4 w-4" /> ภาพรวม
            </TabsTrigger>
            <TabsTrigger
              value="checklist"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium data-[state=active]:border-emerald-600 data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
            >
              <ClipboardCheck className="mr-2 h-4 w-4" /> เช็คลิสต์ร่วมกัน
            </TabsTrigger>
            <TabsTrigger
              value="issues"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium data-[state=active]:border-purple-600 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
            >
              <Wrench className="mr-2 h-4 w-4" /> ปัญหา / แจ้งซ่อม
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="border-none bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    สถานะการตรวจของผู้ซื้อ
                  </CardTitle>
                  <CardDescription className="text-sm text-slate-600">
                    ตรวจแล้ว {overviewStats.accepted} รายการ • ขอแก้เพิ่ม {overviewStats.followUp} รายการ
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="h-2 w-full rounded-full bg-slate-200">
                    <div
                      className="h-2 rounded-full bg-emerald-500"
                      style={{ width: `${overviewStats.completion}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500">รวม {overviewStats.total} รายการในเช็คลิสต์</p>
                  <Button
                    asChild
                    variant="outline"
                    className="w-fit border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  >
                    <Link href="#checklist">ไปที่รายการตรวจ</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-none bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
                    <MessageCircle className="h-5 w-5 text-indigo-500" />
                    ติดต่อผู้ขายได้รวดเร็ว
                  </CardTitle>
                  <CardDescription className="text-sm text-slate-600">
                    บันทึกสิ่งที่ต้องเตรียมและให้ DreamHome แจ้งเตือนผ่านแชทได้ทันที
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <Compass className="h-4 w-4 text-slate-500" />
                    {propertyLocation}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-500" />
                    เวลาแนะนำ 09:00 - 11:00 น.
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-slate-500" />
                    ข้อมูลซิงค์กับฝั่งผู้ขายแบบเรียลไทม์
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-none bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
                  <CalendarIcon className="h-5 w-5 text-indigo-500" />
                  ไทม์ไลน์การตรวจรับ
                </CardTitle>
                <CardDescription className="text-sm text-slate-600">
                  รวมเหตุการณ์สำคัญระหว่างนัดหมายและการแก้ไขข้อบกพร่อง
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {timelineEvents.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    ยังไม่มีเหตุการณ์ในไทม์ไลน์ เริ่มจากการยืนยันวันส่งมอบหรือสร้างรายการแจ้งซ่อม
                  </p>
                ) : (
                  <div className="space-y-3">
                    {timelineEvents.map((event) => (
                      <div
                        key={event.id}
                        className={`flex items-start gap-3 rounded-2xl border p-3 text-sm text-slate-600 ${event.tone}`}
                      >
                        <CalendarIcon className="mt-0.5 h-4 w-4 text-indigo-500" />
                        <div>
                          <p className="font-semibold text-slate-900">{event.title}</p>
                          <p>{event.description}</p>
                          <p className="text-xs text-slate-500">
                            {format(parseISO(event.date), "d MMM yyyy")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="checklist" className="space-y-6" id="checklist">
            <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
              <Card className="border-none bg-white shadow-sm">
                <CardHeader className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
                    <ClipboardCheck className="h-5 w-5 text-emerald-500" />
                    รายการที่ต้องตรวจ
                  </CardTitle>
                  <CardDescription className="text-sm text-slate-600">
                    อัปเดตสถานะร่วมกับผู้ขายได้แบบเรียลไทม์
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {checklistItems.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      ยังไม่มีรายการตรวจ เริ่มจากการเพิ่มรายการใหม่หรือให้ผู้ขายเพิ่มจากฝั่งของตน
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {checklistItems.map((item) => (
                        <div
                          key={item.id}
                          className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-base font-semibold text-slate-900">{item.title}</p>
                              <p className="text-sm text-slate-600">{item.description}</p>
                              <p className="text-xs text-slate-500">
                                เพิ่มโดย {item.createdBy === "buyer" ? "ผู้ซื้อ" : "ผู้ขาย"}
                              </p>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="flex flex-col items-end gap-2">
                                <Badge
                                  className={`rounded-full border px-3 py-1 text-[10px] font-semibold ${sellerStatusMeta[item.sellerStatus].tone}`}
                                >
                                  {sellerStatusMeta[item.sellerStatus].label}
                                </Badge>
                                <Badge
                                  className={`rounded-full border px-3 py-1 text-[10px] font-semibold ${buyerStatusMeta[item.buyerStatus].tone}`}
                                >
                                  {buyerStatusMeta[item.buyerStatus].label}
                                </Badge>
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-slate-400 hover:text-red-600"
                                onClick={() => handleChecklistDeleteClick(item)}
                                aria-label="ลบรายการเช็คลิสต์"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span>{buyerStatusMeta[item.buyerStatus].description}</span>
                            <span>•</span>
                            <span>{sellerStatusMeta[item.sellerStatus].description}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              size="sm"
                              variant={item.buyerStatus === "accepted" ? "default" : "outline"}
                              className={`rounded-full ${
                                item.buyerStatus === "accepted"
                                  ? "bg-emerald-500 text-white hover:bg-emerald-600"
                                  : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                              }`}
                              onClick={() => handleUpdateBuyerStatus(item.id, "accepted")}
                            >
                              ผ่านแล้ว
                            </Button>
                            <Button
                              size="sm"
                              variant={item.buyerStatus === "follow-up" ? "default" : "outline"}
                              className={`rounded-full ${
                                item.buyerStatus === "follow-up"
                                  ? "bg-purple-500 text-white hover:bg-purple-600"
                                  : "border-purple-200 text-purple-700 hover:bg-purple-50"
                              }`}
                              onClick={() => handleUpdateBuyerStatus(item.id, "follow-up")}
                            >
                              ขอแก้เพิ่ม
                            </Button>
                            <Button
                              size="sm"
                              variant={item.buyerStatus === "pending" ? "default" : "outline"}
                              className={`rounded-full ${
                                item.buyerStatus === "pending"
                                  ? "bg-slate-900 text-white hover:bg-slate-800"
                                  : "border-slate-200 text-slate-700 hover:bg-slate-50"
                              }`}
                              onClick={() => handleUpdateBuyerStatus(item.id, "pending")}
                            >
                              รอตรวจอีกครั้ง
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border border-indigo-100 bg-indigo-50/60 shadow-sm">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-base font-semibold text-indigo-900">
                    เพิ่มรายการที่อยากตรวจเพิ่ม
                  </CardTitle>
                  <CardDescription className="text-sm text-indigo-700">
                    ผู้ซื้อสามารถเพิ่มรายการใหม่เพื่อให้ผู้ขายช่วยเตรียมได้
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-checklist-title" className="text-xs font-semibold text-indigo-800">
                      หัวข้อรายการ
                    </Label>
                    <Input
                      id="new-checklist-title"
                      placeholder="เช่น ตรวจความเรียบร้อยของสวนหน้าบ้าน"
                      value={newChecklistTitle}
                      onChange={(event) => setNewChecklistTitle(event.target.value)}
                      className="border-indigo-200 bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-checklist-description" className="text-xs font-semibold text-indigo-800">
                      รายละเอียด (ไม่บังคับ)
                    </Label>
                    <Textarea
                      id="new-checklist-description"
                      placeholder="อธิบายเพิ่มเติมว่าคาดหวังอะไร"
                      value={newChecklistDescription}
                      onChange={(event) => setNewChecklistDescription(event.target.value)}
                      className="border-indigo-200 bg-white"
                    />
                  </div>
                  <Button
                    onClick={handleAddChecklistItem}
                    disabled={addingChecklist}
                    className="w-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
                  >
                    เพิ่มเข้าเช็คลิสต์
                  </Button>
                  <p className="text-xs text-indigo-700/80">
                    รายการที่เพิ่มจะซิงก์ไปให้ผู้ขายดูผ่าน DreamHome เช่นเดียวกัน
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="issues" className="space-y-6">
            <div className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-slate-900">แจ้งปัญหาเพิ่มเติม</h2>
                <p className="text-sm text-slate-600">
                  บันทึกสิ่งที่พบระหว่างการตรวจรับ ผู้ขายจะเห็นและอัปเดตสถานะได้ทันที
                </p>
              </div>
              <Button
                onClick={() => setReportDialogOpen(true)}
                className="bg-purple-600 text-white hover:bg-purple-700"
              >
                <AlertCircle className="mr-2 h-4 w-4" /> สร้างรายการซ่อม
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {issues.length === 0 ? (
                <Card className="border border-dashed border-slate-200 bg-white shadow-sm md:col-span-2">
                  <CardContent className="flex h-full flex-col items-center justify-center gap-3 py-12 text-center text-sm text-slate-500">
                    <Wrench className="h-8 w-8 text-slate-300" />
                    <p>ยังไม่มีรายการแจ้งซ่อมจากผู้ซื้อ</p>
                    <p>กดปุ่ม “สร้างรายการซ่อม” เพื่อส่งให้ผู้ขายติดตามใน Defect Tracking</p>
                  </CardContent>
                </Card>
              ) : (
                issues.map((issue) => (
                  <Card key={issue.id} className="border border-slate-200 bg-white shadow-sm">
                    <CardHeader className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <CardTitle className="text-base font-semibold text-slate-900">{issue.title}</CardTitle>
                        <Badge
                          className={`rounded-full border px-3 py-1 text-[10px] font-semibold ${issueStatusMeta[issue.status].tone}`}
                        >
                          {issueStatusMeta[issue.status].label}
                        </Badge>
                      </div>
                      <CardDescription className="text-sm text-slate-600">{issue.location}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-slate-600">
                      <p>{issue.description}</p>
                      {issue.beforePhotos.length > 0 && (
                        <div className="space-y-2 rounded-xl bg-slate-50 p-3">
                          <p className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                            <ImageIcon className="h-4 w-4 text-slate-500" /> รูปก่อนแก้ไข
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {issue.beforePhotos.map((photo) => (
                              <a
                                key={photo.id}
                                href={photo.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative block h-20 w-28 overflow-hidden rounded-lg border border-slate-200"
                              >
                                <img
                                  src={photo.url}
                                  alt={`Before fix ${issue.title}`}
                                  className="h-full w-full object-cover transition group-hover:scale-105"
                                />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      {issue.afterPhotos.length > 0 && (
                        <div className="space-y-2 rounded-xl bg-emerald-50/60 p-3">
                          <p className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                            <ImageIcon className="h-4 w-4 text-emerald-500" /> รูปหลังแก้ไข
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {issue.afterPhotos.map((photo) => (
                              <a
                                key={photo.id}
                                href={photo.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative block h-20 w-28 overflow-hidden rounded-lg border border-emerald-200"
                              >
                                <img
                                  src={photo.url}
                                  alt={`After fix ${issue.title}`}
                                  className="h-full w-full object-cover transition group-hover:scale-105"
                                />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span>รายงานเมื่อ {format(parseISO(issue.reportedAt), "d MMM yyyy")}</span>
                        {issue.owner && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600">
                            <ShieldCheck className="h-3 w-3" />
                            {issue.owner}
                          </span>
                        )}
                      </div>
                      {issue.expectedCompletion && (
                        <p className="text-xs text-slate-500">
                          กำหนดเสร็จ: {format(parseISO(issue.expectedCompletion), "d MMM yyyy")}
                        </p>
                      )}
                      {issue.resolvedAt && (
                        <p className="text-xs text-emerald-600">
                          ปิดงานเมื่อ {format(parseISO(issue.resolvedAt), "d MMM yyyy")}
                        </p>
                      )}
                      <p className="text-xs text-slate-500">{issueStatusMeta[issue.status].description}</p>
                      {issue.status !== "completed" && (
                        <div className="pt-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-full border-amber-200 text-amber-600 hover:bg-amber-50"
                            onClick={() => handleIssueReminderClick(issue)}
                            disabled={Boolean(issueReminderState[issue.id])}
                          >
                            <BellRing className="mr-2 h-4 w-4" /> เตือนผู้ขาย
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={notificationsOpen} onOpenChange={setNotificationsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <Bell className="h-5 w-5 text-amber-500" />
              การแจ้งเตือนทั้งหมด
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-3 overflow-y-auto py-2">
            {notificationsLoading ? (
              <div className="flex items-center justify-center py-8 text-sm text-slate-500">
                กำลังโหลดการแจ้งเตือน...
              </div>
            ) : notifications.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center text-sm text-slate-500">
                ยังไม่มีการแจ้งเตือนจากระบบ
              </div>
            ) : (
              notifications.map((notification) => {
                const categoryMeta = notificationCategoryMeta[notification.category]
                return (
                  <div
                    key={notification.id}
                    className={`rounded-2xl border p-4 shadow-sm transition ${
                      notification.read
                        ? "border-slate-200 bg-white"
                        : "border-amber-200 bg-amber-50/70"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-slate-900">{notification.title}</p>
                        <p className="text-sm text-slate-600">{notification.message}</p>
                        <p className="text-xs text-slate-400">
                          {safeFormatDateTime(notification.createdAt)} • {" "}
                          {notification.triggeredBy === "buyer" ? "ผู้ซื้อ" : "ผู้ขาย"}
                        </p>
                      </div>
                      <Badge
                        className={`rounded-full border px-3 py-1 text-[10px] font-semibold ${categoryMeta.tone}`}
                      >
                        {categoryMeta.label}
                      </Badge>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(checklistItemToDelete)}
        onOpenChange={(open) => {
          if (!open) {
            setChecklistItemToDelete(null)
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <Trash2 className="h-5 w-5 text-red-500" />
              ยืนยันการลบรายการตรวจ
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-600">
              {checklistItemToDelete
                ? `ต้องการลบ "${checklistItemToDelete.title}" ออกจากเช็คลิสต์ใช่หรือไม่?`
                : "ต้องการลบรายการนี้ออกจากเช็คลิสต์ใช่หรือไม่"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setChecklistItemToDelete(null)}
              className="border-slate-200 text-slate-600 hover:bg-slate-100"
              disabled={deletingChecklist}
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleConfirmDeleteChecklist}
              disabled={deletingChecklist}
              className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
            >
              ลบรายการ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="w-[min(95vw,38rem)] max-h-[calc(100vh-4rem)] overflow-y-auto max-w-2xl sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <AlertCircle className="h-5 w-5 text-purple-600" />
              แจ้งปัญหาใหม่
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="issue-title" className="text-xs font-semibold text-slate-700">
                หัวข้อปัญหา
              </Label>
              <Input
                id="issue-title"
                value={reportTitle}
                onChange={(event) => setReportTitle(event.target.value)}
                placeholder="เช่น พื้นไม้มีรอยขีด"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="issue-location" className="text-xs font-semibold text-slate-700">
                ตำแหน่งที่พบ
              </Label>
              <Input
                id="issue-location"
                value={reportLocation}
                onChange={(event) => setReportLocation(event.target.value)}
                placeholder="เช่น ห้องนอนใหญ่"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="issue-description" className="text-xs font-semibold text-slate-700">
                รายละเอียดเพิ่มเติม (ไม่บังคับ)
              </Label>
              <Textarea
                id="issue-description"
                value={reportDescription}
                onChange={(event) => setReportDescription(event.target.value)}
                placeholder="บรรยายเพิ่มเติมเพื่อให้ทีมผู้ขายเข้าใจปัญหา"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-700">
                แนบรูปก่อนแก้ไข (ไม่บังคับ)
              </Label>
              <div className="space-y-3 rounded-2xl border border-dashed border-slate-200 p-4">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Upload className="h-4 w-4 text-slate-400" /> เพิ่มรูปเพื่อให้ผู้ขายเห็นปัญหาชัดเจน
                </div>
                <Input
                  ref={beforePhotoInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleReportBeforePhotoChange}
                  disabled={creatingIssue}
                />
                {reportBeforePhotos.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    เลือกรูปความเสียหายก่อนแก้ไขเพื่อให้ผู้ขายประเมินงานได้ง่ายขึ้น
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {reportBeforePhotos.map((entry) => (
                      <div
                        key={entry.preview}
                        className="relative h-20 w-28 overflow-hidden rounded-lg border border-slate-200"
                      >
                        <img
                          src={entry.preview}
                          alt="ภาพก่อนแก้ไข"
                          className="h-full w-full object-cover"
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="absolute right-1 top-1 h-6 w-6 rounded-full bg-white/80 text-red-500 hover:bg-white"
                          onClick={() => handleRemoveBeforePhoto(entry.preview)}
                          disabled={creatingIssue}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="sr-only">ลบรูปนี้</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="issue-expected-date" className="text-xs font-semibold text-slate-700">
                ต้องการให้เสร็จภายใน (ไม่บังคับ)
              </Label>
              <Input
                id="issue-expected-date"
                type="date"
                value={reportExpectedDate}
                onChange={(event) => setReportExpectedDate(event.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setReportDialogOpen(false)}
                className="border-slate-200 text-slate-700 hover:bg-slate-100"
                disabled={creatingIssue}
              >
                ยกเลิก
              </Button>
              <Button
                onClick={handleSubmitIssue}
                disabled={creatingIssue}
                className="bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60"
              >
                ส่งให้ผู้ขาย
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
