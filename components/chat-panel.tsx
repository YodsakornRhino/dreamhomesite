"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  ArrowLeft,
  Loader2,
  MessageSquareText,
  Pin,
  PinOff,
  Search,
  Send,
  X,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuthContext } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import {
  addDocument,
  setDocument,
  subscribeToCollection,
  updateDocument,
} from "@/lib/firestore"
import { cn } from "@/lib/utils"

interface ChatPanelProps {
  isOpen: boolean
  onClose: () => void
  requestedParticipantId?: string | null
  onRequestParticipantHandled?: () => void
}

interface ChatThread {
  id: string
  participants: string[]
  lastMessage?: string
  lastSenderId?: string
  updatedAt?: Date | null
  pinnedBy?: string[]
}

interface ChatMessage {
  id: string
  text: string
  senderId: string
  createdAt?: Date | null
}

interface UserProfileSummary {
  uid: string
  name?: string
  email?: string
  photoURL?: string
}

const createChatId = (first: string, second: string) => {
  return [first, second].sort().join("__")
}

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

const ChatPanel: React.FC<ChatPanelProps> = ({
  isOpen,
  onClose,
  requestedParticipantId,
  onRequestParticipantHandled,
}) => {
  const { user } = useAuthContext()
  const { toast } = useToast()

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

  const panelRef = useRef<HTMLDivElement>(null)
  const messageEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const lastThreadTimestampsRef = useRef<Record<string, number>>({})
  const initialThreadSnapshotRef = useRef(true)
  const lastMessageIdRef = useRef<string | null>(null)

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

  const activeChatId = useMemo(() => {
    if (!user?.uid || !activeParticipantId) return null
    return createChatId(user.uid, activeParticipantId)
  }, [activeParticipantId, user?.uid])

  const activeProfile = activeParticipantId ? userMap[activeParticipantId] : undefined

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
      if (!panelRef.current) {
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

      if (panelRef.current.contains(targetElement)) {
        return
      }

      if (targetElement.closest("[data-chat-panel-keep-open]")) {
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
      setThreads([])
      setMessages([])
      setSearchTerm("")
      setMessageDraft("")
      setHighlightedThreadIds([])
      setHighlightedMessageId(null)
      lastThreadTimestampsRef.current = {}
      initialThreadSnapshotRef.current = true
      return
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

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
  }, [isOpen, toast])

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
    if (!isOpen || !user?.uid) return

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
  }, [isOpen, playNotificationSound, toast, user?.uid])

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
              return {
                id: doc.id,
                text: typeof data.text === "string" ? data.text : "",
                senderId: typeof data.senderId === "string" ? data.senderId : "",
                createdAt:
                  data.createdAt && typeof data.createdAt.toDate === "function"
                    ? (data.createdAt.toDate() as Date)
                    : null,
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

  const suggestedUsers = useMemo(() => {
    if (!user?.uid) return [] as UserProfileSummary[]

    const threadIds = new Set(threadEntries.map((entry) => entry.otherId))

    return Object.values(userMap)
      .filter((profile) => profile.uid !== user.uid && !threadIds.has(profile.uid))
      .filter((profile) => {
        if (!normalizedSearch) return true
        const name = (profile.name || "").toLowerCase()
        const email = (profile.email || "").toLowerCase()
        return name.includes(normalizedSearch) || email.includes(normalizedSearch)
      })
      .slice(0, 10)
  }, [normalizedSearch, threadEntries, user?.uid, userMap])

  const handleSelectParticipant = (targetUid: string) => {
    if (!user?.uid) return
    setActiveParticipantId(targetUid)
    const chatId = createChatId(user.uid, targetUid)
    setHighlightedThreadIds((prev) => prev.filter((id) => id !== chatId))
  }

  const handleSendMessage = async () => {
    if (!user?.uid || !activeParticipantId) return

    const trimmed = messageDraft.trim()
    if (!trimmed) return

    setSending(true)

    try {
      const { serverTimestamp } = await import("firebase/firestore")
      const chatId = createChatId(user.uid, activeParticipantId)
      const participants = [user.uid, activeParticipantId].sort()

      await Promise.all([
        addDocument(`chats/${chatId}/messages`, {
          text: trimmed,
          senderId: user.uid,
          createdAt: serverTimestamp(),
        }),
        setDocument("chats", chatId, {
          participants,
          lastMessage: trimmed,
          lastSenderId: user.uid,
          updatedAt: serverTimestamp(),
        }),
      ])

      setMessageDraft("")
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

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
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

                {suggestedUsers.length > 0 && (
                  <div className="border-t border-slate-100 p-3 md:p-4">
                    <p className="px-1 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      เริ่มแชทใหม่
                    </p>
                    <div className="flex flex-col gap-2">
                      {suggestedUsers.map((profile) => (
                        <button
                          key={profile.uid}
                          type="button"
                          onClick={() => handleSelectParticipant(profile.uid)}
                          className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-slate-100/80"
                        >
                          <Avatar className="h-9 w-9 border border-slate-200">
                            <AvatarImage src={profile.photoURL || ""} alt={getDisplayName(profile)} />
                            <AvatarFallback className="bg-blue-100 text-xs font-semibold text-blue-600">
                              {getAvatarFallback(profile)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-800">{getDisplayName(profile)}</span>
                            {profile.email && <span className="text-xs text-gray-500">{profile.email}</span>}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
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
                    </div>

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
                                  <p>{message.text}</p>
                                  <span
                                    className={cn(
                                      "mt-1 block text-[11px] md:text-xs",
                                      isMine ? "text-blue-100/80" : "text-gray-400",
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
                <form onSubmit={handleSubmit} className="flex items-center gap-2 md:gap-3">
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
                    disabled={sending || !messageDraft.trim()}
                    className="h-10 w-10 rounded-full bg-blue-600 p-0 hover:bg-blue-700 md:h-11 md:w-11"
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 md:h-5 md:w-5" />}
                  </Button>
                </form>
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
    </div>
  )
}

export default ChatPanel
