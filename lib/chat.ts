import { FirebaseError } from "firebase/app"

import { getFirestoreInstance } from "./firestore"
import { uploadFile, getDownloadURL } from "./storage"

export type ChatAttachmentType = "image" | "video"

export interface ChatAttachmentMetadata {
  id: string
  url: string
  name: string
  type: ChatAttachmentType
  storagePath: string
  contentType: string | null
  size: number | null
}

export interface ConversationParticipant {
  uid: string
  name: string
  photoURL?: string | null
}

export const buildConversationId = (userA: string, userB: string): string => {
  return [userA, userB].sort().join("__")
}

const isPermissionDeniedError = (error: unknown): error is FirebaseError => {
  return error instanceof FirebaseError && error.code === "permission-denied"
}

const normaliseAttachmentType = (fileType: string): ChatAttachmentType => {
  if (fileType.startsWith("video/")) {
    return "video"
  }
  return "image"
}

const createAttachmentId = (conversationId: string, fileName: string): string => {
  return `${conversationId}_${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}_${fileName}`
}

const toStoragePath = (conversationId: string, attachmentId: string): string => {
  return `chat/${conversationId}/${attachmentId}`
}

export const uploadChatAttachments = async (
  conversationId: string,
  files: File[],
): Promise<ChatAttachmentMetadata[]> => {
  const uploads = await Promise.all(
    files.map(async (file) => {
      const attachmentId = createAttachmentId(conversationId, file.name.replace(/\s+/g, "_"))
      const storagePath = toStoragePath(conversationId, attachmentId)
      const metadata = { contentType: file.type }
      await uploadFile(storagePath, file, metadata)
      const url = await getDownloadURL(storagePath)
      return {
        id: attachmentId,
        url,
        name: file.name,
        type: normaliseAttachmentType(file.type),
        storagePath,
        contentType: file.type || null,
        size: typeof file.size === "number" ? file.size : null,
      }
    }),
  )

  return uploads
}

export interface EnsureConversationOptions {
  currentUser: ConversationParticipant
  targetUser: ConversationParticipant
}

export const ensureConversation = async ({
  currentUser,
  targetUser,
}: EnsureConversationOptions): Promise<string> => {
  if (!currentUser.uid || !targetUser.uid) {
    throw new Error("Both users must have a UID to start a conversation")
  }

  const conversationId = buildConversationId(currentUser.uid, targetUser.uid)
  const db = await getFirestoreInstance()
  const {
    doc,
    getDoc,
    serverTimestamp,
    setDoc,
  } = await import("firebase/firestore")

  const now = serverTimestamp()

  const [currentChatRef, targetChatRef, conversationRef] = [
    doc(db, "users", currentUser.uid, "Chat", conversationId),
    doc(db, "users", targetUser.uid, "Chat", conversationId),
    doc(db, "chats", conversationId),
  ]

  const [existingChat, existingConversation] = await Promise.all([
    getDoc(currentChatRef),
    getDoc(conversationRef).catch((error: unknown) => {
      if (isPermissionDeniedError(error)) {
        console.warn(
          "Failed to read shared conversation metadata due to permissions",
          error,
        )
        return null
      }
      throw error
    }),
  ])

  const conversationData = existingConversation?.exists()
    ? (existingConversation.data() as Record<string, unknown>)
    : undefined
  const participantSummaries =
    (conversationData?.participantSummaries as
      | Record<string, Record<string, unknown>>
      | undefined) ?? {}

  const currentSummary = participantSummaries[currentUser.uid] ?? {}
  const targetSummary = participantSummaries[targetUser.uid] ?? {}

  const currentCreatedAt = existingChat.exists()
    ? existingChat.get("createdAt") ?? currentSummary.createdAt ?? now
    : currentSummary.createdAt ?? now
  const targetCreatedAt = targetSummary.createdAt ?? now
  const conversationCreatedAt = existingConversation?.exists()
    ? existingConversation.get("createdAt") ?? now
    : now

  const writes: Promise<unknown>[] = [
    setDoc(
      currentChatRef,
      {
        conversationId,
        participants: [currentUser.uid, targetUser.uid],
        otherUser: targetUser,
        createdAt: currentCreatedAt,
        updatedAt: now,
        pinned: existingChat.exists()
          ? existingChat.get("pinned") ?? currentSummary.pinned ?? false
          : currentSummary.pinned ?? false,
      },
      { merge: true },
    ),
    setDoc(
      conversationRef,
      {
        participants: [currentUser.uid, targetUser.uid],
        createdAt: conversationCreatedAt,
        updatedAt: now,
        participantSummaries: {
          [currentUser.uid]: {
            ...currentSummary,
            otherUser: targetUser,
            createdAt: currentCreatedAt,
            updatedAt: now,
            pinned:
              (currentSummary.pinned as boolean | undefined) ??
              (existingChat.exists()
                ? (existingChat.get("pinned") as boolean | undefined)
                : false),
          },
          [targetUser.uid]: {
            ...targetSummary,
            otherUser: currentUser,
            createdAt: targetCreatedAt,
            updatedAt: now,
            pinned: (targetSummary.pinned as boolean | undefined) ?? false,
          },
        },
      },
      { merge: true },
    ).catch((error: unknown) => {
      if (isPermissionDeniedError(error)) {
        console.warn(
          "Failed to create shared conversation metadata due to permissions",
          error,
        )
        return null
      }
      throw error
    }),
  ]

  writes.push(
    setDoc(
      targetChatRef,
      {
        conversationId,
        participants: [currentUser.uid, targetUser.uid],
        otherUser: currentUser,
        createdAt: targetCreatedAt,
        updatedAt: now,
        pinned: (targetSummary.pinned as boolean | undefined) ?? false,
      },
      { merge: true },
    ).catch((error: unknown) => {
      console.warn("Failed to create chat reference for target user", error)
      return null
    }),
  )

  await Promise.all(writes)

  return conversationId
}

