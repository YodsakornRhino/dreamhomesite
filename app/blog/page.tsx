"use client"

import {
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react"
import Link from "next/link"
import Image from "next/image"
import { Inter } from "next/font/google"
import { Calendar, User, ArrowRight, Search, Loader2, Clock3 } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BLOG_CATEGORIES, subscribeToPublishedBlogs } from "@/lib/blogs"
import type { BlogPost } from "@/types/blog"
import { useAuthContext } from "@/contexts/AuthContext"

const inter = Inter({ subsets: ["latin"] })

const ALL_CATEGORY = "ทั้งหมด"

const formatDate = (isoDate: string | null): string => {
  if (!isoDate) {
    return "กำลังเผยแพร่"
  }
  try {
    const date = new Date(isoDate)
    if (Number.isNaN(date.getTime())) {
      return "กำลังเผยแพร่"
    }
    return new Intl.DateTimeFormat("th-TH", {
      dateStyle: "medium",
    }).format(date)
  } catch (error) {
    console.error("Failed to format date", error)
    return "กำลังเผยแพร่"
  }
}

const calculateFeaturedPosts = (posts: BlogPost[]): BlogPost[] => {
  return posts.slice(0, 2)
}

const calculateOtherPosts = (posts: BlogPost[]): BlogPost[] => {
  return posts.slice(2)
}

