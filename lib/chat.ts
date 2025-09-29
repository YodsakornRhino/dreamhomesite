import type { Timestamp } from "firebase/firestore"
import { getFirebaseApp } from "./firebase"
import { getFirestoreInstance } from "./firestore"
import { getStorageInstance } from "./storage"
import { getDownloadURL } from "./storage"
import { uploadFile } from "./storage"

export type ChatAttachmentType = "image" | "video" | "file"

export interface ChatParticipant {
  uid: string
  name: string | null
  photoURL?: string | null
  email?: string | null
}

export interface ChatAttachment {
  id: string
  name: string
  url: string
  contentType: string
  size: number
  storagePath: string
  type: ChatAttachmentType
}

export interface ChatMessage {
  id: string
  senderId: string
  text: string | null
  createdAt: Timestamp | null
  attachments: ChatAttachment[]
}

export interface ChatConversation {
  id: string
  participants: string[]
  otherUser?: ChatParticipant | null
  pinned: boolean
  lastMessage: string | null
  lastMessageAt: Timestamp | null
  lastSenderId?: string | null
  unreadCount?: number
  createdAt?: Timestamp | null
  updatedAt?: Timestamp | null
  isPending?: boolean
}

export interface EnsureConversationParams {
  currentUser: ChatParticipant
  targetUser: ChatParticipant
}

export interface SendMessageParams {
  conversationId: string
  sender: ChatParticipant
  participants?: string[]
  text: string | null
  attachments?: ChatAttachment[]
}

const generateConversationId = (participants: string[]): string => {
  return participants
    .slice()
    .sort((a, b) => a.localeCompare(b))
    .join("__")
}

const toAttachmentType = (contentType: string): ChatAttachmentType => {
  if (contentType.startsWith("image/")) {
    return "image"
  }
  if (contentType.startsWith("video/")) {
    return "video"
  }
  return "file"
}

const ensureParticipantDetails = (
  participants: ChatParticipant[],
): Record<string, ChatParticipant> => {
  return participants.reduce<Record<string, ChatParticipant>>((acc, participant) => {
    acc[participant.uid] = {
      uid: participant.uid,
      name: participant.name ?? null,
      photoURL: participant.photoURL ?? null,
      email: participant.email ?? null,
    }
    return acc
  }, {})
}

export const ensureConversation = async ({
  currentUser,
  targetUser,
}: EnsureConversationParams): Promise<{ id: string; participants: string[] }> => {
  if (typeof window === "undefined") {
    throw new Error("ensureConversation can only be called in the browser")
  }

  if (!currentUser.uid || !targetUser.uid) {
    throw new Error("Both participants must have a uid")
  }

  // Ensure the Firebase app has been initialised
  getFirebaseApp()

  const db = await getFirestoreInstance()
  const { doc, getDoc, setDoc, serverTimestamp } = await import("firebase/firestore")

  const participants = [currentUser.uid, targetUser.uid]
  const conversationId = generateConversationId(participants)
  const conversationRef = doc(db, "chats", conversationId)
  const conversationSnap = await getDoc(conversationRef)
  const now = serverTimestamp()
  const participantDetails = ensureParticipantDetails([currentUser, targetUser])

  if (!conversationSnap.exists()) {
    await setDoc(
      conversationRef,
      {
        participants: participants.slice().sort((a, b) => a.localeCompare(b)),
        participantDetails,
        createdAt: now,
        updatedAt: now,
        lastMessage: null,
        lastMessageAt: null,
        lastSenderId: null,
      },
      { merge: true },
    )
  } else {
    const existingDetails = conversationSnap.data()?.participantDetails ?? {}
    const mergedDetails = { ...participantDetails, ...existingDetails }
    await setDoc(
      conversationRef,
      {
        participantDetails: mergedDetails,
        updatedAt: now,
      },
      { merge: true },
    )
  }

  const ensureUserChatDoc = async (owner: ChatParticipant, other: ChatParticipant) => {
    const chatDocRef = doc(db, "users", owner.uid, "Chat", conversationId)
    const chatDocSnap = await getDoc(chatDocRef)
    const defaultPinned = chatDocSnap.exists() ? chatDocSnap.data()?.pinned ?? false : false
    const createdAt = chatDocSnap.exists()
      ? chatDocSnap.data()?.createdAt ?? now
      : now

    await setDoc(
      chatDocRef,
      {
        participants: participants.slice().sort((a, b) => a.localeCompare(b)),
        otherUser: {
          uid: other.uid,
          name: other.name ?? null,
          photoURL: other.photoURL ?? null,
          email: other.email ?? null,
        },
        pinned: defaultPinned,
        createdAt,
        updatedAt: now,
      },
      { merge: true },
    )
  }

  await Promise.all([
    ensureUserChatDoc(currentUser, targetUser),
    ensureUserChatDoc(targetUser, currentUser),
  ])

  return { id: conversationId, participants: participants.slice().sort((a, b) => a.localeCompare(b)) }
}

export const subscribeToUserConversations = async (
  userId: string,
  callback: (conversations: ChatConversation[]) => void,
): Promise<() => void> => {
  const db = await getFirestoreInstance()
  const { collection, onSnapshot, orderBy, query } = await import("firebase/firestore")

  const chatCollection = collection(db, "users", userId, "Chat")
  const chatQuery = query(
    chatCollection,
    orderBy("pinned", "desc"),
    orderBy("lastMessageAt", "desc"),
  )

  const unsubscribe = onSnapshot(chatQuery, (snapshot) => {
    const conversations = snapshot.docs.map((docSnap) => {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        participants: (data.participants as string[]) ?? [],
        otherUser: data.otherUser ?? null,
        pinned: Boolean(data.pinned),
        lastMessage: (data.lastMessage as string | null) ?? null,
        lastMessageAt: (data.lastMessageAt as Timestamp | null) ?? null,
        lastSenderId: (data.lastSenderId as string | null) ?? null,
        unreadCount: (data.unreadCount as number | undefined) ?? 0,
        createdAt: (data.createdAt as Timestamp | null) ?? null,
        updatedAt: (data.updatedAt as Timestamp | null) ?? null,
      } satisfies ChatConversation
    })

    callback(conversations)
  })

  return unsubscribe
}

