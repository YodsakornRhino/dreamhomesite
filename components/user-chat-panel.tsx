"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  MessageCircle,
  Phone,
  Search,
  X,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: string;
  sender: "me" | "them";
  content: string;
  timestamp: string;
};

type Conversation = {
  id: string;
  name: string;
  avatar?: string;
  status: "online" | "offline" | "recently";
  lastMessage: string;
  updatedAt: string;
  unreadCount?: number;
  messages: ChatMessage[];
};

interface UserChatPanelProps {
  open: boolean;
  onClose: () => void;
}

const conversations: Conversation[] = [
  {
    id: "1",
    name: "คุณภูมินทร์ ใจดี",
    avatar: "https://i.pravatar.cc/100?img=12",
    status: "online",
    lastMessage: "สนใจนัดดูบ้านวันเสาร์นี้ครับ",
    updatedAt: "2 นาทีที่แล้ว",
    unreadCount: 2,
    messages: [
      {
        id: "m1",
        sender: "them",
        content: "สวัสดีครับ บ้านแถวลาดพร้าวยังมีอยู่ไหมครับ",
        timestamp: "10:12",
      },
      {
        id: "m2",
        sender: "me",
        content: "ยังมีอยู่ครับ สนใจนัดดูวันไหนได้เลย",
        timestamp: "10:14",
      },
      {
        id: "m3",
        sender: "them",
        content: "สนใจนัดดูบ้านวันเสาร์นี้ครับ",
        timestamp: "10:15",
      },
    ],
  },
  {
    id: "2",
    name: "ครอบครัวธนทรัพย์ Family",
    avatar: "https://i.pravatar.cc/100?img=32",
    status: "recently",
    lastMessage: "ขอบคุณสำหรับข้อมูลเพิ่มเติมนะคะ",
    updatedAt: "6 ชั่วโมงที่แล้ว",
    messages: [
      {
        id: "m1",
        sender: "them",
        content: "อยากทราบรายละเอียดค่าโอนค่ะ",
        timestamp: "08:20",
      },
      {
        id: "m2",
        sender: "me",
        content: "ผู้ขายรับผิดชอบให้ทั้งหมดเลยครับ",
        timestamp: "08:28",
      },
      {
        id: "m3",
        sender: "them",
        content: "ขอบคุณสำหรับข้อมูลเพิ่มเติมนะคะ",
        timestamp: "09:02",
      },
    ],
  },
  {
    id: "3",
    name: "คุณสุกัลยาณี",
    avatar: "https://i.pravatar.cc/100?img=48",
    status: "offline",
    lastMessage: "เดี๋ยวขอคุยกับครอบครัวก่อนนะคะ",
    updatedAt: "เมื่อวานนี้",
    messages: [
      {
        id: "m1",
        sender: "them",
        content: "ต้องการขอส่วนลดเพิ่มอีกนิดค่ะ",
        timestamp: "17:45",
      },
      {
        id: "m2",
        sender: "me",
        content: "ได้ครับ เดี๋ยวผมลองคุยกับเจ้าของให้อีกที",
        timestamp: "17:52",
      },
      {
        id: "m3",
        sender: "them",
        content: "เดี๋ยวขอคุยกับครอบครัวก่อนนะคะ",
        timestamp: "18:05",
      },
    ],
  },
];

const statusBadgeMap: Record<Conversation["status"], string> = {
  online: "bg-green-500",
  offline: "bg-gray-400",
  recently: "bg-amber-400",
};

