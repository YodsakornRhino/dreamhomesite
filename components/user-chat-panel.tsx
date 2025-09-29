"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react"
import {
  ArrowLeft,
  FileImage,
  FileVideo,
  Loader2,
  MessageCircle,
  Paperclip,
  Pin,
  PinOff,
  Search,
  Send,
  X,
} from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { th } from "date-fns/locale"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import {
  ensureConversation,
  markConversationRead,
  sendMessage,
  toggleConversationPin,
  uploadChatAttachments,
  type ChatAttachment,
  type ChatConversation,
  type ChatParticipant,
} from "@/lib/chat"
import { useUserChats } from "@/hooks/use-user-chats"
import { useChatMessages } from "@/hooks/use-chat-messages"
import { useAuthContext } from "@/contexts/AuthContext"

interface ChatContact {
  id: string
  name: string
  avatar?: string | null
}

interface UserChatPanelProps {
  open: boolean
  onClose: () => void
  initialConversationId?: string | null
  initialContact?: ChatContact | null
}

interface DisplayConversation extends ChatConversation {
  displayName: string
  displayAvatar?: string | null
}

const getInitials = (name: string): string => {
  if (!name) return "DH"
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase()
}

const formatRelative = (timestamp: Date | null): string => {
  if (!timestamp) return "เมื่อสักครู่"
  return formatDistanceToNow(timestamp, { addSuffix: true, locale: th })
}

const formatMessageTime = (timestamp: Date | null): string => {
  if (!timestamp) return ""
  return format(timestamp, "HH:mm น.", { locale: th })
}

const mapContactToParticipant = (contact: ChatContact): ChatParticipant => ({
  uid: contact.id,
  name: contact.name,
  photoURL: contact.avatar ?? null,
})

const normaliseConversation = (
  conversation: ChatConversation,
): DisplayConversation => {
  const name = conversation.otherUser?.name?.trim()
  const displayName = name && name.length > 0 ? name : "ผู้ใช้ DreamHome"

  return {
    ...conversation,
    displayName,
    displayAvatar: conversation.otherUser?.photoURL ?? null,
  }
}

