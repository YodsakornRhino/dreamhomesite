"use client"

import { useEffect, useState } from "react"

import { subscribeToCollection } from "@/lib/firestore"
import type { ConversationMessage } from "@/types/conversation"

type UseConversationMessagesResult = {
  messages: ConversationMessage[]
  loading: boolean
  error: string | null
}

const toIsoString = (value: unknown): string | null => {
  if (!value) return null
  if (typeof value === "string") return value
  if (
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate?: () => Date }).toDate === "function"
  ) {
    const date = (value as { toDate: () => Date }).toDate()
    if (date instanceof Date && !Number.isNaN(date.getTime())) {
      return date.toISOString()
    }
  }
  return null
}

export function useConversationMessages(
  conversationId: string | null,
): UseConversationMessagesResult {
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [loading, setLoading] = useState(Boolean(conversationId))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    let isActive = true

    if (!conversationId) {
      setMessages([])
      setLoading(false)
      setError(null)
      return () => {}
    }

    setLoading(true)
    setError(null)

    const subscribe = async () => {
      try {
        const { orderBy } = await import("firebase/firestore")
        unsubscribe = await subscribeToCollection({
          collectionPath: `conversations/${conversationId}/messages`,
          onNext: (docs) => {
            if (!isActive) return

            const nextMessages = docs.map((docSnap) => {
              const data = docSnap.data() as Record<string, unknown>
              const text = typeof data.text === "string" ? data.text : ""
              const senderId = typeof data.senderId === "string" ? data.senderId : ""

              return {
                id: docSnap.id,
                text,
                senderId,
                createdAt: toIsoString(data.createdAt ?? null),
              }
            })

            nextMessages.sort((a, b) => {
              const aTime = a.createdAt ?? ""
              const bTime = b.createdAt ?? ""
              if (aTime === bTime) return 0
              return aTime < bTime ? -1 : 1
            })

            setMessages(nextMessages)
            setLoading(false)
          },
          queryConstraints: [orderBy("createdAt", "asc")],
          onError: () => {
            if (!isActive) return
            setMessages([])
            setError("ไม่สามารถโหลดข้อความได้")
            setLoading(false)
          },
        })
      } catch (err) {
        if (!isActive) return
        console.error("Failed to subscribe to conversation messages", err)
        setError("ไม่สามารถโหลดข้อความได้")
        setLoading(false)
      }
    }

    void subscribe()

    return () => {
      isActive = false
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [conversationId])

  return { messages, loading, error }
}
