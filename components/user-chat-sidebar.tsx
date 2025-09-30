"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  ChevronLeft,
  Info,
  Loader2,
  MessageCircle,
  MoreHorizontal,
  Search,
  Send,
  X,
} from "lucide-react"
import { FirebaseError } from "firebase/app"
import type { DocumentData } from "firebase/firestore"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useAuthContext } from "@/contexts/AuthContext"
import { getDocument, getFirestoreInstance } from "@/lib/firestore"
import { cn } from "@/lib/utils"

interface UserChatSidebarProps {
  isOpen: boolean
  onClose: () => void
}

interface ParticipantProfile {
  id: string
  name: string
  email?: string | null
  photoURL?: string | null
}

interface ConversationSummary {
  id: string
  participants: string[]
  otherParticipantId: string
  profile: ParticipantProfile
  lastMessageText: string
  lastMessageAt: Date | null
  unreadCount: number
}

interface ChatMessage {
  id: string
  senderId: string
  text: string
  createdAt: Date | null
}

interface FirestoreErrorState {
  title: string
  description: string
}

type FirestoreErrorCode =
  | "permission-denied"
  | "unauthenticated"
  | "unavailable"
  | "not-found"
  | "unknown"

const FALLBACK_PROFILE: ParticipantProfile = {
  id: "",
  name: "ผู้ใช้",
  email: null,
  photoURL: null,
}

const formatRelativeTime = (date: Date | null): string => {
  if (!date) {
    return ""
  }

  const now = Date.now()
  const diff = now - date.getTime()

  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) {
    return "เมื่อครู่"
  }

  if (diff < hour) {
    const minutes = Math.floor(diff / minute)
    return `${minutes} นาทีที่แล้ว`
  }

  if (diff < day) {
    const hours = Math.floor(diff / hour)
    return `${hours} ชม. ที่แล้ว`
  }

  return date.toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "short",
  })
}

const formatMessageTime = (date: Date | null): string => {
  if (!date) {
    return ""
  }

  return date.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

const getInitials = (name: string) => {
  if (!name) {
    return "US"
  }

  return name
    .trim()
    .substring(0, 2)
    .toUpperCase()
}

const toDate = (value: unknown): Date | null => {
  if (!value) {
    return null
  }

  if (value instanceof Date) {
    return value
  }

  if (typeof value === "number") {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
  }

  if (typeof value === "string") {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
  }

  if (typeof value === "object" && value !== null && "toDate" in value) {
    try {
      const result = (value as { toDate: () => Date }).toDate()
      return result instanceof Date ? result : null
    } catch (error) {
      console.error("Failed to convert Firestore timestamp", error)
      return null
    }
  }

  return null
}

const DEMO_PROFILES: Record<string, ParticipantProfile> = {
  "agent-ani": {
    id: "agent-ani",
    name: "แอนนี่ ตัวแทน",
    email: "annie.agent@example.com",
    photoURL: null,
  },
  "agent-narin": {
    id: "agent-narin",
    name: "นรินทร์",
    email: "narin@example.com",
    photoURL: null,
  },
}

const DEMO_CONVERSATION_BLUEPRINT = [
  {
    id: "demo-convo-annie",
    otherParticipantId: "agent-ani",
    lastMessageText: "ขอบคุณค่ะ เดี๋ยวจัดส่งข้อมูลเพิ่มเติมให้นะคะ",
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 25),
    unreadCount: 0,
  },
  {
    id: "demo-convo-narin",
    otherParticipantId: "agent-narin",
    lastMessageText: "สะดวกเข้าไปดูบ้านวันเสาร์นี้ไหมครับ",
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
    unreadCount: 1,
  },
]

