export type BlogCategory =
  | "เคล็ดลับการซื้อ"
  | "เคล็ดลับการขาย"
  | "วิเคราะห์ตลาด"
  | "การลงทุน"
  | "การเงิน"
  | "ย่านที่อยู่อาศัย"
  | "ข่าวสาร"
  | "ไลฟ์สไตล์"
  | "แนวโน้มอสังหา"
  | "อื่นๆ"

export interface BlogPost {
  id: string
  title: string
  excerpt: string
  content: string
  category: BlogCategory
  tags: string[]
  coverImageUrl: string | null
  coverImagePath: string | null
  readTimeMinutes: number
  authorId: string
  authorName: string
  authorEmail: string | null
  createdAt: string | null
  updatedAt: string | null
  published: boolean
}

export interface CreateBlogPostInput {
  title: string
  excerpt: string
  content: string
  category: BlogCategory
  tags: string[]
  coverImageUrl: string | null
  coverImagePath: string | null
  readTimeMinutes: number
  published?: boolean
}
