import type {
  ConversationLastMessage,
  ConversationParticipant,
} from "@/types/conversation"

const STORAGE_KEY = "dreamhome:conversation-cache"

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string")

const sanitizeLastMessage = (
  value: unknown,
): ConversationLastMessage | null => {
  if (!value || typeof value !== "object") {
    return null
  }

  const record = value as Record<string, unknown>
  const text = typeof record.text === "string" ? record.text : ""
  const senderId = typeof record.senderId === "string" ? record.senderId : ""
  const createdAt =
    typeof record.createdAt === "string" ? record.createdAt : null

  if (!text && !senderId && !createdAt) {
    return null
  }

  return { text, senderId, createdAt }
}

const sanitizeParticipant = (
  uid: string,
  value: unknown,
): ConversationParticipant => {
  if (!value || typeof value !== "object") {
    return { uid, name: "ผู้ใช้งาน", email: null, photoURL: null }
  }

  const record = value as Record<string, unknown>
  const name =
    typeof record.name === "string" && record.name.trim()
      ? record.name
      : "ผู้ใช้งาน"
  const email =
    typeof record.email === "string" && record.email.trim()
      ? record.email
      : null
  const photoURL =
    typeof record.photoURL === "string" && record.photoURL.trim()
      ? record.photoURL
      : null

  return { uid, name, email, photoURL }
}

export type CachedConversation = {
  id: string
  participantIds: string[]
  lastMessage: ConversationLastMessage | null
  updatedAt: string | null
}

export type ConversationCachePayload = {
  conversations: CachedConversation[]
  participants: Record<string, ConversationParticipant>
  timestamp: number
}

type ConversationCache = Record<string, ConversationCachePayload>

const readCache = (): ConversationCache => {
  if (typeof window === "undefined") {
    return {}
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== "object") {
      return {}
    }
    return parsed as ConversationCache
  } catch (error) {
    console.error("Failed to read conversation cache", error)
    return {}
  }
}

const writeCache = (cache: ConversationCache) => {
  if (typeof window === "undefined") {
    return
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache))
  } catch (error) {
    console.error("Failed to write conversation cache", error)
  }
}

export const loadConversationsFromCache = (
  userId: string,
): ConversationCachePayload | null => {
  const cache = readCache()
  const payload = cache[userId]
  if (!payload) {
    return null
  }

  const conversations = Array.isArray(payload.conversations)
    ? payload.conversations
        .map((conversation) => {
          if (!conversation || typeof conversation !== "object") {
            return null
          }

          const { id, participantIds, lastMessage, updatedAt } =
            conversation as Partial<CachedConversation>

          if (typeof id !== "string" || !isStringArray(participantIds)) {
            return null
          }

          return {
            id,
            participantIds,
            lastMessage: sanitizeLastMessage(lastMessage ?? null),
            updatedAt:
              typeof updatedAt === "string" && updatedAt.trim()
                ? updatedAt
                : null,
          } as CachedConversation
        })
        .filter((conversation): conversation is CachedConversation =>
          Boolean(conversation),
        )
    : []

  const participantsEntries = Object.entries(payload.participants ?? {})
    .filter(([uid]) => typeof uid === "string" && uid.trim())
    .map(([uid, value]) => [uid, sanitizeParticipant(uid, value)] as const)

  const participants = Object.fromEntries(participantsEntries)

  return {
    conversations,
    participants,
    timestamp:
      typeof payload.timestamp === "number" && Number.isFinite(payload.timestamp)
        ? payload.timestamp
        : Date.now(),
  }
}

export const saveConversationsToCache = (
  userId: string,
  conversations: CachedConversation[],
  participants: Record<string, ConversationParticipant>,
) => {
  const cache = readCache()
  cache[userId] = {
    conversations,
    participants,
    timestamp: Date.now(),
  }
  writeCache(cache)
}

export const clearConversationCacheForUser = (userId: string) => {
  const cache = readCache()
  if (!cache[userId]) {
    return
  }
  delete cache[userId]
  writeCache(cache)
}

