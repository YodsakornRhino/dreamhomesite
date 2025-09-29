"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import {
  ArrowLeft,
  CheckCircle2,
  FileImage,
  FileVideo,
  Loader2,
  MessageCircle,
  Paperclip,
  Phone,
  Pin,
  PinOff,
  Search,
  Send,
  X,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useAuthContext } from "@/contexts/AuthContext"
import { cn } from "@/lib/utils"
import {
  ensureConversation,
  sendMessage,
  togglePinConversation,
  uploadChatAttachments,
  buildConversationId,
  type ChatAttachmentMetadata,
  type ConversationParticipant,
} from "@/lib/chat"
import {
  formatRelativeTime,
  useUserChats,
  type ChatPreview,
} from "@/hooks/use-user-chats"
import { getFirestoreInstance } from "@/lib/firestore"

interface ChatContact {
  id: string
  name: string
  avatar?: string | null
}

interface ChatMessage {
  id: string
  senderId: string
  text: string
  attachments: ChatAttachmentMetadata[]
  createdAt: Date | null
}

interface UserChatPanelProps {
  open: boolean
  onClose: () => void
  initialConversationId?: string | null
  initialContact?: ChatContact | null
}

const toDate = (value: unknown): Date | null => {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value === "number") return new Date(value)
  if (typeof value === "object" && value !== null && "toDate" in value) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (value as any).toDate()
    } catch (error) {
      console.warn("Failed to convert timestamp", error)
      return null
    }
  }
  return null
}

