"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Inter } from "next/font/google"
import { Calendar, Clock3, Loader2, PenSquare, Search, Tag } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAuthContext } from "@/contexts/AuthContext"
import { useUserProfile } from "@/hooks/use-user-profile"
import { subscribeToUserBlogs } from "@/lib/blogs"
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

interface AuthorBlogPageProps {
  params: { authorId: string }
}

export default function AuthorBlogPage({ params }: AuthorBlogPageProps) {
  const authorId = params.authorId
  const { user } = useAuthContext()
  const isViewingOwnProfile = Boolean(user?.uid && user.uid === authorId)
  const { profile, loading: profileLoading, error: profileError } =
    useUserProfile(authorId)

  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (!authorId) {
      setError("ไม่พบผู้เขียนที่ต้องการ")
      setLoading(false)
      return
    }

    let unsubscribe: (() => void) | undefined
    let cancelled = false

    const init = async () => {
      try {
        unsubscribe = await subscribeToUserBlogs(authorId, (items) => {
          if (cancelled) return
          setPosts(items)
          setLoading(false)
        })
      } catch (err) {
        console.error("Failed to load author blogs", err)
        if (!cancelled) {
          setError("ไม่สามารถโหลดบทความของผู้เขียนได้ กรุณาลองใหม่อีกครั้ง")
          setLoading(false)
        }
      }
    }

    init()

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [authorId])

  const visiblePosts = useMemo(() => {
    if (isViewingOwnProfile) return posts
    return posts.filter((post) => post.published)
  }, [isViewingOwnProfile, posts])

  const filteredPosts = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase()
    if (!normalizedQuery) return visiblePosts

    return visiblePosts.filter((post) =>
      [post.title, post.excerpt, post.content, post.tags.join(" ")]
        .map((value) => value.toLowerCase())
        .some((value) => value.includes(normalizedQuery)),
    )
  }, [searchTerm, visiblePosts])

  const totalReadTime = useMemo(
    () => visiblePosts.reduce((acc, post) => acc + (post.readTimeMinutes || 0), 0),
    [visiblePosts],
  )

  const uniqueCategories = useMemo(() => {
    return new Set(visiblePosts.map((post) => post.category)).size
  }, [visiblePosts])

  return (
    <div className={`${inter.className} bg-slate-50 min-h-screen py-12`}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              บทความจาก {profile?.name ?? "ผู้เขียน"}
            </h1>
            <p className="text-slate-500 mt-1">
              ค้นพบประสบการณ์และเรื่องราวจากชุมชน DreamHome
            </p>
          </div>
          <Button asChild variant="ghost" className="gap-2">
            <Link href="/blog">
              กลับสู่บล็อก
            </Link>
          </Button>
        </div>

        {profileLoading ? (
          <Card className="mb-8">
            <CardContent className="py-6 text-center text-slate-500">
              กำลังโหลดข้อมูลผู้เขียน...
            </CardContent>
          </Card>
        ) : profileError ? (
          <Card className="mb-8 border border-red-200 bg-red-50">
            <CardContent className="py-6 text-center text-red-600">
              {profileError}
            </CardContent>
          </Card>
        ) : profile ? (
          <Card className="mb-8">
            <CardContent className="py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-2xl font-semibold text-slate-900">{profile.name}</p>
                {profile.email && (
                  <p className="text-sm text-slate-500">อีเมล: {profile.email}</p>
                )}
                {profile.phoneNumber && (
                  <p className="text-sm text-slate-500">เบอร์โทร: {profile.phoneNumber}</p>
                )}
              </div>
              {profile.status && (
                <div className="text-sm text-slate-500">
                  สถานะล่าสุด: {profile.status.state === "online" ? "ออนไลน์" : "ออฟไลน์"}
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p>กำลังโหลดบทความ...</p>
          </div>
        ) : error ? (
          <Card className="border border-red-200 bg-red-50">
            <CardContent className="py-8 text-center">
              <p className="text-red-600 font-medium mb-2">{error}</p>
              <Button asChild variant="destructive">
                <Link href="/blog">กลับไปหน้ารวมบทความ</Link>
              </Button>
            </CardContent>
          </Card>
        ) : visiblePosts.length === 0 ? (
          <Card className="border-dashed border-2 border-slate-200">
            <CardContent className="py-12 text-center space-y-4">
              <PenSquare className="h-10 w-10 mx-auto text-slate-400" />
              <h2 className="text-2xl font-semibold text-slate-700">
                {isViewingOwnProfile
                  ? "ยังไม่มีบทความของคุณ"
                  : "ยังไม่มีบทความเผยแพร่จากผู้เขียนนี้"}
              </h2>
              <p className="text-slate-500">
                {isViewingOwnProfile
                  ? "เริ่มแบ่งปันประสบการณ์ของคุณกับชุมชน DreamHome"
                  : "ติดตามเพื่อรับบทความใหม่ ๆ จากผู้เขียนรายนี้"}
              </p>
              {isViewingOwnProfile && (
                <Button asChild className="bg-teal-600 hover:bg-teal-700">
                  <Link href="/blog/create">เขียนบทความเลย</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardContent className="py-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-slate-500">จำนวนบทความ</p>
                  <p className="text-2xl font-semibold text-slate-900">{visiblePosts.length}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">เวลารวมในการอ่าน</p>
                  <p className="text-2xl font-semibold text-slate-900">{totalReadTime} นาที</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">หมวดหมู่ที่เผยแพร่</p>
                  <p className="text-2xl font-semibold text-slate-900">{uniqueCategories}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 shadow-sm">
              <CardContent className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="ค้นหาบทความของผู้เขียนนี้..."
                    className="pl-9"
                    aria-label="ค้นหาบทความของผู้เขียนนี้"
                  />
                </div>
                <div className="text-sm text-slate-500">
                  {filteredPosts.length === visiblePosts.length && searchTerm.trim().length === 0
                    ? `พบทั้งหมด ${visiblePosts.length} บทความ`
                    : `พบ ${filteredPosts.length} บทความที่ตรงกับการค้นหา`}
                </div>
              </CardContent>
            </Card>

            {filteredPosts.length === 0 ? (
              <Card className="border-dashed border-2 border-slate-200">
                <CardContent className="py-12 text-center space-y-3">
                  <PenSquare className="h-10 w-10 mx-auto text-slate-400" />
                  <h2 className="text-xl font-semibold text-slate-700">ไม่พบบทความที่ตรงกับการค้นหา</h2>
                  <p className="text-slate-500">ลองเปลี่ยนคำค้นหา หรือเคลียร์คำค้นเพื่อดูบทความทั้งหมด</p>
                  <Button
                    variant="outline"
                    onClick={() => setSearchTerm("")}
                    className="mx-auto w-fit"
                  >
                    ล้างการค้นหา
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {filteredPosts.map((post) => (
                  <Card key={post.id} className="border border-slate-200 shadow-sm">
                    <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2">
                      <div>
                        <CardTitle className="text-xl text-slate-900 break-words">{post.title}</CardTitle>
                        <p className="text-sm text-slate-500 mt-1">
                          เผยแพร่เมื่อ {formatDate(post.createdAt)}
                      </p>
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
                        {isViewingOwnProfile && (
                          <Button asChild variant="ghost" size="sm">
                            <Link href="/blog/create" className="flex items-center gap-2">
                              <PenSquare className="h-3 w-3" />
                              สร้างบทความใหม่
                            </Link>
                          </Button>
                        )}
                      </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