export function UserChatPanel({ open, onClose }: UserChatPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!open) {
      setActiveConversationId(null);
      setSearchTerm("");
    }
  }, [open]);

  const filteredConversations = useMemo(() => {
    if (!searchTerm.trim()) {
      return conversations;
    }

    const keyword = searchTerm.trim().toLowerCase();
    return conversations.filter((conversation) =>
      [conversation.name, conversation.lastMessage]
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    );
  }, [searchTerm]);

  const activeConversation = useMemo(
    () =>
      conversations.find((conversation) => conversation.id === activeConversationId) ||
      null,
    [activeConversationId],
  );

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex justify-end bg-slate-900/20 backdrop-blur-sm transition-opacity duration-300",
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <div
        className={cn(
          "relative flex h-full w-full max-w-md flex-col overflow-hidden bg-white shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <header className="flex items-center justify-between border-b px-5 py-4">
          <div className="flex items-center space-x-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-semibold text-gray-900">ข้อความ</p>
              <p className="text-xs text-muted-foreground">
                พูดคุยกับลูกค้าหรือผู้ขายเกี่ยวกับการซื้อบ้าน
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </header>

        <div className="relative flex-1 overflow-hidden">
          <div
            className={cn(
              "absolute inset-0 flex transition-transform duration-300 ease-in-out",
              activeConversation ? "-translate-x-full" : "translate-x-0",
            )}
          >
            <section className="flex w-full flex-1 flex-col overflow-hidden">
              <div className="border-b px-5 py-4">
                <div className="flex items-center rounded-full border bg-gray-50 px-3">
                  <Search className="mr-2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="ค้นหาผู้ติดต่อ"
                    className="flex-1 bg-transparent py-2 text-sm outline-none"
                  />
                </div>
              </div>

              <div className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
                {filteredConversations.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center space-y-2 text-center text-sm text-muted-foreground">
                    <MessageCircle className="h-6 w-6" />
                    <p>ไม่พบการสนทนาที่ตรงกับคำค้นหา</p>
                  </div>
                ) : (
                  filteredConversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      onClick={() => setActiveConversationId(conversation.id)}
                      className={cn(
                        "flex w-full items-center space-x-3 rounded-2xl px-3 py-2 text-left transition-colors",
                        conversation.id === activeConversationId
                          ? "bg-blue-50"
                          : "hover:bg-gray-100",
                      )}
                    >
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarImage
                            src={conversation.avatar}
                            alt={conversation.name}
                          />
                          <AvatarFallback>
                            {conversation.name
                              .split(" ")
                              .map((segment) => segment[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span
                          className={cn(
                            "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white",
                            statusBadgeMap[conversation.status],
                          )}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between">
                          <p className="truncate text-sm font-semibold text-gray-900">
                            {conversation.name}
                          </p>
                          <span className="whitespace-nowrap text-xs text-muted-foreground">
                            {conversation.updatedAt}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {conversation.lastMessage}
                        </p>
                      </div>
                      {conversation.unreadCount ? (
                        <Badge className="rounded-full px-2 py-0 text-xs">
                          {conversation.unreadCount}
                        </Badge>
                      ) : null}
                    </button>
                  ))
                )}
              </div>
            </section>

            <section className="flex w-full flex-1 flex-col">
              {activeConversation ? (
                <>
                  <div className="flex items-center justify-between border-b px-4 py-3">
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={() => setActiveConversationId(null)}
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </Button>
                      <Avatar className="hidden h-11 w-11 md:inline-flex">
                        <AvatarImage
                          src={activeConversation.avatar}
                          alt={activeConversation.name}
                        />
                        <AvatarFallback>
                          {activeConversation.name
                            .split(" ")
                            .map((segment) => segment[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {activeConversation.name}
                        </p>
                        <div className="flex items-center space-x-1 text-xs text-emerald-600">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>สนใจจริง</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Phone className="h-4 w-4" />
                      โทรคุย
                    </Button>
                  </div>

                  <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-4">
                    {activeConversation.messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex",
                          message.sender === "me"
                            ? "justify-end"
                            : "justify-start",
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                            message.sender === "me"
                              ? "bg-blue-600 text-white"
                              : "bg-white text-gray-900",
                          )}
                        >
                          <p>{message.content}</p>
                          <span
                            className={cn(
                              "mt-1 block text-[11px]",
                              message.sender === "me"
                                ? "text-blue-100"
                                : "text-gray-400",
                            )}
                          >
                            {message.timestamp}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t bg-white px-4 py-3">
                    <div className="flex items-center space-x-2 rounded-full border bg-gray-50 px-3 py-1.5">
                      <input
                        type="text"
                        placeholder="พิมพ์ข้อความเพื่อคุยเรื่องซื้อบ้าน..."
                        className="flex-1 bg-transparent text-sm outline-none"
                      />
                      <Button size="sm" className="rounded-full">
                        ส่ง
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center space-y-3 px-6 text-center">
                  <Avatar className="h-20 w-20 border-4 border-blue-100">
                    <AvatarImage src="https://i.pravatar.cc/100?img=65" alt="DreamHome Assistant" />
                    <AvatarFallback>DH</AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-gray-900">
                      เริ่มพูดคุยกับลูกค้าของคุณ
                    </p>
                    <p className="text-sm text-muted-foreground">
                      เลือกชื่อจากรายการทางซ้ายเพื่อดูรายละเอียดการสนทนาเกี่ยวกับการซื้อบ้าน
                    </p>
                  </div>
                  <Button onClick={onClose} variant="outline">
                    ปิดหน้าต่างข้อความ
                  </Button>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
