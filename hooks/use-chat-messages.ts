"use client";

import { useEffect, useMemo, useState } from "react";

import { subscribeToCollection } from "@/lib/firestore";
import type { ChatMessage } from "@/types/chat";

interface UseChatMessagesResult {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
}

export function useChatMessages(chatId: string | null): UseChatMessagesResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(Boolean(chatId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let isActive = true;

    if (!chatId) {
      setMessages([]);
      setLoading(false);
      setError(null);
      return () => {};
    }

    setLoading(true);
    setError(null);

    const loadMessages = async () => {
      try {
        const { orderBy } = await import("firebase/firestore");
        unsubscribe = await subscribeToCollection(
          `chats/${chatId}/messages`,
          (docs) => {
            if (!isActive) return;

            const mapped = docs.map((doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                senderId: data.senderId as string,
                text: data.text as string,
                createdAt:
                  data.createdAt?.toDate?.() instanceof Date
                    ? (data.createdAt.toDate() as Date)
                    : null,
              } satisfies ChatMessage;
            });

            setMessages(
              mapped.sort((a, b) => {
                const timeA = a.createdAt?.getTime() ?? 0;
                const timeB = b.createdAt?.getTime() ?? 0;
                return timeA - timeB;
              }),
            );
            setLoading(false);
          },
          orderBy("createdAt", "asc"),
        );
      } catch (err) {
        console.error("Failed to subscribe to chat messages:", err);
        if (!isActive) return;
        setError("ไม่สามารถโหลดข้อความได้");
        setMessages([]);
        setLoading(false);
      }
    };

    void loadMessages();

    return () => {
      isActive = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [chatId]);

  return useMemo(
    () => ({
      messages,
      loading,
      error,
    }),
    [messages, loading, error],
  );
}
