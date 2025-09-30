export interface ChatConversation {
  id: string;
  participantIds: string[];
  lastMessage?: string;
  updatedAt?: Date | null;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  createdAt: Date | null;
}
