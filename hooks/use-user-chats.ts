"use client"

import { useEffect, useMemo, useState } from "react"
import type { DocumentData } from "firebase/firestore"
import { formatDistanceToNow } from "date-fns"
import { th } from "date-fns/locale"

import { getFirestoreInstance } from "@/lib/firestore"
import type {
  ChatAttachmentMetadata,
  ConversationParticipant,
} from "@/lib/chat"

export interface ChatPreview {
  id: string
  conversationId: string
  otherUser: ConversationParticipant | null
  lastMessageText: string
  lastMessageAt: Date | null
  lastMessageSenderId: string | null
  attachments?: ChatAttachmentMetadata[]
  pinned: boolean
  updatedAt: Date | null
  createdAt: Date | null
}

export interface UseUserChatsResult {
  conversations: ChatPreview[]
  loading: boolean
  error: string | null
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
      console.warn("Failed to convert Firestore timestamp", error)
      return null
    }
  }
  return null
}

const extractLastMessageText = (data: DocumentData): string => {
  const text = data?.lastMessage?.text as string | undefined
  if (text && text.trim().length > 0) {
    return text.trim()
  }
  const attachments = data?.lastMessage?.attachments as
    | ChatAttachmentMetadata[]
    | undefined
  if (attachments && attachments.length > 0) {
    const first = attachments[0]
    return first.type === "video" ? "ส่งวิดีโอ" : "ส่งรูปภาพ"
  }
  return "เริ่มบทสนทนาใหม่"
}

export const useUserChats = (userId: string | null | undefined): UseUserChatsResult => {
  const [conversations, setConversations] = useState<ChatPreview[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setConversations([])
      return undefined
    }

    let unsubscribe: (() => void) | undefined
    let cancelled = false

    const subscribe = async () => {
      setLoading(true)
      try {
        const db = await getFirestoreInstance()
        const { collection, onSnapshot, orderBy, query } = await import(
          "firebase/firestore"
        )

        const chatCollection = collection(db, "users", userId, "Chat")
        const q = query(chatCollection, orderBy("pinned", "desc"), orderBy("updatedAt", "desc"))

        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            if (cancelled) {
              return
            }
            const next = snapshot.docs.map((docSnap) => {
              const data = docSnap.data()
              const lastMessage = data.lastMessage ?? null
              const createdAt = toDate(data.createdAt)
              const updatedAt = toDate(data.updatedAt)
              const lastMessageAt = toDate(lastMessage?.createdAt)

              return {
                id: docSnap.id,
                conversationId: (data.conversationId as string | undefined) ?? docSnap.id,
                otherUser: data.otherUser ?? null,
                lastMessageText: extractLastMessageText(data),
                lastMessageAt,
                lastMessageSenderId: (lastMessage?.senderId as string | undefined) ?? null,
                attachments: (lastMessage?.attachments as ChatAttachmentMetadata[] | undefined) ?? [],
                pinned: Boolean(data.pinned),
                updatedAt,
                createdAt,
              } satisfies ChatPreview
            })
            setConversations(next)
            setLoading(false)
          },
          (err) => {
            console.error("Failed to subscribe to chats", err)
            setError("ไม่สามารถโหลดข้อความได้")
            setLoading(false)
          },
        )
      } catch (err) {
        console.error("Failed to initialise chat listener", err)
        setError("ไม่สามารถเชื่อมต่อข้อความได้")
        setLoading(false)
      }
    }

    subscribe()

    return () => {
      cancelled = true
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [userId])

  const orderedConversations = useMemo(() => {
    return conversations.slice().sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      const aTime = a.updatedAt?.getTime() ?? 0
      const bTime = b.updatedAt?.getTime() ?? 0
      return bTime - aTime
    })
  }, [conversations])

  return { conversations: orderedConversations, loading, error }
}

export const formatRelativeTime = (date: Date | null): string => {
  if (!date) {
    return ""
  }
  try {
    return formatDistanceToNow(date, { addSuffix: true, locale: th })
  } catch (error) {
    console.warn("Failed to format relative time", error)
    return ""
  }
}
