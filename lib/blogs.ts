import type { BlogPost, CreateBlogPostInput, BlogCategory } from "@/types/blog"
import { addDocument, subscribeToCollection, subscribeToDocument } from "@/lib/firestore"
import { mapDocumentToBlogPost } from "./blog-mapper"

const BLOG_COLLECTION = "blogs"

export const BLOG_CATEGORIES: BlogCategory[] = [
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
]

export const subscribeToPublishedBlogs = async (
  callback: (posts: BlogPost[]) => void,
): Promise<() => void> => {
  const { where, orderBy } = await import("firebase/firestore")
  return subscribeToCollection(
    BLOG_COLLECTION,
    (docs) => {
      const posts = docs.map(mapDocumentToBlogPost).filter((post) => post.published)
      callback(posts)
    },
    where("published", "==", true),
    orderBy("createdAt", "desc"),
  )
}

export const subscribeToUserBlogs = async (
  userId: string,
  callback: (posts: BlogPost[]) => void,
): Promise<() => void> => {
  const { where, orderBy } = await import("firebase/firestore")
  return subscribeToCollection(
    BLOG_COLLECTION,
    (docs) => {
      const posts = docs.map(mapDocumentToBlogPost)
      callback(posts)
    },
    where("authorId", "==", userId),
    orderBy("createdAt", "desc"),
  )
}

export const subscribeToBlog = async (
  blogId: string,
  callback: (post: BlogPost | null) => void,
): Promise<() => void> => {
  return subscribeToDocument(BLOG_COLLECTION, blogId, (doc) => {
    if (!doc) {
      callback(null)
      return
    }
    callback(mapDocumentToBlogPost(doc))
  })
}

interface BlogAuthor {
  uid: string
  displayName: string | null
  email: string | null
}

export const createBlogPost = async (
  author: BlogAuthor,
  input: CreateBlogPostInput,
): Promise<string> => {
  const { serverTimestamp } = await import("firebase/firestore")

  const docRef = await addDocument(BLOG_COLLECTION, {
    title: input.title,
    excerpt: input.excerpt,
    content: input.content,
    category: input.category,
    tags: input.tags,
    coverImageUrl: input.coverImageUrl,
    coverImagePath: input.coverImagePath,
    readTimeMinutes: input.readTimeMinutes,
    published: input.published ?? true,
    authorId: author.uid,
    authorName: author.displayName?.trim() || author.email?.split("@")[0] || "ผู้เขียน",
    authorEmail: author.email ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return docRef.id
}
