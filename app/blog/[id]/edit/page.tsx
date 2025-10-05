"use client"

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react"
import Link from "next/link"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import { Inter } from "next/font/google"
import { ArrowLeft, Loader2, Upload, X } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useAuthContext } from "@/contexts/AuthContext"
import {
  BLOG_CATEGORIES,
  estimateReadTimeMinutes,
  subscribeToBlog,
  updateBlogPost,
} from "@/lib/blogs"
import { deleteFile, getDownloadURL, uploadFile } from "@/lib/storage"
import type { BlogCategory, BlogPost } from "@/types/blog"

const inter = Inter({ subsets: ["latin"] })

const normalizeFileName = (fileName: string) =>
  fileName
    .replace(/[^a-zA-Z0-9.ก-๙_-]+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase()

export default function EditBlogPage() {
  const params = useParams<{ id: string }>()
  const blogId = params?.id
  const router = useRouter()
  const { user } = useAuthContext()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [post, setPost] = useState<BlogPost | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState<BlogCategory>(BLOG_CATEGORIES[0])
  const [tagsInput, setTagsInput] = useState("")
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [existingCoverUrl, setExistingCoverUrl] = useState<string | null>(null)
  const [originalCoverPath, setOriginalCoverPath] = useState<string | null>(null)
  const [removeExistingCover, setRemoveExistingCover] = useState(false)
  const [formInitialized, setFormInitialized] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const coverInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!blogId || typeof blogId !== "string") {
      setError("ไม่พบบทความที่ต้องการแก้ไข")
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
            setError("ไม่พบบทความที่ต้องการแก้ไข")
          } else {
            setError(null)
          }
        })
      } catch (err) {
        console.error("Failed to load blog post for editing", err)
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

  useEffect(() => {
    if (!post || formInitialized) return

    setTitle(post.title)
    setExcerpt(post.excerpt)
    setContent(post.content)
    setCategory(post.category)
    setTagsInput(post.tags.join(", "))
    setExistingCoverUrl(post.coverImageUrl)
    setOriginalCoverPath(post.coverImagePath)
    setRemoveExistingCover(false)
    setFormInitialized(true)
  }, [post, formInitialized])

  useEffect(() => {
    return () => {
      if (coverPreview) {
        URL.revokeObjectURL(coverPreview)
      }
    }
  }, [coverPreview])

  const tags = useMemo(() => {
    return tagsInput
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)
  }, [tagsInput])

  const handleCoverChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      setCoverFile(null)
      if (coverPreview) {
        URL.revokeObjectURL(coverPreview)
      }
      setCoverPreview(null)
      if (coverInputRef.current) {
        coverInputRef.current.value = ""
      }
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "ไฟล์มีขนาดใหญ่เกินไป",
        description: "กรุณาอัปโหลดรูปภาพที่มีขนาดไม่เกิน 5MB",
        variant: "destructive",
      })
      event.target.value = ""
      return
    }

    if (coverPreview) {
      URL.revokeObjectURL(coverPreview)
    }

    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
    setRemoveExistingCover(false)
    event.target.value = ""
  }

  const handleRemoveCover = () => {
    if (coverPreview) {
      URL.revokeObjectURL(coverPreview)
    }
    setCoverFile(null)
    setCoverPreview(null)
    setExistingCoverUrl(null)
    setRemoveExistingCover(true)
    if (coverInputRef.current) {
      coverInputRef.current.value = ""
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!user) {
      toast({
        title: "กรุณาเข้าสู่ระบบ",
        description: "คุณต้องเข้าสู่ระบบเพื่อแก้ไขบทความ",
        variant: "destructive",
      })
      return
    }

    if (!post || post.authorId !== user.uid) {
      toast({
        title: "ไม่สามารถแก้ไขบทความได้",
        description: "คุณไม่มีสิทธิ์แก้ไขบทความนี้",
        variant: "destructive",
      })
      return
    }

    if (!title.trim() || !excerpt.trim() || !content.trim()) {
      toast({
        title: "กรอกข้อมูลไม่ครบ",
        description: "กรุณากรอกหัวเรื่อง คำโปรย และเนื้อหาก่อนบันทึก",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)

    try {
      let coverUrl = existingCoverUrl
      let coverPath = originalCoverPath
      let uploadedCoverPath: string | null = null

      if (coverFile) {
        const filePath = `blog-covers/${user.uid}/${Date.now()}-${normalizeFileName(coverFile.name)}`
        await uploadFile(filePath, coverFile, { contentType: coverFile.type })
        coverUrl = await getDownloadURL(filePath)
        coverPath = filePath
        uploadedCoverPath = filePath
      }

      if (removeExistingCover && !coverFile) {
        coverUrl = null
        coverPath = null
      }

      const readTimeMinutes = estimateReadTimeMinutes(content)

      await updateBlogPost(post.id, {
        title: title.trim(),
        excerpt: excerpt.trim(),
        content: content.trim(),
        category,
        tags,
        coverImageUrl: coverUrl,
        coverImagePath: coverPath,
        readTimeMinutes,
      })

      const shouldDeleteOldCover =
        (!!coverFile && !!originalCoverPath && originalCoverPath !== uploadedCoverPath) ||
        (removeExistingCover && !coverFile && !!originalCoverPath)

      if (shouldDeleteOldCover && originalCoverPath) {
        try {
          await deleteFile(originalCoverPath)
        } catch (deleteError) {
          console.error("Failed to delete previous cover image", deleteError)
        }
      }

      setOriginalCoverPath(uploadedCoverPath ?? coverPath ?? null)
      setExistingCoverUrl(coverUrl)
      if (coverPreview) {
        URL.revokeObjectURL(coverPreview)
      }
      setCoverPreview(null)
      setCoverFile(null)
      setRemoveExistingCover(false)
      if (coverInputRef.current) {
        coverInputRef.current.value = ""
      }

      toast({
        title: "บันทึกการแก้ไขสำเร็จ",
        description: "บทความของคุณได้รับการอัปเดตแล้ว",
      })

      router.push(`/blog/${post.id}`)
    } catch (err) {
      console.error("Failed to update blog post", err)
      toast({
        title: "ไม่สามารถบันทึกบทความได้",
        description: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const isAuthor = user && post && post.authorId === user.uid

  return (
    <div className={`${inter.className} bg-gradient-to-b from-slate-50 to-white min-h-screen py-12`}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">แก้ไขบทความ</h1>
            <p className="text-slate-500 mt-1">
              ปรับปรุงบทความของคุณและอัปเดตรูปภาพหน้าปกได้ทุกเมื่อ
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild className="gap-2">
              <Link href={blogId ? `/blog/${blogId}` : "/blog"}>
                ดูบทความ
              </Link>
            </Button>
            <Button variant="ghost" asChild className="gap-2">
              <Link href="/blog">
                <ArrowLeft className="h-4 w-4" />
                กลับสู่บล็อก
              </Link>
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p>กำลังโหลดบทความ...</p>
          </div>
        ) : error && !post ? (
          <Card className="border-dashed border-2 border-red-200 bg-red-50">
            <CardContent className="py-12 text-center space-y-4">
              <h2 className="text-2xl font-semibold text-red-600">{error}</h2>
              <Button asChild variant="destructive">
                <Link href="/blog">กลับไปหน้ารวมบทความ</Link>
              </Button>
            </CardContent>
          </Card>
        ) : !user ? (
          <Card className="border-dashed border-2 border-slate-200">
            <CardContent className="py-12 text-center space-y-3">
              <h2 className="text-xl font-semibold text-slate-700">กรุณาเข้าสู่ระบบ</h2>
              <p className="text-slate-500">
                คุณต้องเข้าสู่ระบบก่อนจึงจะสามารถแก้ไขบทความได้
              </p>
            </CardContent>
          </Card>
        ) : post && !isAuthor ? (
          <Card className="border border-amber-200 bg-amber-50">
            <CardContent className="py-10 text-center space-y-4">
              <h2 className="text-xl font-semibold text-amber-700">ไม่มีสิทธิ์แก้ไขบทความนี้</h2>
              <p className="text-amber-600">บทความนี้ไม่ได้สร้างโดยบัญชีของคุณ</p>
              <Button asChild variant="outline">
                <Link href="/blog">กลับไปหน้าบทความ</Link>
              </Button>
            </CardContent>
          </Card>
        ) : post ? (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">รายละเอียดบทความ</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="title">หัวข้อบทความ</Label>
                  <Input
                    id="title"
                    placeholder="กรอกหัวข้อที่ดึงดูดใจ"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="excerpt">คำโปรย (ไม่เกิน 200 ตัวอักษร)</Label>
                  <Textarea
                    id="excerpt"
                    rows={3}
                    maxLength={200}
                    placeholder="สรุปเนื้อหาที่น่าสนใจในย่อหน้าเดียว"
                    value={excerpt}
                    onChange={(event) => setExcerpt(event.target.value)}
                  />
                  <p className="text-sm text-slate-400">{excerpt.length}/200</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">เนื้อหาบทความ</Label>
                  <Textarea
                    id="content"
                    rows={12}
                    placeholder="แบ่งปันประสบการณ์ เทคนิค หรือเรื่องราวของคุณ"
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                  />
                  <p className="text-sm text-slate-400">
                    เวลาโดยประมาณในการอ่าน {estimateReadTimeMinutes(content)} นาที
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>หมวดหมู่</Label>
                    <Select value={category} onValueChange={(value) => setCategory(value as BlogCategory)}>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกหมวดหมู่" />
                      </SelectTrigger>
                      <SelectContent>
                        {BLOG_CATEGORIES.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tags">แท็ก (คั่นด้วยเครื่องหมายจุลภาค)</Label>
                    <Input
                      id="tags"
                      placeholder="การลงทุน, บ้านเดี่ยว, การรีโนเวท"
                      value={tagsInput}
                      onChange={(event) => setTagsInput(event.target.value)}
                    />
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                        {tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="bg-teal-50 text-teal-700">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>รูปภาพหน้าปก</Label>
                  {(coverPreview || existingCoverUrl) ? (
                    <div className="relative w-full overflow-hidden rounded-xl border border-slate-200">
                      <div className="relative h-64 w-full">
                        <Image
                          src={coverPreview || existingCoverUrl || "/placeholder.svg"}
                          alt="ภาพหน้าปกบทความ"
                          fill
                          className="object-cover"
                          sizes="100vw"
                        />
                      </div>
                      <div className="absolute top-3 right-3 flex gap-2">
                        <Button type="button" size="sm" variant="secondary" className="gap-2" onClick={handleRemoveCover}>
                          <X className="h-4 w-4" />
                          ลบรูป
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <label
                      className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center cursor-pointer hover:border-teal-400"
                      htmlFor="blog-cover-upload"
                      onClick={() => coverInputRef.current?.click()}
                    >
                      <Upload className="h-8 w-8 text-teal-500" />
                      <div>
                        <p className="font-medium text-slate-700">อัปโหลดรูปภาพหน้าปก</p>
                        <p className="text-sm text-slate-500">รองรับไฟล์ JPG, PNG ขนาดไม่เกิน 5MB</p>
                      </div>
                    </label>
                  )}
                  {(coverPreview || existingCoverUrl) && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <p className="text-sm text-slate-500">
                        {coverPreview ? "กำลังแสดงตัวอย่างรูปภาพใหม่" : "กำลังใช้รูปภาพปัจจุบัน"}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="gap-2"
                          onClick={() => coverInputRef.current?.click()}
                        >
                          <Upload className="h-4 w-4" />
                          เปลี่ยนรูปภาพ
                        </Button>
                      </div>
                    </div>
                  )}
                  <Input
                    ref={coverInputRef}
                    id="blog-cover-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverChange}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => router.push(blogId ? `/blog/${blogId}` : "/blog")}>
                    ยกเลิก
                  </Button>
                  <Button type="submit" className="bg-teal-600 hover:bg-teal-700" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        กำลังบันทึก...
                      </>
                    ) : (
                      "บันทึกการแก้ไข"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
