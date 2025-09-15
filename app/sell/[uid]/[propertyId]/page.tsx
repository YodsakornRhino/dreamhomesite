"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { useAuthContext } from "@/contexts/AuthContext"
import { getDocument } from "@/lib/firestore"
import { Bed, Bath, MapPin, Square } from "lucide-react"

interface Props {
  params: { uid: string; propertyId: string }
}

export default function PropertyPage({ params }: Props) {
  const { uid, propertyId } = params
  const { user } = useAuthContext()
  const [property, setProperty] = useState<any | null>(null)

  useEffect(() => {
    const fetch = async () => {
      const doc = await getDocument(`users/${uid}/user_property`, propertyId)
      if (doc) {
        setProperty({ id: doc.id, ...doc.data() })
      }
    }
    fetch()
  }, [uid, propertyId])

  if (!property) return <p className="p-4">กำลังโหลด...</p>

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold">{property.title}</h1>
      {property.price && (
        <p className="text-2xl font-semibold text-blue-600">{property.price}</p>
      )}
      {(property.address || property.city || property.province) && (
        <p className="text-gray-600 flex items-center">
          <MapPin className="w-4 h-4 mr-1" />
          {[property.address, property.city, property.province].filter(Boolean).join(", ")}
        </p>
      )}
      {Array.isArray(property.photos) && property.photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {property.photos.map((url: string, idx: number) => (
            <img
              key={idx}
              src={url}
              alt={property.title || `photo-${idx}`}
              className="w-full h-48 object-cover rounded"
            />
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-4 text-gray-700">
        {property.bedrooms && (
          <span className="flex items-center">
            <Bed className="w-4 h-4 mr-1" /> {property.bedrooms} ห้องนอน
          </span>
        )}
        {property.bathrooms && (
          <span className="flex items-center">
            <Bath className="w-4 h-4 mr-1" /> {property.bathrooms} ห้องน้ำ
          </span>
        )}
        {property.usableArea && (
          <span className="flex items-center">
            <Square className="w-4 h-4 mr-1" /> พื้นที่ใช้สอย {property.usableArea}
          </span>
        )}
        {property.landArea && (
          <span className="flex items-center">
            <Square className="w-4 h-4 mr-1" /> พื้นที่ดิน {property.landArea}
          </span>
        )}
      </div>
      {property.description && (
        <p className="text-gray-700 whitespace-pre-line">{property.description}</p>
      )}
      {user?.uid === uid && (
        <Link href={`/sell/${uid}/${propertyId}/edit`}>
          <Button>แก้ไขประกาศ</Button>
        </Link>
      )}
    </div>
  )
}
