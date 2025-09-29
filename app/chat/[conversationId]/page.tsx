import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Home, Image, Info, Phone, Send, Video } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ConversationList } from "@/components/chat/conversation-list"
import {
  createPlaceholderConversation,
  findConversationById,
  type ChatMessage,
} from "@/lib/mock-chats"
import { cn } from "@/lib/utils"

type PageProps = {
  params: Promise<{ conversationId: string }>
  searchParams?: Promise<{ name?: string; avatar?: string }>
}

function decodeParam(value?: string) {
  if (!value) return undefined
  try {
    return decodeURIComponent(value)
  } catch (error) {
    console.error("Failed to decode query param", error)
    return value
  }
}

export default async function ConversationPage({ params, searchParams }: PageProps) {
  const { conversationId } = await params
  const resolvedSearchParams = (await searchParams) ?? {}

  const fallbackName = decodeParam(resolvedSearchParams.name)
  const fallbackAvatar = decodeParam(resolvedSearchParams.avatar)

  const conversation =
    findConversationById(conversationId) ||
    (fallbackName
      ? createPlaceholderConversation({
          id: conversationId,
          name: fallbackName,
          avatarUrl: fallbackAvatar,
        })
      : undefined)

  if (!conversation) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 lg:flex-row lg:py-16">
        <div className="w-full overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 shadow-2xl backdrop-blur lg:flex lg:max-w-sm">
          <ConversationList activeConversationId={conversation.id} className="hidden lg:flex" />
          <div className="flex flex-col gap-4 p-6 lg:hidden">
            <h1 className="text-xl font-semibold">แชท</h1>
            <p className="text-sm text-slate-400">
              เลือกรายชื่อจากหน้า <Link href="/chat" className="text-blue-300 underline underline-offset-4">กล่องข้อความ</Link> เพื่อดูบทสนทนาทั้งหมด
            </p>
          </div>
        </div>

        <section className="flex w-full flex-1 flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 shadow-2xl backdrop-blur">
          <header className="flex flex-col gap-4 border-b border-white/5 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/chat"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-slate-300 transition hover:border-blue-500/40 hover:text-white sm:hidden"
                aria-label="กลับไปยังรายชื่อแชท"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <Avatar className="h-14 w-14">
                <AvatarImage src={conversation.avatarUrl} alt={conversation.name} />
                <AvatarFallback className="bg-blue-500/20 text-lg text-blue-100">
                  {conversation.name
                    .split(" ")
                    .map((segment) => segment.charAt(0))
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-white">{conversation.name}</h2>
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-200">
                    {conversation.isOnline ? "ออนไลน์" : "ออฟไลน์"}
                  </span>
                </div>
                <p className="text-sm text-slate-400">ผู้ซื้อ: {conversation.buyerName}</p>
                {conversation.location && (
                  <p className="text-xs text-slate-500">ทำเล: {conversation.location}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 px-4 text-sm font-medium text-slate-200 transition hover:border-blue-500/40 hover:text-white"
              >
                <Phone className="h-4 w-4" />
                โทรหา
              </button>
              <button
                type="button"
                className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 px-4 text-sm font-medium text-slate-200 transition hover:border-blue-500/40 hover:text-white"
              >
                <Video className="h-4 w-4" />
                วิดีโอคอล
              </button>
              <button
                type="button"
                className="inline-flex h-10 items-center justify-center rounded-full border border-white/10 px-4 text-sm text-slate-200 transition hover:border-blue-500/40 hover:text-white"
                aria-label="ข้อมูลเพิ่มเติม"
              >
                <Info className="h-4 w-4" />
              </button>
            </div>
          </header>

          <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 py-8">
            {conversation.messages.map((message: ChatMessage) => (
              <div
                key={message.id}
                className={cn("flex w-full", message.author === "buyer" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-xl rounded-3xl px-5 py-3 text-sm shadow-xl",
                    message.author === "buyer"
                      ? "bg-blue-500/90 text-white"
                      : "bg-white/10 text-slate-100",
                  )}
                >
                  <p className="leading-relaxed">{message.text}</p>
                  <span className="mt-2 block text-right text-[11px] uppercase tracking-wide text-slate-300/80">
                    {message.time}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <footer className="border-t border-white/5 bg-slate-900/70 p-6">
            <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-950/60 p-4 shadow-inner shadow-slate-900/40 sm:flex-row sm:items-center">
              <button
                type="button"
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 text-sm text-slate-200 transition hover:border-blue-500/40 hover:text-white sm:w-auto sm:px-4"
              >
                <Image className="h-4 w-4" />
                แนบรูปทรัพย์สิน
              </button>
              <div className="flex flex-1 items-center gap-3 rounded-xl border border-white/10 bg-slate-900/80 px-4">
                <input
                  type="text"
                  placeholder={`พิมพ์ข้อความเพื่อคุยกับ ${conversation.name}`}
                  className="h-11 flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                />
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-600"
                  aria-label="ส่งข้อความ"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <div className="hidden min-w-[180px] flex-col gap-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-300 sm:flex">
                <div className="flex items-center gap-2 text-slate-200">
                  <Home className="h-4 w-4" />
                  รายละเอียดประกาศ
                </div>
                {conversation.propertySummary && (
                  <p className="text-slate-400">{conversation.propertySummary}</p>
                )}
                {conversation.askingPrice && (
                  <p className="font-semibold text-white">ราคาเสนอ {conversation.askingPrice}</p>
                )}
              </div>
            </div>
          </footer>
        </section>
      </div>
    </div>
  )
}
