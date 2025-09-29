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

const mapLastMessage = (raw: any): ConversationLastMessage | null => {
  if (!raw) {
    return null
  }

  const attachmentsRaw: any[] = Array.isArray(raw.attachments)
    ? raw.attachments
    : []

  return {
    senderId:
      typeof raw.senderId === "string"
        ? raw.senderId
        : raw.senderId == null
        ? null
        : String(raw.senderId),
    text:
      typeof raw.text === "string"
        ? raw.text
        : raw.text == null
        ? null
        : String(raw.text),
    attachments: attachmentsRaw
      .map(mapAttachment)
      .filter(Boolean) as ChatAttachment[],
    createdAt: toDate(raw.createdAt),
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

  const ensureMetadata = async (
    userId: string,
    otherId: string,
    shouldThrowOnError: boolean,
  ) => {
    try {
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
    } catch (error) {
      console.warn(
        "Failed to ensure per-user chat metadata",
        { userId, conversationId },
        error,
      )
      if (shouldThrowOnError) {
        throw error
      }
    }
  }

  await ensureMetadata(currentUserId, targetUserId, true)
  await ensureMetadata(targetUserId, currentUserId, false)

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
  const { collection, onSnapshot, orderBy, query, where } = await import(
    "firebase/firestore"
  )

  const sharedCollectionRef = collection(db, COLLECTION_NAME)
  const sharedQuery = query(
    sharedCollectionRef,
    where("participants", "array-contains", userId),
  )

  const metadataCollectionRef = collection(db, "users", userId, "Chat")
  const metadataQuery = query(
    metadataCollectionRef,
    orderBy("pinned", "desc"),
    orderBy("updatedAt", "desc"),
  )

  let sharedDocs = new Map<string, Record<string, any>>()
  let metadataDocs = new Map<string, Record<string, any>>()

  const emit = () => {
    const ids = new Set<string>()
    sharedDocs.forEach((_, key) => ids.add(key))
    metadataDocs.forEach((_, key) => ids.add(key))

    const conversations: UserConversation[] = Array.from(ids).map((id) => {
      const shared = sharedDocs.get(id) ?? null
      const metadata = metadataDocs.get(id) ?? null

      const participantsRaw: string[] = Array.isArray(shared?.participants)
        ? (shared!.participants as string[])
        : Array.isArray(metadata?.participants)
        ? (metadata!.participants as string[])
        : [userId]

      const metadataOtherUserId =
        (metadata?.otherUserId as string | undefined) ?? null
      const metadataOtherUser =
        (metadata?.otherUser as ChatUserProfile | undefined) ?? null

      const participantProfiles: Record<string, any> =
        (shared?.participantProfiles as Record<string, any> | undefined) ?? {}

      const otherUserIdFromParticipants = participantsRaw.find(
        (participant) => participant !== userId,
      )

      const fallbackParticipantId = Object.keys(participantProfiles).find(
        (participantId) => participantId !== userId,
      )

      const resolvedOtherUserId =
        otherUserIdFromParticipants ??
        metadataOtherUserId ??
        (metadataOtherUser?.uid as string | undefined) ??
        fallbackParticipantId ??
        ""

      const conversationProfile = resolvedOtherUserId
        ? (participantProfiles[resolvedOtherUserId] as
            | ChatUserProfile
            | undefined
            | null)
        : null

      const otherUser: ChatUserProfile = {
        uid:
          resolvedOtherUserId ||
          (conversationProfile?.uid as string | undefined) ||
          (metadataOtherUser?.uid as string | undefined) ||
          "",
        name:
          (conversationProfile?.name as string | undefined) ??
          (metadataOtherUser?.name as string | undefined) ??
          (metadata?.otherUserName as string | undefined) ??
          "ผู้ใช้ DreamHome",
        email:
          (conversationProfile?.email as string | undefined) ??
          (metadataOtherUser?.email as string | undefined) ??
          null,
        photoURL:
          (conversationProfile?.photoURL as string | undefined) ??
          (metadataOtherUser?.photoURL as string | undefined) ??
          (metadata?.otherUserPhotoURL as string | undefined) ??
          null,
      }

      const participantsSet = new Set<string>()
      for (const participant of participantsRaw) {
        if (typeof participant === "string" && participant.trim()) {
          participantsSet.add(participant)
        }
      }
      participantsSet.add(userId)
      if (otherUser.uid) {
        participantsSet.add(otherUser.uid)
      }
      const participants = sortParticipants(Array.from(participantsSet))

      const lastMessageRaw = shared?.lastMessage ?? metadata?.lastMessage ?? null
      const lastMessage = mapLastMessage(lastMessageRaw)

      const createdAt =
        toDate(shared?.createdAt) ?? toDate(metadata?.createdAt) ?? null
      const updatedAt =
        toDate(shared?.updatedAt) ?? toDate(metadata?.updatedAt) ?? null

      const unreadCount = Number(metadata?.unreadCount ?? 0)
      const pinned = Boolean(metadata?.pinned)

      return {
        id,
        participants,
        otherUserId: otherUser.uid,
        otherUser,
        lastMessage,
        pinned,
        unreadCount,
        createdAt,
        updatedAt,
      }
    })

    callback(conversations)
  }

  const unsubscribeShared = onSnapshot(
    sharedQuery,
    (snapshot) => {
      sharedDocs = new Map(
        snapshot.docs.map((docSnapshot) => [
          docSnapshot.id,
          docSnapshot.data() as Record<string, any>,
        ]),
      )
      emit()
    },
    (error) => {
      console.error("Failed to subscribe to shared conversations", error)
    },
  )

  const unsubscribeMetadata = onSnapshot(
    metadataQuery,
    (snapshot) => {
      metadataDocs = new Map(
        snapshot.docs.map((docSnapshot) => [
          docSnapshot.id,
          docSnapshot.data() as Record<string, any>,
        ]),
      )
      emit()
    },
    (error) => {
      console.error("Failed to subscribe to user conversation metadata", error)
    },
  )

  return () => {
    unsubscribeShared()
    unsubscribeMetadata()
  }
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

  const participantProfiles: Record<string, any> =
    (data.participantProfiles as Record<string, any> | undefined) ?? {}

  const missingProfiles = participants.filter(
    (participantId) => !participantProfiles[participantId],
  )

  if (missingProfiles.length > 0) {
    const profiles = await Promise.all(
      missingProfiles.map((participantId) => fetchUserProfile(participantId)),
    )
    profiles.forEach((profile, index) => {
      const participantId = missingProfiles[index]
      participantProfiles[participantId] = profile ?? null
    })
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
    participantProfiles,
  })

  await Promise.all(
    participants.map(async (participantId) => {
      try {
        const metadataRef = doc(
          db,
          "users",
          participantId,
          "Chat",
          conversationId,
        )
        await setDoc(
          metadataRef,
          {
            lastMessage,
            updatedAt: now,
            unreadCount: participantId === senderId ? 0 : increment(1),
          },
          { merge: true },
        )
      } catch (error) {
        if (participantId === senderId) {
          throw error
        }
        console.warn(
          "Failed to update chat metadata for participant",
          { participantId, conversationId },
          error,
        )
      }
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
