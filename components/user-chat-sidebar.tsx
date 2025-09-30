"use client"

import { useMemo, useState } from "react"
import {
  ChevronLeft,
  MessageCircle,
  MoreHorizontal,
  Search,
  Send,
  X,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface UserChatSidebarProps {
  isOpen: boolean
  onClose: () => void
}

interface Message {
  id: string
  sender: "me" | "them"
  text: string
  time: string
}

interface Conversation {
  id: string
  name: string
  avatar?: string
  lastMessage: string
  timestamp: string
  status: string
  unreadCount?: number
  messages: Message[]
}

// TODO: เชื่อมต่อข้อมูลการสนทนาจริงจาก Firebase แทนข้อมูลตัวอย่างนี้
const initialConversations: Conversation[] = [
  {
    id: "1",
    name: "ธเนศ family",
    lastMessage: "พร้อมนัดชมบ้านพรุ่งนี้ค่ะ",
    timestamp: "8 ชม.",
    status: "กำลังใช้งาน",
    unreadCount: 2,
    messages: [
      {
        id: "1",
        sender: "them",
        text: "สวัสดีค่ะ สนใจบ้านในโครงการ Lakeview ใช่ไหมคะ?",
        time: "09:24",
      },
      {
        id: "2",
        sender: "me",
        text: "ใช่ครับ อยากนัดชมบ้านวันเสาร์ได้ไหม",
        time: "09:30",
      },
      {
        id: "3",
        sender: "them",
        text: "ได้เลยค่ะ พร้อมนัดชมบ้านพรุ่งนี้ค่ะ",
        time: "10:15",
      },
    ],
  },
  {
    id: "2",
    name: "กุลธิดา สุขใจ",
    lastMessage: "ขอบคุณมากค่ะ",
    timestamp: "10 ชม.",
    status: "ออนไลน์เมื่อ 1 ชม. ที่แล้ว",
    messages: [
      {
        id: "1",
        sender: "them",
        text: "มีบ้านที่ยื่นกู้ธนาคารให้ด้วยไหมคะ",
        time: "16:04",
      },
      {
        id: "2",
        sender: "me",
        text: "มีค่ะ เดี๋ยวผมรวบรวมข้อมูลและส่งให้ภายในวันนี้",
        time: "16:18",
      },
      {
        id: "3",
        sender: "them",
        text: "ขอบคุณมากค่ะ",
        time: "16:20",
      },
    ],
  },
  {
    id: "3",
    name: "Preecha Saw",
    lastMessage: "ขอโลเคชันอีกครั้งครับ",
    timestamp: "12 ชม.",
    status: "กำลังใช้งาน",
    unreadCount: 1,
    messages: [
      {
        id: "1",
        sender: "them",
        text: "บ้านหลังนี้อยู่ตรงไหนของเชียงใหม่ครับ",
        time: "19:41",
      },
      {
        id: "2",
        sender: "me",
        text: "อยู่ใกล้กับ Central Festival เชียงใหม่ครับ",
        time: "19:44",
      },
      {
        id: "3",
        sender: "them",
        text: "ขอโลเคชันอีกครั้งครับ",
        time: "19:45",
      },
    ],
  },
]

export function UserChatSidebar({ isOpen, onClose }: UserChatSidebarProps) {
  const [conversations, setConversations] = useState(initialConversations)
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [messageInput, setMessageInput] = useState("")
  const [search, setSearch] = useState("")

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId],
  )

  const filteredConversations = useMemo(() => {
    if (!search.trim()) {
      return conversations
    }

    return conversations.filter((conversation) =>
      conversation.name.toLowerCase().includes(search.trim().toLowerCase()),
    )
  }, [conversations, search])

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId)
    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              unreadCount: 0,
            }
          : conversation,
      ),
    )
  }

  const handleBackToList = () => {
    setSelectedConversationId(null)
    setMessageInput("")
  }

  const handleSendMessage = () => {
    if (!selectedConversation || !messageInput.trim()) {
      return
    }

    const newMessage: Message = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}`,
      sender: "me",
      text: messageInput.trim(),
      time: new Date().toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    }

    setConversations((prev) =>
      prev.map((conversation) => {
        if (conversation.id !== selectedConversation.id) {
          return conversation
        }

        return {
          ...conversation,
          lastMessage: newMessage.text,
          timestamp: "ตอนนี้",
          messages: [...conversation.messages, newMessage],
        }
      }),
    )

    setMessageInput("")
  }

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-gray-900/40 transition-opacity duration-300",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-white shadow-2xl border-l border-gray-100 transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b px-4 py-4">
            <div className="flex items-center space-x-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">ข้อความ</p>
                <p className="text-xs text-gray-500">สนทนากับผู้ซื้อบ้านได้สะดวกยิ่งขึ้น</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
              <span className="sr-only">ปิดกล่องข้อความ</span>
            </Button>
          </div>

          <div className="relative flex-1 overflow-hidden">
            {/* Conversation list */}
            <div
              className={cn(
                "absolute inset-0 flex flex-col transition-transform duration-300 ease-in-out",
                selectedConversation ? "-translate-x-full opacity-0" : "translate-x-0 opacity-100",
              )}
            >
              <div className="px-4 py-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="ค้นหาแชท"
                    className="w-full rounded-full border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-2 pb-6">
                <div className="space-y-2">
                  {filteredConversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() => handleSelectConversation(conversation.id)}
                      className={cn(
                        "flex w-full items-center space-x-3 rounded-xl border border-transparent px-3 py-3 text-left transition-all hover:border-blue-100 hover:bg-blue-50/60",
                        conversation.unreadCount ? "bg-blue-50" : "bg-white",
                      )}
                    >
                      <Avatar className="h-11 w-11">
                        <AvatarImage src={conversation.avatar ?? ""} alt={conversation.name} />
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {conversation.name.substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between">
                          <p className="truncate text-sm font-semibold text-gray-900">{conversation.name}</p>
                          <span className="text-xs text-gray-400">{conversation.timestamp}</span>
                        </div>
                        <p className="mt-1 truncate text-xs text-gray-600">{conversation.lastMessage}</p>
                        <p className="mt-1 text-[11px] text-blue-500">{conversation.status}</p>
                      </div>
                      {conversation.unreadCount ? (
                        <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-600 px-2 text-[11px] font-semibold text-white">
                          {conversation.unreadCount}
                        </span>
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Conversation detail */}
            <div
              className={cn(
                "absolute inset-0 flex flex-col bg-white transition-transform duration-300 ease-in-out",
                selectedConversation ? "translate-x-0" : "translate-x-full",
              )}
            >
              {selectedConversation ? (
                <>
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={handleBackToList}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="sr-only">ย้อนกลับ</span>
                    </Button>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedConversation.avatar ?? ""} alt={selectedConversation.name} />
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {selectedConversation.name.substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-gray-900">{selectedConversation.name}</p>
                      <p className="text-xs text-blue-500">{selectedConversation.status}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">ตัวเลือกเพิ่มเติม</span>
                  </Button>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto px-4 py-6">
                  {selectedConversation.messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex w-full",
                        message.sender === "me" ? "justify-end" : "justify-start",
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                          message.sender === "me"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-900",
                        )}
                      >
                        <p className="font-medium leading-relaxed">{message.text}</p>
                        <span
                          className={cn(
                            "mt-1 block text-[11px]",
                            message.sender === "me" ? "text-blue-100" : "text-gray-500",
                          )}
                        >
                          {message.time}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t px-4 py-3">
                  <div className="flex items-center space-x-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-2">
                    <input
                      value={messageInput}
                      onChange={(event) => setMessageInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault()
                          handleSendMessage()
                        }
                      }}
                      placeholder="พิมพ์ข้อความ..."
                      className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none"
                    />
                    <Button size="icon" className="h-9 w-9 rounded-full bg-blue-600 hover:bg-blue-700" onClick={handleSendMessage}>
                      <Send className="h-4 w-4" />
                      <span className="sr-only">ส่งข้อความ</span>
                    </Button>
                  </div>
                </div>
              </>
              ) : (
                <div className="flex h-full flex-col items-center justify-center space-y-4 px-6 text-center text-gray-500">
                  <MessageCircle className="h-12 w-12 text-blue-200" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">เลือกแชทเพื่อเริ่มการสนทนา</p>
                    <p className="mt-1 text-xs text-gray-500">
                      เลือกผู้ติดต่อจากรายการด้านซ้ายเพื่อดูข้อความและตอบกลับอย่างรวดเร็ว
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default UserChatSidebar
