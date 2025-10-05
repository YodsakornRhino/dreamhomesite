"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Inter } from "next/font/google"
import { Calendar, Clock3, Loader2, PenSquare, PlusCircle, Tag } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { subscribeToUserBlogs } from "@/lib/blogs"
import type { BlogPost } from "@/types/blog"
import { useAuthContext } from "@/contexts/AuthContext"

const inter = Inter({ subsets: ["latin"] })

const formatDate = (isoDate: string | null): string => {
  if (!isoDate) return "กำลังเผยแพร่"
  try {
    const date = new Date(isoDate)
    if (Number.isNaN(date.getTime())) {
      return "กำลังเผยแพร่"
    }
    return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" }).format(date)
  } catch (error) {
    console.error("Failed to format blog date", error)
    return "กำลังเผยแพร่"
  }
}

export default function MyBlogsPage() {
  const { user } = useAuthContext()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    let unsubscribe: (() => void) | undefined
    let cancelled = false

    const init = async () => {
      try {
        unsubscribe = await subscribeToUserBlogs(user.uid, (items) => {
          if (cancelled) return
          setPosts(items)
          setLoading(false)
        })
      } catch (err) {
        console.error("Failed to load user blogs", err)
        if (!cancelled) {
          setError("ไม่สามารถโหลดบล็อกของคุณได้ กรุณาลองใหม่อีกครั้ง")
          setLoading(false)
        }
      }
    }

    init()

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [user])

  const totalReadTime = useMemo(
    () => posts.reduce((acc, post) => acc + (post.readTimeMinutes || 0), 0),
    [posts],
  )

  return (
    <div className={`${inter.className} bg-slate-50 min-h-screen py-12`}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">บล็อกของฉัน</h1>
            <p className="text-slate-500 mt-1">
              จัดการบทความที่คุณเผยแพร่บน DreamHome และติดตามสถิติอย่างรวดเร็ว
            </p>
          </div>
          <Button asChild className="bg-teal-600 hover:bg-teal-700 gap-2">
            <Link href="/blog/create">
              <PlusCircle className="h-4 w-4" />
              เขียนบทความใหม่
            </Link>
          </Button>
        </div>

        {!user ? (
          <Card className="border-dashed border-2 border-slate-200">
            <CardContent className="py-12 text-center space-y-3">
              <h2 className="text-xl font-semibold text-slate-700">กรุณาเข้าสู่ระบบ</h2>
              <p className="text-slate-500">
                คุณต้องเข้าสู่ระบบก่อนจึงจะสามารถดูและจัดการบทความของคุณได้
              </p>
              <p className="text-sm text-slate-400">ไปที่ปุ่มโปรไฟล์ด้านขวาบนเพื่อเข้าสู่ระบบหรือสมัครใช้งาน</p>
            </CardContent>
          </Card>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p>กำลังโหลดบล็อกของคุณ...</p>
          </div>
        ) : error ? (
          <Card className="border border-red-200 bg-red-50">
            <CardContent className="py-8 text-center">
              <p className="text-red-600 font-medium mb-2">{error}</p>
              <p className="text-red-500">กรุณาลองรีเฟรชหน้าใหม่อีกครั้ง</p>
            </CardContent>
          </Card>
        ) : posts.length === 0 ? (
          <Card className="border-dashed border-2 border-slate-200">
            <CardContent className="py-12 text-center space-y-4">
              <PenSquare className="h-10 w-10 mx-auto text-slate-400" />
              <h2 className="text-2xl font-semibold text-slate-700">ยังไม่มีบทความของคุณ</h2>
              <p className="text-slate-500">
                เริ่มต้นเขียนบทความแรกเพื่อแบ่งปันประสบการณ์และความรู้กับผู้อื่น
              </p>
              <Button asChild className="bg-teal-600 hover:bg-teal-700">
                <Link href="/blog/create">เขียนบทความเลย</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardContent className="py-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-slate-500">จำนวนบทความ</p>
                  <p className="text-2xl font-semibold text-slate-900">{posts.length}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">เวลารวมในการอ่าน</p>
                  <p className="text-2xl font-semibold text-slate-900">{totalReadTime} นาที</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">หมวดหมู่ที่เผยแพร่</p>
                  <p className="text-2xl font-semibold text-slate-900">{new Set(posts.map((post) => post.category)).size}</p>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-6">
              {posts.map((post) => (
                <Card key={post.id} className="border border-slate-200 shadow-sm">
                  <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2">
                    <div>
                      <CardTitle className="text-xl text-slate-900 break-words">{post.title}</CardTitle>
                      <p className="text-sm text-slate-500 mt-1">เผยแพร่เมื่อ {formatDate(post.createdAt)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="bg-teal-100 text-teal-700">
                        {post.category}
                      </Badge>
                      <Badge variant="outline" className="text-slate-600">
                        <Clock3 className="h-3 w-3 mr-1" /> {post.readTimeMinutes} นาที
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-slate-600 line-clamp-3 break-words">
                      {post.excerpt || post.content.slice(0, 160)}
                    </p>
                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 text-sm text-slate-500">
                        <Tag className="h-4 w-4 text-teal-600" />
                        {post.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="bg-teal-50 text-teal-700">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
                      <div className="text-xs text-slate-400">
                        อัปเดตล่าสุด {formatDate(post.updatedAt ?? post.createdAt)}
                      </div>
                      <div className="flex gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/blog/${post.id}`} className="flex items-center gap-2">
                            อ่านบทความ
                            <Calendar className="h-3 w-3" />
                          </Link>
                        </Button>
                        <Button asChild variant="ghost" size="sm">
                          <Link href="/blog/create" className="flex items-center gap-2">
                            <PenSquare className="h-3 w-3" />
                            สร้างบทความใหม่
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
