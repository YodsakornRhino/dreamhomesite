"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import { Inter } from "next/font/google"
import { ArrowLeft, Calendar, Clock3, Loader2, Tag, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { subscribeToBlog } from "@/lib/blogs"
import type { BlogPost } from "@/types/blog"

const inter = Inter({ subsets: ["latin"] })

const formatDate = (isoDate: string | null): string => {
  if (!isoDate) return "กำลังเผยแพร่"
  try {
    const date = new Date(isoDate)
    if (Number.isNaN(date.getTime())) {
      return "กำลังเผยแพร่"
    }
    return new Intl.DateTimeFormat("th-TH", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date)
  } catch (error) {
    console.error("Failed to format blog date", error)
    return "กำลังเผยแพร่"
  }
}

export default function BlogDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const blogId = params?.id

  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!blogId || typeof blogId !== "string") {
      setError("ไม่พบบทความที่ต้องการ")
      setLoading(false)
      return
    }

    let unsubscribe: (() => void) | undefined
    let cancelled = false

    const init = async () => {
      try {
        unsubscribe = await subscribeToBlog(blogId, (blog) => {
          if (cancelled) return
          setPost(blog)
          setLoading(false)
          if (!blog) {
            setError("ไม่พบบทความที่ต้องการ")
          } else {
            setError(null)
          }
        })
      } catch (err) {
        console.error("Failed to load blog post", err)
        if (!cancelled) {
          setError("ไม่สามารถโหลดบทความได้ กรุณาลองใหม่อีกครั้ง")
          setLoading(false)
        }
      }
    }

    init()

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [blogId])

  return (
    <div className={`${inter.className} bg-slate-50 min-h-screen`}> 
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" size="sm" asChild className="gap-2">
            <Link href="/blog">
              <ArrowLeft className="h-4 w-4" />
              กลับสู่บล็อก
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.refresh()}>
            รีเฟรช
          </Button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p>กำลังโหลดบทความ...</p>
          </div>
        ) : error ? (
          <Card className="border-dashed border-2 border-red-200 bg-red-50">
            <CardContent className="py-12 text-center space-y-4">
              <h2 className="text-2xl font-semibold text-red-600">{error}</h2>
              <p className="text-red-500">บทความอาจถูกลบหรือไม่มีอยู่จริง</p>
              <Button asChild variant="destructive">
                <Link href="/blog">กลับไปหน้ารวมบทความ</Link>
              </Button>
            </CardContent>
          </Card>
        ) : post ? (
          <article className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {post.coverImageUrl && (
              <div className="relative h-80 w-full">
                <Image
                  src={post.coverImageUrl}
                  alt={post.title}
                  fill
                  className="object-cover"
                  sizes="100vw"
                  priority
                />
              </div>
            )}
            <div className="p-6 sm:p-10">
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-100" variant="secondary">
                  {post.category}
                </Badge>
                <div className="flex items-center text-sm text-slate-500">
                  <User className="h-4 w-4 mr-1" />
                  {post.authorName}
                </div>
                <div className="flex items-center text-sm text-slate-500">
                  <Calendar className="h-4 w-4 mr-1" />
                  {formatDate(post.createdAt)}
                </div>
                <div className="flex items-center text-sm text-slate-500">
                  <Clock3 className="h-4 w-4 mr-1" />
                  {post.readTimeMinutes} นาทีในการอ่าน
                </div>
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6 leading-tight">
                {post.title}
              </h1>

              {post.excerpt && (
                <p className="text-lg text-slate-600 italic border-l-4 border-teal-500 pl-4 mb-8">
                  {post.excerpt}
                </p>
              )}

              <div className="prose prose-lg max-w-none text-slate-700 leading-8">
                <p className="whitespace-pre-line">{post.content}</p>
              </div>

              {post.tags.length > 0 && (
                <div className="mt-10 flex flex-wrap items-center gap-2">
                  <Tag className="h-4 w-4 text-teal-600" />
                  {post.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="bg-teal-50 text-teal-700">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </article>
        ) : null}
      </div>
    </div>
  )
}
