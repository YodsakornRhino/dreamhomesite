"use client"

import { MessageCircle } from "lucide-react"

import {
  CHAT_WIDGET_OFFSET_CLASS,
  useChatPanel,
} from "@/contexts/chat-panel-context"
import { cn } from "@/lib/utils"

export default function ChatWidget() {
  const { isOpen, openWith, close } = useChatPanel()

  const handleClick = () => {
    if (isOpen) {
      close()
      return
    }

    openWith({
      name: "DreamHome Assistant",
      avatarUrl: "",
    })
  }

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-40 transition-[right] duration-300 ease-in-out",
        isOpen ? CHAT_WIDGET_OFFSET_CLASS : undefined,
      )}
    >
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "rounded-full bg-blue-600 p-4 text-white shadow-lg transition-all duration-300 hover:bg-blue-700",
          !isOpen && "animate-bounce",
        )}
        aria-label={isOpen ? "ปิดหน้าต่างแชท" : "เปิดหน้าต่างแชท"}
      >
        <MessageCircle size={24} />
      </button>
    </div>
  )
}
