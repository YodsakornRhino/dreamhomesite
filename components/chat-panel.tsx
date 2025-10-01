"use client"
import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Images,
  Loader2,
  MessageSquareText,
  Paperclip,
  Pin,
  PinOff,
  Play,
  Search,
  Send,
  X,
  ImageIcon,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useAuthContext } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import type {
  PropertyPreviewOpenEventDetail,
  PropertyPreviewPayload,
} from "@/types/chat"
import {
  addDocument,
  setDocument,
  subscribeToCollection,
  subscribeToDocument,
  updateDocument,
} from "@/lib/firestore"
import { getDownloadURL, uploadFile } from "@/lib/storage"
import { cn } from "@/lib/utils"
import { formatPropertyPrice, TRANSACTION_LABELS } from "@/lib/property"

interface ChatPanelProps {
  isOpen: boolean
  onClose: () => void
  requestedParticipantId?: string | null
  onRequestParticipantHandled?: () => void
  requestedPropertyPreview?: PropertyPreviewPayload | null
  onRequestPropertyPreviewHandled?: () => void
}

interface ChatThread {
  id: string
  participants: string[]
  lastMessage?: string
  lastSenderId?: string
  updatedAt?: Date | null
  pinnedBy?: string[]
}

type AttachmentKind = "image" | "video" | "file"

interface ChatMessageAttachment {
  url: string
  storagePath: string
  contentType?: string
  name?: string
  size?: number
  type: AttachmentKind
}

type ChatMessagePropertyPreview = PropertyPreviewPayload

interface ChatMessage {
  id: string
  text: string
  senderId: string
  createdAt?: Date | null
  attachments?: ChatMessageAttachment[]
  propertyPreview?: ChatMessagePropertyPreview
}

interface UserProfileSummary {
  uid: string
  name?: string
  email?: string
  photoURL?: string
}

interface PropertyPurchaseStatus {
  isUnderPurchase: boolean
  confirmedBuyerId: string | null
  buyerConfirmed: boolean
  sellerDocumentsConfirmed: boolean
}

const createChatId = (first: string, second: string) => {
  return [first, second].sort().join("__")
}

const resolveAttachmentKind = (contentType?: string | null): AttachmentKind => {
  if (!contentType) return "file"
  if (contentType.startsWith("image/")) return "image"
  if (contentType.startsWith("video/")) return "video"
  return "file"
}

const describeAttachmentSummary = (attachments: { type: AttachmentKind }[]) => {
  const hasImages = attachments.some((attachment) => attachment.type === "image")
  const hasVideos = attachments.some((attachment) => attachment.type === "video")

  if (hasImages && hasVideos) {
    return "ส่งรูปและวิดีโอ"
  }

  if (hasImages) {
    return attachments.length > 1 ? `ส่งรูปภาพ ${attachments.length} รูป` : "ส่งรูปภาพ"
  }

  if (hasVideos) {
    return attachments.length > 1 ? `ส่งวิดีโอ ${attachments.length} รายการ` : "ส่งวิดีโอ"
  }

  return attachments.length > 1 ? `ส่งไฟล์ ${attachments.length} รายการ` : "ส่งไฟล์"
}

const sanitizeFileName = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, "_")

const getDisplayName = (profile?: UserProfileSummary | null) => {
  if (!profile) return "ผู้ใช้ DreamHome"
  return profile.name?.trim() || profile.email?.split("@")[0] || "ผู้ใช้ DreamHome"
}

const getAvatarFallback = (profile?: UserProfileSummary | null) => {
  const base = profile?.name || profile?.email || "DM"
  return base.substring(0, 2).toUpperCase()
}

const formatThreadTime = (date?: Date | null) => {
  if (!date) return ""

  const now = new Date()
  const sameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()

  if (sameDay) {
    return new Intl.DateTimeFormat("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  return new Intl.DateTimeFormat("th-TH", {
    day: "2-digit",
    month: "short",
  }).format(date)
}

