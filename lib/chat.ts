import type { Unsubscribe } from "firebase/firestore"
import { getDocument, getFirestoreInstance } from "./firestore"
import { getDownloadURL, uploadFile } from "./storage"

export type ChatAttachmentType = "image" | "video" | "file"

export interface ChatUserProfile {
  uid: string
  name: string
  email?: string | null
  photoURL?: string | null
}

export interface ChatAttachment {
  id: string
  name: string
  url: string
  type: ChatAttachmentType
  contentType?: string | null
}

export interface ChatMessage {
  id: string
  conversationId: string
  senderId: string
  text: string | null
  attachments: ChatAttachment[]
  createdAt: Date
}

export interface ConversationLastMessage {
  senderId: string | null
  text: string | null
  attachments: ChatAttachment[]
  createdAt: Date | null
}

export interface UserConversation {
  id: string
  participants: string[]
  otherUserId: string
  otherUser: ChatUserProfile
  lastMessage: ConversationLastMessage | null
  pinned: boolean
  unreadCount: number
  createdAt: Date | null
  updatedAt: Date | null
}

interface EnsureConversationParams {
  currentUserId: string
  targetUserId: string
}

export interface EnsureConversationResult {
  conversationId: string
  participants: string[]
  currentUser: ChatUserProfile | null
  targetUser: ChatUserProfile | null
}

interface SendMessageParams {
  conversationId: string
  senderId: string
  text: string | null
  files: File[]
}

const COLLECTION_NAME = "conversation"

const randomId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2, 10)
}

const sortParticipants = (participants: string[]): string[] =>
  [...participants].sort((a, b) => a.localeCompare(b))

const buildConversationId = (participants: string[]): string =>
  sortParticipants(participants).join("__")

const toDate = (value: any): Date | null => {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value.toDate === "function") {
    return value.toDate()
  }
  return null
}

const mapAttachment = (raw: any): ChatAttachment | null => {
  if (!raw) return null
  const type: ChatAttachmentType = raw.type === "video"
    ? "video"
    : raw.type === "image"
    ? "image"
    : "file"

  return {
    id: raw.id ?? randomId(),
    name: raw.name ?? "ไฟล์แนบ",
    url: raw.url ?? "",
    type,
    contentType: raw.contentType ?? null,
  }
}

const fetchUserProfile = async (userId: string): Promise<ChatUserProfile | null> => {
  try {
    const snapshot = await getDocument("users", userId)
    if (!snapshot) {
      return null
    }
    const data = snapshot.data() as Record<string, any>
    return {
      uid: userId,
      name:
        (data.name as string | undefined) ||
        (data.displayName as string | undefined) ||
        (data.email as string | undefined) ||
        "ผู้ใช้ DreamHome",
      email: (data.email as string | undefined) ?? null,
      photoURL: (data.photoURL as string | undefined) ?? null,
    }
  } catch (error) {
    console.error("Failed to fetch user profile", error)
    return null
  }
}