export default function BlogPage() {
  const { user } = useAuthContext()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL_CATEGORY)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const isInteractiveElement = (element: EventTarget | null): boolean => {
    if (!(element instanceof HTMLElement)) {
      return false
    }
    return Boolean(element.closest("a, button"))
  }

  const handleCardClick = (postId: string) => (event: MouseEvent<HTMLDivElement>) => {
    if (isInteractiveElement(event.target)) {
      return
    }
    router.push(`/blog/${postId}`)
  }

  const handleCardKeyDown = (postId: string) => (event: KeyboardEvent<HTMLDivElement>) => {
    if (isInteractiveElement(event.target)) {
      return
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      router.push(`/blog/${postId}`)
    }
  }

  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    let cancelled = false

    const setup = async () => {
      try {
        unsubscribe = await subscribeToPublishedBlogs((items) => {
          if (cancelled) return
          setPosts(items)
          setLoading(false)
        })
      } catch (err) {
        console.error("Failed to subscribe to blog posts", err)
        if (!cancelled) {
          setError("ไม่สามารถโหลดบทความได้ กรุณาลองใหม่อีกครั้ง")
          setLoading(false)
        }
      }
    }

    setup()

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [])

  const categories = useMemo(() => [ALL_CATEGORY, ...BLOG_CATEGORIES], [])

  const filteredPosts = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase()

    return posts.filter((post) => {
      const matchesCategory =
        selectedCategory === ALL_CATEGORY || post.category === selectedCategory

      const matchesSearch =
        normalizedQuery.length === 0 ||
        [post.title, post.excerpt, post.content, post.tags.join(" ")]
          .map((value) => value.toLowerCase())
          .some((value) => value.includes(normalizedQuery))

      return matchesCategory && matchesSearch
    })
  }, [posts, searchTerm, selectedCategory])

  const featuredPosts = useMemo(
    () => calculateFeaturedPosts(filteredPosts),
    [filteredPosts],
  )
  const otherPosts = useMemo(
    () => calculateOtherPosts(filteredPosts),
    [filteredPosts],
  )

  return (
    <div className={`${inter.className} bg-gray-50 min-h-screen text-gray-900`}>
      <section className="relative overflow-hidden bg-gradient-to-r from-teal-600 to-cyan-600 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[url('/blog-pattern.svg')] opacity-10" aria-hidden />
        <div className="layout-container section-spacing-lg">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="text-center md:text-left">
              <h1 className="text-4xl font-bold leading-tight sm:text-5xl">มุมมองอสังหาริมทรัพย์</h1>
              <p className="mt-4 text-lg opacity-90 sm:text-xl md:max-w-2xl">
                ศูนย์รวมบทความ เทคนิค และข่าวสารล่าสุดด้านอสังหาริมทรัพย์จากผู้เชี่ยวชาญและชุมชนผู้ใช้งาน DreamHome
              </p>
            </div>
            {user ? (
              <Button
                asChild
                size="lg"
                className="w-full bg-white text-teal-600 shadow-lg hover:bg-white/90 sm:w-auto"
              >
                <Link href="/blog/create">สร้างบทความใหม่</Link>
              </Button>
            ) : (
              <p className="mx-auto max-w-md text-sm text-white/85 md:mx-0">
                เข้าสู่ระบบเพื่อเริ่มแบ่งปันประสบการณ์และความรู้เกี่ยวกับอสังหาริมทรัพย์ของคุณกับชุมชน
              </p>
            )}
          </div>

          <div className="mx-auto mt-10 max-w-3xl rounded-2xl bg-white p-4 shadow-xl sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                <Input
                  placeholder="ค้นหาบทความ..."
                  className="h-12 rounded-xl border-gray-200 pl-10 text-slate-900 placeholder:text-slate-500"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
              <Button
                className="h-12 rounded-xl bg-teal-600 hover:bg-teal-700"
                onClick={() => setSearchTerm((value) => value.trim())}
              >
                ค้นหา
              </Button>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              ลองค้นหาด้วยคำสำคัญ เช่น "การลงทุน", "คอนโด", "รีโนเวท" หรือเลือกหัวข้อจากหมวดหมู่ด้านล่าง
            </p>
          </div>
        </div>
      </section>

      <section className="border-b bg-white py-8">
        <div className="layout-container">
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                className={
                  selectedCategory === category
                    ? "bg-teal-600 hover:bg-teal-700 text-white border-transparent"
                    : "text-gray-700"
                }
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      <section className="section-spacing">
        <div className="layout-container">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <p>กำลังโหลดบทความ...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-6 text-center">
              {error}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-200 rounded-xl p-10 text-center">
              <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                ยังไม่มีบทความในหมวดหมู่นี้
              </h2>
              <p className="text-gray-500">
                ลองเปลี่ยนคำค้นหา หรือเลือกหมวดหมู่อื่นเพื่อค้นหาบทความที่คุณสนใจ
              </p>
              {user && (
                <Button asChild className="mt-6 bg-teal-600 hover:bg-teal-700">
                  <Link href="/blog/create">เขียนบทความแรกของคุณ</Link>
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="mb-12 text-center md:text-left">
                <h2 className="text-3xl font-bold text-gray-900">บทความล่าสุด</h2>
                <p className="mt-3 text-gray-600">
                  ติดตามแนวโน้มและเคล็ดลับล่าสุดจากผู้เชี่ยวชาญและคอมมูนิตี้ DreamHome
                </p>
              </div>

              {featuredPosts.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
                  {featuredPosts.map((post) => (
                    <Card
                      key={post.id}
                      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer focus-visible:ring-2 focus-visible:ring-teal-500"
                      role="link"
                      tabIndex={0}
                      onClick={handleCardClick(post.id)}
                      onKeyDown={handleCardKeyDown(post.id)}
                    >
                      <div className="relative h-56 bg-gradient-to-r from-teal-400 to-blue-500">
                        {post.coverImageUrl ? (
                          <Image
                            src={post.coverImageUrl}
                            alt={post.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 1024px) 100vw, 50vw"
                            priority
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-white text-5xl opacity-30">
                            📰
                          </div>
                        )}
                        <div className="absolute top-4 left-4">
                          <Badge variant="secondary" className="bg-white/90 text-teal-700">
                            {post.category}
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-6 flex flex-col h-full">
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
                          <div className="flex items-center">
                            <User size={16} className="mr-2" />
                            <Link
                              href={`/blog/authors/${post.authorId}`}
                              className="hover:underline"
                            >
                              {post.authorName}
                            </Link>
                          </div>
                          <div className="flex items-center">
                            <Calendar size={16} className="mr-2" />
                            {formatDate(post.createdAt)}
                          </div>
                          <div className="flex items-center">
                            <Clock3 size={16} className="mr-2" />
                            {post.readTimeMinutes} นาทีในการอ่าน
                          </div>
                        </div>
                        <h3 className="text-2xl font-bold mb-3 text-gray-900 line-clamp-2 break-words">
                          {post.title}
                        </h3>
                        <p className="text-gray-600 mb-6 line-clamp-3 flex-1 break-words">{post.excerpt}</p>
                        <Button asChild variant="outline" className="self-start">
                          <Link href={`/blog/${post.id}`}>
                            อ่านบทความ
                            <ArrowRight size={16} className="ml-2" />
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {otherPosts.length > 0 && (
                <>
                  <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <h2 className="text-2xl font-semibold text-gray-900">บทความทั้งหมด</h2>
                    <p className="text-sm text-gray-500">
                      พบ {otherPosts.length + featuredPosts.length} บทความที่ตรงกับการค้นหาของคุณ
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {otherPosts.map((post) => (
                      <Card
                        key={post.id}
                        className="overflow-hidden hover:shadow-md transition-shadow flex flex-col cursor-pointer focus-visible:ring-2 focus-visible:ring-teal-500"
                        role="link"
                        tabIndex={0}
                        onClick={handleCardClick(post.id)}
                        onKeyDown={handleCardKeyDown(post.id)}
                        aria-label={`อ่านบทความ ${post.title}`}
                      >
                        <div className="relative h-44 bg-gradient-to-r from-cyan-400 to-teal-500">
                          {post.coverImageUrl ? (
                            <Image
                              src={post.coverImageUrl}
                              alt={post.title}
                              fill
                              className="object-cover"
                              sizes="(max-width: 1024px) 100vw, 33vw"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-white text-4xl opacity-30">
                              📝
                            </div>
                          )}
                          <div className="absolute top-3 left-3">
                            <Badge variant="outline" className="bg-white/80 text-teal-700 border-none">
                              {post.category}
                            </Badge>
                          </div>
                        </div>
                        <CardContent className="p-5 flex flex-col flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 break-words">
                            {post.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-4 line-clamp-3 flex-1 break-words">{post.excerpt}</p>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500 mb-3">
                            <div className="flex items-center">
                              <User size={14} className="mr-2" />
                              <Link
                                href={`/blog/authors/${post.authorId}`}
                                className="hover:underline"
                              >
                                {post.authorName}
                              </Link>
                            </div>
                            <div className="flex items-center">
                              <Calendar size={14} className="mr-2" />
                              {formatDate(post.createdAt)}
                            </div>
                            <div className="flex items-center">
                              <Clock3 size={14} className="mr-2" />
                              {post.readTimeMinutes} นาทีในการอ่าน
                            </div>
                          </div>
                          <Button asChild variant="ghost" size="sm" className="justify-between">
                            <Link href={`/blog/${post.id}`}>
                              อ่านบทความ
                              <ArrowRight size={14} className="ml-2" />
                            </Link>
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  )
}
