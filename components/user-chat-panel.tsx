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
  AlertCircle,
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
import {
  ensureConversation,
  markConversationRead,
  sendMessage as sendChatMessage,
  setConversationPinned,
  subscribeToConversationMessages,
  subscribeToUserConversations,
  type ChatMessage as StoredChatMessage,
  type UserConversation,
} from "@/lib/chat"

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
  const [conversations, setConversations] = useState<UserConversation[]>([])
  const [messages, setMessages] = useState<StoredChatMessage[]>([])
  const [conversationsLoading, setConversationsLoading] = useState(false)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [conversationsError, setConversationsError] = useState<string | null>(
    null,
  )
  const [messagesError, setMessagesError] = useState<string | null>(null)

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
      setMessages([])
      setMessagesError(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      return
    }

    if (initialConversationId) {
      setActiveConversationId(initialConversationId)
      setShowListOnMobile(false)
    }
  }, [open, initialConversationId])

  useEffect(() => {
    if (!user?.uid) {
      setConversations([])
      setConversationsLoading(false)
      setConversationsError(null)
      return
    }

    let isActive = true
    let unsubscribe: (() => void) | undefined

    setConversationsLoading(true)
    setConversationsError(null)

    subscribeToUserConversations(user.uid, (items) => {
      if (!isActive) return
      setConversations(items)
      setConversationsLoading(false)
    })
      .then((fn) => {
        if (!isActive) {
          fn()
          return
        }
        unsubscribe = fn
      })
      .catch((error) => {
        console.error("Failed to subscribe to conversations", error)
        if (!isActive) {
          return
        }
        setConversationsLoading(false)
        setConversationsError("ไม่สามารถโหลดรายการแชทได้")
      })

    return () => {
      isActive = false
      unsubscribe?.()
    }
  }, [user?.uid])

  useEffect(() => {
    if (!open || !user?.uid || !initialContact?.id) {
      return
    }

    let cancelled = false
    setShowListOnMobile(false)

    ensureConversation({
      currentUserId: user.uid,
      targetUserId: initialContact.id,
    })
      .then((result) => {
        if (cancelled) return
        setActiveConversationId(result.conversationId)
      })
      .catch((error) => {
        console.error("Failed to ensure conversation", error)
        if (cancelled) return
        toast({
          title: "ไม่สามารถเปิดแชทได้",
          description: "โปรดลองใหม่อีกครั้ง",
          variant: "destructive",
        })
      })

    return () => {
      cancelled = true
    }
  }, [open, user?.uid, initialContact?.id, toast])

  useEffect(() => {
    if (!activeConversationId) {
      setMessages([])
      setMessagesLoading(false)
      setMessagesError(null)
      return
    }

    let isActive = true
    let unsubscribe: (() => void) | undefined
    setMessagesLoading(true)
    setMessagesError(null)

    subscribeToConversationMessages(activeConversationId, (items) => {
      if (!isActive) return
      setMessages(items)
      setMessagesLoading(false)
    })
      .then((fn) => {
        if (!isActive) {
          fn()
          return
        }
        unsubscribe = fn
      })
      .catch((error) => {
        console.error("Failed to subscribe to messages", error)
        if (!isActive) {
          return
        }
        setMessages([])
        setMessagesLoading(false)
        setMessagesError("ไม่สามารถโหลดข้อความได้")
      })

    return () => {
      isActive = false
      unsubscribe?.()
    }
  }, [activeConversationId])

  useEffect(() => {
    if (!user?.uid || !activeConversationId) {
      return
    }

    markConversationRead(user.uid, activeConversationId).catch((error) => {
      console.error("Failed to mark conversation as read", error)
    })
  }, [activeConversationId, user?.uid])

  const activeConversation = useMemo(() => {
    if (!activeConversationId) return null
    return conversations.find((conversation) => conversation.id === activeConversationId) ?? null
  }, [activeConversationId, conversations])

  useEffect(() => {
    if (!open) return
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [open, activeConversationId, messages.length])

  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => {
      if (a.pinned !== b.pinned) {
        return a.pinned ? -1 : 1
      }

      const timeA =
        a.lastMessage?.createdAt?.getTime() ??
        a.updatedAt?.getTime() ??
        a.createdAt?.getTime() ??
        0
      const timeB =
        b.lastMessage?.createdAt?.getTime() ??
        b.updatedAt?.getTime() ??
        b.createdAt?.getTime() ??
        0

      return timeB - timeA
    })
  }, [conversations])

  const filteredConversations = useMemo(() => {
    if (!searchTerm.trim()) {
      return sortedConversations
    }

    const keyword = searchTerm.trim().toLowerCase()
    return sortedConversations.filter((conversation) => {
      const name = conversation.otherUser.name.toLowerCase()
      if (name.includes(keyword)) {
        return true
      }

      const messageText = conversation.lastMessage?.text ?? ""
      if (messageText.toLowerCase().includes(keyword)) {
        return true
      }

      return false
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
    if (user?.uid) {
      markConversationRead(user.uid, conversationId).catch((error) => {
        console.error("Failed to mark conversation as read", error)
      })
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

  const togglePin = async () => {
    if (!activeConversation || !user?.uid) {
      return
    }

    try {
      await setConversationPinned(
        user.uid,
        activeConversation.id,
        !activeConversation.pinned,
      )
    } catch (error) {
      console.error("Failed to toggle pin", error)
      toast({
        title: "ปักหมุดไม่สำเร็จ",
        description: "โปรดลองอีกครั้ง",
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

    setSendingMessage(true)

    try {
      let conversationId = activeConversationId

      if (!conversationId) {
        if (!initialContact?.id) {
          toast({
            title: "ไม่สามารถส่งข้อความได้",
            description: "กรุณาเลือกผู้ใช้ที่จะสนทนาก่อน",
            variant: "destructive",
          })
          return
        }

        const result = await ensureConversation({
          currentUserId: user.uid,
          targetUserId: initialContact.id,
        })
        conversationId = result.conversationId
        setActiveConversationId(conversationId)
      }

      await sendChatMessage({
        conversationId,
        senderId: user.uid,
        text: trimmedMessage || null,
        files: selectedFiles,
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
        description: "โปรดลองอีกครั้ง",
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
    !filteredConversations.length && !conversationsLoading

  const activeConversationDate = useMemo(() => {
    if (!activeConversation) {
      return null
    }

    return (
      activeConversation.lastMessage?.createdAt ??
      activeConversation.updatedAt ??
      activeConversation.createdAt ??
      null
    )
  }, [activeConversation])

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
              {conversationsLoading ? (
                <div className="flex h-full items-center justify-center text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : conversationsError ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-sm text-red-500">
                  <AlertCircle className="h-6 w-6" />
                  <p>{conversationsError}</p>
                </div>
              ) : conversationListEmpty ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-sm text-muted-foreground">
                  <MessageCircle className="h-8 w-8 text-emerald-500" />
                  <p>ยังไม่มีบทสนทนา เริ่มพูดคุยกับผู้ขายเพื่อวางแผนซื้อบ้าน</p>
                </div>
              ) : (
                filteredConversations.map((conversation) => {
                  const isActive = activeConversationId === conversation.id
                  const lastMessage = conversation.lastMessage
                  const lastTimestamp =
                    lastMessage?.createdAt ??
                    conversation.updatedAt ??
                    conversation.createdAt ??
                    null

                  let lastMessagePreview = "ยังไม่มีข้อความ"
                  if (lastMessage) {
                    if (lastMessage.text && lastMessage.text.trim()) {
                      lastMessagePreview = lastMessage.text.trim()
                    } else if (lastMessage.attachments.length > 0) {
                      if (lastMessage.attachments.length === 1) {
                        const attachment = lastMessage.attachments[0]
                        if (attachment.type === "image") {
                          lastMessagePreview = "ส่งรูปภาพ"
                        } else if (attachment.type === "video") {
                          lastMessagePreview = "ส่งวิดีโอ"
                        } else {
                          lastMessagePreview = `ส่งไฟล์ ${attachment.name}`
                        }
                      } else {
                        lastMessagePreview = `ส่งไฟล์แนบ ${lastMessage.attachments.length} รายการ`
                      }
                    }
                  }

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
                        {conversation.otherUser.photoURL ? (
                          <AvatarImage
                            src={conversation.otherUser.photoURL}
                            alt={conversation.otherUser.name}
                          />
                        ) : (
                          <AvatarFallback className="bg-emerald-100 text-emerald-700">
                            {getInitials(conversation.otherUser.name)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {conversation.otherUser.name}
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
                      {activeConversation.otherUser.photoURL ? (
                        <AvatarImage
                          src={activeConversation.otherUser.photoURL}
                          alt={activeConversation.otherUser.name}
                        />
                      ) : (
                        <AvatarFallback className="bg-emerald-100 text-emerald-700">
                          {getInitials(activeConversation.otherUser.name)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {activeConversation.otherUser.name}
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
                  {messagesLoading ? (
                    <div className="flex h-full items-center justify-center text-slate-400">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  ) : messagesError ? (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-red-500">
                      <AlertCircle className="h-6 w-6" />
                      <p>{messagesError}</p>
                    </div>
                  ) : messages.length === 0 ? (
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
