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
  ClipboardCheck,
  ClipboardList,
  Home,
  Image as ImageIcon,
  MessageCircle,
  Plus,
  ShieldCheck,
  Trash2,
  Upload,
  Wrench,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  updateInspectionIssue,
  updateInspectionState,
} from "@/lib/home-inspection"
import { mapDocumentToUserProperty } from "@/lib/user-property-mapper"
import { cancelPropertyPurchase } from "@/lib/property-purchase"
import type {
  HomeInspectionChecklistItem,
  HomeInspectionIssue,
  HomeInspectionIssueStatus,
  HomeInspectionNotification,
  HomeInspectionState,
  SellerChecklistStatus,
} from "@/types/home-inspection"
import type { ChatOpenEventDetail } from "@/types/chat"
import type { UserProperty } from "@/types/user-property"
import { markUserNotificationsReadByRelated } from "@/lib/notifications"
import { getDownloadURL, uploadFile } from "@/lib/storage"
import { sanitizeFileName } from "@/lib/utils"

const sellerStatusMeta: Record<
  SellerChecklistStatus,
  { label: string; badgeClass: string; description: string }
> = {
  scheduled: {
    label: "พร้อมให้ตรวจ",
    badgeClass: "bg-blue-100 text-blue-700 border border-blue-200",
    description: "เตรียมรายการนี้ให้ผู้ซื้อเข้าตรวจได้",
  },
  fixing: {
    label: "กำลังแก้ไข",
    badgeClass: "bg-amber-100 text-amber-700 border border-amber-200",
    description: "ทีมช่างกำลังปรับปรุงอยู่",
  },
  done: {
    label: "แก้ไขเรียบร้อย",
    badgeClass: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    description: "พร้อมให้ผู้ซื้อยืนยันผล",
  },
}

const buyerStatusMeta: Record<
  HomeInspectionChecklistItem["buyerStatus"],
  { label: string; badgeClass: string }
> = {
  pending: {
    label: "รอตรวจ",
    badgeClass: "bg-slate-100 text-slate-700 border border-slate-200",
  },
  accepted: {
    label: "ผู้ซื้อยืนยันแล้ว",
    badgeClass: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  },
  "follow-up": {
    label: "ผู้ซื้อขอแก้เพิ่ม",
    badgeClass: "bg-purple-100 text-purple-700 border border-purple-200",
  },
}

const issueStatusOptions: { value: HomeInspectionIssueStatus; label: string }[] = [
  { value: "pending", label: "รอเริ่มงาน" },
  { value: "in-progress", label: "กำลังแก้ไข" },
  { value: "buyer-review", label: "ส่งให้ผู้ซื้อเช็ก" },
  { value: "completed", label: "ปิดงานเรียบร้อย" },
]

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

const extractDateInput = (value: string | null) => {
  if (!value) return ""
  const [datePart] = value.split("T")
  return datePart ?? ""
}

const extractTimeInput = (value: string | null) => {
  if (!value) return ""
  const [, timePart] = value.split("T")
  if (!timePart) return ""
  return timePart.slice(0, 5)
}

const combineDateAndTime = (dateValue: string, timeValue: string) => {
  const trimmedDate = dateValue.trim()
  if (!trimmedDate) {
    return null
  }

  const trimmedTime = timeValue.trim()
  const validTime = /^\d{2}:\d{2}$/.test(trimmedTime) ? trimmedTime : "09:00"

  return `${trimmedDate}T${validTime}:00`
}

const defaultState: HomeInspectionState = {
  handoverDate: null,
  handoverNote: "",
  lastUpdatedAt: null,
  lastUpdatedBy: null,
}

