export interface ChatMessage {
  id: string
  author: "buyer" | "seller"
  text: string
  time: string
  isHighlighted?: boolean
}

export interface ConversationSummary {
  id: string
  name: string
  avatarUrl: string
  preview: string
  lastActive: string
  unreadCount?: number
  isOnline?: boolean
  propertySummary?: string
  badge?: string
}

export interface Conversation extends ConversationSummary {
  messages: ChatMessage[]
  buyerName: string
  location?: string
  askingPrice?: string
  propertyId?: string
}

const mockConversations: Conversation[] = [
  {
    id: "siriporn-n-park-villa",
    name: "ศิริพร ส.",
    buyerName: "วิน เดอะ ซิตี้",
    avatarUrl:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=facearea&facepad=2&w=120&h=120&q=80",
    preview: "สวัสดีค่ะ สนใจนัดดูบ้านวันเสาร์นี้นะคะ",
    lastActive: "8 ชม.",
    unreadCount: 2,
    isOnline: true,
    propertySummary: "บ้านเดี่ยว เดอะ ซิตี้ บางนา",
    badge: "ใหม่",
    askingPrice: "฿5.2M",
    location: "บางนา, กรุงเทพฯ",
    propertyId: "dh-001",
    messages: [
      {
        id: "1",
        author: "seller",
        text: "สวัสดีค่ะ บ้านหลังนี้ยังว่างอยู่ สนใจนัดดูไหมคะ",
        time: "09:12",
      },
      {
        id: "2",
        author: "buyer",
        text: "สวัสดีครับ อยากนัดดูวันเสาร์นี้ช่วงบ่ายได้ไหมครับ",
        time: "09:15",
      },
      {
        id: "3",
        author: "seller",
        text: "ได้ค่ะ บ่ายสองโมงสะดวกไหมคะ",
        time: "09:17",
      },
      {
        id: "4",
        author: "buyer",
        text: "สะดวกครับ แล้วเจอกันนะครับ",
        time: "09:18",
      },
    ],
  },
  {
    id: "sukanya-condo",
    name: "สุกัญญา จ.",
    buyerName: "ณัฐ บ้านและคอนโด",
    avatarUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=120&h=120&q=80",
    preview: "คอนโดใกล้ BTS ยังว่างนะคะ มีโปรผ่อนดาวน์ 0%",
    lastActive: "3 ชม.",
    unreadCount: 1,
    isOnline: false,
    propertySummary: "คอนโดใจกลางเมือง",
    askingPrice: "฿3.8M",
    location: "อโศก, กรุงเทพฯ",
    propertyId: "dh-124",
    messages: [
      {
        id: "1",
        author: "buyer",
        text: "อยากทราบว่าห้องนี้เลี้ยงสัตว์ได้ไหมครับ",
        time: "11:02",
      },
      {
        id: "2",
        author: "seller",
        text: "เลี้ยงได้ค่ะ ถ้าเป็นสัตว์ขนาดเล็กไม่เกิน 10 กิโล",
        time: "11:05",
      },
      {
        id: "3",
        author: "buyer",
        text: "ขอบคุณครับ แล้วค่าส่วนกลางเท่าไรครับ",
        time: "11:06",
      },
    ],
  },
  {
    id: "onnapha-townhome",
    name: "Onnapha",
    buyerName: "100Kanajo",
    avatarUrl:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=facearea&facepad=2&w=120&h=120&q=80",
    preview: "มีโปรโมชั่นโอนภายในเดือนนี้ลดอีก 50,000 บาท",
    lastActive: "14 ชม.",
    propertySummary: "ทาวน์โฮม 3 ชั้น",
    askingPrice: "฿4.5M",
    location: "วัชรพล, กรุงเทพฯ",
    messages: [
      {
        id: "1",
        author: "seller",
        text: "มีโครงการ cashback 50,000 บาทถึงสิ้นเดือนนะคะ",
        time: "16:40",
      },
      {
        id: "2",
        author: "buyer",
        text: "ขอบคุณค่ะ ขอรูปห้องนอนเพิ่มอีกได้ไหมคะ",
        time: "16:43",
      },
    ],
  },
  {
    id: "family-rent-house",
    name: "ธเนศกร family",
    buyerName: "บ้านใกล้ BTS",
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&facepad=2&w=120&h=120&q=80",
    preview: "พรุ่งนี้ 10 โมงสะดวกให้เข้าไปดูบ้านไหมครับ",
    lastActive: "1 ชม.",
    unreadCount: 4,
    isOnline: true,
    propertySummary: "บ้านเดี่ยวให้เช่า",
    messages: [
      {
        id: "1",
        author: "buyer",
        text: "มีที่จอดรถได้กี่คันครับ",
        time: "08:20",
      },
      {
        id: "2",
        author: "seller",
        text: "จอดได้สองคันครับ หน้าบ้านหนึ่ง ในบ้านหนึ่ง",
        time: "08:24",
      },
      {
        id: "3",
        author: "buyer",
        text: "โอเคครับ ขอเข้าไปดูบ้านพรุ่งนี้ช่วงสายๆ",
        time: "08:25",
      },
    ],
  },
  {
    id: "suwimon-apartment",
    name: "สุวิมล ท.",
    buyerName: "All Gen",
    avatarUrl:
      "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=facearea&facepad=2&w=120&h=120&q=80",
    preview: "ยังสนใจห้องสตูดิโออยู่ไหมคะ เหลืออยู่ 2 ห้อง",
    lastActive: "เมื่อคืน",
    propertySummary: "อพาร์ตเมนต์หรู",
    messages: [
      {
        id: "1",
        author: "seller",
        text: "ยังสนใจห้องสตูดิโออยู่ไหมคะ เหลืออยู่ 2 ห้อง",
        time: "22:18",
      },
    ],
  },
  {
    id: "luxury-pool-villa",
    name: "วิวรรธนะ ก.",
    buyerName: "Luxury Finder",
    avatarUrl:
      "https://images.unsplash.com/photo-1521579971123-1192931a1452?auto=format&fit=facearea&facepad=2&w=120&h=120&q=80",
    preview: "ขอบคุณที่สนใจพูลวิลล่าสุดหรูนะครับ",
    lastActive: "2 วัน",
    propertySummary: "พูลวิลล่าพร้อมสระส่วนตัว",
    messages: [
      {
        id: "1",
        author: "buyer",
        text: "พูลวิลล่าหลังนี้มีบริการแม่บ้านไหมครับ",
        time: "15:22",
      },
      {
        id: "2",
        author: "seller",
        text: "มีครับ สัปดาห์ละ 2 ครั้ง",
        time: "15:30",
      },
    ],
  },
]

