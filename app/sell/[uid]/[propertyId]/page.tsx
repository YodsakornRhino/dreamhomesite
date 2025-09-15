"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { getDocument, updateDocument } from "@/lib/firestore"
import { useAuthContext } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface Property {
  id: string
  title: string
  price: number
  description: string
  photos: string[]
  sellerName: string
  sellerPhone: string
  sellerEmail: string
  bedrooms: number
  bathrooms: number
  parking: number
  address: string
  city: string
  province: string
  postal: string
}

export default function PropertyDetailPage() {
  const params = useParams<{ uid: string; propertyId: string }>()
  const { user } = useAuthContext()
  const [property, setProperty] = useState<Property | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState({ title: "", price: "", description: "" })

  const uid = params?.uid
  const propertyId = params?.propertyId

  useEffect(() => {
    const load = async () => {
      if (!uid || !propertyId) return
      const doc = await getDocument(`users/${uid}/user_property`, propertyId)
      if (doc) {
        const data = { id: doc.id, ...(doc.data() as any) } as Property
        setProperty(data)
        setForm({
          title: data.title || "",
          price: String(data.price || ""),
          description: data.description || "",
        })
      }
    }
    load()
  }, [uid, propertyId])

  const isOwner = user?.uid === uid

  const handleSave = async () => {
    if (!property || !uid || !propertyId) return
    const newData = {
      title: form.title,
      price: Number(form.price),
      description: form.description,
    }
    await updateDocument(`users/${uid}/user_property`, propertyId, newData)
    setProperty({ ...property, ...newData })
    setEditMode(false)
  }

  if (!property) {
    return <p className="p-4">กำลังโหลด...</p>
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {property.photos && property.photos.length > 0 && (
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={property.photos[0]}
            alt={property.title}
            className="w-full h-64 object-cover rounded-md"
          />
          {property.photos.length > 1 && (
            <div className="grid grid-cols-4 gap-2 mt-2">
              {property.photos.slice(1).map((photo, idx) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={idx}
                  src={photo}
                  alt={property.title}
                  className="h-24 w-full object-cover rounded"
                />
              ))}
            </div>
          )}
        </div>
      )}

      {editMode ? (
        <div className="space-y-4">
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="ชื่อประกาศ"
          />
          <Input
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            placeholder="ราคา"
          />
          <Textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="รายละเอียด"
          />
          <Button onClick={handleSave}>บันทึก</Button>
        </div>
      ) : (
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">{property.title}</h1>
          <p className="text-xl text-blue-600 font-semibold">
            {property.price?.toLocaleString("th-TH")}
          </p>
          <p>{property.description}</p>
          <div className="text-gray-600 text-sm">
            {property.address}, {property.city}, {property.province} {property.postal}
          </div>
          <div className="text-sm text-gray-600">
            ห้องนอน: {property.bedrooms} | ห้องน้ำ: {property.bathrooms} | ที่จอดรถ: {property.parking}
          </div>
          {isOwner && (
            <Button onClick={() => setEditMode(true)}>แก้ไขประกาศ</Button>
          )}
        </div>
      )}
    </div>
  )
}