const DEMO_MESSAGES: Record<string, ChatMessage[]> = {
  "demo-convo-annie": [
    {
      id: "demo-msg-1",
      senderId: "agent-ani",
      text: "สวัสดีค่ะ ขอบคุณที่สนใจโครงการ Dream Ville",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
    },
    {
      id: "demo-msg-2",
      senderId: "demo-user",
      text: "สนใจแบบ 3 ห้องนอนค่ะ พอมีห้องว่างมั้ย",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
    },
    {
      id: "demo-msg-3",
      senderId: "agent-ani",
      text: "มีค่ะ ราคาเริ่มต้นที่ 4.2 ล้าน รวมตกแต่งแล้วนะคะ",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
    },
    {
      id: "demo-msg-4",
      senderId: "demo-user",
      text: "ขอบคุณค่ะ ขอรายละเอียดเพิ่มเติมทางอีเมลได้ไหม",
      createdAt: new Date(Date.now() - 1000 * 60 * 40),
    },
    {
      id: "demo-msg-5",
      senderId: "agent-ani",
      text: "ได้เลยค่ะ เดี๋ยวส่งข้อมูลให้อีกสักครู่นะคะ",
      createdAt: new Date(Date.now() - 1000 * 60 * 25),
    },
  ],
  "demo-convo-narin": [
    {
      id: "demo-msg-6",
      senderId: "agent-narin",
      text: "สวัสดีครับ บ้านโครงการ Lakefront ยังว่างอยู่ครับ",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
    },
    {
      id: "demo-msg-7",
      senderId: "demo-user",
      text: "สนใจนัดดูบ้านครับ",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
    },
    {
      id: "demo-msg-8",
      senderId: "agent-narin",
      text: "เสาร์นี้สะดวกไหมครับ มีรอบ 10 โมงกับบ่ายสอง",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
    },
    {
      id: "demo-msg-9",
      senderId: "demo-user",
      text: "สะดวกบ่ายสองครับ",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3.5),
    },
    {
      id: "demo-msg-10",
      senderId: "agent-narin",
      text: "รับทราบครับ ไว้เจอกันวันเสาร์ครับ",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
    },
  ],
}

const buildDemoConversations = (
  currentUserId: string,
): { conversations: ConversationSummary[]; messages: Record<string, ChatMessage[]> } => {
  const conversations = DEMO_CONVERSATION_BLUEPRINT.map((item) => {
    const profile = DEMO_PROFILES[item.otherParticipantId] ?? FALLBACK_PROFILE
    return {
      id: item.id,
      participants: [currentUserId, item.otherParticipantId],
      otherParticipantId: item.otherParticipantId,
      profile,
      lastMessageText: item.lastMessageText,
      lastMessageAt: item.lastMessageAt,
      unreadCount: item.unreadCount,
    }
  })

  const messages: Record<string, ChatMessage[]> = {}
  Object.entries(DEMO_MESSAGES).forEach(([conversationId, chatMessages]) => {
    messages[conversationId] = chatMessages.map((message) => ({
      ...message,
      senderId: message.senderId === "demo-user" ? currentUserId : message.senderId,
    }))
  })

  return { conversations, messages }
}

