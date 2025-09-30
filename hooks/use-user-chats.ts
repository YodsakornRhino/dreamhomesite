"use client";

import { useEffect, useMemo, useState } from "react";

import { subscribeToCollection } from "@/lib/firestore";
import type { ChatConversation } from "@/types/chat";

interface UseUserChatsResult {
  conversations: ChatConversation[];
  loading: boolean;
  error: string | null;
}

export function useUserChats(userUid: string | null): UseUserChatsResult {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(Boolean(userUid));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let isActive = true;

    if (!userUid) {
      setConversations([]);
      setLoading(false);
      setError(null);
      return () => {};
    }

    setLoading(true);
    setError(null);

    const loadChats = async () => {
      try {
        const { where } = await import("firebase/firestore");

        unsubscribe = await subscribeToCollection(
          "chats",
          (docs) => {
            if (!isActive) return;

            const mapped = docs.map((doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                participantIds: Array.isArray(data.participantIds)
                  ? (data.participantIds as string[])
                  : [],
                lastMessage:
                  typeof data.lastMessage === "string" ? data.lastMessage : undefined,
                updatedAt:
                  data.updatedAt?.toDate?.() instanceof Date
                    ? (data.updatedAt.toDate() as Date)
                    : null,
              } satisfies ChatConversation;
            });

            setConversations(
              mapped.sort((a, b) => {
                const timeA = a.updatedAt?.getTime() ?? 0;
                const timeB = b.updatedAt?.getTime() ?? 0;
                return timeB - timeA;
              }),
            );
            setLoading(false);
          },
          where("participantIds", "array-contains", userUid),
        );
      } catch (err) {
        console.error("Failed to subscribe to user chats:", err);
        if (!isActive) return;
        setError("ไม่สามารถโหลดการสนทนาได้");
        setConversations([]);
        setLoading(false);
      }
    };

    void loadChats();

    return () => {
      isActive = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [userUid]);

  return useMemo(
    () => ({
      conversations,
      loading,
      error,
    }),
    [conversations, loading, error],
  );
}