const formatMessageTime = (date?: Date | null) => {
  if (!date) return ""
  return new Intl.DateTimeFormat("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

interface SendMessageOptions {
  text?: string
  attachments?: ChatMessageAttachment[]
  propertyPreview?: PropertyPreviewPayload | null
}

const sanitizePropertyPreview = (preview: PropertyPreviewPayload) => {
  return {
    propertyId: preview.propertyId,
    ownerUid: preview.ownerUid,
    title: preview.title,
    price: typeof preview.price === "number" ? preview.price : null,
    transactionType:
      typeof preview.transactionType === "string" ? preview.transactionType : null,
    thumbnailUrl:
      typeof preview.thumbnailUrl === "string" && preview.thumbnailUrl.trim().length > 0
        ? preview.thumbnailUrl
        : null,
    address:
      typeof preview.address === "string" && preview.address.trim().length > 0
        ? preview.address
        : null,
    city:
      typeof preview.city === "string" && preview.city.trim().length > 0
        ? preview.city
        : null,
    province:
      typeof preview.province === "string" && preview.province.trim().length > 0
        ? preview.province
        : null,
  }
}

const formatPropertyPreviewSummary = (preview: PropertyPreviewPayload) => {
  const title = preview.title.trim()
  return title ? `สนใจประกาศ: ${title}` : "สนใจประกาศนี้"
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  isOpen,
  onClose,
  requestedParticipantId,
  onRequestParticipantHandled,
  requestedPropertyPreview,
  onRequestPropertyPreviewHandled,
}) => {
  const { user } = useAuthContext()
  const { toast } = useToast()
  const router = useRouter()

  const MAX_PENDING_ATTACHMENTS = 6

  const [shouldRender, setShouldRender] = useState(isOpen)
  const [isMobile, setIsMobile] = useState(false)
  const [threads, setThreads] = useState<ChatThread[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [userMap, setUserMap] = useState<Record<string, UserProfileSummary>>({})
  const [loadingThreads, setLoadingThreads] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [messageDraft, setMessageDraft] = useState("")
  const [sending, setSending] = useState(false)
  const [activeParticipantId, setActiveParticipantId] = useState<string | null>(null)
  const [highlightedThreadIds, setHighlightedThreadIds] = useState<string[]>([])
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null)
  const [pendingAttachments, setPendingAttachments] = useState<File[]>([])
  const [attachmentPreviews, setAttachmentPreviews] = useState<
    { id: string; url: string; kind: "image" | "video"; name: string }
  >([])
  const [queuedPropertyPreview, setQueuedPropertyPreview] =
    useState<PropertyPreviewPayload | null>(null)
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)
  const [isMediaViewerOpen, setIsMediaViewerOpen] = useState(false)
  const [selectedAttachment, setSelectedAttachment] = useState<ChatMessageAttachment | null>(null)
  const [confirmingPropertyId, setConfirmingPropertyId] = useState<string | null>(null)
  const [buyerConfirmingPropertyId, setBuyerConfirmingPropertyId] =
    useState<string | null>(null)
  const [propertyStatusMap, setPropertyStatusMap] = useState<
    Record<string, PropertyPurchaseStatus>
  >({})
  const propertySubscriptionsRef = useRef<Record<string, () => void>>({})
  const [buyerConfirmationPreview, setBuyerConfirmationPreview] =
    useState<ChatMessagePropertyPreview | null>(null)
  const buyerConfirmationDismissedRef = useRef<Set<string>>(new Set())
  const lastBuyerConfirmationPropertyIdRef = useRef<string | null>(null)

  const panelRef = useRef<HTMLDivElement>(null)
  const messageEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const lastThreadTimestampsRef = useRef<Record<string, number>>({})
  const initialThreadSnapshotRef = useRef(true)
  const lastMessageIdRef = useRef<string | null>(null)
  const userMapRef = useRef(userMap)

  const activeBuyerConfirmationStatus =
    buyerConfirmationPreview?.propertyId
      ? propertyStatusMap[buyerConfirmationPreview.propertyId]
      : undefined
  const buyerConfirmationCompleted = Boolean(activeBuyerConfirmationStatus?.buyerConfirmed)
  const buyerConfirmationLoading =
    buyerConfirmationPreview?.propertyId
      ? buyerConfirmingPropertyId === buyerConfirmationPreview.propertyId
      : false

  useEffect(() => {
    return () => {
      const subscriptions = propertySubscriptionsRef.current
      Object.values(subscriptions).forEach((unsubscribe) => unsubscribe())
      propertySubscriptionsRef.current = {}
    }
  }, [])

  useEffect(() => {
    userMapRef.current = userMap
  }, [userMap])

  useEffect(() => {
    lastThreadTimestampsRef.current = {}
    initialThreadSnapshotRef.current = true
  }, [user?.uid])

  useEffect(() => {
    if (!requestedParticipantId) {
      return
    }

    if (!user?.uid || requestedParticipantId === user.uid) {
      onRequestParticipantHandled?.()
      return
    }

    setActiveParticipantId(requestedParticipantId)
    setHighlightedThreadIds((current) => {
      const chatId = createChatId(user.uid, requestedParticipantId)
      return current.filter((id) => id !== chatId)
    })
    onRequestParticipantHandled?.()
  }, [requestedParticipantId, onRequestParticipantHandled, user?.uid])

  useEffect(() => {
    if (!requestedPropertyPreview) {
      return
    }

    if (!user?.uid) {
      onRequestPropertyPreviewHandled?.()
      return
    }

    if (requestedPropertyPreview.ownerUid === user.uid) {
      onRequestPropertyPreviewHandled?.()
      return
    }

    setQueuedPropertyPreview(requestedPropertyPreview)
    setActiveParticipantId(requestedPropertyPreview.ownerUid)
    setHighlightedThreadIds((current) => {
      const chatId = createChatId(user.uid, requestedPropertyPreview.ownerUid)
      return current.filter((id) => id !== chatId)
    })
    onRequestPropertyPreviewHandled?.()
  }, [
    onRequestPropertyPreviewHandled,
    requestedPropertyPreview,
    user?.uid,
  ])

  useEffect(() => {
    if (pendingAttachments.length === 0) {
      setAttachmentPreviews([])
      return
    }

    const previews = pendingAttachments.map((file) => ({
      id: `${file.name}-${file.lastModified}-${file.size}`,
      url: URL.createObjectURL(file),
      kind: file.type.startsWith("video/") ? "video" : "image",
      name: file.name,
    }))

    setAttachmentPreviews(previews)

    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url))
    }
  }, [pendingAttachments])

  useEffect(() => {
    if (isOpen) return

    const subscriptions = propertySubscriptionsRef.current
    Object.values(subscriptions).forEach((unsubscribe) => unsubscribe())
    propertySubscriptionsRef.current = {}
    setPropertyStatusMap({})
    setBuyerConfirmationPreview(null)
  }, [isOpen])

  const activeChatId = useMemo(() => {
    if (!user?.uid || !activeParticipantId) return null
    return createChatId(user.uid, activeParticipantId)
  }, [activeParticipantId, user?.uid])

  const activeProfile = activeParticipantId ? userMap[activeParticipantId] : undefined

  useEffect(() => {
    if (!isOpen) return

    const propertyIds = new Set<string>()
    messages.forEach((message) => {
      const propertyId = message.propertyPreview?.propertyId
      if (propertyId) {
        propertyIds.add(propertyId)
      }
    })

    const subscriptions = propertySubscriptionsRef.current

    for (const [propertyId, unsubscribe] of Object.entries(subscriptions)) {
      if (!propertyIds.has(propertyId)) {
        unsubscribe()
        delete subscriptions[propertyId]
        setPropertyStatusMap((current) => {
          const next = { ...current }
          delete next[propertyId]
          return next
        })
      }
    }

    const newIds = Array.from(propertyIds).filter((propertyId) => !subscriptions[propertyId])
    if (newIds.length === 0) {
      return
    }

    let cancelled = false

    void Promise.all(
      newIds.map(async (propertyId) => {
        try {
          const unsubscribe = await subscribeToDocument("property", propertyId, (doc) => {
            if (cancelled) return

            const record = doc?.data() as Record<string, unknown> | null

            if (!record) {
              setPropertyStatusMap((current) => {
                const next = { ...current }
                delete next[propertyId]
                return next
              })
              return
            }

            const isUnderPurchase = Boolean(record.isUnderPurchase)
            const confirmedBuyerId =
              typeof record.confirmedBuyerId === "string" && record.confirmedBuyerId.trim().length > 0
                ? record.confirmedBuyerId
                : null
            const buyerConfirmed = Boolean(record.buyerConfirmed)
            const sellerDocumentsConfirmed = Boolean(record.sellerDocumentsConfirmed)

            setPropertyStatusMap((current) => ({
              ...current,
              [propertyId]: {
                isUnderPurchase,
                confirmedBuyerId,
                buyerConfirmed,
                sellerDocumentsConfirmed,
              },
            }))
          })

          if (cancelled) {
            unsubscribe()
            return
          }

          subscriptions[propertyId] = unsubscribe
        } catch (error) {
          console.error("Failed to subscribe property status", error)
        }
      }),
    )

    return () => {
      cancelled = true
    }
  }, [isOpen, messages])

  useEffect(() => {
    if (!user?.uid) return

    if (buyerConfirmationPreview?.propertyId) {
      const status = propertyStatusMap[buyerConfirmationPreview.propertyId]
      if (!status) {
        return
      }

      if (!status.isUnderPurchase || status.confirmedBuyerId !== user.uid || status.buyerConfirmed) {
        buyerConfirmationDismissedRef.current.delete(buyerConfirmationPreview.propertyId)
        setBuyerConfirmationPreview(null)
      }

      return
    }

    const nextPropertyId = Object.entries(propertyStatusMap).find(([propertyId, status]) => {
      if (!status?.isUnderPurchase) return false
      if (status.confirmedBuyerId !== user.uid) return false
      if (status.buyerConfirmed) return false
      if (buyerConfirmationDismissedRef.current.has(propertyId)) return false
      return true
    })?.[0]

    if (!nextPropertyId) {
      return
    }

    const preview = messages.find(
      (message): message is ChatMessage & { propertyPreview: ChatMessagePropertyPreview } =>
        Boolean(message.propertyPreview && message.propertyPreview.propertyId === nextPropertyId),
    )?.propertyPreview

    if (preview) {
      lastBuyerConfirmationPropertyIdRef.current = preview.propertyId ?? nextPropertyId
      setBuyerConfirmationPreview(preview)
    }
  }, [
    buyerConfirmationPreview?.propertyId,
    messages,
    propertyStatusMap,
    user?.uid,
  ])

  useEffect(() => {
    for (const [propertyId, status] of Object.entries(propertyStatusMap)) {
      if (!status?.isUnderPurchase || status.buyerConfirmed) {
        buyerConfirmationDismissedRef.current.delete(propertyId)
      }
    }
  }, [propertyStatusMap])

  const handleOpenPropertyPreview = useCallback(
    (preview: ChatMessagePropertyPreview) => {
      if (typeof window === "undefined") return
      if (!preview.propertyId) return

      const detail: PropertyPreviewOpenEventDetail = {
        propertyId: preview.propertyId,
        ownerUid: preview.ownerUid,
        preview,
      }

      window.dispatchEvent(
        new CustomEvent<PropertyPreviewOpenEventDetail>("dreamhome:open-property-preview", {
          detail,
        }),
      )
    },
    [],
  )

  const handleConfirmProperty = useCallback(
    async (preview: ChatMessagePropertyPreview) => {
      if (!user?.uid) {
        toast({
          variant: "destructive",
          title: "ไม่สามารถยืนยันได้",
          description: "กรุณาเข้าสู่ระบบเพื่อดำเนินการยืนยันประกาศ",
        })
        return
      }

      if (preview.ownerUid !== user.uid) {
        return
      }

      if (!preview.propertyId) {
        toast({
          variant: "destructive",
          title: "ไม่พบประกาศ",
          description: "ไม่พบรหัสประกาศสำหรับการยืนยัน",
        })
        return
      }

      if (!activeParticipantId) {
        toast({
          variant: "destructive",
          title: "ไม่พบผู้ซื้อ",
          description: "กรุณาเลือกบทสนทนากับผู้ซื้อก่อนยืนยัน",
        })
        return
      }

      const status = propertyStatusMap[preview.propertyId]
      if (status?.isUnderPurchase) {
        toast({
          title: "ประกาศถูกยืนยันแล้ว",
          description: "ประกาศนี้มีผู้กำลังดำเนินการซื้ออยู่",
        })

        if (preview.propertyId) {
          router.push(`/sell/send-documents?propertyId=${preview.propertyId}`)
        }

        return
      }

      setConfirmingPropertyId(preview.propertyId)

      try {
        await Promise.all([
          updateDocument("property", preview.propertyId, {
            isUnderPurchase: true,
            confirmedBuyerId: activeParticipantId,
            buyerConfirmed: false,
            sellerDocumentsConfirmed: false,
          }),
          updateDocument(
            `users/${preview.ownerUid}/user_property`,
            preview.propertyId,
            {
              isUnderPurchase: true,
              confirmedBuyerId: activeParticipantId,
              buyerConfirmed: false,
              sellerDocumentsConfirmed: false,
            },
          ),
        ])

        toast({
          title: "ยืนยันประกาศสำเร็จ",
          description: "ระบบได้แจ้งเตือนผู้ซื้อเรียบร้อยแล้ว",
        })

        router.push(`/sell/send-documents?propertyId=${preview.propertyId}`)
      } catch (error) {
        console.error("Failed to confirm property purchase", error)
        toast({
          variant: "destructive",
          title: "ยืนยันไม่สำเร็จ",
          description: error instanceof Error ? error.message : "กรุณาลองใหม่อีกครั้ง",
        })
      } finally {
        setConfirmingPropertyId(null)
      }
    },
    [activeParticipantId, propertyStatusMap, router, toast, user?.uid],
  )

  const handleBuyerConfirmProperty = useCallback(
    async (preview: ChatMessagePropertyPreview) => {
      if (!user?.uid) {
        toast({
          variant: "destructive",
          title: "ไม่สามารถยืนยันได้",
          description: "กรุณาเข้าสู่ระบบเพื่อดำเนินการยืนยัน",
        })
        return
      }

      if (!preview.propertyId) {
        toast({
          variant: "destructive",
          title: "ไม่พบประกาศ",
          description: "ไม่พบรหัสประกาศสำหรับการยืนยัน",
        })
        return
      }

      const status = propertyStatusMap[preview.propertyId]
      if (!status?.isUnderPurchase || status.confirmedBuyerId !== user.uid) {
        toast({
          variant: "destructive",
          title: "ไม่สามารถยืนยันประกาศนี้ได้",
          description: "สถานะประกาศไม่รองรับการยืนยันโดยผู้ใช้คนนี้",
        })
        return
      }

      if (status.buyerConfirmed) {
        toast({
          title: "ยืนยันแล้ว",
          description: "คุณได้ยืนยันประกาศนี้ไปก่อนหน้านี้แล้ว",
        })

        if (preview.propertyId) {
          router.push(`/buy/send-documents?propertyId=${preview.propertyId}`)
        }

        return
      }

      setBuyerConfirmingPropertyId(preview.propertyId)

      try {
        await Promise.all([
          updateDocument("property", preview.propertyId, {
            buyerConfirmed: true,
          }),
          updateDocument(
            `users/${preview.ownerUid}/user_property`,
            preview.propertyId,
            {
              buyerConfirmed: true,
            },
          ),
        ])

        toast({
          title: "ยืนยันการซื้อเรียบร้อย",
          description: "ตรวจสอบรายการเอกสารที่ต้องเตรียมในขั้นตอนถัดไป",
        })

        buyerConfirmationDismissedRef.current.delete(preview.propertyId)
        lastBuyerConfirmationPropertyIdRef.current = preview.propertyId
        setBuyerConfirmationPreview(null)
        router.push(`/buy/send-documents?propertyId=${preview.propertyId}`)
      } catch (error) {
        console.error("Failed to confirm buyer acknowledgment", error)
        toast({
          variant: "destructive",
          title: "ยืนยันไม่สำเร็จ",
          description: error instanceof Error ? error.message : "กรุณาลองใหม่อีกครั้ง",
        })
      } finally {
        setBuyerConfirmingPropertyId(null)
      }
    },
    [propertyStatusMap, router, toast, user?.uid],
  )

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true)
      return
    }

    const timeoutId = window.setTimeout(() => setShouldRender(false), 300)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const updateMedia = () => {
      setIsMobile(window.innerWidth < 768)
    }

    updateMedia()
    window.addEventListener("resize", updateMedia)

    return () => {
      window.removeEventListener("resize", updateMedia)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, onClose])

  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      const panelElement = panelRef.current
      if (!panelElement) {
        return
      }

      const rawTarget = event.target
      const targetElement =
        rawTarget instanceof Element
          ? rawTarget
          : rawTarget instanceof Text
            ? rawTarget.parentElement
            : null

      if (!targetElement) {
        onClose()
        return
      }

      if (panelElement.contains(targetElement)) {
        return
      }

      if (targetElement.closest("[data-chat-panel-keep-open]")) {
        return
      }

      const composedPath = typeof event.composedPath === "function" ? event.composedPath() : []
      if (composedPath.some((node) => node instanceof Element && node.hasAttribute("data-chat-panel-keep-open"))) {
        return
      }

      onClose()
    }

    document.addEventListener("pointerdown", handlePointerDown)

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
    }
  }, [isOpen, onClose])

  useEffect(() => {
    if (!isOpen) {
      setActiveParticipantId(null)
      setMessages([])
      setSearchTerm("")
      setMessageDraft("")
      setHighlightedMessageId(null)
      setIsGalleryOpen(false)
      setIsMediaViewerOpen(false)
      setSelectedAttachment(null)
      lastMessageIdRef.current = null
      setPendingAttachments([])
      setAttachmentPreviews([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      return
    }
  }, [isOpen])

  useEffect(() => {
    if (!user?.uid) return

    let unsubUsers: (() => void) | undefined
    let cancelled = false

    ;(async () => {
      try {
        unsubUsers = await subscribeToCollection("users", (docs) => {
          if (cancelled) return

          const nextMap: Record<string, UserProfileSummary> = {}
          docs.forEach((doc) => {
            const data = doc.data() as Record<string, unknown>
            nextMap[doc.id] = {
              uid: doc.id,
              name: typeof data.name === "string" ? data.name : undefined,
              email: typeof data.email === "string" ? data.email : undefined,
              photoURL: typeof data.photoURL === "string" ? data.photoURL : undefined,
            }
          })
          setUserMap(nextMap)
        })
      } catch (error) {
        console.error("Failed to subscribe users", error)
        toast({
          variant: "destructive",
          title: "โหลดรายชื่อผู้ใช้ไม่สำเร็จ",
          description: error instanceof Error ? error.message : "กรุณาลองใหม่อีกครั้ง",
        })
      }
    })()

    return () => {
      cancelled = true
      unsubUsers?.()
    }
  }, [toast, user?.uid])

  const playNotificationSound = useCallback(async () => {
    try {
      if (typeof window === "undefined") return

      const AudioContextConstructor =
        window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AudioContextConstructor) return

      const audioContext = audioContextRef.current ?? new AudioContextConstructor()

      if (audioContext.state === "suspended") {
        await audioContext.resume()
      }

      const now = audioContext.currentTime
      const oscillator = audioContext.createOscillator()
      const gain = audioContext.createGain()

      oscillator.type = "sine"
      oscillator.frequency.setValueAtTime(880, now)

      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(0.16, now + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5)

      oscillator.connect(gain)
      gain.connect(audioContext.destination)

      oscillator.start(now)
      oscillator.stop(now + 0.5)

      audioContextRef.current = audioContext
    } catch (error) {
      console.error("Failed to play notification sound", error)
    }
  }, [])

  useEffect(() => {
    if (!user?.uid) return

    let unsubThreads: (() => void) | undefined
    let cancelled = false

    setLoadingThreads(true)

    ;(async () => {
      try {
        const { where, orderBy } = await import("firebase/firestore")
        unsubThreads = await subscribeToCollection(
          "chats",
          (docs) => {
            if (cancelled) return

            const mapped = docs.map((doc) => {
              const data = doc.data() as Record<string, any>
              return {
                id: doc.id,
                participants: Array.isArray(data.participants)
                  ? (data.participants as string[])
                  : [],
                lastMessage: typeof data.lastMessage === "string" ? data.lastMessage : undefined,
                lastSenderId: typeof data.lastSenderId === "string" ? data.lastSenderId : undefined,
                updatedAt:
                  data.updatedAt && typeof data.updatedAt.toDate === "function"
                    ? (data.updatedAt.toDate() as Date)
                    : null,
                pinnedBy: Array.isArray(data.pinnedBy) ? (data.pinnedBy as string[]) : [],
              }
            })

            if (initialThreadSnapshotRef.current) {
              const timestampMap: Record<string, number> = {}
              mapped.forEach((thread) => {
                if (thread.updatedAt) {
                  timestampMap[thread.id] = thread.updatedAt.getTime()
                }
              })
              lastThreadTimestampsRef.current = timestampMap
              initialThreadSnapshotRef.current = false
            } else {
              const updatedTimestamps: Record<string, number> = {}
              const newThreadIds: string[] = []

              mapped.forEach((thread) => {
                const updatedAtMs = thread.updatedAt ? thread.updatedAt.getTime() : 0
                const previous = lastThreadTimestampsRef.current[thread.id] ?? 0
                updatedTimestamps[thread.id] = updatedAtMs

                if (
                  updatedAtMs > previous &&
                  thread.lastSenderId &&
                  thread.lastSenderId !== user?.uid
                ) {
                  newThreadIds.push(thread.id)
                }
              })

              lastThreadTimestampsRef.current = updatedTimestamps

              if (newThreadIds.length > 0) {
                setHighlightedThreadIds((prev) => {
                  const merged = new Set(prev)
                  newThreadIds.forEach((id) => merged.add(id))
                  return Array.from(merged)
                })
                void playNotificationSound()

                newThreadIds.forEach((threadId) => {
                  const thread = mapped.find((item) => item.id === threadId)
                  if (!thread) return

                  const otherParticipantId = thread.participants.find((participantId) => participantId !== user?.uid)
                  if (!otherParticipantId) return

                  const profile = userMapRef.current?.[otherParticipantId]
                  const displayName = getDisplayName(profile)
                  const messagePreview = thread.lastMessage?.trim()

                  toast({
                    title: `มีการติดต่อจาก ${displayName}`,
                    description: messagePreview && messagePreview.length > 0 ? messagePreview : "มีข้อความใหม่รอคุณอยู่",
                  })
                })
              }
            }

            setThreads(mapped)
            setHighlightedThreadIds((prev) => prev.filter((id) => mapped.some((thread) => thread.id === id)))
            setLoadingThreads(false)
          },
          where("participants", "array-contains", user.uid),
          orderBy("updatedAt", "desc"),
        )
      } catch (error) {
        console.error("Failed to subscribe chats", error)
        setLoadingThreads(false)
        toast({
          variant: "destructive",
          title: "โหลดแชทไม่สำเร็จ",
          description: error instanceof Error ? error.message : "กรุณาลองใหม่อีกครั้ง",
        })
      }
    })()

    return () => {
      cancelled = true
      unsubThreads?.()
    }
  }, [playNotificationSound, toast, user?.uid])

  useEffect(() => {
    if (!isOpen || !activeChatId) {
      setMessages([])
      setLoadingMessages(false)
      return
    }

    let unsubMessages: (() => void) | undefined
    let cancelled = false

    setLoadingMessages(true)

    ;(async () => {
      try {
        const { orderBy } = await import("firebase/firestore")
        unsubMessages = await subscribeToCollection(
          `chats/${activeChatId}/messages`,
          (docs) => {
            if (cancelled) return

            const mapped = docs.map((doc) => {
              const data = doc.data() as Record<string, any>
              const attachments = Array.isArray(data.attachments)
                ? data.attachments
                    .map((raw) => {
                      if (!raw || typeof raw !== "object") return null

                      const url = typeof raw.url === "string" ? raw.url : ""
                      if (!url) return null

                      const storagePath = typeof raw.storagePath === "string" ? raw.storagePath : ""
                      const contentType = typeof raw.contentType === "string" ? raw.contentType : null
                      const typeValue = typeof raw.type === "string" ? raw.type : undefined
                      const resolvedType =
                        typeValue === "image" || typeValue === "video" || typeValue === "file"
                          ? typeValue
                          : resolveAttachmentKind(contentType)

                      return {
                        url,
                        storagePath,
                        contentType: contentType ?? undefined,
                        name: typeof raw.name === "string" ? raw.name : undefined,
                        size: typeof raw.size === "number" ? raw.size : undefined,
                        type: resolvedType,
                      } satisfies ChatMessageAttachment
                    })
                    .filter((value): value is ChatMessageAttachment => Boolean(value))
                : []

              let propertyPreview: ChatMessagePropertyPreview | undefined
              const rawPreview = data.propertyPreview
              if (rawPreview && typeof rawPreview === "object") {
                const previewRecord = rawPreview as Record<string, unknown>
                const propertyId =
                  typeof previewRecord.propertyId === "string"
                    ? previewRecord.propertyId
                    : ""
                const ownerUid =
                  typeof previewRecord.ownerUid === "string"
                    ? previewRecord.ownerUid
                    : ""
                const title =
                  typeof previewRecord.title === "string" ? previewRecord.title : ""

                if (propertyId && ownerUid && title) {
                  propertyPreview = {
                    propertyId,
                    ownerUid,
                    title,
                    price:
                      typeof previewRecord.price === "number"
                        ? previewRecord.price
                        : null,
                    transactionType:
                      typeof previewRecord.transactionType === "string"
                        ? previewRecord.transactionType
                        : null,
                    thumbnailUrl:
                      typeof previewRecord.thumbnailUrl === "string"
                        ? previewRecord.thumbnailUrl
                        : null,
                    address:
                      typeof previewRecord.address === "string"
                        ? previewRecord.address
                        : null,
                    city:
                      typeof previewRecord.city === "string"
                        ? previewRecord.city
                        : null,
                    province:
                      typeof previewRecord.province === "string"
                        ? previewRecord.province
                        : null,
                  }
                }
              }

              return {
                id: doc.id,
                text: typeof data.text === "string" ? data.text : "",
                senderId: typeof data.senderId === "string" ? data.senderId : "",
                createdAt:
                  data.createdAt && typeof data.createdAt.toDate === "function"
                    ? (data.createdAt.toDate() as Date)
                    : null,
                attachments,
                propertyPreview,
              }
            })

            setMessages(mapped)
            setLoadingMessages(false)

            if (mapped.length === 0) {
              lastMessageIdRef.current = null
              return
            }

            const latestMessage = mapped[mapped.length - 1]
            if (latestMessage.id !== lastMessageIdRef.current) {
              lastMessageIdRef.current = latestMessage.id
              if (latestMessage.senderId !== user?.uid) {
                setHighlightedMessageId(latestMessage.id)
              }
            }
          },
          orderBy("createdAt", "asc"),
        )
      } catch (error) {
        console.error("Failed to subscribe messages", error)
        setLoadingMessages(false)
        toast({
          variant: "destructive",
          title: "โหลดข้อความไม่สำเร็จ",
          description: error instanceof Error ? error.message : "กรุณาลองใหม่อีกครั้ง",
        })
      }
    })()

    return () => {
      cancelled = true
      unsubMessages?.()
    }
  }, [activeChatId, isOpen, toast])

  useEffect(() => {
    if (!isOpen || !activeParticipantId) return
    inputRef.current?.focus()
  }, [activeParticipantId, isOpen])

  useEffect(() => {
    if (!isOpen || !activeParticipantId) return
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isOpen, activeParticipantId])

  useEffect(() => {
    setMessageDraft("")
    setHighlightedMessageId(null)
    lastMessageIdRef.current = null
    setPendingAttachments([])
    setAttachmentPreviews([])
    setIsGalleryOpen(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [activeChatId])

  useEffect(() => {
    if (!activeChatId) return
    setHighlightedThreadIds((current) => current.filter((id) => id !== activeChatId))
  }, [activeChatId])

  useEffect(() => {
    if (!highlightedMessageId) return

    const timeoutId = window.setTimeout(() => {
      setHighlightedMessageId((current) => (current === highlightedMessageId ? null : current))
    }, 3500)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [highlightedMessageId])

  const normalizedSearch = searchTerm.trim().toLowerCase()

  const threadEntries = useMemo(() => {
    if (!user?.uid) return [] as {
      thread: ChatThread
      otherId: string
      profile?: UserProfileSummary
      matches: boolean
    }[]

    return threads
      .map((thread) => {
        const otherId = thread.participants.find((pid) => pid !== user.uid)
        if (!otherId) return null
        const profile = userMap[otherId]
        const name = getDisplayName(profile).toLowerCase()
        const email = (profile?.email || "").toLowerCase()
        const matches =
          normalizedSearch.length === 0 ||
          name.includes(normalizedSearch) ||
          email.includes(normalizedSearch)

        return {
          thread,
          otherId,
          profile,
          matches,
        }
      })
      .filter(Boolean) as {
      thread: ChatThread
      otherId: string
      profile?: UserProfileSummary
      matches: boolean
    }[]
  }, [normalizedSearch, threads, user?.uid, userMap])

  const filteredThreads = useMemo(
    () => threadEntries.filter((entry) => entry.matches),
    [threadEntries],
  )

  const visibleThreads = useMemo(() => {
    if (!user?.uid) return filteredThreads

    return [...filteredThreads].sort((a, b) => {
      const aPinned = a.thread.pinnedBy?.includes(user.uid) ?? false
      const bPinned = b.thread.pinnedBy?.includes(user.uid) ?? false

      if (aPinned !== bPinned) {
        return aPinned ? -1 : 1
      }

      const aTime = a.thread.updatedAt ? a.thread.updatedAt.getTime() : 0
      const bTime = b.thread.updatedAt ? b.thread.updatedAt.getTime() : 0

      return bTime - aTime
    })
  }, [filteredThreads, user?.uid])

  const handleSelectParticipant = (targetUid: string) => {
    if (!user?.uid) return
    setActiveParticipantId(targetUid)
    const chatId = createChatId(user.uid, targetUid)
    setHighlightedThreadIds((prev) => prev.filter((id) => id !== chatId))
  }

  const handleFileButtonClick = () => {
    if (sending) return
    fileInputRef.current?.click()
  }

  const handleAttachmentChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ""

    if (files.length === 0) return

    const acceptedFiles = files.filter((file) => file.type.startsWith("image/") || file.type.startsWith("video/"))
    const rejectedCount = files.length - acceptedFiles.length

    if (rejectedCount > 0) {
      toast({
        variant: "destructive",
        title: "ไม่สามารถแนบไฟล์ได้",
        description: "รองรับเฉพาะไฟล์รูปภาพหรือวิดีโอเท่านั้น",
      })
    }

    if (acceptedFiles.length === 0) {
      return
    }

    const limitMessage = `สามารถแนบไฟล์ได้สูงสุด ${MAX_PENDING_ATTACHMENTS} ไฟล์ต่อครั้ง`

    if (pendingAttachments.length >= MAX_PENDING_ATTACHMENTS) {
      toast({
        title: "จำกัดจำนวนไฟล์",
        description: limitMessage,
      })
      return
    }

    const availableSlots = MAX_PENDING_ATTACHMENTS - pendingAttachments.length
    const filesToAdd = acceptedFiles.slice(0, availableSlots)

    if (filesToAdd.length === 0) {
      toast({
        title: "จำกัดจำนวนไฟล์",
        description: limitMessage,
      })
      return
    }

    if (filesToAdd.length < acceptedFiles.length) {
      toast({
        title: "จำกัดจำนวนไฟล์",
        description: limitMessage,
      })
    }

    setPendingAttachments((prev) => [...prev, ...filesToAdd])
  }

  const handleRemoveAttachment = (index: number) => {
    setPendingAttachments((prev) => prev.filter((_, itemIndex) => itemIndex !== index))
  }

  const mediaAttachments = useMemo(() => {
    return messages
      .flatMap((message) =>
        (message.attachments || []).map((attachment) => ({
          ...attachment,
          createdAt: message.createdAt ?? null,
          messageId: message.id,
        })),
      )
      .filter((attachment) => attachment.type === "image" || attachment.type === "video")
      .sort((a, b) => {
        const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 0
        const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 0
        return bTime - aTime
      })
  }, [messages])

  const handleToggleGallery = () => {
    setIsGalleryOpen((prev) => !prev)
  }

  const handleAttachmentClick = (attachment: ChatMessageAttachment) => {
    setSelectedAttachment(attachment)
    setIsMediaViewerOpen(true)
  }

  const handleMediaViewerOpenChange = (open: boolean) => {
    if (!open) {
      setIsMediaViewerOpen(false)
      setSelectedAttachment(null)
    }
  }

  const sendMessageToChat = useCallback(
    async (targetUid: string, options: SendMessageOptions) => {
      if (!user?.uid) {
        throw new Error("กรุณาเข้าสู่ระบบก่อนส่งข้อความ")
      }

      const { serverTimestamp } = await import("firebase/firestore")
      const chatId = createChatId(user.uid, targetUid)
      const participants = [user.uid, targetUid].sort()

      const trimmedText = options.text?.trim() ?? ""
      const attachments = options.attachments ?? []
      const propertyPreview = options.propertyPreview ?? null

      let messagePreview = trimmedText
      if (!messagePreview && propertyPreview) {
        messagePreview = formatPropertyPreviewSummary(propertyPreview)
      }
      if (!messagePreview && attachments.length > 0) {
        messagePreview = describeAttachmentSummary(attachments)
      }

      const timestamp = serverTimestamp()
      const messageData: Record<string, unknown> = {
        text: trimmedText,
        senderId: user.uid,
        createdAt: timestamp,
      }

      if (attachments.length > 0) {
        messageData.attachments = attachments
      }

      if (propertyPreview) {
        messageData.propertyPreview = sanitizePropertyPreview(propertyPreview)
      }

      await Promise.all([
        addDocument(`chats/${chatId}/messages`, messageData),
        setDocument("chats", chatId, {
          participants,
          lastMessage: messagePreview,
          lastSenderId: user.uid,
          updatedAt: serverTimestamp(),
        }),
      ])
    },
    [user?.uid],
  )

  const handleSendMessage = async () => {
    if (!user?.uid || !activeParticipantId) return

    const trimmed = messageDraft.trim()
    const hasAttachments = pendingAttachments.length > 0
    if (!trimmed && !hasAttachments) return

    setSending(true)

    try {
      const chatId = createChatId(user.uid, activeParticipantId)
      let attachmentsPayload: ChatMessageAttachment[] = []

      if (hasAttachments) {
        const baseTimestamp = Date.now()
        attachmentsPayload = await Promise.all(
          pendingAttachments.map(async (file, index) => {
            const safeOriginalName = file.name || `attachment-${index + 1}`
            const storagePath = `chat-attachments/${chatId}/${baseTimestamp}-${index}-${sanitizeFileName(safeOriginalName)}`
            const metadata =
              file.type && file.type.length > 0
                ? { contentType: file.type, customMetadata: { originalName: safeOriginalName } }
                : { customMetadata: { originalName: safeOriginalName } }

            const uploadResult = await uploadFile(storagePath, file, metadata)
            const fullPath = uploadResult.metadata.fullPath ?? storagePath
            const downloadURL = await getDownloadURL(fullPath)
            const contentType = uploadResult.metadata.contentType ?? file.type ?? null

            return {
              url: downloadURL,
              storagePath: fullPath,
              contentType: contentType ?? undefined,
              name: uploadResult.metadata.name ?? safeOriginalName,
              size: uploadResult.metadata.size ?? file.size,
              type: resolveAttachmentKind(contentType),
            }
          }),
        )
      }

      await sendMessageToChat(activeParticipantId, {
        text: trimmed,
        attachments: attachmentsPayload,
      })

      setMessageDraft("")
      setPendingAttachments([])
      setAttachmentPreviews([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      console.error("Failed to send message", error)
      toast({
        variant: "destructive",
        title: "ส่งข้อความไม่สำเร็จ",
        description: error instanceof Error ? error.message : "กรุณาลองใหม่อีกครั้ง",
      })
    } finally {
      setSending(false)
    }
  }

  useEffect(() => {
    if (!queuedPropertyPreview) return
    if (!user?.uid) {
      setQueuedPropertyPreview(null)
      return
    }

    const targetUid = queuedPropertyPreview.ownerUid
    if (!targetUid || targetUid === user.uid) {
      setQueuedPropertyPreview(null)
      return
    }

    if (activeParticipantId !== targetUid) {
      return
    }

    if (sending) {
      return
    }

    setSending(true)

    void (async () => {
      try {
        await sendMessageToChat(targetUid, {
          text: "ฉันสนใจประกาศนี้",
          propertyPreview: queuedPropertyPreview,
        })
      } catch (error) {
        console.error("Failed to send property interest", error)
        toast({
          variant: "destructive",
          title: "ส่งการแจ้งความสนใจไม่สำเร็จ",
          description:
            error instanceof Error ? error.message : "กรุณาลองใหม่อีกครั้ง",
        })
      } finally {
        setSending(false)
        setQueuedPropertyPreview(null)
      }
    })()
  }, [
    activeParticipantId,
    queuedPropertyPreview,
    sending,
    sendMessageToChat,
    toast,
    user?.uid,
  ])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!sending) {
      void handleSendMessage()
    }
  }

  const handleBackToThreads = () => {
    if (!isMobile) return
    setActiveParticipantId(null)
  }

  const handleTogglePin = async (threadId: string, shouldPin: boolean) => {
    if (!user?.uid) return

    try {
      const { arrayRemove, arrayUnion } = await import("firebase/firestore")
      await updateDocument("chats", threadId, {
        pinnedBy: shouldPin ? arrayUnion(user.uid) : arrayRemove(user.uid),
      })
      toast({
        title: shouldPin ? "ปักหมุดการสนทนาแล้ว" : "ยกเลิกการปักหมุดแล้ว",
        description: shouldPin
          ? "บทสนทนานี้จะอยู่ด้านบนสุดเพื่อให้เข้าถึงได้ง่าย"
          : "บทสนทนานี้จะกลับมาจัดเรียงตามเวลาล่าสุด",
      })
    } catch (error) {
      console.error("Failed to toggle pin", error)
      toast({
        variant: "destructive",
        title: "ไม่สามารถเปลี่ยนสถานะปักหมุดได้",
        description: error instanceof Error ? error.message : "กรุณาลองใหม่อีกครั้ง",
      })
    }
  }

  if (!shouldRender) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[60]">
      <div
        role="presentation"
        onClick={onClose}
        className={cn(
          "absolute inset-0 z-0 bg-slate-900/20 transition-opacity duration-300",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      <div
        ref={panelRef}
        className={cn(
          "absolute bottom-4 left-3 right-3 top-20 z-10 mx-auto max-w-full pointer-events-auto transition-all duration-300 sm:left-6 sm:right-6 sm:top-24 sm:max-w-3xl md:left-auto md:right-8 md:mx-0 md:w-[min(90vw,60rem)] lg:w-[min(85vw,72rem)]",
          isOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none",
        )}
      >
      <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white/95 shadow-2xl backdrop-blur">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white/90 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white">
              <MessageSquareText className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-base font-semibold text-gray-900">แชทซื้อบ้าน</h2>
              <p className="text-xs text-gray-500">พูดคุยกับผู้ใช้ DreamHome เพื่อสอบถามรายละเอียดบ้าน</p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-9 w-9 rounded-full text-gray-500 hover:text-gray-900"
          >
            <X className="h-5 w-5" />
          </Button>
        </header>

        {!user?.uid ? (
          <div className="flex flex-1 flex-col items-center justify-center space-y-3 p-8 text-center">
            <MessageSquareText className="h-10 w-10 text-blue-500" />
            <p className="text-sm font-medium text-gray-700">
              กรุณาเข้าสู่ระบบเพื่อเริ่มต้นสนทนากับผู้ขายหรือเจ้าหน้าที่ของเรา
            </p>
          </div>
        ) : (
          <>
            <div className="relative flex flex-1 overflow-hidden bg-white/50">
              <div
                className={cn(
                  "h-full overflow-y-auto border-r border-slate-100 bg-white/80 backdrop-blur transition-all duration-300 md:static md:w-72 md:translate-x-0 md:opacity-100 lg:w-80 xl:w-96",
                  isMobile
                    ? activeParticipantId
                      ? "absolute inset-0 z-30 w-full -translate-x-full opacity-0"
                      : "absolute inset-0 z-30 w-full translate-x-0 opacity-100"
                    : "w-60",
                )}
              >
                <div className="border-b border-slate-100 p-4 md:p-5">
                  <div className="relative flex items-center">
                    <Search className="absolute left-3 h-4 w-4 text-gray-400" />
                    <Input
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="ค้นหาชื่อหรืออีเมล"
                      className="h-9 rounded-full bg-slate-100 pl-9 pr-3 text-sm md:h-10 md:text-base"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2 p-3 md:p-4">
                  {loadingThreads ? (
                    <div className="flex flex-col gap-2">
                      {Array.from({ length: 4 }).map((_, index) => (
                        <div key={`skeleton-${index}`} className="flex items-center gap-3 rounded-xl bg-slate-100/70 p-3">
                          <div className="h-10 w-10 animate-pulse rounded-full bg-slate-200" />
                          <div className="flex-1 space-y-2">
                            <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
                            <div className="h-3 w-36 animate-pulse rounded bg-slate-100" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : visibleThreads.length === 0 ? (
                    <p className="px-2 py-6 text-center text-sm text-gray-500">
                      {normalizedSearch
                        ? "ไม่พบรายชื่อที่ตรงกับการค้นหา"
                        : "ยังไม่มีบทสนทนา เริ่มต้นแชทกับผู้ใช้งานได้เลย"}
                    </p>
                  ) : (
                    visibleThreads.map(({ thread, otherId, profile }) => {
                      const chatId = thread.id
                      const isActive = activeChatId === chatId
                      const isPinned = user?.uid ? thread.pinnedBy?.includes(user.uid) : false
                      const isHighlighted = highlightedThreadIds.includes(chatId)
                      const previewPrefix = thread.lastSenderId === user?.uid ? "คุณ: " : ""
                      return (
                        <button
                          key={chatId}
                          type="button"
                          onClick={() => handleSelectParticipant(otherId)}
                          className={cn(
                            "group flex w-full items-center gap-3 rounded-2xl border bg-white/70 p-3 text-left transition",
                            "hover:border-blue-100 hover:bg-blue-50/70",
                            isActive && "border-blue-200 bg-blue-50 shadow-inner",
                            !isActive && "border-slate-100 shadow-sm",
                            isHighlighted && !isActive && "border-blue-300 bg-blue-50/90",
                            isHighlighted && !isActive && "animate-pulse",
                          )}
                        >
                          <Avatar className="h-11 w-11 border border-slate-200">
                            <AvatarImage src={profile?.photoURL || ""} alt={getDisplayName(profile)} />
                            <AvatarFallback className="bg-blue-100 text-sm font-semibold text-blue-600">
                              {getAvatarFallback(profile)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex min-w-0 flex-1 flex-col">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex flex-col">
                                <span
                                  className={cn(
                                    "truncate text-sm font-semibold text-gray-900",
                                    isHighlighted && "text-blue-700",
                                  )}
                                >
                                  {getDisplayName(profile)}
                                </span>
                                {isPinned && (
                                  <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-blue-500">
                                    <Pin className="h-3 w-3 -rotate-45" /> ปักหมุดแล้ว
                                  </span>
                                )}
                              </div>
                              <span className="mt-0.5 text-[11px] uppercase tracking-wide text-gray-400">
                                {formatThreadTime(thread.updatedAt)}
                              </span>
                            </div>
                            <span
                              className={cn(
                                "truncate text-xs text-gray-500",
                                isActive && "text-gray-600",
                                isHighlighted && !isActive && "font-medium text-blue-600",
                              )}
                            >
                              {thread.lastMessage ? `${previewPrefix}${thread.lastMessage}` : "ยังไม่มีข้อความ"}
                            </span>
                          </div>
                          {user?.uid && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={(event) => {
                                event.stopPropagation()
                                handleTogglePin(chatId, !isPinned)
                              }}
                              className={cn(
                                "h-8 w-8 rounded-full text-gray-400 transition",
                                "hover:text-blue-600",
                                isPinned && "text-blue-600",
                              )}
                            >
                              {isPinned ? <Pin className="h-4 w-4 -rotate-45" /> : <PinOff className="h-4 w-4" />}
                            </Button>
                          )}
                        </button>
                      )
                    })
                  )}
                </div>

              </div>

              <div
                className={cn(
                  "flex h-full flex-1 flex-col bg-slate-50/80 backdrop-blur transition-all duration-300 md:static md:flex-1 md:border-l md:border-slate-100",
                  isMobile
                    ? activeParticipantId
                      ? "absolute inset-0 z-20 w-full translate-x-0 opacity-100"
                      : "absolute inset-0 z-20 w-full translate-x-full opacity-0"
                    : "",
                )}
              >
                {activeParticipantId ? (
                  <>
                    <div className="flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 md:px-6 md:py-4">
                      <div className="flex items-center gap-3">
                        {isMobile && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full text-gray-500 hover:text-gray-900"
                            onClick={handleBackToThreads}
                          >
                            <ArrowLeft className="h-4 w-4" />
                          </Button>
                        )}
                        <Avatar className="h-10 w-10 border border-slate-200">
                          <AvatarImage src={activeProfile?.photoURL || ""} alt={getDisplayName(activeProfile)} />
                          <AvatarFallback className="bg-blue-100 text-sm font-semibold text-blue-600">
                            {getAvatarFallback(activeProfile)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-900">{getDisplayName(activeProfile)}</span>
                          <span className="text-xs text-gray-500">พูดคุยเกี่ยวกับการซื้อบ้าน</span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleToggleGallery}
                        className={cn(
                          "ml-3 inline-flex h-9 items-center gap-2 rounded-full px-3 text-xs font-medium text-gray-500 transition hover:text-gray-900 sm:text-sm",
                          isGalleryOpen && "bg-blue-50 text-blue-700 hover:text-blue-700",
                          mediaAttachments.length === 0 && "text-gray-400 hover:text-gray-600",
                        )}
                        aria-pressed={isGalleryOpen}
                      >
                        <Images className="h-4 w-4" />
                        <span className="hidden sm:inline">คลังสื่อ</span>
                        <span className="inline-flex h-5 min-w-[1.5rem] items-center justify-center rounded-full bg-blue-100 px-1 text-[10px] font-semibold text-blue-600 sm:text-[11px]">
                          {mediaAttachments.length}
                        </span>
                      </Button>
                    </div>

                    {isGalleryOpen && (
                      <div className="max-h-80 overflow-y-auto border-b border-slate-200 bg-white/75 px-4 py-3 backdrop-blur md:px-6 md:py-4">
                        {mediaAttachments.length === 0 ? (
                          <p className="text-sm text-gray-500">ยังไม่มีไฟล์รูปภาพหรือวิดีโอในบทสนทนานี้</p>
                        ) : (
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                            {mediaAttachments.map((attachment) => (
                              <button
                                key={`${attachment.messageId}-${attachment.storagePath}`}
                                type="button"
                                onClick={() => handleAttachmentClick(attachment)}
                                className="group relative block aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                aria-label={attachment.name || (attachment.type === "image" ? "ดูรูปภาพ" : "ดูวิดีโอ")}
                              >
                                {attachment.type === "image" ? (
                                  <img
                                    src={attachment.url}
                                    alt={attachment.name || "ไฟล์รูปภาพ"}
                                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                  />
                                ) : (
                                  <>
                                    <video
                                      src={attachment.url}
                                      muted
                                      loop
                                      playsInline
                                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                    />
                                    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white">
                                        <Play className="h-4 w-4" />
                                      </span>
                                    </div>
                                  </>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div
                      className={cn(
                        "flex-1 overflow-y-auto px-4 py-4 transition-all duration-300 md:px-6 md:py-6",
                        "animate-in fade-in-0 duration-300",
                        "slide-in-from-right-8",
                      )}
                    >
                      {loadingMessages ? (
                        <div className="flex h-full items-center justify-center text-gray-400">
                          <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center space-y-2 text-center text-sm text-gray-500">
                          <MessageSquareText className="h-10 w-10 text-blue-400" />
                          <p>เริ่มต้นสนทนาได้เลยเพื่อสอบถามรายละเอียดเพิ่มเติมเกี่ยวกับบ้านที่สนใจ</p>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3">
                          {messages.map((message) => {
                            const isMine = message.senderId === user.uid
                            const isHighlightedMessage = highlightedMessageId === message.id && !isMine
                            const attachments = message.attachments ?? []
                            const hasAttachments = attachments.length > 0
                            const textContent = message.text ?? ""
                            const showText = textContent.trim().length > 0
                            const propertyPreview = message.propertyPreview
                            const previewStatus =
                              propertyPreview?.propertyId
                                ? propertyStatusMap[propertyPreview.propertyId]
                                : undefined
                            const isPreviewUnderPurchase = Boolean(previewStatus?.isUnderPurchase)
                            const isPreviewOwner = propertyPreview?.ownerUid
                              ? propertyPreview.ownerUid === user.uid
                              : false
                            const isPreviewConfirming =
                              propertyPreview?.propertyId
                                ? confirmingPropertyId === propertyPreview.propertyId
                                : false
                            const isPreviewConfirmedBuyer =
                              Boolean(
                                propertyPreview?.propertyId &&
                                  !isPreviewOwner &&
                                  previewStatus?.confirmedBuyerId === user.uid,
                              )
                            const isPreviewBuyerConfirmed = Boolean(previewStatus?.buyerConfirmed)
                            const isPreviewBuyerConfirming =
                              propertyPreview?.propertyId
                                ? buyerConfirmingPropertyId === propertyPreview.propertyId
                                : false

                            return (
                              <div key={message.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                                <div
                                  className={cn(
                                    "max-w-[82%] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm transition md:max-w-[75%] md:px-4 md:py-3 md:text-base lg:max-w-[70%]",
                                    isMine
                                      ? "bg-blue-600 text-white"
                                      : "bg-white text-gray-900",
                                    isHighlightedMessage && "ring-2 ring-blue-400",
                                  )}
                                >
                                  <div className="flex flex-col gap-2">
                                    {propertyPreview && (
                                      <div
                                        className={cn(
                                          "overflow-hidden rounded-xl border",
                                          isMine
                                            ? "border-white/30 bg-white/10"
                                            : "border-slate-200 bg-white",
                                        )}
                                      >
                                        {propertyPreview.thumbnailUrl ? (
                                          <img
                                            src={propertyPreview.thumbnailUrl}
                                            alt={propertyPreview.title}
                                            className="h-40 w-full object-cover"
                                          />
                                        ) : (
                                          <div className="flex h-40 w-full items-center justify-center bg-slate-100 text-slate-400">
                                            <ImageIcon className="h-10 w-10" />
                                          </div>
                                        )}
                                        <div className="space-y-2 px-3 py-3">
                                          <p
                                            className={cn(
                                              "text-sm font-semibold leading-snug",
                                              isMine ? "text-white" : "text-gray-900",
                                            )}
                                          >
                                            {propertyPreview.title}
                                          </p>
                                          {propertyPreview.transactionType && (
                                            <p
                                              className={cn(
                                                "text-xs font-medium uppercase tracking-wide",
                                                isMine ? "text-white/80" : "text-blue-600",
                                              )}
                                            >
                                              {TRANSACTION_LABELS[propertyPreview.transactionType] ??
                                                propertyPreview.transactionType}
                                            </p>
                                          )}
                                          {typeof propertyPreview.price === "number" &&
                                          Number.isFinite(propertyPreview.price) ? (
                                            <p
                                              className={cn(
                                                "text-sm font-semibold",
                                                isMine ? "text-white" : "text-blue-600",
                                              )}
                                            >
                                              {formatPropertyPrice(
                                                propertyPreview.price,
                                                propertyPreview.transactionType ?? "sale",
                                              )}
                                            </p>
                                          ) : null}
                                          {(() => {
                                            const location =
                                              propertyPreview.address && propertyPreview.address.trim().length > 0
                                                ? propertyPreview.address
                                                : [propertyPreview.city, propertyPreview.province]
                                                    .filter((value): value is string => Boolean(value && value.trim()))
                                                    .join(" ")
                                            if (!location) return null
                                            return (
                                              <p
                                                className={cn(
                                                  "text-xs",
                                                  isMine ? "text-white/75" : "text-gray-500",
                                                )}
                                              >
                                                {location}
                                              </p>
                                            )
                                          })()}
                                          {propertyPreview.ownerUid && (
                                            <div className="mt-2 flex flex-col gap-2">
                                              <button
                                                type="button"
                                                onClick={() => handleOpenPropertyPreview(propertyPreview)}
                                                className={cn(
                                                  "inline-flex w-full items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold transition",
                                                  isMine
                                                    ? "bg-white text-blue-600 hover:bg-blue-50"
                                                    : "bg-blue-600 text-white hover:bg-blue-700",
                                                )}
                                              >
                                                ดูรายละเอียดประกาศ
                                              </button>
                                              {isPreviewOwner && (
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    if (
                                                      isPreviewUnderPurchase &&
                                                      propertyPreview.propertyId
                                                    ) {
                                                      router.push(
                                                        `/sell/send-documents?propertyId=${propertyPreview.propertyId}`,
                                                      )
                                                      return
                                                    }

                                                    handleConfirmProperty(propertyPreview)
                                                  }}
                                                  disabled={isPreviewConfirming}
                                                  className={cn(
                                                    "inline-flex w-full items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold transition",
                                                    isPreviewUnderPurchase
                                                      ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                                                      : "bg-emerald-500 text-white hover:bg-emerald-600",
                                                    isPreviewConfirming && "cursor-wait opacity-75",
                                                  )}
                                                >
                                                  {isPreviewConfirming
                                                    ? "กำลังยืนยัน..."
                                                    : isPreviewUnderPurchase
                                                      ? "มีคนกำลังซื้อแล้ว"
                                                      : "ยืนยันอสังหาริมทรัพย์นี้"}
                                                </button>
                                              )}
                                              {isPreviewConfirmedBuyer && (
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    if (
                                                      isPreviewBuyerConfirmed &&
                                                      propertyPreview.propertyId
                                                    ) {
                                                      router.push(
                                                        `/buy/send-documents?propertyId=${propertyPreview.propertyId}`,
                                                      )
                                                      return
                                                    }

                                                    handleBuyerConfirmProperty(propertyPreview)
                                                  }}
                                                  disabled={isPreviewBuyerConfirming}
                                                  className={cn(
                                                    "inline-flex w-full items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold transition",
                                                    isPreviewBuyerConfirmed
                                                      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                                      : "bg-emerald-500 text-white hover:bg-emerald-600",
                                                    isPreviewBuyerConfirming && "cursor-wait opacity-75",
                                                  )}
                                                >
                                                  {isPreviewBuyerConfirming
                                                    ? "กำลังยืนยัน..."
                                                    : isPreviewBuyerConfirmed
                                                      ? "ยืนยันแล้ว"
                                                      : "ยืนยันเพื่อดำเนินการต่อ"}
                                                </button>
                                              )}
                                              {!isPreviewOwner &&
                                                isPreviewUnderPurchase &&
                                                !isPreviewConfirmedBuyer && (
                                                  <div className="rounded-lg bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-700">
                                                    มีคนกำลังซื้อแล้ว
                                                  </div>
                                              )}
                                              {isPreviewConfirmedBuyer && isPreviewBuyerConfirmed && (
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    if (!propertyPreview.propertyId) return
                                                    router.push(
                                                      `/buy/send-documents?propertyId=${propertyPreview.propertyId}`,
                                                    )
                                                  }}
                                                  className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                                                >
                                                  คุณยืนยันประกาศนี้แล้ว
                                                </button>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                    {hasAttachments && (
                                      <div className="flex flex-col gap-2">
                                        {attachments.map((attachment, index) => {
                                          const key = `${attachment.storagePath || message.id}-${index}`

                                          if (attachment.type === "image") {
                                            return (
                                              <button
                                                key={key}
                                                type="button"
                                                onClick={() => handleAttachmentClick(attachment)}
                                                className={cn(
                                                  "group block overflow-hidden rounded-xl border text-left",
                                                  isMine ? "border-white/30" : "border-slate-200",
                                                )}
                                              >
                                                <img
                                                  src={attachment.url}
                                                  alt={attachment.name || "ไฟล์รูปภาพ"}
                                                  className="max-h-64 w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                                                />
                                              </button>
                                            )
                                          }

                                          if (attachment.type === "video") {
                                            return (
                                              <button
                                                key={key}
                                                type="button"
                                                onClick={() => handleAttachmentClick(attachment)}
                                                className={cn(
                                                  "group relative overflow-hidden rounded-xl border",
                                                  isMine ? "border-white/30" : "border-slate-200",
                                                )}
                                              >
                                                <video
                                                  src={attachment.url}
                                                  muted
                                                  loop
                                                  playsInline
                                                  className="max-h-64 w-full bg-black object-cover transition duration-300 group-hover:scale-[1.02]"
                                                />
                                                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white">
                                                    <Play className="h-5 w-5" />
                                                  </span>
                                                </div>
                                              </button>
                                            )
                                          }

                                          return (
                                            <a
                                              key={key}
                                              href={attachment.url}
                                              target="_blank"
                                              rel="noreferrer"
                                              className={cn(
                                                "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition",
                                                isMine
                                                  ? "border-white/30 bg-white/10 text-white hover:bg-white/20"
                                                  : "border-slate-200 bg-slate-100 text-gray-700 hover:bg-slate-200/80",
                                              )}
                                            >
                                              <Paperclip className="h-4 w-4" />
                                              <span className="truncate text-xs md:text-sm">
                                                {attachment.name || "ไฟล์แนบ"}
                                              </span>
                                            </a>
                                          )
                                        })}
                                      </div>
                                    )}

                                    {showText && (
                                      <p className="whitespace-pre-wrap break-words">{textContent}</p>
                                    )}
                                  </div>
                                  <span
                                    className={cn(
                                      "mt-1 block text-[11px] md:text-xs",
                                      isMine ? "text-right text-blue-100/80" : "text-gray-400",
                                    )}
                                  >
                                    {formatMessageTime(message.createdAt)}
                                  </span>
                                </div>
                              </div>
                            )
                          })}
                          <div ref={messageEndRef} />
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div
                    className={cn(
                      "flex h-full flex-col items-center justify-center space-y-3 p-6 text-center text-sm text-gray-500 md:p-8 md:text-base",
                      "animate-in fade-in-0 duration-300",
                      "slide-in-from-right-4",
                    )}
                  >
                    <MessageSquareText className="h-12 w-12 text-blue-400" />
                    <p>เลือกชื่อผู้ใช้ทางด้านขวาเพื่อเปิดบทสนทนาเกี่ยวกับบ้านที่คุณสนใจ</p>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-slate-200 bg-white/90 px-4 py-3 md:px-6 md:py-4">
              {activeParticipantId ? (
                <>
                  {attachmentPreviews.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-3">
                      {attachmentPreviews.map((preview, index) => (
                        <div
                          key={`${preview.id}-${index}`}
                          className="relative h-20 w-20 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 md:h-24 md:w-24"
                        >
                          {preview.kind === "image" ? (
                            <img src={preview.url} alt={preview.name || "ไฟล์แนบ"} className="h-full w-full object-cover" />
                          ) : (
                            <>
                              <video
                                src={preview.url}
                                muted
                                loop
                                playsInline
                                className="h-full w-full object-cover"
                              />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white">
                                  <Play className="h-3.5 w-3.5" />
                                </span>
                              </div>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(index)}
                            className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
                            aria-label="ลบไฟล์แนบ"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="flex items-center gap-2 md:gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      className="hidden"
                      onChange={handleAttachmentChange}
                      disabled={sending}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleFileButtonClick}
                      className="h-10 w-10 rounded-full text-gray-500 transition hover:text-gray-900 md:h-11 md:w-11"
                      aria-label="แนบไฟล์"
                      disabled={sending}
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Input
                      ref={inputRef}
                      value={messageDraft}
                      onChange={(event) => setMessageDraft(event.target.value)}
                      placeholder="พิมพ์ข้อความของคุณ..."
                      className="h-10 flex-1 rounded-full bg-slate-100 px-4 text-sm md:h-11 md:px-5 md:text-base"
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault()
                          if (!sending) {
                            void handleSendMessage()
                          }
                        }
                      }}
                    />
                    <Button
                      type="submit"
                      disabled={sending || (!messageDraft.trim() && pendingAttachments.length === 0)}
                      className="h-10 w-10 rounded-full bg-blue-600 p-0 hover:bg-blue-700 md:h-11 md:w-11"
                    >
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 md:h-5 md:w-5" />}
                    </Button>
                  </form>
                </>
              ) : (
                <p className="text-center text-sm text-gray-500">
                  เลือกผู้ใช้เพื่อเริ่มต้นการสนทนาเกี่ยวกับการซื้อบ้านของคุณ
                </p>
              )}
            </div>
          </>
        )}
      </div>
      </div>
      <Dialog
        open={Boolean(buyerConfirmationPreview)}
        onOpenChange={(open) => {
          if (!open) {
            const propertyId =
              buyerConfirmationPreview?.propertyId ?? lastBuyerConfirmationPropertyIdRef.current
            if (propertyId) {
              const status = propertyStatusMap[propertyId]
              if (
                status?.isUnderPurchase &&
                status.confirmedBuyerId === user?.uid &&
                !status.buyerConfirmed
              ) {
                buyerConfirmationDismissedRef.current.add(propertyId)
              } else {
                buyerConfirmationDismissedRef.current.delete(propertyId)
              }
              lastBuyerConfirmationPropertyIdRef.current = propertyId
            }
            setBuyerConfirmationPreview(null)
          }
        }}
      >
        <DialogContent className="max-w-lg space-y-6 break-words text-pretty sm:max-w-xl md:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold sm:text-xl">ผู้ขายยืนยันการซื้อแล้ว</DialogTitle>
            <DialogDescription className="break-words text-pretty text-sm sm:text-base">
              {buyerConfirmationPreview
                ? `ผู้ขายได้ยืนยันประกาศ ${buyerConfirmationPreview.title}`
                : "ผู้ขายได้ยืนยันประกาศแล้ว"}
            </DialogDescription>
          </DialogHeader>
          {buyerConfirmationPreview && (
            <div className="space-y-3 break-words rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-pretty text-sm text-amber-800 sm:text-base">
              {buyerConfirmationPreview.price && Number.isFinite(buyerConfirmationPreview.price) && (
                <p className="break-words font-semibold">
                  ราคา {formatPropertyPrice(
                    buyerConfirmationPreview.price,
                    buyerConfirmationPreview.transactionType ?? "sale",
                  )}
                </p>
              )}
              {(buyerConfirmationPreview.address || buyerConfirmationPreview.city || buyerConfirmationPreview.province) && (
                <p className="break-words">
                  {[buyerConfirmationPreview.address, buyerConfirmationPreview.city, buyerConfirmationPreview.province]
                    .filter((value): value is string => Boolean(value && value.trim()))
                    .join(" ")}
                </p>
              )}
              <p className="break-words">
                โปรดเตรียมเอกสารที่จำเป็นและติดตามการติดต่อจากผู้ขายเพื่อดำเนินการขั้นตอนถัดไป
              </p>
            </div>
          )}
          <DialogFooter className="flex w-full flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => setBuyerConfirmationPreview(null)}
              className="h-auto min-h-[3.25rem] w-full break-words whitespace-normal px-6 py-3 text-center text-base sm:w-auto sm:px-8 sm:text-lg"
            >
              ภายหลัง
            </Button>
            {buyerConfirmationPreview && (
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => {
                  handleOpenPropertyPreview(buyerConfirmationPreview)
                }}
                className="h-auto min-h-[3.25rem] w-full break-words whitespace-normal px-6 py-3 text-center text-base sm:w-auto sm:px-8 sm:text-lg"
              >
                ดูรายละเอียดประกาศ
              </Button>
            )}
            {buyerConfirmationPreview && (
              <Button
                type="button"
                size="lg"
                onClick={() => handleBuyerConfirmProperty(buyerConfirmationPreview)}
                disabled={buyerConfirmationCompleted || buyerConfirmationLoading}
                className="h-auto min-h-[3.25rem] w-full break-words whitespace-normal px-6 py-3 text-center text-base sm:w-auto sm:px-8 sm:text-lg"
              >
                {buyerConfirmationLoading
                  ? "กำลังยืนยัน..."
                  : buyerConfirmationCompleted
                    ? "ยืนยันแล้ว"
                    : "ยืนยันเพื่อไปขั้นตอนถัดไป"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isMediaViewerOpen && !!selectedAttachment} onOpenChange={handleMediaViewerOpenChange}>
        <DialogContent className="w-[92vw] max-w-3xl bg-white/95 p-0 shadow-2xl backdrop-blur sm:w-[90vw] sm:max-w-4xl">
          {selectedAttachment && (
            <div className="flex flex-col gap-4 p-4 sm:p-6">
              <DialogHeader className="space-y-1 text-left">
                <DialogTitle className="text-base font-semibold text-gray-900 sm:text-lg">
                  {selectedAttachment.name || (selectedAttachment.type === "image" ? "รูปภาพ" : "วิดีโอ")}
                </DialogTitle>
                <DialogDescription className="text-xs text-gray-500 sm:text-sm">
                  แสดงจากคลังสื่อของบทสนทนา
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center justify-center">
                {selectedAttachment.type === "image" ? (
                  <img
                    src={selectedAttachment.url}
                    alt={selectedAttachment.name || "ไฟล์รูปภาพ"}
                    className="max-h-[70vh] w-full rounded-2xl bg-slate-100 object-contain"
                  />
                ) : (
                  <video
                    key={selectedAttachment.url}
                    src={selectedAttachment.url}
                    controls
                    autoPlay
                    playsInline
                    className="max-h-[70vh] w-full rounded-2xl bg-black object-contain"
                  />
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ChatPanel