export default function SellerHomeInspectionPage() {
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

  const [activeTab, setActiveTab] = useState("schedule")
  const [handoverDateInput, setHandoverDateInput] = useState("")
  const [handoverTimeInput, setHandoverTimeInput] = useState("")
  const [handoverNoteInput, setHandoverNoteInput] = useState("")
  const [savingSchedule, setSavingSchedule] = useState(false)

  const [newChecklistTitle, setNewChecklistTitle] = useState("")
  const [newChecklistDescription, setNewChecklistDescription] = useState("")
  const [newChecklistOwner, setNewChecklistOwner] = useState<"buyer" | "seller">("seller")
  const [addingChecklist, setAddingChecklist] = useState(false)

  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [reportTitle, setReportTitle] = useState("")
  const [reportDescription, setReportDescription] = useState("")
  const [reportLocation, setReportLocation] = useState("")
  const [reportExpectedDate, setReportExpectedDate] = useState("")
  const [reportOwner, setReportOwner] = useState("")
  const [creatingIssue, setCreatingIssue] = useState(false)
  const [reportBeforePhotos, setReportBeforePhotos] = useState<
    { file: File; preview: string }[]
  >([])
  const reportBeforeInputRef = useRef<HTMLInputElement | null>(null)

  const [updatingIssues, setUpdatingIssues] = useState<Record<string, boolean>>({})
  const [issuePhotoUploading, setIssuePhotoUploading] = useState<Record<string, boolean>>({})
  const [issueReminderState, setIssueReminderState] = useState<Record<string, boolean>>({})
  const [checklistItemToDelete, setChecklistItemToDelete] =
    useState<HomeInspectionChecklistItem | null>(null)
  const [deletingChecklist, setDeletingChecklist] = useState(false)

  const [notifications, setNotifications] = useState<HomeInspectionNotification[]>([])
  const [notificationsLoading, setNotificationsLoading] = useState(true)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const notificationIdsRef = useRef<Set<string>>(new Set())
  const notificationsPrimedRef = useRef(false)
  const playNotificationSound = useNotificationSound()
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)

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
      if (reportBeforeInputRef.current) {
        reportBeforeInputRef.current.value = ""
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
      router.replace("/sell")
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
          description: "กรุณาลองรีเฟรชหน้าหรือกลับไปเลือกประกาศ",
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
          description: "ตรวจสอบการเชื่อมต่อและลองใหม่",
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
        unsubscribe = await subscribeToInspectionNotifications(propertyId, "seller", (items) => {
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
    setHandoverDateInput(extractDateInput(inspectionState.handoverDate))
    setHandoverTimeInput(extractTimeInput(inspectionState.handoverDate))
    setHandoverNoteInput(inspectionState.handoverNote ?? "")
  }, [inspectionState.handoverDate, inspectionState.handoverNote, stateLoading])

  const isLoading =
    authLoading ||
    propertyLoading ||
    stateLoading ||
    checklistLoading ||
    issuesLoading

  const scheduleLabel = useMemo(() => {
    if (!inspectionState.handoverDate) return "ยังไม่มีการนัดหมาย"
    return safeFormatDateTime(inspectionState.handoverDate)
  }, [inspectionState.handoverDate])

  const scheduleUpdatedAtLabel = useMemo(() => {
    if (!inspectionState.lastUpdatedAt) return null
    return safeFormatDateTime(inspectionState.lastUpdatedAt)
  }, [inspectionState.lastUpdatedAt])

  const propertyLocation = useMemo(() => {
    if (!property) return "ยังไม่ระบุสถานที่"
    if (property.address) return property.address
    const segments = [property.city, property.province].filter(Boolean)
    return segments.join(", ") || "ยังไม่ระบุสถานที่"
  }, [property])

  const buyerSummary = useMemo(() => {
    const total = checklistItems.length
    const needsFix = checklistItems.filter((item) => item.buyerStatus === "follow-up").length
    const accepted = checklistItems.filter((item) => item.buyerStatus === "accepted").length
    return { total, needsFix, accepted }
  }, [checklistItems])

  const defectSummary = useMemo(() => {
    const pending = issues.filter((issue) => issue.status === "pending").length
    const inProgress = issues.filter((issue) => issue.status === "in-progress").length
    const waitingReview = issues.filter((issue) => issue.status === "buyer-review").length
    const completed = issues.filter((issue) => issue.status === "completed").length
    const total = issues.length
    return { pending, inProgress, waitingReview, completed, total }
  }, [issues])

  const timelineEvents = useMemo(() => {
    const events: { id: string; title: string; description: string; date: string; tone: string }[] = []

    if (inspectionState.handoverDate) {
      events.push({
        id: "handover",
        title: "กำหนดวันส่งมอบ",
        description: scheduleLabel,
        date: inspectionState.handoverDate,
        tone: "border-emerald-200 bg-emerald-50",
      })
    }

    issues.forEach((issue) => {
      events.push({
        id: `${issue.id}-reported`,
        title: `ผู้ซื้อแจ้งปัญหา: ${issue.title}`,
        description: issue.location,
        date: issue.reportedAt,
        tone: "border-amber-200 bg-amber-50",
      })

      if (issue.expectedCompletion) {
        events.push({
          id: `${issue.id}-expected`,
          title: `กำหนดเสร็จที่สัญญาไว้`,
          description: safeFormatDate(issue.expectedCompletion),
          date: issue.expectedCompletion,
          tone: "border-blue-200 bg-blue-50",
        })
      }

      if (issue.resolvedAt) {
        events.push({
          id: `${issue.id}-resolved`,
          title: `ส่งมอบงานแล้ว: ${issue.title}`,
          description: safeFormatDate(issue.resolvedAt),
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

    void markInspectionNotificationsRead(propertyId, unreadIds, "seller")
    if (user?.uid) {
      void markUserNotificationsReadByRelated(user.uid, unreadIds)
    }
  }, [notificationsOpen, propertyId, unreadNotifications, user?.uid])

  const handleSaveSchedule = async () => {
    if (!propertyId) return
    if (!handoverDateInput) {
      toast({
        variant: "destructive",
        title: "กรุณาเลือกวันที่ส่งมอบ",
        description: "ระบุวันที่ต้องการเพื่อนัดหมายกับผู้ซื้อ",
      })
      return
    }

    setSavingSchedule(true)
    try {
      await updateInspectionState(propertyId, {
        handoverDate: combineDateAndTime(handoverDateInput, handoverTimeInput),
        handoverNote: handoverNoteInput,
        lastUpdatedBy: "seller",
      })
      toast({
        title: "บันทึกวันส่งมอบเรียบร้อย",
        description: "DreamHome แจ้งเตือนผู้ซื้อในแชทให้แล้ว",
      })
      setActiveTab("inspection")
    } catch (error) {
      console.error("Failed to save schedule", error)
      toast({
        variant: "destructive",
        title: "บันทึกวันส่งมอบไม่สำเร็จ",
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
          participantId: property.confirmedBuyerId || undefined,
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

  const handleCancelPurchase = async () => {
    if (!propertyId) {
      toast({
        variant: "destructive",
        title: "ไม่พบประกาศ",
        description: "กรุณากลับไปเลือกประกาศจากรายการอีกครั้ง",
      })
      return
    }

    if (!user?.uid) {
      toast({
        variant: "destructive",
        title: "ไม่สามารถยกเลิกได้",
        description: "กรุณาเข้าสู่ระบบก่อน",
      })
      return
    }

    if (!property || !property.confirmedBuyerId) {
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
        description: property.title
          ? `ระบบคืนสถานะประกาศ ${property.title} แล้ว`
          : "ระบบคืนสถานะประกาศเรียบร้อย",
      })
      setCancelDialogOpen(false)
    } catch (error) {
      console.error("Failed to cancel inspection purchase as seller", error)
      toast({
        variant: "destructive",
        title: "ยกเลิกไม่สำเร็จ",
        description: error instanceof Error ? error.message : "กรุณาลองใหม่อีกครั้ง",
      })
    } finally {
      setCancelling(false)
    }
  }

  const handleAddChecklistItem = async () => {
    if (!propertyId) return
    if (!newChecklistTitle.trim()) {
      toast({
        variant: "destructive",
        title: "กรุณากรอกหัวข้อ",
        description: "ระบุหัวข้อรายการก่อนบันทึก",
      })
      return
    }

    setAddingChecklist(true)
    try {
      await createInspectionChecklistItem(
        propertyId,
        {
          title: newChecklistTitle.trim(),
          description: newChecklistDescription.trim() || "รายละเอียดเพิ่มเติมสำหรับทีมตรวจ",
        },
        newChecklistOwner,
      )
      setNewChecklistTitle("")
      setNewChecklistDescription("")
      toast({
        title: "เพิ่มรายการสำเร็จ",
        description: "รายการใหม่ถูกแชร์ให้ผู้ซื้อแล้ว",
      })
    } catch (error) {
      console.error("Failed to add checklist", error)
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
        removedBy: "seller",
        itemTitle: checklistItemToDelete.title,
      })
      toast({
        title: "ลบรายการออกจากเช็คลิสต์แล้ว",
        description: "DreamHome แจ้งเตือนผู้ซื้อให้ทราบ",
      })
      setChecklistItemToDelete(null)
    } catch (error) {
      console.error("Failed to delete checklist", error)
      toast({
        variant: "destructive",
        title: "ลบรายการไม่สำเร็จ",
        description: "กรุณาลองใหม่อีกครั้ง",
      })
    } finally {
      setDeletingChecklist(false)
    }
  }

  const handleSellerStatusChange = async (id: string, status: SellerChecklistStatus) => {
    if (!propertyId) return
    try {
      const item = checklistItems.find((entry) => entry.id === id)
      await updateInspectionChecklistItem(
        propertyId,
        id,
        { sellerStatus: status },
        { updatedBy: "seller", itemTitle: item?.title },
      )
    } catch (error) {
      console.error("Failed to update seller status", error)
      toast({
        variant: "destructive",
        title: "อัปเดตสถานะไม่สำเร็จ",
        description: "กรุณาลองใหม่",
      })
    }
  }

  const handleIssueStatusChange = async (id: string, status: HomeInspectionIssueStatus) => {
    if (!propertyId) return
    setUpdatingIssues((prev) => ({ ...prev, [id]: true }))
    try {
      const issue = issues.find((entry) => entry.id === id)
      await updateInspectionIssue(propertyId, id, {
        status,
        resolvedAt: status === "completed" ? new Date().toISOString() : null,
      },
      { updatedBy: "seller", issueTitle: issue?.title })
    } catch (error) {
      console.error("Failed to update issue status", error)
      toast({
        variant: "destructive",
        title: "อัปเดตสถานะไม่สำเร็จ",
        description: "กรุณาลองใหม่",
      })
    } finally {
      setUpdatingIssues((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    }
  }

  const handleIssueDueDateChange = async (id: string, value: string) => {
    if (!propertyId) return
    setUpdatingIssues((prev) => ({ ...prev, [id]: true }))
    try {
      const issue = issues.find((entry) => entry.id === id)
      await updateInspectionIssue(propertyId, id, {
        expectedCompletion: value ? `${value}T09:00:00` : null,
      },
      { updatedBy: "seller", issueTitle: issue?.title })
    } catch (error) {
      console.error("Failed to update issue due date", error)
      toast({
        variant: "destructive",
        title: "บันทึกกำหนดเสร็จไม่สำเร็จ",
        description: "กรุณาลองใหม่",
      })
    } finally {
      setUpdatingIssues((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    }
  }

  const handleIssueOwnerBlur = async (id: string, value: string) => {
    if (!propertyId) return
    setUpdatingIssues((prev) => ({ ...prev, [id]: true }))
    try {
      const issue = issues.find((entry) => entry.id === id)
      await updateInspectionIssue(propertyId, id, {
        owner: value.trim() || null,
      },
      { updatedBy: "seller", issueTitle: issue?.title })
    } catch (error) {
      console.error("Failed to update issue owner", error)
      toast({
        variant: "destructive",
        title: "บันทึกผู้รับผิดชอบไม่สำเร็จ",
        description: "กรุณาลองใหม่",
      })
    } finally {
      setUpdatingIssues((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
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
        title: "อัปโหลดได้เฉพาะไฟล์รูปภาพ",
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
    if (reportBeforeInputRef.current && reportBeforeInputRef.current.files?.length === 1) {
      reportBeforeInputRef.current.value = ""
    }
  }

  const handleCreateIssue = async () => {
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
          expectedCompletion: reportExpectedDate ? `${reportExpectedDate}T09:00:00` : undefined,
          owner: reportOwner.trim() || undefined,
        },
        "seller",
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
              uploadedBy: "seller" as const,
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
      setReportOwner("")
      setReportBeforePhotos((prev) => {
        prev.forEach((entry) => URL.revokeObjectURL(entry.preview))
        return []
      })
      if (reportBeforeInputRef.current) {
        reportBeforeInputRef.current.value = ""
      }
      toast({
        title: "สร้างรายการแจ้งซ่อมแล้ว",
        description: "เพิ่มเข้า Defect Tracking เรียบร้อย",
      })
    } catch (error) {
      console.error("Failed to create issue", error)
      toast({
        variant: "destructive",
        title: "ไม่สามารถสร้างรายการแจ้งซ่อมได้",
        description: "กรุณาลองใหม่",
      })
    } finally {
      setCreatingIssue(false)
    }
  }

  const handleIssueAfterPhotosUpload = async (
    issue: HomeInspectionIssue,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    if (!propertyId) return
    const input = event.target
    const files = Array.from(input.files ?? [])
    input.value = ""
    if (files.length === 0) {
      return
    }

    const imageFiles = files.filter((file) => file.type.startsWith("image/"))
    if (imageFiles.length === 0) {
      toast({
        variant: "destructive",
        title: "อัปโหลดได้เฉพาะรูปภาพ",
      })
      return
    }

    setIssuePhotoUploading((prev) => ({ ...prev, [issue.id]: true }))
    try {
      const baseTimestamp = Date.now()
      const uploads = await Promise.all(
        imageFiles.map(async (file, index) => {
          const safeOriginalName = file.name || `after-${index + 1}.jpg`
          const storagePath = `inspection-issues/${propertyId}/${issue.id}/after/${baseTimestamp}-${index}-${sanitizeFileName(safeOriginalName)}`
          const metadata =
            file.type && file.type.length > 0 ? { contentType: file.type } : undefined
          const uploadResult = await uploadFile(storagePath, file, metadata)
          const fullPath = uploadResult.metadata.fullPath ?? storagePath
          const downloadUrl = await getDownloadURL(fullPath)
          return {
            url: downloadUrl,
            storagePath: fullPath,
            uploadedBy: "seller" as const,
          }
        }),
      )

      await attachInspectionIssuePhotos(propertyId, issue.id, "after", uploads, {
        issueTitle: issue.title,
      })
      toast({
        title: "อัปโหลดรูปหลังแก้ไขแล้ว",
        description: "แจ้งผู้ซื้อให้เห็นความคืบหน้าทันที",
      })
    } catch (error) {
      console.error("Failed to upload after photos", error)
      toast({
        variant: "destructive",
        title: "อัปโหลดรูปไม่สำเร็จ",
        description: "กรุณาลองใหม่อีกครั้ง",
      })
    } finally {
      setIssuePhotoUploading((prev) => {
        const next = { ...prev }
        delete next[issue.id]
        return next
      })
    }
  }

  const handleIssueReminderClick = async (issue: HomeInspectionIssue) => {
    if (!propertyId) return
    setIssueReminderState((prev) => ({ ...prev, [issue.id]: true }))
    try {
      await remindInspectionIssue(propertyId, issue.id, {
        triggeredBy: "seller",
        issueTitle: issue.title,
        note:
          issue.status === "buyer-review"
            ? `ผู้ขายแจ้งว่ารอผู้ซื้อยืนยันงาน: ${issue.title}`
            : undefined,
      })
      toast({
        title: "ส่งการแจ้งเตือนไปยังผู้ซื้อแล้ว",
        description: "ลูกค้าจะได้รับการแจ้งเตือนผ่านระบบ",
      })
    } catch (error) {
      console.error("Failed to remind buyer", error)
      toast({
        variant: "destructive",
        title: "เตือนผู้ซื้อไม่สำเร็จ",
        description: "กรุณาลองใหม่",
      })
    } finally {
      setIssueReminderState((prev) => {
        const next = { ...prev }
        delete next[issue.id]
        return next
      })
    }
  }

  if (!propertyId) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-slate-50 px-4">
        <Card className="max-w-lg border-none bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-slate-900">ต้องระบุรหัสประกาศ</CardTitle>
            <CardDescription className="text-sm text-slate-600">
              เปิดลิงก์นี้ผ่านประกาศที่กำลังจะส่งมอบ หรือระบุพารามิเตอร์ propertyId ใน URL
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
          <p className="text-sm">กำลังโหลดข้อมูล Workspace ผู้ขาย...</p>
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-slate-50 px-4">
        <Card className="max-w-lg border-none bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-slate-900">ไม่พบข้อมูลประกาศ</CardTitle>
            <CardDescription className="text-sm text-slate-600">
              ตรวจสอบสิทธิ์การเข้าถึงและลองเปิดประกาศจากหน้าแดชบอร์ดอีกครั้ง
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="bg-indigo-600 text-white hover:bg-indigo-700">
              <Link href="/sell">กลับไปแดชบอร์ดผู้ขาย</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-slate-900">ยกเลิกการซื้อสำหรับผู้ซื้อนี้</DialogTitle>
            <DialogDescription className="text-sm text-slate-600">
              ระบบจะลบเช็คลิสต์ รายการแจ้งซ่อม และนัดหมายทั้งหมด เพื่อให้ประกาศพร้อมสำหรับผู้ซื้อรายถัดไป
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

      <div className="min-h-screen bg-slate-50 py-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-4 rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
              <ClipboardList className="h-4 w-4" />
              Workspace ผู้ขาย
            </div>
            {inspectionState.handoverDate ? (
              <Badge className="rounded-full border border-emerald-200 bg-emerald-50 text-[10px] font-semibold tracking-wide text-emerald-600">
                นัดหมายแจ้งผู้ซื้อแล้ว
              </Badge>
            ) : (
              <Badge className="rounded-full border border-amber-200 bg-amber-50 text-[10px] font-semibold tracking-wide text-amber-600">
                รอสร้างนัดหมายส่งมอบ
              </Badge>
            )}
          </div>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3 lg:max-w-3xl">
              <h1 className="text-3xl font-semibold text-slate-900">จัดการส่งมอบบ้านและติดตามงานแก้ไขในที่เดียว</h1>
              <p className="text-sm text-slate-600 sm:text-base">
                ใช้หน้าจอนี้เพื่อระบุวันส่งมอบ แจ้งงานซ่อม และดูสถานะที่ผู้ซื้ออัปเดตกลับมาแบบเรียลไทม์ ทีมงานทุกคนจะเห็นข้อมูลตรงกันและลดการสื่อสารที่ผิดพลาด
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                ระบบจะแจ้งเตือนผ่านแชทอัตโนมัติเมื่อมีการอัปเดต
              </div>
              <div className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-xs font-medium text-slate-600">
                <Home className="h-4 w-4 text-indigo-500" />
                {property.title}
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
                {property.confirmedBuyerId && property.isUnderPurchase && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCancelDialogOpen(true)}
                    className="flex items-center gap-2 rounded-full border-red-200 text-red-600 hover:bg-red-50"
                  >
                    ยกเลิกรายการซื้อ
                  </Button>
                )}
              </div>
            </div>
            <Card className="w-full max-w-sm border border-slate-200 bg-slate-900 text-slate-50 shadow-lg">
              <CardHeader className="space-y-2">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <CalendarIcon className="h-5 w-5 text-indigo-300" />
                  วันส่งมอบล่าสุด
                </CardTitle>
                <CardDescription className="text-sm text-slate-300">
                  {scheduleLabel} • {propertyLocation}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-slate-400">โน้ตถึงทีม</p>
                  <Textarea
                    value={handoverNoteInput}
                    onChange={(event) => setHandoverNoteInput(event.target.value)}
                    placeholder="รายละเอียดการส่งมอบหรือสิ่งที่ต้องเตรียม"
                    className="mt-2 min-h-[72px] border-none bg-slate-800 text-slate-100 placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="handover-date" className="text-xs text-slate-300">
                    กำหนดวันและเวลาส่งมอบ
                  </Label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Input
                      id="handover-date"
                      type="date"
                      value={handoverDateInput}
                      onChange={(event) => setHandoverDateInput(event.target.value)}
                      className="border-none bg-slate-800 text-slate-100"
                    />
                    <Input
                      id="handover-time"
                      type="time"
                      value={handoverTimeInput}
                      onChange={(event) => setHandoverTimeInput(event.target.value)}
                      className="border-none bg-slate-800 text-slate-100"
                    />
                  </div>
                  {scheduleUpdatedAtLabel && (
                    <p className="text-xs text-slate-400">อัปเดตล่าสุด {scheduleUpdatedAtLabel}</p>
                  )}
                </div>
                <Button
                  onClick={handleSaveSchedule}
                  disabled={savingSchedule}
                  className="w-full bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-60"
                >
                  แจ้งวันให้ผู้ซื้อ
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex w-full flex-wrap gap-2 bg-transparent p-0">
            <TabsTrigger
              value="schedule"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium data-[state=active]:border-indigo-600 data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
            >
              <CalendarIcon className="mr-2 h-4 w-4" /> นัดหมาย
            </TabsTrigger>
            <TabsTrigger
              value="inspection"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium data-[state=active]:border-emerald-600 data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
            >
              <ClipboardCheck className="mr-2 h-4 w-4" /> เช็คลิสต์
            </TabsTrigger>
            <TabsTrigger
              value="defects"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium data-[state=active]:border-purple-600 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
            >
              <Wrench className="mr-2 h-4 w-4" /> Defect Tracking
            </TabsTrigger>
          </TabsList>

          <TabsContent value="schedule" className="space-y-6">
            <Card className="border-none bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
                  <MessageCircle className="h-5 w-5 text-indigo-500" />
                  การสื่อสารกับผู้ซื้อ
                </CardTitle>
                <CardDescription className="text-sm text-slate-600">
                  DreamHome จะส่งการแจ้งเตือนในแชททั้งสองฝ่ายทันทีเมื่อมีการอัปเดตนัดหมายหรือรายการแก้ไข
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">สรุปเช็คลิสต์</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {buyerSummary.accepted} รายการผ่าน • {buyerSummary.needsFix} รายการรอแก้ไข
                  </p>
                  <p className="text-sm text-slate-600">รวมทั้งหมด {buyerSummary.total} รายการ</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">ภาพรวม Defect</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {defectSummary.inProgress + defectSummary.pending} งานรอปิด • {defectSummary.completed} ปิดแล้ว
                  </p>
                  <p className="text-sm text-slate-600">กำลังตรวจซ้ำ {defectSummary.waitingReview} รายการ</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
                  <CalendarIcon className="h-5 w-5 text-indigo-500" />
                  ไทม์ไลน์การส่งมอบ
                </CardTitle>
                <CardDescription className="text-sm text-slate-600">
                  ตรวจสอบเหตุการณ์สำคัญตั้งแต่การนัดหมายจนถึงปิดงานแก้ไข
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {timelineEvents.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    ยังไม่มีเหตุการณ์ เริ่มจากการยืนยันวันส่งมอบหรือสร้างรายการแจ้งซ่อมให้ทีมดำเนินการ
                  </p>
                ) : (
                  timelineEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`flex items-start gap-3 rounded-2xl border p-3 text-sm text-slate-600 ${event.tone}`}
                    >
                      <CalendarIcon className="mt-0.5 h-4 w-4 text-indigo-500" />
                      <div>
                        <p className="font-semibold text-slate-900">{event.title}</p>
                        <p>{event.description}</p>
                        <p className="text-xs text-slate-500">{safeFormatDate(event.date)}</p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inspection" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
              <Card className="border-none bg-white shadow-sm">
                <CardHeader className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
                    <ClipboardCheck className="h-5 w-5 text-emerald-500" />
                    รายการตรวจของทั้งสองฝ่าย
                  </CardTitle>
                  <CardDescription className="text-sm text-slate-600">
                    อัปเดตสถานะเพื่อให้ผู้ซื้อเห็นความคืบหน้าได้ทันที
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {checklistItems.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      ยังไม่มีรายการในเช็คลิสต์ เพิ่มรายการใหม่หรือรอให้ผู้ซื้อเพิ่มจากฝั่งของตน
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
                                เพิ่มโดย {item.createdBy === "seller" ? "ผู้ขาย" : "ผู้ซื้อ"}
                              </p>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="flex flex-col items-end gap-2">
                                <Badge className={`rounded-full px-3 py-1 text-[10px] font-semibold ${sellerStatusMeta[item.sellerStatus].badgeClass}`}>
                                  {sellerStatusMeta[item.sellerStatus].label}
                                </Badge>
                                <Badge className={`rounded-full px-3 py-1 text-[10px] font-semibold ${buyerStatusMeta[item.buyerStatus].badgeClass}`}>
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
                            <span>{sellerStatusMeta[item.sellerStatus].description}</span>
                            <span>•</span>
                            <span>{buyerStatusMeta[item.buyerStatus].label}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {(
                              [
                                { value: "scheduled", label: "พร้อมให้ตรวจ" },
                                { value: "fixing", label: "กำลังแก้" },
                                { value: "done", label: "พร้อมส่งมอบ" },
                              ] as { value: SellerChecklistStatus; label: string }[]
                            ).map((option) => (
                              <Button
                                key={option.value}
                                size="sm"
                                variant={item.sellerStatus === option.value ? "default" : "outline"}
                                className={`rounded-full ${
                                  item.sellerStatus === option.value
                                    ? "bg-indigo-500 text-white hover:bg-indigo-600"
                                    : "border-slate-200 text-slate-700 hover:bg-slate-50"
                                }`}
                                onClick={() => handleSellerStatusChange(item.id, option.value)}
                              >
                                {option.label}
                              </Button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border border-indigo-100 bg-indigo-50/60 shadow-sm">
                <CardHeader className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold text-indigo-900">
                    <Plus className="h-5 w-5" /> เพิ่มรายการตรวจใหม่
                  </CardTitle>
                  <CardDescription className="text-sm text-indigo-700">
                    แชร์รายละเอียดให้ผู้ซื้อเห็นทันทีพร้อมเลือกผู้รับผิดชอบ
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-checklist-title" className="text-xs font-semibold text-indigo-800">
                      หัวข้อรายการ
                    </Label>
                    <Input
                      id="new-checklist-title"
                      value={newChecklistTitle}
                      onChange={(event) => setNewChecklistTitle(event.target.value)}
                      placeholder="เช่น ตรวจงานเก็บสีภายนอก"
                      className="border-indigo-200 bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-checklist-description" className="text-xs font-semibold text-indigo-800">
                      รายละเอียด (ไม่บังคับ)
                    </Label>
                    <Textarea
                      id="new-checklist-description"
                      value={newChecklistDescription}
                      onChange={(event) => setNewChecklistDescription(event.target.value)}
                      placeholder="บอกรายละเอียดที่ต้องเตรียมหรือสิ่งที่ต้องการให้ทีมช่างทำ"
                      className="border-indigo-200 bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-indigo-800">ฝ่ายที่รับผิดชอบเริ่มต้น</Label>
                    <Select
                      value={newChecklistOwner}
                      onValueChange={(value: "buyer" | "seller") => setNewChecklistOwner(value)}
                    >
                      <SelectTrigger className="border-indigo-200 bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="seller">ผู้ขายเตรียม</SelectItem>
                        <SelectItem value="buyer">ผู้ซื้อขอเพิ่ม</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleAddChecklistItem}
                    disabled={addingChecklist}
                    className="w-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
                  >
                    เพิ่มเข้ารายการ
                  </Button>
                  <p className="text-xs text-indigo-700/80">
                    DreamHome จะซิงก์รายการนี้ไปให้ผู้ซื้อและแจ้งเตือนในแชททันที
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="defects" className="space-y-6">
            <div className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-slate-900">Defect Tracking Progress</h2>
                <p className="text-sm text-slate-600">
                  บริหารจัดการงานซ่อมที่ผู้ซื้อแจ้งและอัปเดตสถานะให้ทีมรับทราบร่วมกัน
                </p>
              </div>
              <Button
                onClick={() => setReportDialogOpen(true)}
                className="bg-purple-600 text-white hover:bg-purple-700"
              >
                <AlertCircle className="mr-2 h-4 w-4" /> สร้างรายการใหม่
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {issues.length === 0 ? (
                <Card className="border border-dashed border-slate-200 bg-white shadow-sm md:col-span-2">
                  <CardContent className="flex h-full flex-col items-center justify-center gap-3 py-12 text-center text-sm text-slate-500">
                    <Wrench className="h-8 w-8 text-slate-300" />
                    <p>ยังไม่มีรายการ Defect ในระบบ</p>
                    <p>สร้างรายการใหม่เพื่อติดตามงานซ่อมกับทีมและผู้ซื้อ</p>
                  </CardContent>
                </Card>
              ) : (
                issues.map((issue) => (
                  <Card key={issue.id} className="border border-slate-200 bg-white shadow-sm">
                    <CardHeader className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <CardTitle className="text-base font-semibold text-slate-900">{issue.title}</CardTitle>
                        <Badge className={`rounded-full border px-3 py-1 text-[10px] font-semibold ${
                          issue.status === "pending"
                            ? "bg-amber-100 text-amber-700 border-amber-200"
                            : issue.status === "in-progress"
                            ? "bg-blue-100 text-blue-700 border-blue-200"
                            : issue.status === "buyer-review"
                            ? "bg-purple-100 text-purple-700 border-purple-200"
                            : "bg-emerald-100 text-emerald-700 border-emerald-200"
                        }`}>
                          {issueStatusOptions.find((option) => option.value === issue.status)?.label}
                        </Badge>
                      </div>
                      <CardDescription className="text-sm text-slate-600">{issue.location}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-slate-600">
                      <p>{issue.description}</p>
                      {issue.beforePhotos.length > 0 && (
                        <div className="space-y-2 rounded-xl bg-slate-50 p-3">
                          <p className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                            <ImageIcon className="h-4 w-4 text-slate-500" /> รูปก่อนแก้ไขจากลูกค้า
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
                            <ImageIcon className="h-4 w-4 text-emerald-500" /> รูปหลังแก้ไขที่บันทึกแล้ว
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
                        <span>รายงานเมื่อ {safeFormatDate(issue.reportedAt)}</span>
                        {issue.owner && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600">
                            <ShieldCheck className="h-3 w-3" />
                            {issue.owner}
                          </span>
                        )}
                      </div>
                      <div className="space-y-2 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <Label className="text-xs font-semibold text-slate-700">สถานะ</Label>
                          <Select
                            value={issue.status}
                            onValueChange={(value: HomeInspectionIssueStatus) => handleIssueStatusChange(issue.id, value)}
                            disabled={Boolean(updatingIssues[issue.id])}
                          >
                            <SelectTrigger className="w-full sm:w-48">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {issueStatusOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <Label htmlFor={`due-${issue.id}`} className="text-xs font-semibold text-slate-700">
                            กำหนดเสร็จ
                          </Label>
                          <Input
                            id={`due-${issue.id}`}
                            type="date"
                            value={issue.expectedCompletion ? issue.expectedCompletion.slice(0, 10) : ""}
                            onChange={(event) => handleIssueDueDateChange(issue.id, event.target.value)}
                            disabled={Boolean(updatingIssues[issue.id])}
                            className="sm:w-48"
                          />
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <Label htmlFor={`owner-${issue.id}`} className="text-xs font-semibold text-slate-700">
                            ผู้รับผิดชอบ
                          </Label>
                          <Input
                            id={`owner-${issue.id}`}
                            defaultValue={issue.owner ?? ""}
                            onBlur={(event) => handleIssueOwnerBlur(issue.id, event.target.value)}
                            placeholder="เช่น ทีมช่างโครงการ"
                            disabled={Boolean(updatingIssues[issue.id])}
                            className="sm:w-48"
                          />
                        </div>
                        {issue.expectedCompletion && (
                          <p className="text-xs text-slate-500">
                            แจ้งผู้ซื้อว่าจะเสร็จ {safeFormatDate(issue.expectedCompletion)}
                          </p>
                        )}
                        {issue.resolvedAt && (
                          <p className="text-xs text-emerald-600">
                            ปิดงานเมื่อ {safeFormatDate(issue.resolvedAt)}
                          </p>
                        )}
                      </div>
                      <div className="space-y-3 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/40 p-3 text-xs text-emerald-700">
                        <p className="flex items-center gap-2 font-semibold">
                          <Upload className="h-4 w-4" /> แนบรูปหลังแก้ไขให้ลูกค้าเห็นความคืบหน้า
                        </p>
                        <Input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(event) => handleIssueAfterPhotosUpload(issue, event)}
                          disabled={Boolean(issuePhotoUploading[issue.id])}
                        />
                        <p className="text-xs text-emerald-600">
                          {issuePhotoUploading[issue.id]
                            ? "กำลังอัปโหลดรูป..."
                            : "เลือกรูปผลงานหลังแก้ไขเพื่อให้ผู้ซื้อมั่นใจ"}
                        </p>
                      </div>
                    </CardContent>
                    <CardFooter className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                      {issue.status === "buyer-review" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full border-amber-200 text-amber-600 hover:bg-amber-50"
                          onClick={() => handleIssueReminderClick(issue)}
                          disabled={Boolean(issueReminderState[issue.id])}
                        >
                          <BellRing className="mr-2 h-4 w-4" /> เตือนผู้ซื้อให้ตรวจซ้ำ
                        </Button>
                      )}
                      <span className="ml-auto">
                        อัปเดตล่าสุด {safeFormatDateTime(issue.updatedAt)}
                      </span>
                    </CardFooter>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
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
            ลบรายการตรวจ
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-600">
            {checklistItemToDelete
              ? `ต้องการลบ "${checklistItemToDelete.title}" ออกจากเช็คลิสต์หรือไม่?`
              : "ต้องการลบรายการนี้ออกจากเช็คลิสต์หรือไม่"}
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
            สร้างรายการ Defect ใหม่
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="defect-title" className="text-xs font-semibold text-slate-700">
              หัวข้อปัญหา
            </Label>
            <Input
              id="defect-title"
              value={reportTitle}
              onChange={(event) => setReportTitle(event.target.value)}
              placeholder="เช่น เก็บซิลิโคนรอบอ่างใหม่"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="defect-location" className="text-xs font-semibold text-slate-700">
              ตำแหน่งที่พบ
            </Label>
            <Input
              id="defect-location"
              value={reportLocation}
              onChange={(event) => setReportLocation(event.target.value)}
              placeholder="เช่น ห้องน้ำชั้น 2"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="defect-description" className="text-xs font-semibold text-slate-700">
              รายละเอียดเพิ่มเติม (ไม่บังคับ)
            </Label>
            <Textarea
              id="defect-description"
              value={reportDescription}
              onChange={(event) => setReportDescription(event.target.value)}
              placeholder="บรรยายสิ่งที่ต้องแก้ไขหรือวัสดุที่ต้องใช้"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-700">
              แนบรูปก่อนแก้ไข (ไม่บังคับ)
            </Label>
            <div className="space-y-3 rounded-2xl border border-dashed border-slate-200 p-4">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Upload className="h-4 w-4 text-slate-400" /> เพิ่มรูปเพื่อให้ทีมเห็นปัญหาเดิม
              </div>
              <Input
                ref={reportBeforeInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleReportBeforePhotoChange}
                disabled={creatingIssue}
              />
              {reportBeforePhotos.length === 0 ? (
                <p className="text-xs text-slate-500">
                  เลือกรูปสภาพก่อนแก้ไขเพื่อใช้เปรียบเทียบกับงานที่ปรับแล้ว
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
                        alt="ก่อนแก้ไข"
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="defect-date" className="text-xs font-semibold text-slate-700">
                กำหนดเสร็จ (ไม่บังคับ)
              </Label>
              <Input
                id="defect-date"
                type="date"
                value={reportExpectedDate}
                onChange={(event) => setReportExpectedDate(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="defect-owner" className="text-xs font-semibold text-slate-700">
                ผู้รับผิดชอบ (ไม่บังคับ)
              </Label>
              <Input
                id="defect-owner"
                value={reportOwner}
                onChange={(event) => setReportOwner(event.target.value)}
                placeholder="เช่น ทีมช่างคุณเอ็ม"
              />
            </div>
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
              onClick={handleCreateIssue}
              disabled={creatingIssue}
              className="bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60"
            >
              บันทึกรายการ
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}
