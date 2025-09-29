export interface ConversationParticipant {
  uid: string
  name: string
  email: string | null
  photoURL: string | null
}

export interface ConversationLastMessage {
  text: string
  senderId: string
  createdAt: string | null
}

export interface ConversationSummary {
  id: string
  participantIds: string[]
  participants: ConversationParticipant[]
  otherParticipant: ConversationParticipant | null
  lastMessage: ConversationLastMessage | null
  updatedAt: string | null
}

export interface ConversationMessage {
  id: string
  senderId: string
  text: string
  createdAt: string | null
}