export interface SendMessageOptions {
  conversationId: string
  sender: ConversationParticipant
  recipient: ConversationParticipant
  text?: string | null
  attachments?: ChatAttachmentMetadata[]
}

export const sendMessage = async ({
  conversationId,
  sender,
  recipient,
  text,
  attachments = [],
}: SendMessageOptions): Promise<void> => {
  if (!sender.uid || !recipient.uid) {
    throw new Error("Sender and recipient must have a UID")
  }

  if (!text && attachments.length === 0) {
    throw new Error("Cannot send an empty message")
  }

  const db = await getFirestoreInstance()
  const {
    doc,
    collection,
    addDoc,
    serverTimestamp,
    setDoc,
    getDoc,
  } = await import("firebase/firestore")

  const timestamp = serverTimestamp()
  const messageData = {
    senderId: sender.uid,
    text: text ?? "",
    attachments,
    createdAt: timestamp,
  }

  const conversationMetaForSender = {
    lastMessage: messageData,
    updatedAt: timestamp,
  }
  const conversationMetaForRecipient = {
    lastMessage: messageData,
    updatedAt: timestamp,
  }

  const messagesCollection = collection(doc(db, "chats", conversationId), "messages")
  await addDoc(messagesCollection, messageData)

  const conversationRef = doc(db, "chats", conversationId)
  const existingConversation = await getDoc(conversationRef).catch(
    (error: unknown) => {
      if (isPermissionDeniedError(error)) {
        console.warn(
          "Failed to read shared conversation metadata before sending message",
          error,
        )
        return null
      }
      throw error
    },
  )
  const conversationData = existingConversation?.exists()
    ? (existingConversation.data() as Record<string, unknown>)
    : undefined
  const participantSummaries =
    (conversationData?.participantSummaries as
      | Record<string, Record<string, unknown>>
      | undefined) ?? {}

  const senderSummary = participantSummaries[sender.uid] ?? {}
  const recipientSummary = participantSummaries[recipient.uid] ?? {}

  await Promise.all([
    setDoc(
      doc(db, "users", sender.uid, "Chat", conversationId),
      {
        conversationId,
        participants: [sender.uid, recipient.uid],
        otherUser: recipient,
        ...conversationMetaForSender,
      },
      { merge: true },
    ),
    setDoc(
      doc(db, "users", recipient.uid, "Chat", conversationId),
      {
        conversationId,
        participants: [sender.uid, recipient.uid],
        otherUser: sender,
        ...conversationMetaForRecipient,
      },
      { merge: true },
    ).catch((error: unknown) => {
      console.warn("Failed to update recipient chat metadata", error)
      return null
    }),
    setDoc(
      conversationRef,
      {
        participants: [sender.uid, recipient.uid],
        updatedAt: timestamp,
        participantSummaries: {
          [sender.uid]: {
            ...senderSummary,
            otherUser: recipient,
            lastMessage: messageData,
            updatedAt: timestamp,
            createdAt: senderSummary.createdAt ?? timestamp,
          },
          [recipient.uid]: {
            ...recipientSummary,
            otherUser: sender,
            lastMessage: messageData,
            updatedAt: timestamp,
            createdAt: recipientSummary.createdAt ?? timestamp,
          },
        },
      },
      { merge: true },
    ).catch((error: unknown) => {
      if (isPermissionDeniedError(error)) {
        console.warn(
          "Failed to update shared conversation metadata due to permissions",
          error,
        )
        return null
      }
      throw error
    }),
  ])
}

export const togglePinConversation = async (
  userId: string,
  conversationId: string,
  pin: boolean,
): Promise<void> => {
  const db = await getFirestoreInstance()
  const {
    doc,
    updateDoc,
    setDoc,
    serverTimestamp,
  } = await import("firebase/firestore")
  const userConversationRef = doc(db, "users", userId, "Chat", conversationId)
  const summaryConversationRef = doc(db, "chats", conversationId)
  const timestamp = serverTimestamp()
  await Promise.all([
    updateDoc(userConversationRef, {
      pinned: pin,
    }).catch((error: unknown) => {
      console.warn("Failed to update pin state in user chat collection", error)
      return null
    }),
    setDoc(
      summaryConversationRef,
      {
        [`participantSummaries.${userId}.pinned`]: pin,
        [`participantSummaries.${userId}.updatedAt`]: timestamp,
      } as Record<string, unknown>,
      { merge: true },
    ),
  ])
}
