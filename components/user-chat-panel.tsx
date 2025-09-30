"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import {
  ArrowLeft,
  Loader2,
  MessageCircle,
  Send,
  User as UserIcon,
} from "lucide-react";

import { useAuthContext } from "@/contexts/AuthContext";
import { useUserChatContext } from "@/contexts/UserChatContext";
import { useUserChats } from "@/hooks/use-user-chats";
import { useChatMessages } from "@/hooks/use-chat-messages";
import { useUserProfile } from "@/hooks/use-user-profile";
import { sendChatMessage } from "@/lib/chat";
import type { ChatConversation } from "@/types/chat";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ConversationListProps {
  conversations: ChatConversation[];
  currentUserId: string;
  onSelect: (conversationId: string) => void;
  isLoading: boolean;
  error: string | null;
}

const ConversationList = ({
  conversations,
  currentUserId,
  onSelect,
  isLoading,
  error,
}: ConversationListProps) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={`skeleton-${index}`} className="flex items-center space-x-3 rounded-xl border border-dashed p-3">
            <div className="h-12 w-12 animate-pulse rounded-full bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (conversations.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-3 text-center text-sm text-muted-foreground">
        <MessageCircle className="h-10 w-10 text-blue-500" />
        <p>ยังไม่มีการสนทนา เริ่มพูดคุยกับผู้ขายเพื่อวางแผนซื้อบ้านในฝัน</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {conversations.map((conversation) => (
        <ConversationListItem
          key={conversation.id}
          conversation={conversation}
          currentUserId={currentUserId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
};

interface ConversationListItemProps {
  conversation: ChatConversation;
  currentUserId: string;
  onSelect: (conversationId: string) => void;
}

const ConversationListItem = ({
  conversation,
  currentUserId,
  onSelect,
}: ConversationListItemProps) => {
  const otherParticipantId = useMemo(() => {
    return (
      conversation.participantIds.find((participantId) => participantId !== currentUserId) ??
      conversation.participantIds[0] ??
      null
    );
  }, [conversation.participantIds, currentUserId]);

  const { profile, loading } = useUserProfile(otherParticipantId);

  return (
    <button
      type="button"
      onClick={() => onSelect(conversation.id)}
      className="flex w-full items-center space-x-3 rounded-2xl border bg-white p-3 text-left transition hover:border-blue-500 hover:bg-blue-50"
    >
      <Avatar className="h-12 w-12 border">
        <AvatarImage src={profile?.photoURL ?? undefined} alt={profile?.name ?? "ผู้ใช้"} />
        <AvatarFallback className="bg-blue-100 text-blue-600">
          {profile?.name
            ?.split(" ")
            .map((segment) => segment.charAt(0))
            .join("")
            .toUpperCase() || <UserIcon className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-1 flex-col overflow-hidden">
        <span className="truncate text-sm font-semibold text-gray-900">
          {loading ? "กำลังโหลด..." : profile?.name ?? "ผู้ใช้ DreamHome"}
        </span>
        {conversation.lastMessage && (
          <span className="truncate text-xs text-gray-500">{conversation.lastMessage}</span>
        )}
      </div>
      {conversation.updatedAt && (
        <span className="text-xs text-gray-400">
          {formatDistanceToNow(conversation.updatedAt, { addSuffix: true, locale: th })}
        </span>
      )}
    </button>
  );
};

interface ConversationViewProps {
  conversation: ChatConversation | null;
  currentUserId: string;
  onBack: () => void;
}

const ConversationView = ({ conversation, currentUserId, onBack }: ConversationViewProps) => {
  const otherParticipantId = useMemo(() => {
    return (
      conversation?.participantIds.find((participantId) => participantId !== currentUserId) ??
      conversation?.participantIds[0] ??
      null
    );
  }, [conversation?.participantIds, currentUserId]);

  const { profile: otherProfile } = useUserProfile(otherParticipantId);
  const { messages, loading } = useChatMessages(conversation?.id ?? null);
  const { user } = useAuthContext();
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    setMessage("");
  }, [conversation?.id]);

  const handleSend = async () => {
    if (!conversation?.id || !user || !message.trim()) {
      return;
    }

    try {
      setIsSending(true);
      await sendChatMessage(conversation.id, user.uid, message);
      setMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  if (!conversation) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center text-sm text-muted-foreground">
        <MessageCircle className="h-10 w-10 text-blue-500" />
        <p className="mt-3">เลือกผู้ใช้จากรายการเพื่อเริ่มสนทนา</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center space-x-3 border-b pb-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">ย้อนกลับไปหน้ารายการ</span>
        </Button>
        <Avatar className="h-12 w-12 border">
          <AvatarImage src={otherProfile?.photoURL ?? undefined} alt={otherProfile?.name ?? "ผู้ใช้"} />
          <AvatarFallback className="bg-blue-100 text-blue-600">
            {otherProfile?.name
              ?.split(" ")
              .map((segment) => segment.charAt(0))
              .join("")
              .toUpperCase() || <UserIcon className="h-4 w-4" />}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-900">
            {otherProfile?.name ?? "ผู้ใช้ DreamHome"}
          </span>
          {conversation.updatedAt && (
            <span className="text-xs text-gray-500">
              อัพเดตล่าสุด {formatDistanceToNow(conversation.updatedAt, { addSuffix: true, locale: th })}
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center space-y-2 text-center text-sm text-muted-foreground">
            <MessageCircle className="h-10 w-10 text-blue-500" />
            <p>ยังไม่มีข้อความ เริ่มต้นพูดคุยกับผู้ขายได้เลย</p>
          </div>
        ) : (
          messages.map((item) => {
            const isOwnMessage = item.senderId === currentUserId;
            return (
              <div key={item.id} className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                    isOwnMessage ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <p>{item.text}</p>
                  {item.createdAt && (
                    <span className={`mt-1 block text-[10px] ${isOwnMessage ? "text-blue-100" : "text-gray-500"}`}>
                      {formatDistanceToNow(item.createdAt, { addSuffix: true, locale: th })}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="mt-4 border-t pt-4">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="พิมพ์ข้อความของคุณ..."
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSending}
          />
          <Button onClick={handleSend} disabled={isSending || !message.trim()} className="bg-blue-600 hover:bg-blue-700">
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="ml-2 hidden sm:inline">ส่ง</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

const UserChatPanel = () => {
  const { user } = useAuthContext();
  const {
    isOpen,
    closeChatPanel,
    activeConversationId,
    setActiveConversationId,
    isInitializingChat,
  } = useUserChatContext();
  const { conversations, loading, error } = useUserChats(user?.uid ?? null);
  const [view, setView] = useState<"list" | "chat">("list");
  const navigatingBackRef = useRef(false);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) ?? null,
    [activeConversationId, conversations],
  );

  useEffect(() => {
    if (activeConversationId && !navigatingBackRef.current) {
      setView("chat");
    }
  }, [activeConversationId]);

  useEffect(() => {
    if (!isOpen) {
      setView("list");
      setActiveConversationId(null);
    }
  }, [isOpen, setActiveConversationId]);

  const handleSelectConversation = (conversationId: string) => {
    setActiveConversationId(conversationId);
    setView("chat");
  };

  const handleBackToList = () => {
    navigatingBackRef.current = true;
    setView("list");
    setTimeout(() => {
      setActiveConversationId(null);
      navigatingBackRef.current = false;
    }, 320);
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => (open ? undefined : closeChatPanel())}>
      <SheetContent side="right" className="flex h-full w-full max-w-xl flex-col gap-0 p-0" titleText="กล่องข้อความผู้ใช้">
        <SheetHeader className="border-b p-6">
          <SheetTitle className="text-lg font-semibold text-gray-900">ข้อความของฉัน</SheetTitle>
          <p className="text-sm text-gray-500">
            สนทนากับผู้ขายเพื่อสอบถามรายละเอียดและนัดหมายดูบ้านที่สนใจ
          </p>
        </SheetHeader>

        <div className="relative flex-1 overflow-hidden bg-gray-50 p-6">
          {!user ? (
            <div className="flex h-full flex-col items-center justify-center space-y-3 text-center text-sm text-muted-foreground">
              <MessageCircle className="h-10 w-10 text-blue-500" />
              <p>เข้าสู่ระบบเพื่อดูและส่งข้อความกับผู้ขาย</p>
            </div>
          ) : (
            <div
              className={`flex h-full w-full flex-nowrap transition-transform duration-300 ease-in-out ${
                view === "chat" ? "-translate-x-full" : "translate-x-0"
              }`}
            >
              <div className="w-full shrink-0 pr-6">
                <ConversationList
                  conversations={conversations}
                  currentUserId={user.uid}
                  onSelect={handleSelectConversation}
                  isLoading={loading || isInitializingChat}
                  error={error}
                />
              </div>

              <div className="w-full shrink-0 pl-6">
                <ConversationView
                  conversation={activeConversation}
                  currentUserId={user.uid}
                  onBack={handleBackToList}
                />
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default UserChatPanel;
