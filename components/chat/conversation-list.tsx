import Link from "next/link"
import { MessageSquare, Plus, Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { getConversationSummaries } from "@/lib/mock-chats"

const filters = [
  { key: "all", label: "ทั้งหมด" },
  { key: "unread", label: "ยังไม่ได้อ่าน" },
  { key: "group", label: "กลุ่ม" },
]

interface ConversationListProps {
  activeConversationId?: string
  className?: string
}

export function ConversationList({
  activeConversationId,
  className,
}: ConversationListProps) {
  const conversations = getConversationSummaries()

  return (
    <section
      className={cn(
        "flex h-full flex-col gap-6 bg-slate-950/80 p-6 text-slate-100",
        "lg:min-h-[720px]",
        className,
      )}
    >
      <header className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">แชท</h1>
            <p className="text-sm text-slate-400">พูดคุยกับผู้ซื้อและผู้ขายแบบเรียลไทม์</p>
          </div>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/90 text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-500"
            aria-label="เริ่มแชทใหม่"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="search"
            placeholder="ค้นหาในแชท"
            className="h-11 w-full rounded-2xl border border-white/5 bg-white/5 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
            aria-label="ค้นหาในแชท"
          />
        </div>

        <div className="flex gap-2">
          {filters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              className={cn(
                "flex flex-1 items-center justify-center rounded-full border border-white/10 px-4 py-2 text-sm font-medium transition",
                filter.key === "all"
                  ? "bg-white/10 text-white"
                  : "bg-transparent text-slate-300 hover:bg-white/10 hover:text-white",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </header>

      <div className="space-y-2">
        {conversations.map((conversation) => {
          const isActive = conversation.id === activeConversationId

          return (
            <Link
              key={conversation.id}
              href={`/chat/${conversation.id}`}
              className={cn(
                "group flex items-center gap-3 rounded-2xl border border-transparent px-3 py-3 transition",
                isActive
                  ? "border-blue-500/60 bg-blue-500/15 text-white"
                  : "bg-white/5 hover:border-white/10 hover:bg-white/10",
              )}
            >
              <div className="relative">
                <span className="inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-slate-800">
                  <img
                    src={conversation.avatarUrl}
                    alt={conversation.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </span>
                {conversation.isOnline && (
                  <span className="absolute -bottom-1 -right-1 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-slate-950/90 bg-emerald-400" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2">
                  <p className="truncate text-sm font-medium text-white">
                    {conversation.name}
                  </p>
                  {conversation.badge && (
                    <span className="inline-flex shrink-0 items-center rounded-full bg-blue-500/20 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-blue-200">
                      {conversation.badge}
                    </span>
                  )}
                </div>
                <p className="truncate text-sm text-slate-400">
                  {conversation.preview}
                </p>
                {conversation.propertySummary && (
                  <p className="mt-1 truncate text-xs text-slate-500">
                    {conversation.propertySummary}
                  </p>
                )}
              </div>

              <div className="flex flex-col items-end gap-2 text-right text-xs text-slate-400">
                <span>{conversation.lastActive}</span>
                {conversation.unreadCount ? (
                  <span className="inline-flex min-w-[1.75rem] items-center justify-center rounded-full bg-blue-500/90 px-2 py-0.5 text-[11px] font-semibold text-white">
                    {conversation.unreadCount}
                  </span>
                ) : (
                  <MessageSquare className="h-4 w-4 text-slate-600 group-hover:text-slate-300" />
                )}
              </div>
            </Link>
          )
        })}
      </div>

      <footer className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-slate-300">
        <span>ดูทั้งหมดใน DreamHome Chat</span>
        <span className="text-xs text-slate-500">อัปเดตล่าสุด {new Date().toLocaleTimeString("th-TH", {
          hour: "2-digit",
          minute: "2-digit",
        })}</span>
      </footer>
    </section>
  )
}