export const ensureConversation = async ({
  currentUserId,
  targetUserId,
}: EnsureConversationParams): Promise<EnsureConversationResult> => {
  if (!currentUserId || !targetUserId) {
    throw new Error("Both participant IDs are required")
  }

  if (currentUserId === targetUserId) {
    throw new Error("A conversation requires two different participants")
  }

  const participants = sortParticipants([currentUserId, targetUserId])
  const conversationId = buildConversationId(participants)

  const db = await getFirestoreInstance()
  const {
    doc,
    getDoc,
    serverTimestamp,
    setDoc,
  } = await import("firebase/firestore")

  const conversationRef = doc(db, COLLECTION_NAME, conversationId)
  const snapshot = await getDoc(conversationRef)

  const [currentProfile, targetProfile] = await Promise.all([
    fetchUserProfile(currentUserId),
    fetchUserProfile(targetUserId),
  ])

  const participantProfiles: Record<string, ChatUserProfile | null> = {
    [currentUserId]: currentProfile,
    [targetUserId]: targetProfile,
  }

  const now = serverTimestamp()

  if (!snapshot.exists()) {
    await setDoc(conversationRef, {
      participants,
      participantProfiles,
      createdAt: now,
      updatedAt: now,
      lastMessage: null,
    })
  } else {
    await setDoc(
      conversationRef,
      {
        participants,
        participantProfiles,
        updatedAt: now,
      },
      { merge: true },
    )
  }

  const ensureMetadata = async (userId: string, otherId: string) => {
    const otherProfile = participantProfiles[otherId]
    const metadataRef = doc(db, "users", userId, "Chat", conversationId)
    const metadataSnap = await getDoc(metadataRef)
    const data: Record<string, any> = {
      conversationId,
      participants,
      otherUserId: otherId,
      updatedAt: now,
    }

    if (otherProfile) {
      data.otherUser = otherProfile
    }

    if (!metadataSnap.exists()) {
      data.createdAt = now
      data.unreadCount = 0
      data.pinned = false
    }

    await setDoc(metadataRef, data, { merge: true })
  }

  await Promise.all([
    ensureMetadata(currentUserId, targetUserId),
    ensureMetadata(targetUserId, currentUserId),
  ])

  return {
    conversationId,
    participants,
    currentUser: currentProfile,
    targetUser: targetProfile,
  }
}

export const subscribeToUserConversations = async (
  userId: string,
  callback: (conversations: UserConversation[]) => void,
): Promise<Unsubscribe> => {
  const db = await getFirestoreInstance()
  const { collection, onSnapshot, orderBy, query } = await import(
    "firebase/firestore"
  )

  const collectionRef = collection(db, "users", userId, "Chat")
  const q = query(
    collectionRef,
    orderBy("pinned", "desc"),
    orderBy("updatedAt", "desc"),
  )

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const items: UserConversation[] = snapshot.docs.map((docSnapshot) => {
      const data = docSnapshot.data() as Record<string, any>
      const lastMessageRaw = data.lastMessage ?? null
      const attachmentsRaw: any[] = Array.isArray(lastMessageRaw?.attachments)
        ? lastMessageRaw.attachments
        : []

      const lastMessage: ConversationLastMessage | null = lastMessageRaw
        ? {
            senderId: (lastMessageRaw.senderId as string | undefined) ?? null,
            text: (lastMessageRaw.text as string | undefined) ?? null,
            attachments: attachmentsRaw
              .map(mapAttachment)
              .filter(Boolean) as ChatAttachment[],
            createdAt: toDate(lastMessageRaw.createdAt),
          }
        : null

      const otherUser: ChatUserProfile = {
        uid: (data.otherUserId as string | undefined) ?? "",
        name:
          (data.otherUser?.name as string | undefined) ||
          (data.otherUserName as string | undefined) ||
          "ผู้ใช้ DreamHome",
        email: (data.otherUser?.email as string | undefined) ?? null,
        photoURL:
          (data.otherUser?.photoURL as string | undefined) ??
          (data.otherUserPhotoURL as string | undefined) ??
          null,
      }

      return {
        id: docSnapshot.id,
        participants:
          (data.participants as string[] | undefined) ?? [userId, otherUser.uid],
        otherUserId: otherUser.uid,
        otherUser,
        lastMessage,
        pinned: Boolean(data.pinned),
        unreadCount: Number(data.unreadCount ?? 0),
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      }
    })

    callback(items)
  })

  return unsubscribe
}

