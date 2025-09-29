"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { ChangeEvent, KeyboardEvent } from "react"
import {
  ArrowLeft,
  FileImage,
  FileVideo,
  MessageCircle,
  Paperclip,
  Pin,
  PinOff,
  Search,
  Send,
  X,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ChatAttachmentType = "image" | "video"

type MessageSender = "me" | "other"

interface ChatAttachment {
  id: string
  type: ChatAttachmentType
  name: string
}

interface ChatMessage {
  id: string
  sender: MessageSender
  text?: string
  timestamp: string
  attachments?: ChatAttachment[]
}

interface ConversationPreview {
  id: string
  name: string
  avatar?: string | null
  role?: string
  pinned?: boolean
  lastMessage: string
  lastActive: string
  unread?: number
  messages: ChatMessage[]
}

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

const INITIAL_CONVERSATIONS: ConversationPreview[] = [
  {
    id: "conv-001",
    name: "คุณณัฐกานต์",
    role: "ที่ปรึกษาการขาย",
    pinned: true,
    lastMessage: "แนบภาพบรรยากาศโครงการไว้ให้นะคะ",
    lastActive: "5 นาทีที่แล้ว",
    unread: 1,
    messages: [
      {
        id: "conv-001-msg-01",
        sender: "other",
        text: "สวัสดีค่ะ สนใจโครงการ Dream Residence ใช่ไหมคะ",
        timestamp: "09:58",
      },
      {
        id: "conv-001-msg-02",
        sender: "me",
        text: "ใช่ครับ อยากทราบรายละเอียดโปรโมชั่นล่าสุด",
        timestamp: "10:02",
      },
      {
        id: "conv-001-msg-03",
        sender: "other",
        text: "ตอนนี้มีโปรดาวน์ต่ำพิเศษ พร้อมของแถมเครื่องใช้ไฟฟ้าครบชุดค่ะ",
        timestamp: "10:05",
      },
      {
        id: "conv-001-msg-04",
        sender: "other",
        text: "แนบภาพบรรยากาศโครงการไว้ให้นะคะ",
        timestamp: "10:05",
        attachments: [
          {
            id: "conv-001-att-01",
            type: "image",
            name: "มุมมองสวนส่วนกลาง.jpg",
          },
          {
            id: "conv-001-att-02",
            type: "image",
            name: "ห้องตัวอย่าง-2ห้องนอน.png",
          },
        ],
      },
    ],
  },
  {
    id: "conv-002",
    name: "คุณพิมลพรรณ",
    role: "เจ้าของบ้าน",
    pinned: false,
    lastMessage: "จะส่งวิดีโอพาชมห้องให้ภายในเย็นนี้นะคะ",
    lastActive: "12 นาทีที่แล้ว",
    unread: 0,
    messages: [
      {
        id: "conv-002-msg-01",
        sender: "other",
        text: "สวัสดีค่ะ บ้านยังว่างอยู่นะคะ",
        timestamp: "09:10",
      },
      {
        id: "conv-002-msg-02",
        sender: "me",
        text: "ขอนัดดูบ้านวันเสาร์นี้ได้ไหมครับ",
        timestamp: "09:18",
      },
      {
        id: "conv-002-msg-03",
        sender: "other",
        text: "ได้เลยค่ะ เดี๋ยวส่งโลเคชันให้พร้อมวิดีโอพาชมห้อง",
        timestamp: "09:25",
        attachments: [
          {
            id: "conv-002-att-01",
            type: "video",
            name: "tour-บ้านเดี่ยว.mp4",
          },
        ],
      },
    ],
  },
  {
    id: "conv-003",
    name: "ทีมบริการลูกค้า DreamHome",
    role: "DreamHome",
    pinned: false,
    lastMessage: "ขอบคุณที่ติดต่อ DreamHome ค่ะ",
    lastActive: "เมื่อวาน",
    unread: 0,
    messages: [
      {
        id: "conv-003-msg-01",
        sender: "other",
        text: "สวัสดีค่ะ หากต้องการคำแนะนำเพิ่มเติมแจ้งได้เลยนะคะ",
        timestamp: "เมื่อวาน",
      },
      {
        id: "conv-003-msg-02",
        sender: "me",
        text: "ขอบคุณครับ",
        timestamp: "เมื่อวาน",
      },
    ],
  },
]

const cloneInitialConversations = (): ConversationPreview[] => {
  return INITIAL_CONVERSATIONS.map((conversation) => ({
    ...conversation,
    messages: conversation.messages.map((message) => ({
      ...message,
      attachments: message.attachments?.map((attachment) => ({ ...attachment })),
    })),
  }))
}

const getInitials = (name: string): string => {
  if (!name) return "DH"
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase()
}

export function UserChatPanel({
  open,
  onClose,
  initialConversationId,
  initialContact,
}: UserChatPanelProps) {
  const [conversations, setConversations] = useState<ConversationPreview[]>(
    () => cloneInitialConversations(),
  )
  const [searchTerm, setSearchTerm] = useState("")
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    null,
  )
  const [messageInput, setMessageInput] = useState("")
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [showListOnMobile, setShowListOnMobile] = useState(true)

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) {
      setConversations(cloneInitialConversations())
      setActiveConversationId(null)
      setSearchTerm("")
      setMessageInput("")
      setSelectedFiles([])
      setShowListOnMobile(true)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      return
    }

    const baseConversations = cloneInitialConversations()
    let nextConversations = baseConversations

    if (initialContact) {
      const existingIndex = nextConversations.findIndex(
        (conversation) => conversation.id === initialContact.id,
      )

      if (existingIndex >= 0) {
        nextConversations = nextConversations.map((conversation, index) =>
          index === existingIndex
            ? {
                ...conversation,
                name: initialContact.name,
                avatar: initialContact.avatar ?? null,
                messages:
                  conversation.messages.length > 0
                    ? conversation.messages
                    : [
                        {
                          id: `${conversation.id}-intro`,
                          sender: "other",
                          text: `สวัสดีค่ะ ฉันคือ ${initialContact.name} พร้อมช่วยเหลือเรื่องบ้านที่สนใจนะคะ`,
                          timestamp: "ตอนนี้",
                        },
                      ],
              }
            : conversation,
        )
      } else {
        nextConversations = [
          {
            id: initialContact.id,
            name: initialContact.name,
            avatar: initialContact.avatar ?? null,
            role: "ผู้ขาย",
            pinned: false,
            lastMessage: "ส่งข้อความทักทายเพื่อเริ่มพูดคุย",
            lastActive: "ตอนนี้",
            unread: 0,
            messages: [
              {
                id: `${initialContact.id}-intro`,
                sender: "other",
                text: `สวัสดีค่ะ ฉันคือ ${initialContact.name} ยินดีให้ข้อมูลเพิ่มเติมเกี่ยวกับบ้านที่คุณสนใจค่ะ`,
                timestamp: "ตอนนี้",
              },
            ],
          },
          ...nextConversations,
        ]
      }
    }

    setConversations(nextConversations)
    setSearchTerm("")
    setMessageInput("")
    setSelectedFiles([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }

    let targetConversationId =
      initialConversationId ??
      (initialContact ? initialContact.id : nextConversations[0]?.id ?? null)

    if (
      targetConversationId &&
      !nextConversations.some((conversation) => conversation.id === targetConversationId)
    ) {
      targetConversationId = nextConversations[0]?.id ?? null
    }

    setActiveConversationId(targetConversationId ?? null)
    const shouldOpenConversation = Boolean(
      (initialConversationId && targetConversationId) || initialContact,
    )
    setShowListOnMobile(!shouldOpenConversation)
  }, [open, initialConversationId, initialContact])

  const activeConversation = useMemo(() => {
    return (
      conversations.find(
        (conversation) => conversation.id === activeConversationId,
      ) ?? null
    )
  }, [conversations, activeConversationId])

  const messageCount = activeConversation?.messages.length ?? 0

  useEffect(() => {
    if (!open) return
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [open, activeConversationId, messageCount])

  const filteredConversations = useMemo(() => {
    if (!searchTerm.trim()) {
      return conversations
    }

    const keyword = searchTerm.trim().toLowerCase()
    return conversations.filter((conversation) => {
      const name = conversation.name.toLowerCase()
      const lastMessage = conversation.lastMessage.toLowerCase()
      return name.includes(keyword) || lastMessage.includes(keyword)
    })
  }, [conversations, searchTerm])

  const sortedConversations = useMemo(() => {
    const pinned = filteredConversations.filter((conversation) => conversation.pinned)
    const others = filteredConversations.filter((conversation) => !conversation.pinned)
    return [...pinned, ...others]
  }, [filteredConversations])

  const handleSelectConversation = (conversationId: string) => {
    setActiveConversationId(conversationId)
    setConversations((previous) =>
      previous.map((conversation) =>
        conversation.id === conversationId
          ? { ...conversation, unread: 0 }
          : conversation,
      ),
    )
    setSelectedFiles([])
    setMessageInput("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    setShowListOnMobile(false)
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

  const handleTogglePin = () => {
    if (!activeConversation) return
    setConversations((previous) =>
      previous.map((conversation) =>
        conversation.id === activeConversation.id
          ? { ...conversation, pinned: !conversation.pinned }
          : conversation,
      ),
    )
  }

  const handleSendMessage = () => {
    if (!activeConversationId) return
    const trimmedMessage = messageInput.trim()
    const hasAttachments = selectedFiles.length > 0
    if (!trimmedMessage && !hasAttachments) {
      return
    }

    const attachments: ChatAttachment[] = selectedFiles.map((file, index) => ({
      id: `${activeConversationId}-attachment-${Date.now()}-${index}`,
      name: file.name,
      type: file.type.startsWith("video/") ? "video" : "image",
    }))

    setConversations((previous) =>
      previous.map((conversation) => {
        if (conversation.id !== activeConversationId) {
          return conversation
        }

        const nextMessage: ChatMessage = {
          id: `${activeConversationId}-message-${Date.now()}`,
          sender: "me",
          text: trimmedMessage || undefined,
          timestamp: "เพิ่งส่ง",
          attachments: attachments.length ? attachments : undefined,
        }

        const updatedMessages = [...conversation.messages, nextMessage]
        const summaryText =
          trimmedMessage ||
          (attachments.length ? `${attachments.length} ไฟล์แนบ` : "ส่งข้อความใหม่")

        return {
          ...conversation,
          messages: updatedMessages,
          lastMessage: summaryText,
          lastActive: "เพิ่งส่ง",
          unread: 0,
        }
      }),
    )

    setMessageInput("")
    setSelectedFiles([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    setShowListOnMobile(false)
  }

  const handleMessageKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      handleSendMessage()
    }
  }

  const canSendMessage = messageInput.trim().length > 0 || selectedFiles.length > 0

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
                  คุยรายละเอียดการซื้อบ้านกับผู้ขายได้ที่นี่
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
              {sortedConversations.length === 0 ? (
                <div className="mt-10 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm text-muted-foreground">
                  ยังไม่มีบทสนทนาที่ตรงกับคำค้นหา
                </div>
              ) : (
                sortedConversations.map((conversation) => {
                  const isActive = conversation.id === activeConversationId
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
                          {conversation.role ? (
                            <Badge variant="secondary" className="rounded-full px-2 text-[10px] uppercase tracking-wide">
                              {conversation.role}
                            </Badge>
                          ) : null}
                          {conversation.pinned ? (
                            <Badge variant="outline" className="rounded-full px-2 text-[10px] uppercase tracking-wide text-emerald-600">
                              ปักหมุด
                            </Badge>
                          ) : null}
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {conversation.lastMessage}
                        </p>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>{conversation.lastActive}</span>
                          {conversation.unread ? (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-xs font-medium text-white">
                              {conversation.unread}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          <div
            className={cn(
              "absolute inset-0 flex h-full w-full flex-col bg-white transition-transform duration-300",
              "lg:relative lg:flex-1 lg:translate-x-0",
              showListOnMobile ? "translate-x-full lg:translate-x-0" : "translate-x-0",
            )}
          >
            {activeConversation ? (
              <>
                <div className="flex items-center gap-3 border-b px-4 py-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="mr-1 h-9 w-9 text-muted-foreground lg:hidden"
                    onClick={handleBackToList}
                    aria-label="กลับไปหน้ารายชื่อผู้ใช้"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <Avatar className="h-11 w-11">
                    {activeConversation.avatar ? (
                      <AvatarImage src={activeConversation.avatar} alt={activeConversation.name} />
                    ) : (
                      <AvatarFallback className="bg-emerald-100 text-emerald-700">
                        {getInitials(activeConversation.name)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {activeConversation.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{activeConversation.lastActive}</p>
                  </div>
                  {activeConversation.role ? (
                    <Badge variant="secondary" className="rounded-full px-3 text-[11px]">
                      {activeConversation.role}
                    </Badge>
                  ) : null}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground"
                    onClick={handleTogglePin}
                    aria-label={activeConversation.pinned ? "ยกเลิกปักหมุด" : "ปักหมุดบทสนทนา"}
                  >
                    {activeConversation.pinned ? (
                      <PinOff className="h-5 w-5" />
                    ) : (
                      <Pin className="h-5 w-5" />
                    )}
                  </Button>
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

                <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 px-4 py-6">
                  {activeConversation.messages.map((message) => {
                    const isMe = message.sender === "me"
                    return (
                      <div
                        key={message.id}
                        className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}
                      >
                        <div
                          className={cn(
                            "max-w-[85%] rounded-3xl px-4 py-3 text-sm shadow-sm",
                            isMe
                              ? "rounded-br-md bg-emerald-500 text-white"
                              : "rounded-bl-md bg-white text-slate-800",
                          )}
                        >
                          {message.text ? (
                            <p className="whitespace-pre-line leading-relaxed">{message.text}</p>
                          ) : null}
                          {message.attachments?.length ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {message.attachments.map((attachment) => (
                                <div
                                  key={attachment.id}
                                  className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-2 text-xs font-medium text-emerald-700"
                                >
                                  {attachment.type === "video" ? (
                                    <FileVideo className="h-4 w-4" />
                                  ) : (
                                    <FileImage className="h-4 w-4" />
                                  )}
                                  <span className="max-w-[140px] truncate">{attachment.name}</span>
                                </div>
                              ))}
                            </div>
                          ) : null}
                          <div
                            className={cn(
                              "mt-2 text-[11px]",
                              isMe ? "text-white/70" : "text-slate-400",
                            )}
                          >
                            {message.timestamp}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <div className="border-t bg-white px-4 py-4">
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
                            <span className="max-w-[140px] truncate">{file.name}</span>
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
                      className="h-11 w-11 rounded-full bg-emerald-500 text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-200"
                      aria-label="ส่งข้อความ"
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
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
