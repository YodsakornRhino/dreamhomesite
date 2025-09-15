"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { useAuthContext } from "@/contexts/AuthContext"
import { getDocument } from "@/lib/firestore"

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
      {property.price && (
        <p className="text-xl text-blue-600">{property.price}</p>
      )}
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
