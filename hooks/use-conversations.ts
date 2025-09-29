"use client"

import { useEffect, useMemo, useRef, useState } from "react"

import { subscribeToCollection, subscribeToDocument } from "@/lib/firestore"
import { mapDocumentToUserProfile } from "@/lib/user-profile-mapper"
import type {
  ConversationParticipant,
  ConversationSummary,
  ConversationLastMessage,
} from "@/types/conversation"

interface RawConversation {
  id: string
  participantIds: string[]
  lastMessage: ConversationLastMessage | null
  updatedAt: string | null
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

const normalizeParticipant = (participant: ConversationParticipant): ConversationParticipant => ({
  ...participant,
  name: participant.name.trim() || "ผู้ใช้งาน",
})

const createFallbackParticipant = (
  uid: string,
  data: unknown,
): ConversationParticipant => {
  if (!data || typeof data !== "object") {
    return { uid, name: "ผู้ใช้งาน", email: null, photoURL: null }
  }

  const record = data as Record<string, unknown>
  const nameValue = record.name
  const emailValue = record.email
  const photoValue = record.photoURL

  return {
    uid,
    name:
      typeof nameValue === "string" && nameValue.trim()
        ? nameValue
        : typeof emailValue === "string" && emailValue.trim()
        ? emailValue
        : "ผู้ใช้งาน",
    email: typeof emailValue === "string" ? emailValue : null,
    photoURL: typeof photoValue === "string" ? photoValue : null,
  }
}

type UseConversationsResult = {
  conversations: ConversationSummary[]
  loading: boolean
  error: string | null
}

export function useConversations(userId: string | null): UseConversationsResult {
  const [loading, setLoading] = useState(Boolean(userId))
  const [error, setError] = useState<string | null>(null)
  const [rawConversations, setRawConversations] = useState<RawConversation[]>([])
  const [participants, setParticipants] = useState<Record<string, ConversationParticipant>>({})

  const participantUnsubscribers = useRef(new Map<string, () => void>())

  useEffect(() => {
    participantUnsubscribers.current.forEach((unsubscribe) => unsubscribe())
    participantUnsubscribers.current.clear()
    setParticipants({})
    setRawConversations([])
    setError(null)
    setLoading(Boolean(userId))

    if (!userId) {
      return
    }

    let unsubscribeConversations: (() => void) | undefined
    let isActive = true

    const ensureParticipantSubscription = (uid: string) => {
      if (participantUnsubscribers.current.has(uid)) {
        return
      }

      let unsub: (() => void) | undefined
      const subscribe = async () => {
        try {
          unsub = await subscribeToDocument({
            collectionPath: "users",
            docId: uid,
            onNext: (doc) => {
              setParticipants((prev) => {
                const next = { ...prev }
                if (doc) {
                  const profile = mapDocumentToUserProfile(doc)
                  next[uid] = normalizeParticipant({
                    uid: profile.uid,
                    name: profile.name,
                    email: profile.email,
                    photoURL: profile.photoURL,
                  })
                } else if (!next[uid]) {
                  next[uid] = { uid, name: "ผู้ใช้งาน", email: null, photoURL: null }
                }
                return next
              })
            },
            onError: () => {
              setParticipants((prev) => {
                if (prev[uid]) {
                  return prev
                }
                return {
                  ...prev,
                  [uid]: { uid, name: "ผู้ใช้งาน", email: null, photoURL: null },
                }
              })
            },
          })
          participantUnsubscribers.current.set(uid, () => {
            unsub?.()
            participantUnsubscribers.current.delete(uid)
          })
        } catch (err) {
          console.error("Failed to subscribe to participant profile", err)
        }
      }

      void subscribe()
    }

    const syncParticipants = (conversations: RawConversation[]) => {
      const required = new Set<string>()
      conversations.forEach((conversation) => {
        conversation.participantIds.forEach((participantId) => {
          if (participantId) {
            required.add(participantId)
          }
        })
      })

      participantUnsubscribers.current.forEach((unsubscribe, uid) => {
        if (!required.has(uid)) {
          unsubscribe()
        }
      })

      required.forEach((uid) => {
        ensureParticipantSubscription(uid)
      })
    }

    const subscribe = async () => {
      try {
        const { orderBy, where } = await import("firebase/firestore")
        unsubscribeConversations = await subscribeToCollection({
          collectionPath: "conversations",
          onNext: (docs) => {
            if (!isActive) return

            const nextRaw: RawConversation[] = []
            const fallbackParticipants: Record<string, ConversationParticipant> = {}

            docs.forEach((docSnap) => {
              const data = docSnap.data()
              const participantIds = Array.isArray(data.participantIds)
                ? data.participantIds.filter((value): value is string => typeof value === "string")
                : []

              if (Array.isArray(data.participantsInfo)) {
                data.participantsInfo.forEach((info: unknown) => {
                  if (!info || typeof info !== "object") return
                  const uidValue = (info as { uid?: unknown }).uid
                  if (typeof uidValue !== "string") return
                  if (!fallbackParticipants[uidValue]) {
                    fallbackParticipants[uidValue] = normalizeParticipant(
                      createFallbackParticipant(uidValue, info),
                    )
                  }
                })
              }

              const lastMessageData =
                data.lastMessage && typeof data.lastMessage === "object"
                  ? (data.lastMessage as Record<string, unknown>)
                  : null

              const lastMessage: ConversationLastMessage | null = lastMessageData
                ? {
                    text:
                      typeof lastMessageData.text === "string"
                        ? lastMessageData.text
                        : "",
                    senderId:
                      typeof lastMessageData.senderId === "string"
                        ? lastMessageData.senderId
                        : "",
                    createdAt: toIsoString(lastMessageData.createdAt ?? null),
                  }
                : null

              nextRaw.push({
                id: docSnap.id,
                participantIds,
                lastMessage,
                updatedAt: toIsoString(data.updatedAt ?? null),
              })
            })

            setRawConversations(nextRaw)
            if (Object.keys(fallbackParticipants).length > 0) {
              setParticipants((prev) => {
                const next = { ...prev }
                Object.entries(fallbackParticipants).forEach(([uid, info]) => {
                  if (!next[uid]) {
                    next[uid] = info
                  }
                })
                return next
              })
            }
            syncParticipants(nextRaw)
            setLoading(false)
          },
          queryConstraints: [
            where("participantIds", "array-contains", userId),
            orderBy("updatedAt", "desc"),
          ],
          onError: () => {
            if (!isActive) return
            setRawConversations([])
            setError("ไม่สามารถโหลดรายการสนทนาได้")
            setLoading(false)
          },
        })
      } catch (err) {
        if (!isActive) return
        console.error("Failed to subscribe to conversations", err)
        setError("ไม่สามารถโหลดรายการสนทนาได้")
        setLoading(false)
      }
    }

    void subscribe()

    return () => {
      isActive = false
      if (unsubscribeConversations) {
        unsubscribeConversations()
      }
      participantUnsubscribers.current.forEach((unsubscribe) => unsubscribe())
      participantUnsubscribers.current.clear()
    }
  }, [userId])

  const conversations = useMemo<ConversationSummary[]>(() => {
    if (!userId) return []

    return rawConversations.map((conversation) => {
      const participantDetails = conversation.participantIds
        .map((uid) => participants[uid])
        .filter((participant): participant is ConversationParticipant => Boolean(participant))
        .map(normalizeParticipant)

      const otherParticipant = participantDetails.find((participant) => participant.uid !== userId) ?? null

      return {
        id: conversation.id,
        participantIds: conversation.participantIds,
        participants: participantDetails,
        otherParticipant,
        lastMessage: conversation.lastMessage,
        updatedAt: conversation.updatedAt,
      }
    })
  }, [participants, rawConversations, userId])

  return { conversations, loading, error }
}