export const subscribeToConversationMessages = async (
  conversationId: string,
  callback: (messages: ChatMessage[]) => void,
): Promise<Unsubscribe> => {
  const db = await getFirestoreInstance()
  const { collection, onSnapshot, orderBy, query } = await import(
    "firebase/firestore"
  )

  const messagesRef = collection(db, COLLECTION_NAME, conversationId, "messages")
  const q = query(messagesRef, orderBy("createdAt", "asc"))

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const messages: ChatMessage[] = snapshot.docs.map((docSnapshot) => {
      const data = docSnapshot.data() as Record<string, any>
      const attachmentsRaw: any[] = Array.isArray(data.attachments)
        ? data.attachments
        : []

      return {
        id: docSnapshot.id,
        conversationId,
        senderId: (data.senderId as string | undefined) ?? "",
        text:
          (data.text as string | undefined) !== undefined
            ? (data.text as string | null)
            : null,
        attachments: attachmentsRaw
          .map(mapAttachment)
          .filter(Boolean) as ChatAttachment[],
        createdAt: toDate(data.createdAt) ?? new Date(),
      }
    })

    callback(messages)
  })

  return unsubscribe
}

const detectAttachmentType = (file: File): ChatAttachmentType => {
  if (file.type.startsWith("image/")) return "image"
  if (file.type.startsWith("video/")) return "video"
  return "file"
}

export const sendMessage = async ({
  conversationId,
  senderId,
  text,
  files,
}: SendMessageParams): Promise<void> => {
  const trimmedText = text?.trim() ?? ""
  if (!trimmedText && files.length === 0) {
    return
  }

  const db = await getFirestoreInstance()
  const {
    addDoc,
    collection,
    doc,
    getDoc,
    increment,
    serverTimestamp,
    setDoc,
    updateDoc,
  } = await import("firebase/firestore")

  const conversationRef = doc(db, COLLECTION_NAME, conversationId)
  const conversationSnap = await getDoc(conversationRef)
  if (!conversationSnap.exists()) {
    throw new Error("Conversation not found")
  }

  const data = conversationSnap.data() as Record<string, any>
  const participants: string[] = Array.isArray(data.participants)
    ? (data.participants as string[])
    : []

  if (!participants.includes(senderId)) {
    throw new Error("Sender is not part of this conversation")
  }

  const now = serverTimestamp()
  const attachments: ChatAttachment[] = []

  for (const file of files) {
    const safeName = file.name.replace(/[^a-zA-Z0-9_.-]+/g, "-")
    const fileId = randomId()
    const storagePath = `chat/${conversationId}/${fileId}-${safeName}`
    await uploadFile(storagePath, file, { contentType: file.type })
    const url = await getDownloadURL(storagePath)
    attachments.push({
      id: fileId,
      name: file.name,
      url,
      type: detectAttachmentType(file),
      contentType: file.type,
    })
  }

  const messagesRef = collection(db, COLLECTION_NAME, conversationId, "messages")
  await addDoc(messagesRef, {
    senderId,
    text: trimmedText || null,
    attachments,
    createdAt: now,
  })

  const lastMessage = {
    senderId,
    text: trimmedText || null,
    attachments,
    createdAt: now,
  }

  await updateDoc(conversationRef, {
    lastMessage,
    updatedAt: now,
  })

  await Promise.all(
    participants.map(async (participantId) => {
      const metadataRef = doc(db, "users", participantId, "Chat", conversationId)
      await setDoc(
        metadataRef,
        {
          lastMessage,
          updatedAt: now,
          unreadCount: participantId === senderId ? 0 : increment(1),
        },
        { merge: true },
      )
    }),
  )
}

export const setConversationPinned = async (
  userId: string,
  conversationId: string,
  pinned: boolean,
): Promise<void> => {
  const db = await getFirestoreInstance()
  const { doc, setDoc, serverTimestamp } = await import("firebase/firestore")
  const ref = doc(db, "users", userId, "Chat", conversationId)
  await setDoc(
    ref,
    {
      pinned,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export const markConversationRead = async (
  userId: string,
  conversationId: string,
): Promise<void> => {
  const db = await getFirestoreInstance()
  const { doc, setDoc, serverTimestamp } = await import("firebase/firestore")
  const ref = doc(db, "users", userId, "Chat", conversationId)
  await setDoc(
    ref,
    {
      unreadCount: 0,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export const buildConversationIdForParticipants = (
  userA: string,
  userB: string,
): string => buildConversationId([userA, userB])