export function getConversationSummaries(): ConversationSummary[] {
  return mockConversations.map(({
    id,
    name,
    avatarUrl,
    preview,
    lastActive,
    unreadCount,
    isOnline,
    propertySummary,
    badge,
  }) => ({
    id,
    name,
    avatarUrl,
    preview,
    lastActive,
    unreadCount,
    isOnline,
    propertySummary,
    badge,
  }))
}

export function findConversationById(id: string): Conversation | undefined {
  return mockConversations.find((conversation) => conversation.id === id)
}

export function createPlaceholderConversation({
  id,
  name,
  avatarUrl,
}: {
  id: string
  name: string
  avatarUrl?: string
}): Conversation {
  return {
    id,
    name,
    avatarUrl:
      avatarUrl ||
      "https://images.unsplash.com/photo-1520880867055-1e30d1cb001c?auto=format&fit=facearea&facepad=2&w=120&h=120&q=80",
    preview: "เริ่มต้นสนทนาเพื่อสอบถามรายละเอียดบ้าน",
    lastActive: "ตอนนี้",
    buyerName: "คุณ",
    messages: [
      {
        id: "intro",
        author: "seller",
        text: "สวัสดีค่ะ สนใจรายละเอียดเพิ่มเติมเกี่ยวกับบ้านหลังนี้ไหมคะ",
        time: new Date().toLocaleTimeString("th-TH", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ],
  }
}

export type { Conversation as MockConversation }
