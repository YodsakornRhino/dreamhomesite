"use client"

import { useEffect, useMemo, useState } from "react"
import type { DocumentData } from "firebase/firestore"
import { FirebaseError } from "firebase/app"
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

    let unsubscribeUser: (() => void) | undefined
    let unsubscribeShared: (() => void) | undefined
    let cancelled = false

    const userConversations = new Map<string, ChatPreview>()
    const sharedConversations = new Map<string, ChatPreview>()

    const emitCombined = () => {
      if (cancelled) {
        return
      }

      const ids = new Set<string>([
        ...sharedConversations.keys(),
        ...userConversations.keys(),
      ])

      const merged: ChatPreview[] = []
      ids.forEach((id) => {
        const shared = sharedConversations.get(id)
        const user = userConversations.get(id)

        const attachments =
          user?.attachments && user.attachments.length > 0
            ? user.attachments
            : shared?.attachments ?? []

        merged.push({
          id,
          conversationId: user?.conversationId ?? shared?.conversationId ?? id,
          otherUser: user?.otherUser ?? shared?.otherUser ?? null,
          lastMessageText:
            user?.lastMessageText ??
            shared?.lastMessageText ??
            "เริ่มบทสนทนาใหม่",
          lastMessageAt: user?.lastMessageAt ?? shared?.lastMessageAt ?? null,
          lastMessageSenderId:
            user?.lastMessageSenderId ?? shared?.lastMessageSenderId ?? null,
          attachments,
          pinned: user?.pinned ?? shared?.pinned ?? false,
          updatedAt: user?.updatedAt ?? shared?.updatedAt ?? null,
          createdAt: user?.createdAt ?? shared?.createdAt ?? null,
        })
      })

      setConversations(merged)
      setLoading(false)
      setError(null)
    }

    const subscribeToShared = async () => {
      try {
        const db = await getFirestoreInstance()
        const { collection, onSnapshot, orderBy, query, where } = await import(
          "firebase/firestore"
        )

        const chatsCollection = collection(db, "chats")
        const q = query(
          chatsCollection,
          where("participants", "array-contains", userId),
          orderBy("updatedAt", "desc"),
        )

        unsubscribeShared = onSnapshot(
          q,
          (snapshot) => {
            sharedConversations.clear()

            snapshot.docs.forEach((docSnap) => {
              const data = docSnap.data()
              const summaries = (data.participantSummaries as
                | Record<string, DocumentData>
                | undefined) ?? {}
              const currentSummary = summaries[userId] ?? {}
              const lastMessage = currentSummary.lastMessage ?? data.lastMessage ?? null
              const createdAt = toDate(currentSummary.createdAt ?? data.createdAt)
              const updatedAt = toDate(currentSummary.updatedAt ?? data.updatedAt)
              const lastMessageAt = toDate(lastMessage?.createdAt ?? updatedAt)

              let otherUser = (currentSummary.otherUser ?? null) as
                | ConversationParticipant
                | null
              if (!otherUser) {
                const participants = (data.participants as string[] | undefined) ?? []
                const fallbackId = participants.find((participantId) => participantId !== userId)
                if (fallbackId) {
                  otherUser = {
                    uid: fallbackId,
                    name: "ผู้ใช้งาน DreamHome",
                  }
                }
              }

              sharedConversations.set(docSnap.id, {
                id: docSnap.id,
                conversationId: docSnap.id,
                otherUser,
                lastMessageText: extractLastMessageText({ lastMessage }),
                lastMessageAt,
                lastMessageSenderId: (lastMessage?.senderId as string | undefined) ?? null,
                attachments: (lastMessage?.attachments as ChatAttachmentMetadata[] | undefined) ?? [],
                pinned: Boolean(currentSummary.pinned),
                updatedAt,
                createdAt,
              })
            })

            emitCombined()
          },
          (error) => {
            console.error("Failed to subscribe to shared chats", error)
          },
        )
      } catch (error) {
        console.error("Failed to initialise shared chat listener", error)
      }
    }

    const subscribeToUser = async () => {
      try {
        const db = await getFirestoreInstance()
        const { collection, onSnapshot, orderBy, query } = await import(
          "firebase/firestore"
        )

        const chatCollection = collection(db, "users", userId, "Chat")
        const q = query(chatCollection, orderBy("pinned", "desc"), orderBy("updatedAt", "desc"))

        unsubscribeUser = onSnapshot(
          q,
          (snapshot) => {
            userConversations.clear()

            snapshot.docs.forEach((docSnap) => {
              const data = docSnap.data()
              const lastMessage = data.lastMessage ?? null
              const createdAt = toDate(data.createdAt)
              const updatedAt = toDate(data.updatedAt)
              const lastMessageAt = toDate(lastMessage?.createdAt)

              userConversations.set(docSnap.id, {
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
              })
            })

            emitCombined()
          },
          (err) => {
            console.error("Failed to subscribe to chats", err)
            if (err instanceof FirebaseError && err.code === "permission-denied") {
              unsubscribeUser?.()
              unsubscribeUser = undefined
              emitCombined()
              return
            }
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

    setLoading(true)
    subscribeToShared()
    subscribeToUser()

    return () => {
      cancelled = true
      unsubscribeShared?.()
      unsubscribeUser?.()
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
