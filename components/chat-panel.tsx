"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChatPanel } from "@/contexts/chat-panel-context";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: number;
  sender: "buyer" | "seller";
  text: string;
  timestamp: string;
}

const defaultMessages: ChatMessage[] = [
  {
    id: 1,
    sender: "seller",
    text: "สวัสดีค่ะ บ้านหลังนี้ยังว่างอยู่ สนใจรายละเอียดเพิ่มเติมไหมคะ?",
    timestamp: "09:15",
  },
  {
    id: 2,
    sender: "buyer",
    text: "สนใจค่ะ อยากทราบว่ามีส่วนลดพิเศษสำหรับการโอนภายในเดือนนี้ไหมครับ",
    timestamp: "09:17",
  },
  {
    id: 3,
    sender: "seller",
    text: "มีค่ะ หากโอนภายในเดือนนี้สามารถลดได้อีก 50,000 บาท พร้อมของแถมเครื่องปรับอากาศ",
    timestamp: "09:18",
  },
];

const DEFAULT_PARTICIPANT = {
  name: "DreamHome Assistant",
  avatarUrl: "",
};

export function ChatPanel(): JSX.Element {
  const { isOpen, close, participant } = useChatPanel();
  const activeParticipant = participant ?? DEFAULT_PARTICIPANT;
  const [messages, setMessages] = useState<ChatMessage[]>(defaultMessages);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setMessage("");
    }
  }, [isOpen]);

  useEffect(() => {
    setMessages(defaultMessages);
  }, [activeParticipant.name]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [close, isOpen]);

  const participantInitials = useMemo(() => {
    return activeParticipant.name
      .split(" ")
      .map((segment) => segment.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [activeParticipant.name]);

  const handleSendMessage = () => {
    if (!message.trim()) {
      return;
    }

    setMessages((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        sender: "buyer",
        text: message.trim(),
        timestamp: new Date().toLocaleTimeString("th-TH", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);

    setMessage("");
  };

  return (
    <>
      <div
        role="presentation"
        aria-hidden="true"
        onClick={close}
        className={cn(
          "fixed inset-0 z-30 bg-background/80 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="global-chat-panel-title"
        className={cn(
          "fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l bg-background shadow-xl transition-transform duration-300 ease-in-out lg:max-w-none lg:w-[28rem]",
          isOpen ? "translate-x-0" : "translate-x-full",
          isOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <header className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={activeParticipant.avatarUrl ?? ""} alt={activeParticipant.name} />
              <AvatarFallback className="font-semibold">
                {participantInitials}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p id="global-chat-panel-title" className="text-sm font-semibold text-foreground">
                แชทกับ {activeParticipant.name}
              </p>
              <p className="text-xs text-muted-foreground">
                พูดคุยรายละเอียดเกี่ยวกับการซื้อบ้านแบบตัวต่อตัวกับผู้เชี่ยวชาญ
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={close}
            aria-label="ปิดหน้าต่างแชท"
          >
            <X className="h-4 w-4" />
          </Button>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex-1 space-y-3 overflow-y-auto pr-1 text-sm">
            {messages.map((chat) => (
              <div
                key={chat.id}
                className={cn(
                  "flex",
                  chat.sender === "buyer" ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2 shadow-sm",
                    chat.sender === "buyer"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-foreground",
                  )}
                >
                  <p className="leading-relaxed">{chat.text}</p>
                  <span
                    className={cn(
                      "mt-1 block text-[10px] font-medium uppercase tracking-wide",
                      chat.sender === "buyer"
                        ? "text-blue-100"
                        : "text-muted-foreground",
                    )}
                  >
                    {chat.timestamp}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-2 rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
            <p className="font-medium">
              ข้อแนะนำ: ปรึกษารายละเอียดสัญญาและการโอนกับผู้เชี่ยวชาญก่อนตัดสินใจ
            </p>
          </div>
        </div>

        <footer className="border-t bg-muted/10 p-4">
          <div className="flex items-center gap-2">
            <Input
              value={message}
              placeholder="พิมพ์ข้อความถึงผู้ขาย..."
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button type="button" onClick={handleSendMessage}>
              ส่งข้อความ
            </Button>
          </div>
        </footer>
      </aside>
    </>
  );
}
