"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useAuthContext } from "@/contexts/AuthContext"
import { getDocument, updateDocument } from "@/lib/firestore"

interface Props {
  params: { uid: string; propertyId: string }
}

export default function EditPropertyPage({ params }: Props) {
  const { uid, propertyId } = params
  const router = useRouter()
  const { user, loading } = useAuthContext()
  const [title, setTitle] = useState("")
  const [price, setPrice] = useState("")
  const [description, setDescription] = useState("")
  const [photos, setPhotos] = useState<string[]>([])

  useEffect(() => {
    if (!loading && user && user.uid !== uid) {
      router.replace(`/sell/${uid}/${propertyId}`)
    }
  }, [user, loading, uid, propertyId, router])

  useEffect(() => {
    const fetch = async () => {
      const doc = await getDocument(`users/${uid}/user_property`, propertyId)
      if (doc) {
        const data = doc.data() as any
        setTitle(data.title || "")
        setPrice(data.price || "")
        setDescription(data.description || "")
        if (Array.isArray(data.photos)) setPhotos(data.photos)
      }
    }
    fetch()
  }, [uid, propertyId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await updateDocument(`users/${uid}/user_property`, propertyId, {
      title,
      price,
      description,
    })
    router.push(`/sell/${uid}/${propertyId}`)
  }

  if (loading || !user) return null

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">แก้ไขประกาศ</h1>
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
          {photos.map((url, idx) => (
            <img
              key={idx}
              src={url}
              alt={title || `photo-${idx}`}
              className="w-full h-32 object-cover rounded"
            />
          ))}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 text-sm font-medium">ชื่อประกาศ</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium">ราคา</label>
          <Input value={price} onChange={(e) => setPrice(e.target.value)} required />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium">รายละเอียด</label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} required />
        </div>
        <Button type="submit">บันทึก</Button>
      </form>
    </div>
  )
}
