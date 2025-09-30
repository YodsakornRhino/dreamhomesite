"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  ArrowLeft,
  Loader2,
  MessageSquareText,
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
} from "@/lib/firestore"
import { cn } from "@/lib/utils"

interface ChatPanelProps {
  isOpen: boolean
  onClose: () => void
}

interface ChatThread {
  id: string
  participants: string[]
  lastMessage?: string
  lastSenderId?: string
  updatedAt?: Date | null
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

const ChatPanel: React.FC<ChatPanelProps> = ({ isOpen, onClose }) => {
  const { user } = useAuthContext()
  const { toast } = useToast()

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

  const messageEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const activeChatId = useMemo(() => {
    if (!user?.uid || !activeParticipantId) return null
    return createChatId(user.uid, activeParticipantId)
  }, [activeParticipantId, user?.uid])

  const activeProfile = activeParticipantId ? userMap[activeParticipantId] : undefined

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
    if (!isOpen) {
      setActiveParticipantId(null)
      setThreads([])
      setMessages([])
      setSearchTerm("")
      setMessageDraft("")
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
              }
            })

            setThreads(mapped)
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
  }, [isOpen, toast, user?.uid])

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
  }, [activeChatId])

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

  const filteredThreads = threadEntries.filter((entry) => entry.matches)

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

  if (!isOpen) {
    return null
  }

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 top-20 z-[60] w-[calc(100%-1.5rem)] max-w-3xl transition-all duration-300",
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
                  "h-full overflow-y-auto border-r border-slate-100 bg-white/80 backdrop-blur transition-all duration-300 md:static md:w-72 md:translate-x-0 md:opacity-100",
                  isMobile
                    ? activeParticipantId
                      ? "absolute inset-0 z-30 w-full -translate-x-full opacity-0"
                      : "absolute inset-0 z-30 w-full translate-x-0 opacity-100"
                    : "w-72 md:w-80",
                )}
              >
                <div className="border-b border-slate-100 p-4">
                  <div className="relative flex items-center">
                    <Search className="absolute left-3 h-4 w-4 text-gray-400" />
                    <Input
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="ค้นหาชื่อหรืออีเมล"
                      className="h-9 rounded-full bg-slate-100 pl-9 pr-3 text-sm"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2 p-3">
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
                  ) : filteredThreads.length === 0 ? (
                    <p className="px-2 py-6 text-center text-sm text-gray-500">
                      {normalizedSearch
                        ? "ไม่พบรายชื่อที่ตรงกับการค้นหา"
                        : "ยังไม่มีบทสนทนา เริ่มต้นแชทกับผู้ใช้งานได้เลย"}
                    </p>
                  ) : (
                    filteredThreads.map(({ thread, otherId, profile }) => {
                      const isActive = activeChatId === thread.id
                      const previewPrefix = thread.lastSenderId === user.uid ? "คุณ: " : ""
                      return (
                        <button
                          key={thread.id}
                          type="button"
                          onClick={() => handleSelectParticipant(otherId)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors",
                            isActive
                              ? "bg-blue-50/90 ring-1 ring-blue-200"
                              : "hover:bg-slate-100/80",
                          )}
                        >
                          <Avatar className="h-10 w-10 border border-slate-200">
                            <AvatarImage src={profile?.photoURL || ""} alt={getDisplayName(profile)} />
                            <AvatarFallback className="bg-blue-100 text-sm font-semibold text-blue-600">
                              {getAvatarFallback(profile)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-1 flex-col overflow-hidden">
                            <div className="flex items-center justify-between">
                              <span className="truncate text-sm font-semibold text-gray-900">
                                {getDisplayName(profile)}
                              </span>
                              <span className="ml-3 flex-shrink-0 text-xs text-gray-400">
                                {formatThreadTime(thread.updatedAt)}
                              </span>
                            </div>
                            <span className="truncate text-xs text-gray-500">
                              {thread.lastMessage ? `${previewPrefix}${thread.lastMessage}` : "ยังไม่มีข้อความ"}
                            </span>
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>

                {suggestedUsers.length > 0 && (
                  <div className="border-t border-slate-100 p-3">
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
                  "flex h-full flex-1 flex-col bg-slate-50/80 backdrop-blur transition-all duration-300 md:static md:flex-1 md:translate-x-0 md:opacity-100",
                  isMobile
                    ? activeParticipantId
                      ? "absolute inset-0 z-20 w-full translate-x-0 opacity-100"
                      : "absolute inset-0 z-20 w-full translate-x-full opacity-0"
                    : "",
                )}
              >
                {activeParticipantId ? (
                  <>
                    <div className="flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3">
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

                    <div className="flex-1 overflow-y-auto px-4 py-4">
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
                            return (
                              <div key={message.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}
                              >
                                <div
                                  className={cn(
                                    "max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm",
                                    isMine
                                      ? "bg-blue-600 text-white"
                                      : "bg-white text-gray-900",
                                  )}
                                >
                                  <p>{message.text}</p>
                                  <span className={cn(
                                    "mt-1 block text-[11px]",
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
                  <div className="flex h-full flex-col items-center justify-center space-y-3 p-6 text-center text-sm text-gray-500">
                    <MessageSquareText className="h-12 w-12 text-blue-400" />
                    <p>เลือกชื่อผู้ใช้ทางด้านขวาเพื่อเปิดบทสนทนาเกี่ยวกับบ้านที่คุณสนใจ</p>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-slate-200 bg-white/90 px-4 py-3">
              {activeParticipantId ? (
                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                  <Input
                    ref={inputRef}
                    value={messageDraft}
                    onChange={(event) => setMessageDraft(event.target.value)}
                    placeholder="พิมพ์ข้อความของคุณ..."
                    className="h-10 flex-1 rounded-full bg-slate-100 px-4 text-sm"
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
                    className="h-10 w-10 rounded-full bg-blue-600 p-0 hover:bg-blue-700"
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
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
  )
}

export default ChatPanel
