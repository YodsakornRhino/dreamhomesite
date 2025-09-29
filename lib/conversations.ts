import { getDocument, getFirestoreInstance } from "./firestore"
import { mapDocumentToUserProfile } from "./user-profile-mapper"
import type { ConversationParticipant } from "@/types/conversation"

export const buildConversationId = (uidA: string, uidB: string): string => {
  const [first, second] = [uidA, uidB].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
  return `${first}__${second}`
}

const normalizeParticipant = (participant: ConversationParticipant): ConversationParticipant => ({
  ...participant,
  name: participant.name.trim() || "ผู้ใช้งาน",
})

const fetchParticipantsInfo = async (
  participantIds: string[],
): Promise<ConversationParticipant[]> => {
  const snapshots = await Promise.all(
    participantIds.map(async (uid) => {
      try {
        return await getDocument("users", uid)
      } catch (err) {
        console.error("Failed to load participant info", err)
        return null
      }
    }),
  )

  return participantIds.map((uid, index) => {
    const snapshot = snapshots[index]
    if (snapshot) {
      const profile = mapDocumentToUserProfile(snapshot)
      return normalizeParticipant({
        uid: profile.uid,
        name: profile.name,
        email: profile.email,
        photoURL: profile.photoURL,
      })
    }
    return { uid, name: "ผู้ใช้งาน", email: null, photoURL: null }
  })
}

export interface SendConversationMessageParams {
  conversationId: string
  participantIds: string[]
  senderId: string
  text: string
}

export const sendConversationMessage = async ({
  conversationId,
  participantIds,
  senderId,
  text,
}: SendConversationMessageParams): Promise<void> => {
  const trimmedText = text.trim()
  if (!trimmedText) {
    throw new Error("Message text cannot be empty")
  }

  const uniqueParticipantIds = Array.from(
    new Set(participantIds.filter((id): id is string => typeof id === "string" && id.trim())),
  )

  if (!uniqueParticipantIds.includes(senderId)) {
    uniqueParticipantIds.push(senderId)
  }

  if (uniqueParticipantIds.length < 2) {
    throw new Error("A conversation requires at least two participants")
  }

  const sortedParticipantIds = [...uniqueParticipantIds].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))

  const db = await getFirestoreInstance()
  const { addDoc, collection, doc, getDoc, serverTimestamp, setDoc } = await import(
    "firebase/firestore"
  )

  const conversationRef = doc(db, "conversations", conversationId)
  const snapshot = await getDoc(conversationRef)
  const now = serverTimestamp()

  let participantsInfo: ConversationParticipant[] | undefined
  if (!snapshot.exists()) {
    participantsInfo = await fetchParticipantsInfo(sortedParticipantIds)
  } else {
    const data = snapshot.data() as Record<string, unknown>
    if (!Array.isArray(data.participantsInfo) || data.participantsInfo.length === 0) {
      participantsInfo = await fetchParticipantsInfo(sortedParticipantIds)
    }
  }

  const dataToMerge: Record<string, unknown> = {
    participantIds: sortedParticipantIds,
    updatedAt: now,
    lastMessage: {
      text: trimmedText,
      senderId,
      createdAt: now,
    },
  }

  if (!snapshot.exists()) {
    dataToMerge.createdAt = now
  } else {
    const existingData = snapshot.data() as Record<string, unknown>
    dataToMerge.createdAt = existingData.createdAt ?? now
  }

  if (participantsInfo) {
    dataToMerge.participantsInfo = participantsInfo
  }

  await setDoc(conversationRef, dataToMerge, { merge: true })

  const messagesCollection = collection(conversationRef, "messages")
  await addDoc(messagesCollection, {
    senderId,
    text: trimmedText,
    createdAt: now,
  })
}

interface EnsureDirectConversationParams {
  currentUserId: string
  otherUserId: string
}

export const ensureDirectConversation = async ({
  currentUserId,
  otherUserId,
}: EnsureDirectConversationParams): Promise<{ conversationId: string }> => {
  const trimmedCurrent = currentUserId.trim()
  const trimmedOther = otherUserId.trim()

  if (!trimmedCurrent || !trimmedOther) {
    throw new Error("Both participant IDs are required to start a conversation")
  }

  const conversationId = buildConversationId(trimmedCurrent, trimmedOther)
  const participantIds = [trimmedCurrent, trimmedOther].sort((a, b) =>
    a < b ? -1 : a > b ? 1 : 0,
  )

  const db = await getFirestoreInstance()
  const { doc, getDoc, serverTimestamp, setDoc } = await import("firebase/firestore")

  const conversationRef = doc(db, "conversations", conversationId)
  const snapshot = await getDoc(conversationRef)
  const now = serverTimestamp()

  const dataToMerge: Record<string, unknown> = {
    participantIds,
    updatedAt: now,
  }

  if (!snapshot.exists()) {
    dataToMerge.createdAt = now
    dataToMerge.lastMessage = null
    dataToMerge.participantsInfo = await fetchParticipantsInfo(participantIds)
  } else {
    const data = snapshot.data() as Record<string, unknown>
    const existingIds = Array.isArray(data.participantIds)
      ? data.participantIds.filter((value): value is string => typeof value === "string")
      : []

    const mergedIds = Array.from(new Set([...existingIds, ...participantIds]))
    mergedIds.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
    dataToMerge.participantIds = mergedIds

    if (!Array.isArray(data.participantsInfo) || data.participantsInfo.length === 0) {
      dataToMerge.participantsInfo = await fetchParticipantsInfo(participantIds)
    }

    if (!("createdAt" in data)) {
      dataToMerge.createdAt = now
    }

    if (!("lastMessage" in data)) {
      dataToMerge.lastMessage = null
    }
  }

  await setDoc(conversationRef, dataToMerge, { merge: true })

  return { conversationId }
}
