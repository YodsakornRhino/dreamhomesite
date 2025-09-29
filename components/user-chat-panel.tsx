"use client"

import {
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
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useAuthContext } from "@/contexts/AuthContext"
import { cn } from "@/lib/utils"

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

interface ChatAttachment {
  id: string
  type: "image" | "video"
  name: string
  url: string
}

interface ChatMessage {
  id: string
  senderId: string
  text: string | null
  attachments: ChatAttachment[]
  createdAt: Date
}

interface Conversation {
  id: string
  name: string
  avatar: string | null
  pinned: boolean
  unreadCount: number
  createdAt: Date
  messages: ChatMessage[]
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

const createSampleConversations = (): Conversation[] => {
  const now = new Date()
  return [
    {
      id: "conv-001",
      name: "คุณสมชาย บ้านเดี่ยวบางนา",
      avatar: null,
      pinned: true,
      unreadCount: 2,
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 5),
      messages: [
        {
          id: "conv-001-msg-001",
          senderId: "conv-001-buyer",
          text: "สวัสดีครับ สนใจบ้านเดี่ยว 3 ห้องนอนของคุณครับ ยังพร้อมขายอยู่ไหม?",
          attachments: [],
          createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 4.5),
        },
        {
          id: "conv-001-msg-002",
          senderId: "current-user",
          text: "พร้อมขายครับ บ้านเพิ่งรีโนเวทเสร็จเมื่อเดือนที่แล้ว สนใจนัดชมวันไหนได้บ้างครับ",
          attachments: [],
          createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 4.4),
        },
        {
          id: "conv-001-msg-003",
          senderId: "conv-001-buyer",
          text: "สุดสัปดาห์นี้ได้ไหมครับ ถ้ามีรูปเพิ่มเติมส่งมาได้เลยนะครับ",
          attachments: [],
          createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 3),
        },
      ],
    },
    {
      id: "conv-002",
      name: "คุณณิชา คอนโดหรูสุขุมวิท",
      avatar: null,
      pinned: false,
      unreadCount: 0,
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2),
      messages: [
        {
          id: "conv-002-msg-001",
          senderId: "current-user",
          text: "สวัสดีค่ะ คอนโดยังอยู่ไหมคะ",
          attachments: [],
          createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2),
        },
        {
          id: "conv-002-msg-002",
          senderId: "conv-002-owner",
          text: "ยังว่างอยู่ค่ะ สามารถนัดชมได้ทุกวันหลัง 6 โมงเย็นนะคะ",
          attachments: [],
          createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 20),
        },
        {
          id: "conv-002-msg-003",
          senderId: "current-user",
          text: null,
          attachments: [
            {
              id: "conv-002-msg-003-attach-1",
              type: "image",
              name: "แปลนห้อง.jpg",
              url: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=400&q=80",
            },
          ],
          createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 19),
        },
      ],
    },
    {
      id: "conv-003",
      name: "คุณอรทัย บ้านสวนเชียงใหม่",
      avatar: null,
      pinned: false,
      unreadCount: 0,
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24),
      messages: [],
    },
  ]
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
  const [sendingMessage, setSendingMessage] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>(
    () => createSampleConversations(),
  )

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) {
      setSearchTerm("")
      setActiveConversationId(null)
      setSelectedFiles([])
      setMessageInput("")
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

  useEffect(() => {
    if (!open || !initialConversationId) {
      return
    }

    setConversations((previous) => {
      const exists = previous.some((conversation) => conversation.id === initialConversationId)
      if (exists) {
        return previous
      }

      const now = new Date()
      const placeholder: Conversation = {
        id: initialConversationId,
        name: "บทสนทนาใหม่",
        avatar: null,
        pinned: false,
        unreadCount: 0,
        createdAt: now,
        messages: [],
      }

      return [placeholder, ...previous]
    })
  }, [initialConversationId, open])

  useEffect(() => {
    if (!open || !initialContact) {
      return
    }

    const conversationId = `contact-${initialContact.id}`
    setConversations((previous) => {
      const exists = previous.some((conversation) => conversation.id === conversationId)
      if (exists) {
        return previous
      }

      const now = new Date()
      const newConversation: Conversation = {
        id: conversationId,
        name: initialContact.name?.trim() || "ผู้ใช้ DreamHome",
        avatar: initialContact.avatar ?? null,
        pinned: false,
        unreadCount: 0,
        createdAt: now,
        messages: [],
      }

      return [newConversation, ...previous]
    })
    setActiveConversationId(conversationId)
  }, [initialContact, open])

  const activeConversation = useMemo(() => {
    if (!activeConversationId) return null
    return conversations.find((conversation) => conversation.id === activeConversationId) ?? null
  }, [activeConversationId, conversations])

  const messages = activeConversation?.messages ?? []

  useEffect(() => {
    if (!open) return
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [open, activeConversationId, messages.length])

  const sortedConversations = useMemo(() => {
    const withLastTimestamp = conversations.map((conversation) => {
      const lastMessage = conversation.messages[conversation.messages.length - 1] ?? null
      const lastTimestamp = lastMessage?.createdAt ?? conversation.createdAt
      return { conversation, lastTimestamp }
    })

    return withLastTimestamp
      .sort((a, b) => {
        if (a.conversation.pinned !== b.conversation.pinned) {
          return a.conversation.pinned ? -1 : 1
        }
        return b.lastTimestamp.getTime() - a.lastTimestamp.getTime()
      })
      .map((item) => item.conversation)
  }, [conversations])

  const filteredConversations = useMemo(() => {
    if (!searchTerm.trim()) {
      return sortedConversations
    }

    const keyword = searchTerm.trim().toLowerCase()
    return sortedConversations.filter((conversation) => {
      if (conversation.name.toLowerCase().includes(keyword)) {
        return true
      }

      return conversation.messages.some((message) => {
        const text = message.text ?? ""
        return text.toLowerCase().includes(keyword)
      })
    })
  }, [searchTerm, sortedConversations])

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

  const togglePin = () => {
    if (!activeConversation) {
      return
    }

    setConversations((previous) =>
      previous.map((conversation) =>
        conversation.id === activeConversation.id
          ? { ...conversation, pinned: !conversation.pinned }
          : conversation,
      ),
    )
  }

  const ensureConversationExists = (): string => {
    if (activeConversationId) {
      return activeConversationId
    }

    if (initialContact) {
      const conversationId = `contact-${initialContact.id}`
      setConversations((previous) => {
        const exists = previous.some((conversation) => conversation.id === conversationId)
        if (exists) {
          return previous
        }

        const now = new Date()
        const newConversation: Conversation = {
          id: conversationId,
          name: initialContact.name?.trim() || "ผู้ใช้ DreamHome",
          avatar: initialContact.avatar ?? null,
          pinned: false,
          unreadCount: 0,
          createdAt: now,
          messages: [],
        }

        return [newConversation, ...previous]
      })
      setActiveConversationId(conversationId)
      return conversationId
    }

    const generatedId = `local-${Date.now()}`
    const now = new Date()
    const fallbackConversation: Conversation = {
      id: generatedId,
      name: "ผู้ใช้ DreamHome",
      avatar: null,
      pinned: false,
      unreadCount: 0,
      createdAt: now,
      messages: [],
    }
    setConversations((previous) => [fallbackConversation, ...previous])
    setActiveConversationId(generatedId)
    return generatedId
  }

  const handleSendMessage = () => {
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

    setSendingMessage(true)

    try {
      const conversationId = ensureConversationExists()
      const attachments = selectedFiles.map((file, index) => ({
        id: `${conversationId}-file-${Date.now()}-${index}`,
        type: file.type.startsWith("video/") ? "video" : "image",
        name: file.name,
        url: URL.createObjectURL(file),
      }))

      const newMessage: ChatMessage = {
        id: `${conversationId}-message-${Date.now()}`,
        senderId: user.uid ?? "current-user",
        text: trimmedMessage || null,
        attachments,
        createdAt: new Date(),
      }

      setConversations((previous) => {
        const existingIndex = previous.findIndex(
          (conversation) => conversation.id === conversationId,
        )

        if (existingIndex === -1) {
          return previous
        }

        const updated = [...previous]
        const target = updated[existingIndex]
        updated[existingIndex] = {
          ...target,
          messages: [...target.messages, newMessage],
          unreadCount: 0,
        }

        return updated
      })

      setMessageInput("")
      setSelectedFiles([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      setShowListOnMobile(false)
    } finally {
      setSendingMessage(false)
    }
  }

  const handleMessageKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      if (!sendingMessage) {
        handleSendMessage()
      }
    }
  }

  const canSendMessage =
    Boolean(user) &&
    (messageInput.trim().length > 0 || selectedFiles.length > 0) &&
    !sendingMessage

  const conversationListEmpty = !filteredConversations.length

  const activeConversationDate = (() => {
    if (!activeConversation) {
      return null
    }
    const lastMessage = activeConversation.messages[activeConversation.messages.length - 1]
    return lastMessage?.createdAt ?? activeConversation.createdAt
  })()

  return (
    <div
      className={cn(
        "fixed inset-y-0 right-0 z-50 w-full max-w-full bg-white shadow-2xl transition-transform duration-300",
        "sm:max-w-md md:max-w-3xl lg:max-w-4xl xl:max-w-5xl",
        "md:rounded-l-3xl md:border md:border-slate-200 md:border-r-0",
        open ? "translate-x-0" : "translate-x-full",
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 md:hidden"
              onClick={onClose}
              aria-label="ปิดหน้าต่างแชท"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <p className="text-sm font-semibold text-slate-900">ข้อความ</p>
              <p className="text-xs text-slate-500">
                พูดคุยเรื่องการซื้อบ้านกับเจ้าของทรัพย์สินได้ที่นี่
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="hidden h-9 w-9 md:flex"
            onClick={onClose}
            aria-label="ปิดหน้าต่างแชท"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <div
            className={cn(
              "flex w-full flex-col bg-slate-50",
              "transition-transform duration-300 md:translate-x-0",
              "md:w-80 md:flex-none md:border-r md:border-slate-100 lg:w-96",
              showListOnMobile ? "translate-x-0" : "-translate-x-full md:translate-x-0",
            )}
          >
            <div className="border-b bg-white px-4 py-3 md:px-5 md:py-4">
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="ค้นหารายชื่อหรือข้อความ"
                  className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {conversationListEmpty ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-sm text-muted-foreground">
                  <MessageCircle className="h-8 w-8 text-emerald-500" />
                  <p>ยังไม่มีบทสนทนา เริ่มพูดคุยกับผู้ขายเพื่อวางแผนซื้อบ้าน</p>
                </div>
              ) : (
                filteredConversations.map((conversation) => {
                  const isActive = activeConversationId === conversation.id
                  const lastMessage = conversation.messages[conversation.messages.length - 1] ?? null
                  const lastTimestamp = lastMessage?.createdAt ?? conversation.createdAt
                  const lastMessagePreview =
                    lastMessage?.text?.trim() ||
                    (lastMessage?.attachments.length
                      ? "ส่งไฟล์แนบ"
                      : "ยังไม่มีข้อความ")
                  const unreadCount = conversation.unreadCount

                  return (
                    <button
                      type="button"
                      key={conversation.id}
                      onClick={() => handleSelectConversation(conversation.id)}
                      className={cn(
                        "flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left transition md:px-5 md:py-4",
                        isActive
                          ? "bg-emerald-50 text-emerald-900 shadow-sm"
                          : "hover:bg-slate-100/70",
                      )}
                    >
                      <Avatar className="h-12 w-12 border border-white shadow-sm">
                        {conversation.avatar ? (
                          <AvatarImage src={conversation.avatar} alt={conversation.name} />
                        ) : (
                          <AvatarFallback className="bg-emerald-100 text-emerald-700">
                            {getInitials(conversation.name)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {conversation.name}
                          </p>
                          {conversation.pinned && (
                            <Pin className="h-3.5 w-3.5 text-emerald-500" />
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
            </div>
          </div>

          <div
            className={cn(
              "flex h-full flex-1 flex-col bg-white",
              "transition-transform duration-300",
              showListOnMobile ? "translate-x-full md:translate-x-0" : "translate-x-0",
            )}
          >
            {activeConversation ? (
              <>
                <div className="flex items-center justify-between border-b px-4 py-3 md:px-6 md:py-4">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="mr-1 h-9 w-9 md:hidden"
                      onClick={handleBackToList}
                      aria-label="ย้อนกลับไปยังรายชื่อแชท"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <Avatar className="h-10 w-10 border">
                      {activeConversation.avatar ? (
                        <AvatarImage
                          src={activeConversation.avatar}
                          alt={activeConversation.name}
                        />
                      ) : (
                        <AvatarFallback className="bg-emerald-100 text-emerald-700">
                          {getInitials(activeConversation.name)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {activeConversation.name}
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
                      onClick={togglePin}
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

                <div className="flex-1 overflow-y-auto bg-slate-50 px-4 py-6 sm:px-6 md:px-8">
                  {messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground">
                      <MessageCircle className="h-8 w-8 text-emerald-500" />
                      <p>เริ่มต้นบทสนทนาโดยส่งข้อความแรกถึงผู้ใช้รายนี้</p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isMe = message.senderId === (user?.uid ?? "current-user")
                      const timestamp = message.createdAt ?? null
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
                                    ) : (
                                      <FileImage className="h-4 w-4" />
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
                </div>

                <div className="border-t bg-white px-4 py-4 md:px-6">
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

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
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
                          onClick={handleSendMessage}
                          disabled={!canSendMessage}
                          className="h-11 w-full rounded-2xl bg-emerald-500 text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-200 sm:w-12 sm:rounded-full"
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
                <Button variant="outline" onClick={handleBackToList} className="mt-2 md:hidden">
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