export function UserChatPanel({
  open,
  onClose,
  initialConversationId,
  initialContact,
}: UserChatPanelProps) {
  const { user, loading: authLoading } = useAuthContext()
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState("")
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    null,
  )
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [messageInput, setMessageInput] = useState("")
  const [showListOnMobile, setShowListOnMobile] = useState(true)
  const [pendingConversations, setPendingConversations] = useState<ChatConversation[]>([])
  const [sendingMessage, setSendingMessage] = useState(false)

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const { conversations, loading: conversationsLoading, error: conversationsError } = useUserChats(
    user?.uid,
  )

  const { messages, loading: messagesLoading, error: messagesError } = useChatMessages(
    activeConversationId,
  )

  useEffect(() => {
    if (!open) {
      setSearchTerm("")
      setActiveConversationId(null)
      setSelectedFiles([])
      setMessageInput("")
      setPendingConversations([])
      setShowListOnMobile(true)
      setSendingMessage(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      return
    }

    if (initialConversationId) {
      setActiveConversationId(initialConversationId)
    }

    if (initialContact) {
      setShowListOnMobile(false)
    }
  }, [open, initialConversationId, initialContact])

  const ensureInitialConversation = useCallback(async () => {
    if (!open || !user || !initialContact) {
      return
    }

    try {
      const { id, participants } = await ensureConversation({
        currentUser: {
          uid: user.uid,
          name: user.displayName ?? user.email ?? "ผู้ใช้",
          photoURL: user.photoURL ?? null,
          email: user.email ?? null,
        },
        targetUser: mapContactToParticipant(initialContact),
      })

      setPendingConversations((previous) => {
        const filtered = previous.filter((conversation) => conversation.id !== id)
        return [
          ...filtered,
          {
            id,
            participants,
            pinned: false,
            lastMessage: null,
            lastMessageAt: null,
            otherUser: mapContactToParticipant(initialContact),
            lastSenderId: null,
            unreadCount: 0,
            isPending: true,
          },
        ]
      })

      setActiveConversationId(id)
      setShowListOnMobile(false)
    } catch (error) {
      console.error("Failed to ensure conversation", error)
      toast({
        title: "ไม่สามารถเริ่มต้นบทสนทนาได้",
        description: "กรุณาลองใหม่อีกครั้ง หรือรีเฟรชหน้า",
        variant: "destructive",
      })
    }
  }, [initialContact, open, toast, user])

  useEffect(() => {
    if (!initialContact || !open) {
      return
    }

    if (!user) {
      toast({
        title: "ต้องเข้าสู่ระบบก่อน",
        description: "กรุณาเข้าสู่ระบบเพื่อเริ่มคุยกับผู้ขาย",
        variant: "destructive",
      })
      return
    }

    void ensureInitialConversation()
  }, [ensureInitialConversation, initialContact, open, toast, user])

  useEffect(() => {
    if (!conversations.length) {
      return
    }

    setPendingConversations((previous) =>
      previous.filter(
        (conversation) => !conversations.some((existing) => existing.id === conversation.id),
      ),
    )
  }, [conversations])

  useEffect(() => {
    if (!open) return
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [open, activeConversationId, messages.length])

  useEffect(() => {
    if (!user?.uid || !activeConversationId) {
      return
    }

    void markConversationRead(user.uid, activeConversationId)
  }, [activeConversationId, user?.uid])

  const displayConversations = useMemo(() => {
    const conversationMap = new Map<string, ChatConversation>()
    conversations.forEach((conversation) => {
      conversationMap.set(conversation.id, conversation)
    })
    pendingConversations.forEach((conversation) => {
      if (!conversationMap.has(conversation.id)) {
        conversationMap.set(conversation.id, conversation)
      }
    })

    const combined = Array.from(conversationMap.values())

    return combined
      .map((conversation) => normaliseConversation(conversation))
      .sort((a, b) => {
        if (a.pinned !== b.pinned) {
          return a.pinned ? -1 : 1
        }
        const timeA = a.lastMessageAt?.toMillis?.() ?? a.updatedAt?.toMillis?.() ?? a.createdAt?.toMillis?.() ?? 0
        const timeB = b.lastMessageAt?.toMillis?.() ?? b.updatedAt?.toMillis?.() ?? b.createdAt?.toMillis?.() ?? 0
        return timeB - timeA
      })
  }, [conversations, pendingConversations])

  const filteredConversations = useMemo(() => {
    if (!searchTerm.trim()) {
      return displayConversations
    }

    const keyword = searchTerm.trim().toLowerCase()
    return displayConversations.filter((conversation) => {
      const name = conversation.displayName.toLowerCase()
      const lastMessage = (conversation.lastMessage ?? "").toLowerCase()
      return name.includes(keyword) || lastMessage.includes(keyword)
    })
  }, [displayConversations, searchTerm])

  const activeConversation = useMemo(() => {
    if (!activeConversationId) return null
    return (
      displayConversations.find((conversation) => conversation.id === activeConversationId) ??
      null
    )
  }, [activeConversationId, displayConversations])

  const handleSelectConversation = (conversationId: string) => {
    setActiveConversationId(conversationId)
    setShowListOnMobile(false)
    setSelectedFiles([])
    setMessageInput("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleBackToList = () => {
    setShowListOnMobile(true)
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    setSelectedFiles(files)
  }

  const handleRemoveSelectedFile = (index: number) => {
    setSelectedFiles((previous) => previous.filter((_, itemIndex) => itemIndex !== index))
  }

  const handleTogglePin = async () => {
    if (!user?.uid || !activeConversation || activeConversation.isPending) {
      return
    }

    try {
      await toggleConversationPin(user.uid, activeConversation.id, !activeConversation.pinned)
    } catch (error) {
      console.error("Failed to toggle pin", error)
      toast({
        title: "ปักหมุดไม่สำเร็จ",
        description: "กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      })
    }
  }

  const handleSendMessage = async () => {
    if (!user) {
      toast({
        title: "ต้องเข้าสู่ระบบก่อน",
        description: "กรุณาเข้าสู่ระบบเพื่อส่งข้อความ",
        variant: "destructive",
      })
      return
    }

    const trimmedMessage = messageInput.trim()
    if (!trimmedMessage && selectedFiles.length === 0) {
      return
    }

    try {
      setSendingMessage(true)

      let conversationId = activeConversation?.id ?? null
      let participants = activeConversation?.participants ?? []
      let otherParticipant =
        activeConversation?.otherUser ??
        (initialContact ? mapContactToParticipant(initialContact) : null)

      if (!conversationId || participants.length === 0 || !otherParticipant) {
        if (!otherParticipant) {
          throw new Error("Missing participant information")
        }

        const ensured = await ensureConversation({
          currentUser: {
            uid: user.uid,
            name: user.displayName ?? user.email ?? "ผู้ใช้",
            photoURL: user.photoURL ?? null,
            email: user.email ?? null,
          },
          targetUser: otherParticipant,
        })

        conversationId = ensured.id
        participants = ensured.participants
        setActiveConversationId(ensured.id)
      }

      const attachments: ChatAttachment[] = await uploadChatAttachments(
        conversationId,
        selectedFiles,
      )

      await sendMessage({
        conversationId,
        sender: {
          uid: user.uid,
          name: user.displayName ?? user.email ?? "ผู้ใช้",
          photoURL: user.photoURL ?? null,
          email: user.email ?? null,
        },
        participants,
        text: trimmedMessage || null,
        attachments,
      })

      setMessageInput("")
      setSelectedFiles([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      setShowListOnMobile(false)
    } catch (error) {
      console.error("Failed to send message", error)
      toast({
        title: "ส่งข้อความไม่สำเร็จ",
        description: "ตรวจสอบสิทธิ์การเข้าถึง Firestore/Storage แล้วลองใหม่",
        variant: "destructive",
      })
    } finally {
      setSendingMessage(false)
    }
  }

  const handleMessageKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      if (!sendingMessage) {
        void handleSendMessage()
      }
    }
  }

  const canSendMessage =
    Boolean(user) &&
    (messageInput.trim().length > 0 || selectedFiles.length > 0) &&
    !sendingMessage

  const conversationListEmpty =
    !conversationsLoading && !filteredConversations.length && !pendingConversations.length

  const activeConversationDate =
    activeConversation?.lastMessageAt?.toDate?.() ??
    activeConversation?.updatedAt?.toDate?.() ??
    activeConversation?.createdAt?.toDate?.() ??
    null

  return (
    <div
      className={cn(
        "fixed inset-y-0 right-0 z-50 w-full max-w-full bg-white shadow-2xl transition-transform duration-300",
        "sm:max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-5xl",
        open ? "translate-x-0" : "translate-x-full",
      )}
    >
      <div className="flex h-full flex-col">
        <div className="relative flex h-full flex-1 overflow-hidden bg-slate-50">
          <div
            className={cn(
              "absolute inset-0 flex h-full w-full flex-col border-r bg-white transition-transform duration-300",
              "lg:relative lg:w-96 lg:flex-shrink-0 lg:translate-x-0",
              showListOnMobile ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
            )}
          >
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900">ข้อความ</h2>
                <p className="text-xs text-muted-foreground">
                  พูดคุยกับผู้ขายเกี่ยวกับการซื้อบ้านได้ที่นี่
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground"
                onClick={onClose}
                aria-label="ปิดหน้าต่างแชท"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="px-4 py-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="ค้นหาผู้ใช้หรือบทสนทนา"
                  className="w-full rounded-full border border-slate-200 bg-slate-100/60 py-2 pl-9 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto px-2 pb-4">
              {conversationsLoading ? (
                <div className="flex flex-col gap-3 px-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={`skeleton-${index}`}
                      className="flex animate-pulse items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3"
                    >
                      <div className="h-12 w-12 rounded-full bg-slate-200" />
                      <div className="flex flex-1 flex-col gap-2">
                        <div className="h-4 w-32 rounded bg-slate-200" />
                        <div className="h-3 w-40 rounded bg-slate-200" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : conversationListEmpty ? (
                <div className="mt-10 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm text-muted-foreground">
                  ยังไม่มีบทสนทนา เริ่มพูดคุยกับผู้ขายเพื่อให้แสดงในรายการนี้
                </div>
              ) : (
                filteredConversations.map((conversation) => {
                  const isActive = conversation.id === activeConversationId
                  const unreadCount = conversation.unreadCount ?? 0
                  const lastTimestamp = conversation.lastMessageAt?.toDate?.() ?? conversation.updatedAt?.toDate?.() ?? null
                  const lastMessagePreview = conversation.lastMessage ??
                    (conversation.isPending ? "ส่งข้อความทักทายเพื่อเริ่มพูดคุย" : "ยังไม่มีข้อความ")

                  return (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() => handleSelectConversation(conversation.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition",
                        isActive
                          ? "bg-emerald-50 text-emerald-900 shadow-sm"
                          : "hover:bg-slate-100/70",
                      )}
                    >
                      <Avatar className="h-12 w-12 border border-white shadow-sm">
                        {conversation.displayAvatar ? (
                          <AvatarImage src={conversation.displayAvatar} alt={conversation.displayName} />
                        ) : (
                          <AvatarFallback className="bg-emerald-100 text-emerald-700">
                            {getInitials(conversation.displayName)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {conversation.displayName}
                          </p>
                          {conversation.pinned && (
                            <Pin className="h-3.5 w-3.5 text-emerald-500" />
                          )}
                          {conversation.isPending && (
                            <Badge variant="outline" className="h-5 rounded-full border-dashed text-[10px]">
                              กำลังสร้าง
                            </Badge>
                          )}
                        </div>
                        <p className="truncate text-xs text-slate-500">{lastMessagePreview}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[11px] text-slate-400">
                          {lastTimestamp ? formatRelative(lastTimestamp) : ""}
                        </span>
                        {unreadCount > 0 && (
                          <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })
              )}
              {conversationsError ? (
                <p className="px-4 text-xs text-red-500">{conversationsError}</p>
              ) : null}
            </div>
          </div>

          <div
            className={cn(
              "flex h-full flex-1 flex-col bg-white",
              "transition-transform duration-300",
              showListOnMobile ? "translate-x-full lg:translate-x-0" : "translate-x-0",
            )}
          >
            {activeConversation ? (
              <>
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="mr-1 h-9 w-9 lg:hidden"
                      onClick={handleBackToList}
                      aria-label="ย้อนกลับไปยังรายชื่อแชท"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <Avatar className="h-10 w-10 border">
                      {activeConversation.displayAvatar ? (
                        <AvatarImage
                          src={activeConversation.displayAvatar}
                          alt={activeConversation.displayName}
                        />
                      ) : (
                        <AvatarFallback className="bg-emerald-100 text-emerald-700">
                          {getInitials(activeConversation.displayName)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {activeConversation.displayName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {activeConversationDate ? formatRelative(activeConversationDate) : "พร้อมพูดคุย"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      onClick={handleTogglePin}
                      disabled={activeConversation.isPending}
                      aria-label={activeConversation.pinned ? "ยกเลิกการปักหมุด" : "ปักหมุดบทสนทนา"}
                    >
                      {activeConversation.pinned ? (
                        <Pin className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <PinOff className="h-4 w-4 text-slate-400" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto bg-slate-50 px-4 py-6">
                  {messagesLoading ? (
                    <div className="flex h-full w-full items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground">
                      <MessageCircle className="h-8 w-8 text-emerald-500" />
                      <p>เริ่มต้นบทสนทนาโดยส่งข้อความแรกถึงผู้ใช้รายนี้</p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isMe = message.senderId === user?.uid
                      const timestamp = message.createdAt?.toDate?.() ?? null
                      return (
                        <div
                          key={message.id}
                          className={cn(
                            "mb-4 flex w-full flex-col",
                            isMe ? "items-end" : "items-start",
                          )}
                        >
                          <div
                            className={cn(
                              "max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm",
                              isMe
                                ? "bg-emerald-500 text-white"
                                : "bg-white text-slate-800",
                            )}
                          >
                            {message.text ? <p className="whitespace-pre-wrap break-words">{message.text}</p> : null}
                            {message.attachments.length > 0 ? (
                              <div className="mt-2 flex flex-col gap-2">
                                {message.attachments.map((attachment) => (
                                  <a
                                    key={attachment.id}
                                    href={attachment.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={cn(
                                      "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs",
                                      isMe
                                        ? "border-white/40 bg-white/20 text-white"
                                        : "border-emerald-100 bg-emerald-50 text-emerald-600",
                                    )}
                                  >
                                    {attachment.type === "video" ? (
                                      <FileVideo className="h-4 w-4" />
                                    ) : attachment.type === "image" ? (
                                      <FileImage className="h-4 w-4" />
                                    ) : (
                                      <Paperclip className="h-4 w-4" />
                                    )}
                                    <span className="max-w-[160px] truncate" title={attachment.name}>
                                      {attachment.name}
                                    </span>
                                  </a>
                                ))}
                              </div>
                            ) : null}
                            <div
                              className={cn(
                                "mt-2 text-[11px]",
                                isMe ? "text-white/70" : "text-slate-400",
                              )}
                            >
                              {formatMessageTime(timestamp)}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                  {messagesError ? (
                    <p className="mt-4 text-center text-xs text-red-500">{messagesError}</p>
                  ) : null}
                </div>

                <div className="border-t bg-white px-4 py-4">
                  {!user && !authLoading ? (
                    <div className="rounded-2xl border border-dashed border-emerald-300 bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-700">
                      กรุณาเข้าสู่ระบบเพื่อส่งข้อความและแนบไฟล์
                    </div>
                  ) : (
                    <>
                      {selectedFiles.length > 0 ? (
                        <div className="mb-3 flex flex-wrap gap-2">
                          {selectedFiles.map((file, index) => {
                            const isVideo = file.type.startsWith("video/")
                            return (
                              <div
                                key={`${file.name}-${index}`}
                                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700"
                              >
                                {isVideo ? (
                                  <FileVideo className="h-4 w-4 text-blue-500" />
                                ) : (
                                  <FileImage className="h-4 w-4 text-emerald-500" />
                                )}
                                <span className="max-w-[140px] truncate" title={file.name}>
                                  {file.name}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSelectedFile(index)}
                                  className="text-slate-400 transition hover:text-slate-700"
                                  aria-label="ลบไฟล์แนบ"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      ) : null}

                      <div className="flex items-end gap-3">
                        <div className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-emerald-200">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-muted-foreground"
                            onClick={() => fileInputRef.current?.click()}
                            aria-label="แนบรูปภาพหรือวิดีโอ"
                            disabled={sendingMessage}
                          >
                            <Paperclip className="h-5 w-5" />
                          </Button>
                          <textarea
                            rows={2}
                            value={messageInput}
                            onChange={(event) => setMessageInput(event.target.value)}
                            onKeyDown={handleMessageKeyDown}
                            placeholder="พิมพ์ข้อความเพื่อคุยเรื่องซื้อบ้าน..."
                            className="flex-1 resize-none bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
                            disabled={sendingMessage}
                          />
                          <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/*,video/*"
                            className="hidden"
                            onChange={handleFileChange}
                          />
                        </div>
                        <Button
                          type="button"
                          onClick={() => void handleSendMessage()}
                          disabled={!canSendMessage}
                          className="h-11 w-11 rounded-full bg-emerald-500 text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-200"
                          aria-label="ส่งข้อความ"
                        >
                          {sendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-5 w-5" />}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
                <div className="rounded-full bg-emerald-50 p-4 text-emerald-600">
                  <MessageCircle className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-slate-900">
                    เลือกผู้ใช้เพื่อเริ่มบทสนทนา
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    เลือกผู้ติดต่อจากรายการด้านซ้ายเพื่อพูดคุยรายละเอียดการซื้อบ้านที่คุณสนใจ
                  </p>
                </div>
                <Button variant="outline" onClick={handleBackToList} className="mt-2 lg:hidden">
                  กลับไปรายชื่อแชท
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

