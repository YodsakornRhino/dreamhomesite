import { addDocument, getDocument, setDocument, updateDocument } from "@/lib/firestore";

export const generateChatId = (userA: string, userB: string) =>
  [userA, userB].sort((a, b) => a.localeCompare(b)).join("__");

export const ensureChatDocument = async (
  currentUserId: string,
  targetUserId: string,
) => {
  const chatId = generateChatId(currentUserId, targetUserId);

  const existingDoc = await getDocument("chats", chatId);
  if (!existingDoc) {
    const { serverTimestamp } = await import("firebase/firestore");
    await setDocument("chats", chatId, {
      participantIds: [currentUserId, targetUserId],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  return chatId;
};

export const sendChatMessage = async (
  chatId: string,
  senderId: string,
  message: string,
) => {
  const trimmed = message.trim();
  if (!trimmed) {
    return;
  }

  const { serverTimestamp } = await import("firebase/firestore");

  await addDocument(`chats/${chatId}/messages`, {
    senderId,
    text: trimmed,
    createdAt: serverTimestamp(),
  });

  await updateDocument("chats", chatId, {
    lastMessage: trimmed,
    lastMessageSenderId: senderId,
    updatedAt: serverTimestamp(),
  });
};