export const subscribeToConversationMessages = async (
  conversationId: string,
  callback: (messages: ChatMessage[]) => void,
): Promise<() => void> => {
  const db = await getFirestoreInstance()
  const { collection, onSnapshot, orderBy, query } = await import("firebase/firestore")

  const messagesCollection = collection(db, "chats", conversationId, "messages")
  const messagesQuery = query(messagesCollection, orderBy("createdAt", "asc"))

  const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
    const messages = snapshot.docs.map((docSnap) => {
      const data = docSnap.data()
      const attachments = Array.isArray(data.attachments)
        ? (data.attachments as ChatAttachment[]).map((attachment) => ({
            ...attachment,
            type: attachment.type ?? toAttachmentType(attachment.contentType ?? ""),
          }))
        : []

      return {
        id: docSnap.id,
        senderId: data.senderId as string,
        text: (data.text as string | null) ?? null,
        createdAt: (data.createdAt as Timestamp | null) ?? null,
        attachments,
      } satisfies ChatMessage
    })

    callback(messages)
  })

  return unsubscribe
}

export const uploadChatAttachments = async (
  conversationId: string,
  files: File[],
): Promise<ChatAttachment[]> => {
  if (files.length === 0) {
    return []
  }

  await getStorageInstance()

  const uploads = await Promise.all(
    files.map(async (file) => {
      const id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
      const storagePath = `chat/${conversationId}/${id}-${sanitizedName}`
      const uploadResult = await uploadFile(storagePath, file, {
        contentType: file.type,
      })
      const url = await getDownloadURL(uploadResult.metadata.fullPath)

      return {
        id,
        name: file.name,
        url,
        contentType: file.type,
        size: file.size,
        storagePath: uploadResult.metadata.fullPath,
        type: toAttachmentType(file.type),
      } satisfies ChatAttachment
    }),
  )

  return uploads
}

export const sendMessage = async ({
  conversationId,
  sender,
  participants,
  text,
  attachments = [],
}: SendMessageParams): Promise<void> => {
  if (typeof window === "undefined") {
    throw new Error("sendMessage can only be called in the browser")
  }

  const db = await getFirestoreInstance()
  const { addDoc, collection, doc, getDoc, serverTimestamp, setDoc } = await import(
    "firebase/firestore"
  )

  const now = serverTimestamp()
  const sanitizedText = text && text.trim().length > 0 ? text : null
  const messageCollection = collection(db, "chats", conversationId, "messages")

  await addDoc(messageCollection, {
    senderId: sender.uid,
    text: sanitizedText,
    attachments,
    createdAt: now,
  })

  const chatDocRef = doc(db, "chats", conversationId)
  const chatDocSnap = await getDoc(chatDocRef)
  const participantIds = participants?.length
    ? participants.slice().sort((a, b) => a.localeCompare(b))
    : ((chatDocSnap.data()?.participants as string[] | undefined) ?? [])

  const participantDetails: Record<string, ChatParticipant> = chatDocSnap.data()?.participantDetails ?? {}

  const summary =
    sanitizedText ?? (attachments.length > 0 ? `${attachments.length} ไฟล์แนบ` : "ส่งข้อความใหม่")

  await setDoc(
    chatDocRef,
    {
      lastMessage: summary,
      lastMessageAt: now,
      lastSenderId: sender.uid,
      updatedAt: now,
      participants: participantIds,
      participantDetails: ensureParticipantDetails(
        Object.values(participantDetails).length
          ? Object.values(participantDetails)
          : participantIds.map((uid) => ({
              uid,
              name: participantDetails?.[uid]?.name ?? null,
              photoURL: participantDetails?.[uid]?.photoURL ?? null,
              email: participantDetails?.[uid]?.email ?? null,
            })),
      ),
    },
    { merge: true },
  )

  await Promise.all(
    participantIds.map(async (participantUid) => {
      const chatDoc = doc(db, "users", participantUid, "Chat", conversationId)
      const otherParticipantUid = participantIds.find((uid) => uid !== participantUid) ?? sender.uid
      const otherDetails =
        participantDetails?.[otherParticipantUid] ??
        (participantUid === sender.uid
          ? {
              uid: sender.uid,
              name: sender.name ?? null,
              photoURL: sender.photoURL ?? null,
              email: sender.email ?? null,
            }
          : null)

      await setDoc(
        chatDoc,
        {
          participants: participantIds,
          lastMessage: summary,
          lastMessageAt: now,
          lastSenderId: sender.uid,
          updatedAt: now,
          unreadCount: participantUid === sender.uid ? 0 : 1,
          otherUser: otherDetails,
        },
        { merge: true },
      )
    }),
  )
}

export const toggleConversationPin = async (
  userId: string,
  conversationId: string,
  shouldPin: boolean,
): Promise<void> => {
  const db = await getFirestoreInstance()
  const { doc, setDoc, serverTimestamp } = await import("firebase/firestore")

  const chatDocRef = doc(db, "users", userId, "Chat", conversationId)
  await setDoc(
    chatDocRef,
    {
      pinned: shouldPin,
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

  const chatDocRef = doc(db, "users", userId, "Chat", conversationId)
  await setDoc(
    chatDocRef,
    {
      unreadCount: 0,
      lastViewedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

