"use client";

import { useMemo, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface UserChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participantName: string;
  participantAvatar?: string;
}

interface ChatMessage {
  id: number;
  sender: "buyer" | "seller";
  text: string;
  timestamp: string;
}

const initialMessages: ChatMessage[] = [
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

export function UserChatDialog({
  open,
  onOpenChange,
  participantName,
  participantAvatar,
}: UserChatDialogProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [message, setMessage] = useState("");

  const participantInitials = useMemo(() => {
    return participantName
      .split(" ")
      .map((segment) => segment.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [participantName]);

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="space-y-3">
          <DialogTitle>แชทกับ {participantName}</DialogTitle>
          <DialogDescription>
            พูดคุยรายละเอียดเกี่ยวกับการซื้อบ้านแบบตัวต่อตัวกับผู้ขายรายนี้
          </DialogDescription>
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={participantAvatar ?? ""} alt={participantName} />
              <AvatarFallback className="font-semibold">
                {participantInitials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {participantName}
              </p>
              <p className="text-xs text-muted-foreground">
                ตอบกลับโดยเฉลี่ยภายใน 30 นาที
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex h-72 flex-col gap-4 rounded-lg border bg-muted/30 p-4">
          <div className="flex-1 space-y-3 overflow-y-auto pr-1 text-sm">
            {messages.map((chat) => (
              <div
                key={chat.id}
                className={`flex ${
                  chat.sender === "buyer" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 shadow-sm ${
                    chat.sender === "buyer"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-foreground"
                  }`}
                >
                  <p className="leading-relaxed">{chat.text}</p>
                  <span
                    className={`mt-1 block text-[10px] font-medium uppercase tracking-wide ${
                      chat.sender === "buyer"
                        ? "text-blue-100"
                        : "text-muted-foreground"
                    }`}
                  >
                    {chat.timestamp}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-2 text-xs text-muted-foreground">
            <p className="font-medium">
              ข้อแนะนำ: ปรึกษารายละเอียดสัญญาและการโอนกับผู้เชี่ยวชาญก่อนตัดสินใจ
            </p>
          </div>
        </div>

        <DialogFooter className="sm:flex sm:flex-row sm:items-center sm:space-x-3">
          <div className="flex w-full items-center gap-2">
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
            <Button onClick={handleSendMessage} type="button">
              ส่งข้อความ
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
