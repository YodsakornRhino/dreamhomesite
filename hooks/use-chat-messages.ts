"use client"

import { useEffect, useState } from "react"

import type { ChatMessage } from "@/lib/chat"
import { subscribeToConversationMessages } from "@/lib/chat"

interface UseChatMessagesResult {
  messages: ChatMessage[]
  loading: boolean
  error: string | null
}

export function useChatMessages(conversationId: string | null | undefined): UseChatMessagesResult {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!conversationId) {
      setMessages([])
      setLoading(false)
      setError(null)
      return
    }

    let isActive = true
    setLoading(true)
    setError(null)

    let unsubscribe: (() => void) | undefined

    ;(async () => {
      try {
        unsubscribe = await subscribeToConversationMessages(conversationId, (nextMessages) => {
          if (!isActive) return
          setMessages(nextMessages)
          setLoading(false)
        })
      } catch (subscribeError) {
        console.error("Failed to subscribe to conversation messages", subscribeError)
        if (!isActive) return
        setError("ไม่สามารถโหลดข้อความได้")
        setLoading(false)
      }
    })()

    return () => {
      isActive = false
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [conversationId])

  return { messages, loading, error }
}