export function UserChatPanel({
  open,
  onClose,
  initialConversationId,
  initialContact,
}: UserChatPanelProps) {
  const { user } = useAuthContext()
  const { toast } = useToast()

  const currentUserParticipant = useMemo<ConversationParticipant | null>(() => {
    if (!user) return null
    return {
      uid: user.uid,
      name: user.displayName || user.email || "ผู้ใช้งาน DreamHome",
      photoURL: user.photoURL ?? undefined,
    }
  }, [user])

  const { conversations, loading: loadingConversations } = useUserChats(
    currentUserParticipant?.uid,
  )

  const [searchTerm, setSearchTerm] = useState("")
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    null,
  )
  const [pendingConversation, setPendingConversation] = useState<ChatPreview | null>(
    null,
  )
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [messageInput, setMessageInput] = useState("")
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isSending, setIsSending] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const ensuredConversationsRef = useRef<Set<string>>(new Set())

  const activeConversationFromStore = useMemo(
    () =>
      conversations.find((conversation) => conversation.id === activeConversationId) ??
      null,
    [conversations, activeConversationId],
  )

  const activeConversation = useMemo(() => {
    if (activeConversationFromStore) {
      return activeConversationFromStore
    }

    if (
      pendingConversation &&
      pendingConversation.id === activeConversationId &&
      pendingConversation.otherUser
    ) {
      return pendingConversation
    }

    return null
  }, [activeConversationFromStore, pendingConversation, activeConversationId])

  const filteredConversations = useMemo(() => {
    if (!searchTerm.trim()) {
      return conversations
    }
    const keyword = searchTerm.trim().toLowerCase()
    return conversations.filter((conversation) => {
      const name = conversation.otherUser?.name?.toLowerCase() ?? ""
      const lastMessage = conversation.lastMessageText.toLowerCase()
      return name.includes(keyword) || lastMessage.includes(keyword)
    })
  }, [conversations, searchTerm])

  useEffect(() => {
    if (!open) {
      setActiveConversationId(null)
      setSearchTerm("")
      setMessages([])
      setMessageInput("")
      setSelectedFiles([])
      setPendingConversation(null)
      ensuredConversationsRef.current.clear()
      return
    }

    if (!currentUserParticipant) {
      return
    }

    if (initialContact) {
      const ensuredConversationId = buildConversationId(
        currentUserParticipant.uid,
        initialContact.id,
      )
      const fallbackConversation: ChatPreview = {
        id: ensuredConversationId,
        conversationId: ensuredConversationId,
        otherUser: {
          uid: initialContact.id,
          name: initialContact.name,
          photoURL: initialContact.avatar ?? undefined,
        },
        lastMessageText: "เริ่มบทสนทนาใหม่",
        lastMessageAt: null,
        lastMessageSenderId: null,
        attachments: [],
        pinned: false,
        updatedAt: new Date(),
        createdAt: new Date(),
      }

      setActiveConversationId(ensuredConversationId)
      setPendingConversation(fallbackConversation)

      ensuredConversationsRef.current.add(ensuredConversationId)

      ensureConversation({
        currentUser: currentUserParticipant,
        targetUser: {
          uid: initialContact.id,
          name: initialContact.name,
          photoURL: initialContact.avatar ?? undefined,
        },
      })
        .then((conversationId) => {
          setActiveConversationId(conversationId)
        })
        .catch((error) => {
          console.error("Failed to ensure conversation", error)
          toast({
            title: "ไม่สามารถเปิดแชทได้",
            description: "เกิดข้อผิดพลาดในการเริ่มต้นการสนทนา",
            variant: "destructive",
          })
          setPendingConversation(null)
          ensuredConversationsRef.current.delete(ensuredConversationId)
        })
    }
  }, [
    open,
    initialContact,
    currentUserParticipant,
    toast,
  ])

  useEffect(() => {
    if (!open || !initialConversationId) {
      return
    }

    const matched = conversations.find(
      (conversation) =>
        conversation.id === initialConversationId ||
        conversation.otherUser?.uid === initialConversationId,
    )
    if (matched) {
      setActiveConversationId(matched.id)
      setPendingConversation(matched)
    }
  }, [open, initialConversationId, conversations])

  useEffect(() => {
    if (!activeConversationId) {
      return
    }

    const resolved = conversations.find(
      (conversation) => conversation.id === activeConversationId,
    )

    if (resolved) {
      setPendingConversation(null)
    }
  }, [conversations, activeConversationId])

  useEffect(() => {
    if (!open) {
      return
    }

    if (!activeConversationId) {
      setMessages([])
      return
    }

    let unsubscribe: (() => void) | undefined
    let cancelled = false

    const subscribe = async () => {
      setMessagesLoading(true)
      try {
        const db = await getFirestoreInstance()
        const { collection, doc, onSnapshot, orderBy, query } = await import(
          "firebase/firestore"
        )
        const conversationRef = doc(db, "chats", activeConversationId)
        const messagesCollection = collection(conversationRef, "messages")
        const q = query(messagesCollection, orderBy("createdAt", "asc"))

        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            if (cancelled) {
              return
            }
            const nextMessages = snapshot.docs.map((docSnap) => {
              const data = docSnap.data()
              return {
                id: docSnap.id,
                senderId: (data.senderId as string) ?? "",
                text: typeof data.text === "string" ? data.text : "",
                attachments: (data.attachments as ChatAttachmentMetadata[] | undefined) ?? [],
                createdAt: toDate(data.createdAt),
              } satisfies ChatMessage
            })
            setMessages(nextMessages)
            setMessagesLoading(false)
          },
          (error) => {
            console.error("Failed to subscribe to messages", error)
            toast({
              title: "ไม่สามารถโหลดข้อความได้",
              description: "กรุณาลองอีกครั้ง",
              variant: "destructive",
            })
            setMessagesLoading(false)
          },
        )
      } catch (error) {
        console.error("Failed to load messages", error)
        toast({
          title: "ไม่สามารถโหลดข้อความได้",
          description: "กรุณาลองอีกครั้ง",
          variant: "destructive",
        })
        setMessagesLoading(false)
      }
    }

    subscribe()

    return () => {
      cancelled = true
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [activeConversationId, open, toast])

  useEffect(() => {
    if (!open) {
      return
    }
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, open])

  const handleSelectConversation = (conversation: ChatPreview) => {
    setActiveConversationId(conversation.id)
    setPendingConversation(conversation)
  }

  useEffect(() => {
    if (!open || !currentUserParticipant || !activeConversation?.otherUser) {
      return
    }

    const conversationKey = activeConversation.id
    if (ensuredConversationsRef.current.has(conversationKey)) {
      return
    }

    ensuredConversationsRef.current.add(conversationKey)

    ensureConversation({
      currentUser: currentUserParticipant,
      targetUser: activeConversation.otherUser,
    }).catch((error) => {
      console.error("Failed to ensure conversation", error)
      ensuredConversationsRef.current.delete(conversationKey)
    })
  }, [
    open,
    activeConversation,
    currentUserParticipant,
  ])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return
    const files = Array.from(event.target.files)
    setSelectedFiles((prev) => [...prev, ...files])
    event.target.value = ""
  }

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== index))
  }

  const handleSendMessage = async () => {
    if (!currentUserParticipant || !activeConversation || isSending) {
      return
    }

    const text = messageInput.trim()
    if (!text && selectedFiles.length === 0) {
      return
    }

    if (!activeConversation.otherUser) {
      toast({
        title: "ไม่พบข้อมูลผู้ติดต่อ",
        description: "ไม่สามารถส่งข้อความได้",
        variant: "destructive",
      })
      return
    }

    setIsSending(true)
    try {
      const attachments =
        selectedFiles.length > 0
          ? await uploadChatAttachments(activeConversation.id, selectedFiles)
          : []

      await sendMessage({
        conversationId: activeConversation.id,
        sender: currentUserParticipant,
        recipient: activeConversation.otherUser,
        text: text.length > 0 ? text : null,
        attachments,
      })

      setMessageInput("")
      setSelectedFiles([])
    } catch (error) {
      console.error("Failed to send message", error)
      toast({
        title: "ส่งข้อความไม่สำเร็จ",
        description: "กรุณาลองอีกครั้ง",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleTogglePin = async () => {
    if (!currentUserParticipant || !activeConversation) {
      return
    }

    try {
      await togglePinConversation(
        currentUserParticipant.uid,
        activeConversation.id,
        !activeConversation.pinned,
      )
    } catch (error) {
      console.error("Failed to toggle pin", error)
      toast({
        title: "ปักหมุดไม่สำเร็จ",
        description: "กรุณาลองอีกครั้ง",
        variant: "destructive",
      })
    }
  }

  const handleClosePanel = () => {
    onClose()
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex justify-end bg-slate-900/20 backdrop-blur-sm transition-opacity duration-300",
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <div
        className={cn(
          "relative flex h-full w-full max-w-md flex-col overflow-hidden bg-white shadow-2xl transition-transform duration-300 ease-out sm:max-w-xl md:max-w-3xl md:rounded-l-3xl lg:max-w-4xl xl:max-w-5xl",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <header className="flex items-center justify-between border-b px-4 py-3 sm:px-5 sm:py-4 md:px-6">
          <div className="flex items-center space-x-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-semibold text-gray-900">ข้อความ</p>
              <p className="text-xs text-muted-foreground">
                พูดคุยกับลูกค้าหรือผู้ขายเกี่ยวกับการซื้อบ้าน
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClosePanel}>
            <X className="h-5 w-5" />
          </Button>
        </header>

        <div className="relative flex-1 overflow-hidden">
          <div className="relative flex h-full md:grid md:grid-cols-[300px,minmax(0,1fr)] lg:grid-cols-[340px,minmax(0,1fr)] xl:grid-cols-[380px,minmax(0,1fr)]">
            <section className="flex w-full flex-1 flex-col overflow-hidden md:border-r md:border-gray-100">
              <div className="border-b px-4 py-3 sm:px-5 sm:py-4 md:px-6">
                <div className="flex items-center rounded-full border bg-gray-50 px-3 py-1.5 sm:py-2">
                  <Search className="mr-2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="ค้นหาผู้ติดต่อ"
                    className="flex-1 bg-transparent py-2 text-sm outline-none"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="space-y-1 px-3 pb-4 sm:px-4 md:px-5 lg:px-6">
                  {loadingConversations ? (
                    <div className="flex h-48 items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="flex h-48 flex-col items-center justify-center space-y-2 text-center text-sm text-muted-foreground">
                      <MessageCircle className="h-6 w-6" />
                      <p>ไม่พบการสนทนาที่ตรงกับคำค้นหา</p>
                    </div>
                  ) : (
                    filteredConversations.map((conversation) => (
                      <button
                        key={conversation.id}
                        onClick={() => handleSelectConversation(conversation)}
                        className={cn(
                          "flex w-full items-center space-x-3 rounded-2xl px-3 py-2 text-left transition-colors",
                          conversation.id === activeConversationId
                            ? "bg-blue-50"
                            : "hover:bg-gray-100",
                        )}
                      >
                        <div className="relative">
                          <Avatar className="h-12 w-12">
                            <AvatarImage
                              src={conversation.otherUser?.photoURL}
                              alt={conversation.otherUser?.name ?? ""}
                            />
                            <AvatarFallback>
                              {conversation.otherUser?.name
                                ?.split(" ")
                                .map((segment) => segment[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase() ?? "DH"}
                            </AvatarFallback>
                          </Avatar>
                          {conversation.pinned ? (
                            <span className="absolute -right-1 -top-1 rounded-full bg-amber-400 p-1 text-white shadow">
                              <Pin className="h-3 w-3" />
                            </span>
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between">
                            <p className="truncate text-sm font-semibold text-gray-900 lg:text-base">
                              {conversation.otherUser?.name ?? "ผู้ใช้ DreamHome"}
                            </p>
                            <span className="whitespace-nowrap text-xs text-muted-foreground">
                              {formatRelativeTime(conversation.lastMessageAt ?? conversation.updatedAt)}
                            </span>
                          </div>
                          <p className="mt-1 truncate text-xs text-muted-foreground lg:text-sm">
                            {conversation.lastMessageText}
                          </p>
                        </div>
                        {conversation.attachments && conversation.attachments.length > 0 ? (
                          <Badge className="rounded-full px-2 py-0 text-xs" variant="secondary">
                            {conversation.attachments.length}
                          </Badge>
                        ) : null}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </section>

            <section
              className={cn(
                "absolute inset-0 z-10 flex h-full w-full flex-col bg-white transition-transform duration-300 ease-in-out md:static md:z-0 md:translate-x-0 md:bg-slate-50 md:shadow-none md:border-l md:border-gray-100",
                activeConversation ? "translate-x-0" : "translate-x-full md:translate-x-0",
              )}
            >
              {activeConversation ? (
                <>
                  <div className="flex items-center justify-between border-b bg-white px-4 py-3 sm:px-5 md:px-6">
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={() => setActiveConversationId(null)}
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </Button>
                      <Avatar className="hidden h-11 w-11 md:inline-flex">
                        <AvatarImage
                          src={activeConversation.otherUser?.photoURL}
                          alt={activeConversation.otherUser?.name ?? ""}
                        />
                        <AvatarFallback>
                          {activeConversation.otherUser?.name
                            ?.split(" ")
                            .map((segment) => segment[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase() ?? "DH"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 md:text-base">
                          {activeConversation.otherUser?.name ?? "ผู้ใช้ DreamHome"}
                        </p>
                        <div className="flex items-center space-x-1 text-xs text-emerald-600">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>สนใจจริง</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={activeConversation.pinned ? "ยกเลิกปักหมุด" : "ปักหมุด"}
                        onClick={handleTogglePin}
                      >
                        {activeConversation.pinned ? (
                          <PinOff className="h-5 w-5" />
                        ) : (
                          <Pin className="h-5 w-5" />
                        )}
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2 md:px-4">
                        <Phone className="h-4 w-4" />
                        โทรคุย
                      </Button>
                    </div>
                  </div>

                  <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-4 sm:px-5 md:px-6 md:py-6 lg:px-8">
                    {messagesLoading ? (
                      <div className="flex h-full items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex h-full flex-col items-center justify-center space-y-3 text-center text-sm text-muted-foreground">
                        <MessageCircle className="h-10 w-10 text-blue-500" />
                        <div className="space-y-1">
                          <p className="text-base font-semibold text-gray-900">
                            เริ่มแชทกับ {activeConversation.otherUser?.name}
                          </p>
                          <p>
                            ส่งข้อความแรกเพื่อพูดคุยรายละเอียดการซื้อบ้านกับผู้ใช้นี้
                          </p>
                        </div>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={cn(
                            "flex flex-col space-y-2",
                            message.senderId === currentUserParticipant?.uid
                              ? "items-end"
                              : "items-start",
                          )}
                        >
                          <div
                            className={cn(
                              "max-w-[82%] space-y-2 rounded-2xl px-4 py-3 text-sm shadow-sm",
                              message.senderId === currentUserParticipant?.uid
                                ? "bg-blue-600 text-white"
                                : "bg-white text-gray-900",
                            )}
                          >
                            {message.text ? <p className="whitespace-pre-line">{message.text}</p> : null}
                            {message.attachments.length > 0 ? (
                              <div className="grid gap-2">
                                {message.attachments.map((attachment) => (
                                  <div key={attachment.id} className="overflow-hidden rounded-xl">
                                    {attachment.type === "video" ? (
                                      <video
                                        src={attachment.url}
                                        controls
                                        className="max-h-64 w-full rounded-xl object-cover"
                                      />
                                    ) : (
                                      <Image
                                        src={attachment.url}
                                        alt={attachment.name}
                                        width={320}
                                        height={320}
                                        className="max-h-64 w-full rounded-xl object-cover"
                                      />
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : null}
                            <span
                              className={cn(
                                "block text-[11px]",
                                message.senderId === currentUserParticipant?.uid
                                  ? "text-blue-100"
                                  : "text-gray-400",
                              )}
                            >
                              {formatRelativeTime(message.createdAt)}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="border-t bg-white px-4 py-3 sm:px-5 md:px-6">
                    {selectedFiles.length > 0 ? (
                      <div className="mb-3 flex flex-wrap gap-2">
                        {selectedFiles.map((file, index) => (
                          <div
                            key={`${file.name}-${index}`}
                            className="flex items-center space-x-2 rounded-full border border-dashed border-blue-200 bg-blue-50 px-3 py-1 text-xs text-blue-700"
                          >
                            {file.type.startsWith("video/") ? (
                              <FileVideo className="h-3.5 w-3.5" />
                            ) : (
                              <FileImage className="h-3.5 w-3.5" />
                            )}
                            <span className="max-w-[140px] truncate">{file.name}</span>
                            <button
                              type="button"
                              className="text-blue-600 hover:text-blue-800"
                              onClick={() => removeSelectedFile(index)}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    <div className="flex items-end gap-2 rounded-3xl border bg-gray-50 px-3 py-2">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="rounded-full text-muted-foreground"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Paperclip className="h-5 w-5" />
                      </Button>
                      <textarea
                        rows={1}
                        value={messageInput}
                        onChange={(event) => setMessageInput(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" && !event.shiftKey) {
                            event.preventDefault()
                            handleSendMessage()
                          }
                        }}
                        placeholder="พิมพ์ข้อความเพื่อคุยเรื่องซื้อบ้าน..."
                        className="max-h-32 flex-1 resize-none bg-transparent py-1 text-sm outline-none"
                      />
                      <Button
                        size="icon"
                        className="rounded-full bg-blue-600 text-white hover:bg-blue-700"
                        onClick={handleSendMessage}
                        disabled={isSending || (!messageInput.trim() && selectedFiles.length === 0)}
                      >
                        {isSending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center space-y-3 px-6 text-center md:px-10">
                  <Avatar className="h-20 w-20 border-4 border-blue-100">
                    <AvatarImage src="https://i.pravatar.cc/100?img=65" alt="DreamHome Assistant" />
                    <AvatarFallback>DH</AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-gray-900">
                      เริ่มพูดคุยกับลูกค้าของคุณ
                    </p>
                    <p className="text-sm text-muted-foreground">
                      เลือกชื่อจากรายการทางซ้ายเพื่อดูรายละเอียดการสนทนาเกี่ยวกับการซื้อบ้าน
                    </p>
                  </div>
                  <Button onClick={handleClosePanel} variant="outline">
                    ปิดหน้าต่างข้อความ
                  </Button>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
