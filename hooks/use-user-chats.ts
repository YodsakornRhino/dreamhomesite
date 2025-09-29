"use client"

import { useEffect, useMemo, useState } from "react"

import type { ChatConversation } from "@/lib/chat"
import { subscribeToUserConversations } from "@/lib/chat"

interface UseUserChatsResult {
  conversations: ChatConversation[]
  loading: boolean
  error: string | null
}

export function useUserChats(userId: string | null | undefined): UseUserChatsResult {
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setConversations([])
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
        unsubscribe = await subscribeToUserConversations(userId, (nextConversations) => {
          if (!isActive) return
          setConversations(nextConversations)
          setLoading(false)
        })
      } catch (subscribeError) {
        console.error("Failed to subscribe to user chats", subscribeError)
        if (!isActive) return
        setError("ไม่สามารถโหลดบทสนทนาได้")
        setLoading(false)
      }
    })()

    return () => {
      isActive = false
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [userId])

  const sortedConversations = useMemo(() => {
    const sortByRecent = (a: ChatConversation, b: ChatConversation) => {
      const timeA = a.lastMessageAt?.toMillis?.() ?? a.updatedAt?.toMillis?.() ?? 0
      const timeB = b.lastMessageAt?.toMillis?.() ?? b.updatedAt?.toMillis?.() ?? 0
      return timeB - timeA
    }

    const pinned = conversations.filter((conversation) => conversation.pinned).sort(sortByRecent)
    const others = conversations.filter((conversation) => !conversation.pinned).sort(sortByRecent)

    return [...pinned, ...others]
  }, [conversations])

  return { conversations: sortedConversations, loading, error }
}

