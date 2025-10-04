import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore"

import type { BlogPost, BlogCategory } from "@/types/blog"

const toStringOrEmpty = (value: unknown): string => {
  if (typeof value === "string") return value
  if (typeof value === "number" && Number.isFinite(value)) return value.toString()
  return ""
}

const toStringOrNull = (value: unknown): string | null => {
  if (typeof value === "string") return value
  if (typeof value === "number" && Number.isFinite(value)) return value.toString()
  return null
}

const toCategory = (value: unknown): BlogCategory => {
  const category = typeof value === "string" ? value : "อื่นๆ"
  return (
    [
      "เคล็ดลับการซื้อ",
      "เคล็ดลับการขาย",
      "วิเคราะห์ตลาด",
      "การลงทุน",
      "การเงิน",
      "ย่านที่อยู่อาศัย",
      "ข่าวสาร",
      "ไลฟ์สไตล์",
      "แนวโน้มอสังหา",
      "อื่นๆ",
    ] as const
  ).includes(category as BlogCategory)
    ? (category as BlogCategory)
    : "อื่นๆ"
}

const toStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean)
  }
  return []
}

const toNumberOrZero = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }
  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

const toIsoStringOrNull = (value: unknown): string | null => {
  if (typeof value === "string") return value
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate?: () => Date }).toDate === "function"
  ) {
    const date = (value as { toDate: () => Date }).toDate()
    if (date instanceof Date && !Number.isNaN(date.getTime())) {
      return date.toISOString()
    }
  }
  return null
}

export const mapDocumentToBlogPost = (
  doc: QueryDocumentSnapshot<DocumentData>,
): BlogPost => {
  const data = doc.data()

  return {
    id: doc.id,
    title: toStringOrEmpty(data.title).trim(),
    excerpt: toStringOrEmpty(data.excerpt).trim(),
    content: toStringOrEmpty(data.content),
    category: toCategory(data.category),
    tags: toStringArray(data.tags),
    coverImageUrl: toStringOrNull(data.coverImageUrl),
    coverImagePath: toStringOrNull(data.coverImagePath),
    readTimeMinutes: Math.max(1, Math.round(toNumberOrZero(data.readTimeMinutes) || estimateReadTime(data.content))),
    authorId: toStringOrEmpty(data.authorId),
    authorName: toStringOrEmpty(data.authorName) || "ผู้เขียน",
    authorEmail: toStringOrNull(data.authorEmail),
    createdAt: toIsoStringOrNull(data.createdAt),
    updatedAt: toIsoStringOrNull(data.updatedAt),
    published: Boolean(data.published ?? true),
  }
}

const estimateReadTime = (content: unknown): number => {
  if (typeof content !== "string") {
    return 3
  }
  const words = content.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return 1
  return Math.max(1, Math.round(words.length / 200))
}
