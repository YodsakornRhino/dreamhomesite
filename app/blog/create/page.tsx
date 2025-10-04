"use client"

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Inter } from "next/font/google"
import { Upload, Loader2, ArrowLeft, X } from "lucide-react"

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
import { useAuthContext } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { BLOG_CATEGORIES, createBlogPost } from "@/lib/blogs"
import { getDownloadURL, uploadFile } from "@/lib/storage"
import type { BlogCategory } from "@/types/blog"

const inter = Inter({ subsets: ["latin"] })

const DEFAULT_CATEGORY: BlogCategory = BLOG_CATEGORIES[0]

const calculateReadTime = (content: string): number => {
  const words = content.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return 1
  return Math.max(1, Math.round(words.length / 200))
}

const normalizeFileName = (fileName: string) =>
  fileName
    .replace(/[^a-zA-Z0-9.ก-๙_-]+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase()

export default function CreateBlogPage() {
  const router = useRouter()
  const { user } = useAuthContext()
  const { toast } = useToast()

  const [title, setTitle] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState<BlogCategory>(DEFAULT_CATEGORY)
  const [tagsInput, setTagsInput] = useState("")
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

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
      setCoverPreview(null)
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
  }

  const handleRemoveCover = () => {
    setCoverFile(null)
    if (coverPreview) {
      URL.revokeObjectURL(coverPreview)
    }
    setCoverPreview(null)
  }

  useEffect(() => {
    return () => {
      if (coverPreview) {
        URL.revokeObjectURL(coverPreview)
      }
    }
  }, [coverPreview])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!user) {
      toast({
        title: "กรุณาเข้าสู่ระบบ",
        description: "คุณต้องเข้าสู่ระบบเพื่อสร้างบทความ",
        variant: "destructive",
      })
      return
    }

    if (!title.trim() || !excerpt.trim() || !content.trim()) {
      toast({
        title: "กรอกข้อมูลไม่ครบ",
        description: "กรุณากรอกหัวเรื่อง คำโปรย และเนื้อหาก่อนเผยแพร่",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)

    try {
      let coverUrl: string | null = null
      let coverPath: string | null = null

      if (coverFile) {
        const filePath = `blog-covers/${user.uid}/${Date.now()}-${normalizeFileName(coverFile.name)}`
        await uploadFile(filePath, coverFile, { contentType: coverFile.type })
        coverUrl = await getDownloadURL(filePath)
        coverPath = filePath
      }

      const blogId = await createBlogPost(
        {
          uid: user.uid,
          displayName: user.displayName ?? null,
          email: user.email ?? null,
        },
        {
          title: title.trim(),
          excerpt: excerpt.trim(),
          content: content.trim(),
          category,
          tags,
          coverImageUrl: coverUrl,
          coverImagePath: coverPath,
          readTimeMinutes: calculateReadTime(content),
        },
      )

      toast({
        title: "เผยแพร่บทความสำเร็จ",
        description: "บทความของคุณพร้อมแล้วบน DreamHome Blog",
      })

      router.push(`/blog/${blogId}`)
    } catch (error) {
      console.error("Failed to create blog post", error)
      toast({
        title: "ไม่สามารถเผยแพร่บทความได้",
        description: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={`${inter.className} bg-gradient-to-b from-slate-50 to-white min-h-screen py-12`}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">สร้างบทความใหม่</h1>
            <p className="text-slate-500 mt-1">
              แบ่งปันประสบการณ์ เทคนิค และเรื่องราวเกี่ยวกับอสังหาริมทรัพย์กับชุมชน DreamHome
            </p>
          </div>
          <Button variant="ghost" asChild className="gap-2">
            <Link href="/blog">
              <ArrowLeft className="h-4 w-4" />
              กลับสู่บล็อก
            </Link>
          </Button>
        </div>

        {!user ? (
          <Card className="border-dashed border-2 border-slate-200">
            <CardHeader>
              <CardTitle className="text-xl text-slate-700">เข้าสู่ระบบเพื่อสร้างบทความ</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-500 space-y-3">
              <p>
                คุณต้องเข้าสู่ระบบก่อนจึงจะสามารถเขียนและเผยแพร่บทความได้ กรุณาเข้าสู่ระบบผ่านเมนูด้านบนขวาของหน้าจอ
              </p>
              <p>
                หากยังไม่มีบัญชี สามารถสมัครได้ฟรีเพื่อเริ่มแบ่งปันความรู้และเรื่องราวเกี่ยวกับอสังหาริมทรัพย์
              </p>
            </CardContent>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">รายละเอียดบทความ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">หัวเรื่อง</Label>
                    <Input
                      id="title"
                      placeholder="เช่น 10 เทคนิคขายคอนโดให้ได้ราคาดี"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      maxLength={150}
                      required
                    />
                    <p className="text-xs text-slate-400 text-right">
                      {title.trim().length}/150 อักขระ
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="excerpt">คำโปรย</Label>
                    <Textarea
                      id="excerpt"
                      placeholder="สรุปเนื้อหาสั้นๆ เพื่อดึงดูดผู้อ่าน"
                      value={excerpt}
                      onChange={(event) => setExcerpt(event.target.value)}
                      rows={3}
                      maxLength={250}
                      required
                    />
                    <p className="text-xs text-slate-400 text-right">
                      {excerpt.trim().length}/250 อักขระ
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">หมวดหมู่</Label>
                    <Select value={category} onValueChange={(value) => setCategory(value as BlogCategory)}>
                      <SelectTrigger id="category" className="w-full">
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
                    <p className="text-xs text-slate-400">
                      เลือกหมวดหมู่ที่ตรงกับเนื้อหามากที่สุดเพื่อช่วยให้ผู้อ่านค้นหาได้ง่าย
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags">แท็ก (คั่นด้วยเครื่องหมายจุลภาค ,)</Label>
                    <Input
                      id="tags"
                      placeholder="เช่น คอนโด, การลงทุน, รีโนเวท"
                      value={tagsInput}
                      onChange={(event) => setTagsInput(event.target.value)}
                    />
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">รูปภาพหน้าปก</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 min-h-[220px] relative border border-dashed border-slate-300 rounded-lg bg-slate-50 flex items-center justify-center">
                    {coverPreview ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={coverPreview}
                          alt="ตัวอย่างรูปภาพหน้าปก"
                          fill
                          className="object-cover rounded-lg"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="absolute top-3 right-3 bg-white/80"
                          onClick={handleRemoveCover}
                        >
                          <X className="h-4 w-4" />
                          ลบภาพ
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center text-slate-400 space-y-2 p-6">
                        <Upload className="h-10 w-10 mx-auto" />
                        <p className="font-medium">อัปโหลดรูปภาพหน้าปก</p>
                        <p className="text-sm">ไฟล์ JPG, PNG หรือ WEBP ขนาดไม่เกิน 5MB</p>
                      </div>
                    )}
                  </div>
                  <div className="md:w-64 space-y-3">
                    <Input type="file" accept="image/*" onChange={handleCoverChange} />
                    <p className="text-xs text-slate-400">
                      รูปภาพจะช่วยให้บทความของคุณน่าสนใจและโดดเด่นมากขึ้น
                    </p>
                    <p className="text-xs text-slate-400">
                      เคล็ดลับ: เลือกรูปที่มีอัตราส่วน 16:9 เพื่อให้แสดงผลได้เต็มหน้าจอ
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">เนื้อหาบทความ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="เริ่มต้นเขียนบทความของคุณที่นี่..."
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  rows={16}
                  required
                />
                <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
                  <span>ความยาวประมาณ {content.trim().split(/\s+/).filter(Boolean).length} คำ</span>
                  <span>เวลาที่ใช้ในการอ่าน {calculateReadTime(content)} นาที</span>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-end gap-4">
              <Button type="button" variant="outline" asChild>
                <Link href="/blog">ยกเลิก</Link>
              </Button>
              <Button type="submit" disabled={submitting} className="bg-teal-600 hover:bg-teal-700">
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังเผยแพร่...
                  </>
                ) : (
                  "เผยแพร่บทความ"
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
