"use client";

import type React from "react";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

import { ensureChatDocument } from "@/lib/chat";
import { useAuthContext } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface UserChatContextValue {
  isOpen: boolean;
  openChatPanel: (conversationId?: string) => void;
  closeChatPanel: () => void;
  activeConversationId: string | null;
  setActiveConversationId: (conversationId: string | null) => void;
  openChatWithUser: (userId: string) => Promise<void>;
  isInitializingChat: boolean;
}

const UserChatContext = createContext<UserChatContextValue | undefined>(undefined);

export function UserChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthContext();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isInitializingChat, setIsInitializingChat] = useState(false);

  const openChatPanel = useCallback((conversationId?: string) => {
    setIsOpen(true);
    if (conversationId) {
      setActiveConversationId(conversationId);
    }
  }, []);

  const closeChatPanel = useCallback(() => {
    setIsOpen(false);
    setActiveConversationId(null);
  }, []);

  const openChatWithUser = useCallback(
    async (targetUserId: string) => {
      if (!user) {
        toast({
          title: "กรุณาเข้าสู่ระบบ",
          description: "เข้าสู่ระบบเพื่อเริ่มต้นการสนทนา",
          variant: "destructive",
        });
        return;
      }

      if (targetUserId === user.uid) {
        toast({
          title: "ไม่สามารถเปิดแชท",
          description: "คุณไม่สามารถสนทนากับตัวเองได้",
          variant: "destructive",
        });
        return;
      }

      setIsOpen(true);
      setIsInitializingChat(true);

      try {
        const chatId = await ensureChatDocument(user.uid, targetUserId);
        setActiveConversationId(chatId);
      } catch (error) {
        console.error("Failed to open chat with user:", error);
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถเปิดการสนทนาได้ กรุณาลองใหม่อีกครั้ง",
          variant: "destructive",
        });
      } finally {
        setIsInitializingChat(false);
      }
    },
    [toast, user],
  );

  const value = useMemo(
    () => ({
      isOpen,
      openChatPanel,
      closeChatPanel,
      activeConversationId,
      setActiveConversationId,
      openChatWithUser,
      isInitializingChat,
    }),
    [
      activeConversationId,
      closeChatPanel,
      isInitializingChat,
      isOpen,
      openChatPanel,
      openChatWithUser,
    ],
  );

  return <UserChatContext.Provider value={value}>{children}</UserChatContext.Provider>;
}

export const useUserChatContext = () => {
  const context = useContext(UserChatContext);
  if (!context) {
    throw new Error("useUserChatContext must be used within a UserChatProvider");
  }
  return context;
};
