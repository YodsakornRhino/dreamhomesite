import type { Metadata } from "next"

import { ConversationList } from "@/components/chat/conversation-list"

export const metadata: Metadata = {
  title: "กล่องข้อความ | DreamHome",
  description: "จัดการการสนทนาระหว่างผู้ซื้อและผู้ขายบน DreamHome ในที่เดียว",
}

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10 lg:py-16">
        <div className="rounded-3xl border border-white/10 bg-slate-900/70 shadow-2xl backdrop-blur">
          <ConversationList />
        </div>
        <div className="rounded-3xl border border-dashed border-white/10 bg-slate-900/40 p-8 text-center">
          <h2 className="text-lg font-semibold text-white">เลือกการสนทนาที่ต้องการทางด้านบน</h2>
          <p className="mt-2 text-sm text-slate-400">
            เมื่อเลือกรายชื่อผู้ติดต่อ เราจะแสดงรายละเอียดบทสนทนาและข้อมูลอสังหาฯ ที่เกี่ยวข้องให้คุณทันที
          </p>
        </div>
      </div>
    </div>
  )
}