export function UserChatSidebar({ isOpen, onClose }: UserChatSidebarProps) {
  const { user } = useAuthContext()
  const { toast } = useToast()

  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [messageInput, setMessageInput] = useState("")
  const [isConversationsLoading, setIsConversationsLoading] = useState(false)
  const [isMessagesLoading, setIsMessagesLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [conversationsError, setConversationsError] = useState<FirestoreErrorState | null>(null)
  const [messagesError, setMessagesError] = useState<FirestoreErrorState | null>(null)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [demoNotice, setDemoNotice] = useState<string | null>(null)

  const profileCache = useRef<Map<string, ParticipantProfile>>(new Map())
  const conversationsRef = useRef<ConversationSummary[]>([])

  useEffect(() => {
    conversationsRef.current = conversations
  }, [conversations])

  const demoDataRef = useRef<{
    conversations: ConversationSummary[]
    messages: Record<string, ChatMessage[]>
  } | null>(null)

  const permissionToastShown = useRef(false)

  const resolveFirestoreError = useCallback(
    (
      error: unknown,
      fallback: FirestoreErrorState,
    ): { state: FirestoreErrorState; code: FirestoreErrorCode } => {
      if (error instanceof FirebaseError) {
        if (error.code === "permission-denied") {
          return {
            code: "permission-denied",
            state: {
              title: "ไม่มีสิทธิ์เข้าถึงข้อมูล",
              description:
                "บัญชีของคุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้ DreamHome จึงแสดงตัวอย่างบทสนทนาแทน คุณสามารถปรับ Firebase Security Rules เพื่อเปิดใช้งานข้อมูลจริงได้",
            },
          }
        }

        if (error.code === "unauthenticated") {
          return {
            code: "unauthenticated",
            state: {
              title: "กรุณาเข้าสู่ระบบ",
              description: "คุณจำเป็นต้องเข้าสู่ระบบเพื่อดูข้อมูลนี้",
            },
          }
        }

        if (error.code === "unavailable") {
          return {
            code: "unavailable",
            state: {
              title: "เซิร์ฟเวอร์ไม่พร้อมใช้งาน",
              description: "โปรดลองใหม่อีกครั้งในภายหลัง",
            },
          }
        }
      }

      return { code: "unknown", state: fallback }
    },
    [],
  )

  const enableDemoMode = useCallback(
    (reason: string) => {
      if (!user) {
        return
      }

      if (!demoDataRef.current) {
        const { conversations: demoConversations, messages: demoMessages } = buildDemoConversations(
          user.uid,
        )

        demoDataRef.current = {
          conversations: demoConversations,
          messages: demoMessages,
        }
      }

      setIsDemoMode(true)
      setConversations(demoDataRef.current.conversations)
      setConversationsError(null)
      setIsConversationsLoading(false)
      setMessagesError(null)

      const hasSelected = selectedConversationId
        ? demoDataRef.current.conversations.some((item) => item.id === selectedConversationId)
        : false

      if (!hasSelected && demoDataRef.current.conversations.length > 0) {
        const firstConversationId = demoDataRef.current.conversations[0].id
        setSelectedConversationId(firstConversationId)
        setMessages(demoDataRef.current.messages[firstConversationId] ?? [])
      } else if (hasSelected && selectedConversationId) {
        setMessages(demoDataRef.current.messages[selectedConversationId] ?? [])
      }

      setDemoNotice(reason)

      if (!permissionToastShown.current) {
        toast({
          title: "กำลังแสดงข้อมูลตัวอย่าง",
          description: reason,
        })
        permissionToastShown.current = true
      }
    },
    [selectedConversationId, toast, user],
  )

  const disableDemoMode = useCallback(() => {
    setIsDemoMode(false)
    setDemoNotice(null)
    demoDataRef.current = null
    permissionToastShown.current = false
  }, [])

  const fetchParticipantProfile = useCallback(
    async (participantId: string, existingProfile?: ParticipantProfile | null): Promise<ParticipantProfile> => {
      if (existingProfile && existingProfile.name) {
        profileCache.current.set(participantId, existingProfile)
        return existingProfile
      }

      if (profileCache.current.has(participantId)) {
        return profileCache.current.get(participantId) ?? { ...FALLBACK_PROFILE, id: participantId }
      }

      try {
        const snapshot = await getDocument("users", participantId)
        if (snapshot) {
          const data = snapshot.data() as DocumentData
          const profile: ParticipantProfile = {
            id: participantId,
            name:
              (data.name as string | undefined)?.trim() ||
              (data.displayName as string | undefined)?.trim() ||
              (data.email as string | undefined)?.split("@")[0] ||
              FALLBACK_PROFILE.name,
            email: (data.email as string | undefined) ?? null,
            photoURL: (data.photoURL as string | undefined) ?? null,
          }
          profileCache.current.set(participantId, profile)
          return profile
        }
      } catch (error) {
        console.error("Failed to load participant profile", error)
      }

      const fallback = { ...FALLBACK_PROFILE, id: participantId }
      profileCache.current.set(participantId, fallback)
      return fallback
    },
    [],
  )

  const markConversationAsRead = useCallback(
    async (conversationId: string) => {
      if (!user) {
        return
      }

      if (isDemoMode) {
        const demoStore = demoDataRef.current
        if (!demoStore) {
          return
        }

        demoStore.conversations = demoStore.conversations.map((conversation) =>
          conversation.id === conversationId ? { ...conversation, unreadCount: 0 } : conversation,
        )
        setConversations(demoStore.conversations)
        return
      }

      try {
        const conversation = conversationsRef.current.find((item) => item.id === conversationId)
        if (!conversation) {
          return
        }

        const db = await getFirestoreInstance()
        const { doc, serverTimestamp, updateDoc } = await import("firebase/firestore")
        const conversationRef = doc(db, "conversations", conversationId)
        await updateDoc(conversationRef, {
          [`unreadCounts.${user.uid}`]: 0,
          [`lastReadAt.${user.uid}`]: serverTimestamp(),
        })

        setConversations((prev) =>
          prev.map((item) =>
            item.id === conversationId
              ? {
                  ...item,
                  unreadCount: 0,
                }
              : item,
          ),
        )
      } catch (error) {
        console.error("Failed to mark conversation as read", error)
      }
    },
    [isDemoMode, user],
  )

  useEffect(() => {
    if (!user || !isOpen) {
      setConversations([])
      setSelectedConversationId(null)
      setConversationsError(null)
      setMessages([])
      setMessagesError(null)
      setIsConversationsLoading(false)
      setIsMessagesLoading(false)
      disableDemoMode()
      return
    }

    if (isDemoMode) {
      const demoConversations = demoDataRef.current?.conversations ?? []
      setConversations(demoConversations)
      setConversationsError(null)
      setIsConversationsLoading(false)
      if (!selectedConversationId && demoConversations.length > 0) {
        setSelectedConversationId(demoConversations[0].id)
      }
      return
    }

    disableDemoMode()

    let unsubscribe: (() => void) | undefined
    let cancelled = false

    const subscribe = async () => {
      setIsConversationsLoading(true)
      setConversationsError(null)
      try {
        const db = await getFirestoreInstance()
        const { collection, onSnapshot, orderBy, query, where } = await import("firebase/firestore")
        const conversationsQuery = query(
          collection(db, "conversations"),
          where("participants", "array-contains", user.uid),
          orderBy("updatedAt", "desc"),
        )

        unsubscribe = onSnapshot(
          conversationsQuery,
          (snapshot) => {
            void (async () => {
              try {
                const mapped = await Promise.all(
                  snapshot.docs.map(async (docSnapshot) => {
                    const data = docSnapshot.data()
                    const participants = Array.isArray(data.participants)
                      ? (data.participants as string[])
                      : []

                    if (!participants.includes(user.uid)) {
                      return null
                    }

                    const otherParticipantId =
                      participants.find((participantId) => participantId !== user.uid) ?? user.uid

                    const profileFromDoc = (data.participantProfiles?.[otherParticipantId] ?? null) as
                      | ParticipantProfile
                      | null
                      | undefined

                    const profile = await fetchParticipantProfile(
                      otherParticipantId,
                      profileFromDoc ?? undefined,
                    )

                    const conversation: ConversationSummary = {
                      id: docSnapshot.id,
                      participants,
                      otherParticipantId,
                      profile,
                      lastMessageText: (data.lastMessageText as string | undefined)?.trim() ?? "",
                      lastMessageAt:
                        toDate(data.lastMessageAt) || toDate(data.updatedAt) || toDate(data.createdAt),
                      unreadCount: Number((data.unreadCounts?.[user.uid] as number | undefined) ?? 0),
                    }

                    return conversation
                  }),
                )

                if (cancelled) {
                  return
                }

                const filtered = mapped.filter((item): item is ConversationSummary => item !== null)

                setConversations(filtered)
                setConversationsError(null)
                setIsConversationsLoading(false)

                if (
                  filtered.length > 0 &&
                  filtered.every((conversation) => conversation.id !== selectedConversationId)
                ) {
                  setSelectedConversationId((current) =>
                    current && filtered.some((conversation) => conversation.id === current)
                      ? current
                      : null,
                  )
                }
              } catch (error) {
                console.error("Failed to process conversations snapshot", error)
              }
            })
          },
          (error) => {
            if (cancelled) {
              return
            }

            console.error("Failed to subscribe to conversations", error)
            const { state, code } = resolveFirestoreError(error, {
              title: "ไม่สามารถโหลดรายการสนทนาได้",
              description: "โปรดลองใหม่อีกครั้ง",
            })

            if (code === "permission-denied") {
              setIsConversationsLoading(false)
              enableDemoMode(state.description)
              return
            }

            setConversations([])
            setConversationsError(state)
            setIsConversationsLoading(false)

            toast({
              variant: "destructive",
              title: state.title,
              description: state.description,
            })
          },
        )
      } catch (error) {
        console.error("Failed to subscribe to conversations", error)
        setIsConversationsLoading(false)
        if (cancelled) {
          return
        }

        const { state, code } = resolveFirestoreError(error, {
          title: "ไม่สามารถโหลดรายการสนทนาได้",
          description: "โปรดลองใหม่อีกครั้ง",
        })

        if (code === "permission-denied") {
          setIsConversationsLoading(false)
          enableDemoMode(state.description)
          return
        }

        setConversations([])
        setConversationsError(state)

        toast({
          variant: "destructive",
          title: state.title,
          description: state.description,
        })
      }
    }

    void subscribe()

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [
    disableDemoMode,
    enableDemoMode,
    fetchParticipantProfile,
    isDemoMode,
    isOpen,
    resolveFirestoreError,
    selectedConversationId,
    toast,
    user,
  ])

  useEffect(() => {
    if (!user || !isOpen) {
      setMessages([])
      setIsMessagesLoading(false)
      setMessagesError(null)
      return
    }

    if (!selectedConversationId) {
      setMessages([])
      setIsMessagesLoading(false)
      setMessagesError(null)
      return
    }

    if (isDemoMode) {
      const demoMessages = demoDataRef.current?.messages[selectedConversationId] ?? []
      setMessages(demoMessages)
      setMessagesError(null)
      setIsMessagesLoading(false)
      void markConversationAsRead(selectedConversationId)
      return
    }

    let unsubscribe: (() => void) | undefined
    let cancelled = false

    const subscribeToMessages = async () => {
      setIsMessagesLoading(true)
      setMessagesError(null)
      try {
        const db = await getFirestoreInstance()
        const { collection, doc, onSnapshot, orderBy, query } = await import("firebase/firestore")
        const conversationRef = doc(db, "conversations", selectedConversationId)
        const messagesQuery = query(collection(conversationRef, "messages"), orderBy("createdAt", "asc"))

        unsubscribe = onSnapshot(
          messagesQuery,
          (snapshot) => {
            if (cancelled) {
              return
            }

            const parsed = snapshot.docs
              .map((docSnapshot) => {
                const data = docSnapshot.data()
                const message: ChatMessage = {
                  id: docSnapshot.id,
                  senderId: String(data.senderId ?? ""),
                  text: String(data.text ?? ""),
                  createdAt: toDate(data.createdAt),
                }
                return message
              })
              .sort((a, b) => {
                const aTime = a.createdAt?.getTime() ?? 0
                const bTime = b.createdAt?.getTime() ?? 0
                return aTime - bTime
              })

            setMessages(parsed)
            setMessagesError(null)
            setIsMessagesLoading(false)
          },
          (error) => {
            if (cancelled) {
              return
            }

            console.error("Failed to subscribe to messages", error)
            const { state, code } = resolveFirestoreError(error, {
              title: "ไม่สามารถโหลดข้อความได้",
              description: "โปรดลองใหม่อีกครั้ง",
            })

            if (code === "permission-denied") {
              setIsMessagesLoading(false)
              enableDemoMode(state.description)
              return
            }

            setMessages([])
            setMessagesError(state)
            setIsMessagesLoading(false)
            toast({
              variant: "destructive",
              title: state.title,
              description: state.description,
            })
          },
        )

        await markConversationAsRead(selectedConversationId)
      } catch (error) {
        console.error("Failed to subscribe to messages", error)
        setIsMessagesLoading(false)
        if (cancelled) {
          return
        }

        const { state, code } = resolveFirestoreError(error, {
          title: "ไม่สามารถโหลดข้อความได้",
          description: "โปรดลองใหม่อีกครั้ง",
        })

        if (code === "permission-denied") {
          setIsMessagesLoading(false)
          enableDemoMode(state.description)
          return
        }

        setMessages([])
        setMessagesError(state)
        toast({
          variant: "destructive",
          title: state.title,
          description: state.description,
        })
      }
    }

    void subscribeToMessages()

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [
    enableDemoMode,
    isDemoMode,
    isOpen,
    markConversationAsRead,
    resolveFirestoreError,
    selectedConversationId,
    toast,
    user,
  ])

  useEffect(() => {
    setMessageInput("")
    setMessagesError(null)
  }, [selectedConversationId])

  const handleSelectConversation = useCallback(
    (conversationId: string) => {
      setSelectedConversationId(conversationId)
      void markConversationAsRead(conversationId)
    },
    [markConversationAsRead],
  )

  const handleBackToList = () => {
    setSelectedConversationId(null)
  }

  const handleSendMessage = async () => {
    if (!user || !selectedConversationId) {
      return
    }

    const trimmed = messageInput.trim()

    if (!trimmed) {
      return
    }

    const conversation = conversationsRef.current.find(
      (item) => item.id === selectedConversationId,
    )

    if (!conversation) {
      return
    }

    setIsSending(true)
    setMessageInput("")

    if (isDemoMode) {
      const demoStore = demoDataRef.current
      if (!demoStore) {
        setIsSending(false)
        return
      }

      const now = new Date()
      const newMessage: ChatMessage = {
        id: `demo-local-${now.getTime()}`,
        senderId: user.uid,
        text: trimmed,
        createdAt: now,
      }

      const existingMessages = demoStore.messages[selectedConversationId] ?? []
      const updatedMessages = [...existingMessages, newMessage]
      demoStore.messages[selectedConversationId] = updatedMessages

      demoStore.conversations = demoStore.conversations
        .map((item) =>
          item.id === selectedConversationId
            ? {
                ...item,
                lastMessageText: trimmed,
                lastMessageAt: now,
                unreadCount: 0,
              }
            : item,
        )
        .sort((a, b) => {
          const aTime = a.lastMessageAt?.getTime() ?? 0
          const bTime = b.lastMessageAt?.getTime() ?? 0
          return bTime - aTime
        })

      setMessages(updatedMessages)
      setMessagesError(null)
      setConversations(demoStore.conversations)
      setIsSending(false)
      return
    }

    try {
      const db = await getFirestoreInstance()
      const {
        addDoc,
        collection,
        doc,
        increment,
        serverTimestamp,
        updateDoc,
      } = await import("firebase/firestore")

      const conversationRef = doc(db, "conversations", selectedConversationId)
      const messagesCollection = collection(conversationRef, "messages")
      const timestamp = serverTimestamp()

      await addDoc(messagesCollection, {
        text: trimmed,
        senderId: user.uid,
        createdAt: timestamp,
      })

      const updates: Record<string, unknown> = {
        lastMessageText: trimmed,
        lastMessageSenderId: user.uid,
        lastMessageAt: timestamp,
        updatedAt: timestamp,
        [`unreadCounts.${user.uid}`]: 0,
      }

      conversation.participants
        .filter((participantId) => participantId !== user.uid)
        .forEach((participantId) => {
          updates[`unreadCounts.${participantId}`] = increment(1)
        })

      await updateDoc(conversationRef, updates)
    } catch (error) {
      console.error("Failed to send message", error)
      setMessageInput(trimmed)
      const errorState = resolveFirestoreError(error, {
        title: "ส่งข้อความไม่สำเร็จ",
        description: "โปรดลองอีกครั้งในภายหลัง",
      })
      toast({
        variant: "destructive",
        title: errorState.title,
        description: errorState.description,
      })
    } finally {
      setIsSending(false)
    }
  }

  const selectedConversation = useMemo(() => {
    if (!selectedConversationId) {
      return null
    }

    return (
      conversations.find((conversation) => conversation.id === selectedConversationId) ?? null
    )
  }, [conversations, selectedConversationId])

  const filteredConversations = useMemo(() => {
    if (!search.trim()) {
      return conversations
    }

    const keyword = search.trim().toLowerCase()
    return conversations.filter((conversation) =>
      conversation.profile.name.toLowerCase().includes(keyword),
    )
  }, [conversations, search])

  const isChatReady = !!user

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-gray-900/40 transition-opacity duration-300",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-full border-l border-gray-100 bg-white shadow-2xl transition-transform duration-300 ease-in-out sm:w-[420px]",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b px-4 py-4">
            <div className="flex items-center space-x-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">ข้อความ</p>
                <p className="text-xs text-gray-500">สนทนากับผู้ซื้อบ้านได้สะดวกยิ่งขึ้น</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
              <span className="sr-only">ปิดกล่องข้อความ</span>
            </Button>
          </div>

          {!isChatReady ? (
            <div className="flex flex-1 flex-col items-center justify-center space-y-3 px-6 text-center text-gray-500">
              <MessageCircle className="h-12 w-12 text-blue-200" />
              <div>
                <p className="text-sm font-semibold text-gray-900">กรุณาเข้าสู่ระบบเพื่อใช้งานแชท</p>
                <p className="mt-1 text-xs text-gray-500">เข้าสู่ระบบจากโปรไฟล์ของคุณเพื่อดูและตอบกลับข้อความ</p>
              </div>
            </div>
          ) : (
            <div className="relative flex-1 overflow-hidden">
              <div
                className={cn(
                  "absolute inset-0 flex flex-col transition-transform duration-300 ease-in-out",
                  selectedConversation ? "-translate-x-full opacity-0" : "translate-x-0 opacity-100",
                )}
              >
                <div className="px-4 py-3">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="ค้นหาแชท"
                      className="w-full rounded-full border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-2 pb-6">
                  {demoNotice && !conversationsError ? (
                    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                      <div className="flex items-start space-x-2">
                        <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-amber-800">โหมดตัวอย่าง</p>
                          <p className="mt-1 text-[11px] leading-4 text-amber-700">{demoNotice}</p>
                        </div>
                      </div>
                    </div>
                  ) : null}
                  {conversationsError ? (
                    <div className="flex h-full flex-col items-center justify-center space-y-2 px-6 text-center text-red-500">
                      <MessageCircle className="h-10 w-10 text-red-300" />
                      <div>
                        <p className="text-sm font-semibold text-red-600">{conversationsError.title}</p>
                        <p className="mt-1 text-xs text-red-500">{conversationsError.description}</p>
                      </div>
                    </div>
                  ) : isConversationsLoading ? (
                    <div className="flex h-full items-center justify-center text-gray-500">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center space-y-2 px-6 text-center text-gray-500">
                      <MessageCircle className="h-10 w-10 text-blue-200" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">ยังไม่มีการสนทนา</p>
                        <p className="mt-1 text-xs text-gray-500">เริ่มต้นพูดคุยกับลูกค้าของคุณเพื่อไม่ให้พลาดโอกาสสำคัญ</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredConversations.map((conversation) => (
                        <button
                          key={conversation.id}
                          type="button"
                          onClick={() => handleSelectConversation(conversation.id)}
                          className={cn(
                            "flex w-full items-center space-x-3 rounded-xl border px-3 py-3 text-left transition-all",
                            conversation.id === selectedConversationId
                              ? "border-blue-200 bg-blue-50"
                              : "border-transparent bg-white hover:border-blue-100 hover:bg-blue-50/60",
                          )}
                        >
                          <Avatar className="h-11 w-11">
                            <AvatarImage
                              src={conversation.profile.photoURL ?? undefined}
                              alt={conversation.profile.name}
                            />
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                              {getInitials(conversation.profile.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between">
                              <p className="truncate text-sm font-semibold text-gray-900">
                                {conversation.profile.name}
                              </p>
                              <span className="text-xs text-gray-400">
                                {formatRelativeTime(conversation.lastMessageAt)}
                              </span>
                            </div>
                            <p className="mt-1 truncate text-xs text-gray-600">
                              {conversation.lastMessageText || "ยังไม่มีข้อความ"}
                            </p>
                            <p className="mt-1 text-[11px] text-blue-500">
                              {conversation.profile.email ?? "พร้อมสนทนา"}
                            </p>
                          </div>
                          {conversation.unreadCount > 0 ? (
                            <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-600 px-2 text-[11px] font-semibold text-white">
                              {conversation.unreadCount}
                            </span>
                          ) : null}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div
                className={cn(
                  "absolute inset-0 flex flex-col bg-white transition-transform duration-300 ease-in-out",
                  selectedConversation ? "translate-x-0" : "translate-x-full",
                )}
              >
                {selectedConversation ? (
                  <>
                    <div className="flex items-center justify-between border-b px-4 py-3">
                      <div className="flex items-center space-x-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={handleBackToList}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          <span className="sr-only">ย้อนกลับ</span>
                        </Button>
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={selectedConversation.profile.photoURL ?? undefined}
                            alt={selectedConversation.profile.name}
                          />
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {getInitials(selectedConversation.profile.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-left">
                          <p className="text-sm font-semibold text-gray-900">
                            {selectedConversation.profile.name}
                          </p>
                          <p className="text-xs text-blue-500">
                            {selectedConversation.profile.email ?? "พร้อมสนทนา"}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">ตัวเลือกเพิ่มเติม</span>
                      </Button>
                    </div>

                    <div className="flex-1 space-y-4 overflow-y-auto px-4 py-6">
                      {isDemoMode && !messagesError ? (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                          <div className="flex items-start space-x-2">
                            <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
                            <p className="text-[11px] leading-4 text-amber-700">
                              ข้อความในบทสนทนานี้เป็นตัวอย่างเพื่อช่วยทดสอบส่วนติดต่อผู้ใช้ เมื่อเปิดสิทธิ์ Firebase แล้ว คุณจะเห็นข้อมูลจริงของลูกค้า
                            </p>
                          </div>
                        </div>
                      ) : null}
                      {messagesError ? (
                        <div className="flex h-full flex-col items-center justify-center space-y-3 text-center text-red-500">
                          <MessageCircle className="h-12 w-12 text-red-300" />
                          <div>
                            <p className="text-sm font-semibold text-red-600">{messagesError.title}</p>
                            <p className="mt-1 text-xs text-red-500">{messagesError.description}</p>
                          </div>
                        </div>
                      ) : isMessagesLoading ? (
                        <div className="flex h-full items-center justify-center text-gray-500">
                          <Loader2 className="h-5 w-5 animate-spin" />
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center space-y-3 text-center text-gray-500">
                          <MessageCircle className="h-12 w-12 text-blue-200" />
                          <div>
                            <p className="text-sm font-semibold text-gray-900">ยังไม่มีข้อความ</p>
                            <p className="mt-1 text-xs text-gray-500">เริ่มต้นบทสนทนาด้วยการส่งข้อความแรกของคุณ</p>
                          </div>
                        </div>
                      ) : (
                        messages.map((message) => {
                          const isMe = message.senderId === user.uid
                          return (
                            <div
                              key={message.id}
                              className={cn(
                                "flex w-full",
                                isMe ? "justify-end" : "justify-start",
                              )}
                            >
                              <div
                                className={cn(
                                  "max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                                  isMe ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900",
                                )}
                              >
                                <p className="font-medium leading-relaxed">{message.text}</p>
                                <span
                                  className={cn(
                                    "mt-1 block text-[11px]",
                                    isMe ? "text-blue-100" : "text-gray-500",
                                  )}
                                >
                                  {formatMessageTime(message.createdAt)}
                                </span>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>

                    <div className="border-t px-4 py-3">
                      <div className="flex items-center space-x-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-2">
                        <input
                          value={messageInput}
                          onChange={(event) => setMessageInput(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" && !event.shiftKey) {
                              event.preventDefault()
                              void handleSendMessage()
                            }
                          }}
                          placeholder="พิมพ์ข้อความ..."
                          className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none"
                          disabled={isSending || !!messagesError}
                        />
                        <Button
                          size="icon"
                          className="h-9 w-9 rounded-full bg-blue-600 hover:bg-blue-700"
                          onClick={handleSendMessage}
                          disabled={isSending || !!messagesError}
                        >
                          {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                          <span className="sr-only">ส่งข้อความ</span>
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center space-y-4 px-6 text-center text-gray-500">
                    <MessageCircle className="h-12 w-12 text-blue-200" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">เลือกแชทเพื่อเริ่มการสนทนา</p>
                      <p className="mt-1 text-xs text-gray-500">
                        เลือกผู้ติดต่อจากรายการด้านซ้ายเพื่อดูข้อความและตอบกลับอย่างรวดเร็ว
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default UserChatSidebar
