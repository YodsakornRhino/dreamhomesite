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

  const existing = await getDoc(currentChatRef)

  await Promise.all([
    setDoc(
      currentChatRef,
      {
        conversationId,
        participants: [currentUser.uid, targetUser.uid],
        otherUser: targetUser,
        createdAt: existing.exists() ? existing.get("createdAt") ?? now : now,
        updatedAt: now,
        pinned: existing.exists() ? existing.get("pinned") ?? false : false,
      },
      { merge: true },
    ),
    setDoc(
      targetChatRef,
      {
        conversationId,
        participants: [currentUser.uid, targetUser.uid],
        otherUser: currentUser,
        createdAt: now,
        updatedAt: now,
        pinned: false,
      },
      { merge: true },
    ),
    setDoc(
      conversationRef,
      {
        participants: [currentUser.uid, targetUser.uid],
        createdAt: now,
        updatedAt: now,
      },
      { merge: true },
    ),
  ])

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
    ),
    setDoc(
      doc(db, "chats", conversationId),
      {
        participants: [sender.uid, recipient.uid],
        updatedAt: timestamp,
      },
      { merge: true },
    ),
  ])
}

export const togglePinConversation = async (
  userId: string,
  conversationId: string,
  pin: boolean,
): Promise<void> => {
  const db = await getFirestoreInstance()
  const { doc, updateDoc } = await import("firebase/firestore")
  const conversationRef = doc(db, "users", userId, "Chat", conversationId)
  await updateDoc(conversationRef, {
    pinned: pin,
  })
}
