"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Bed, Bath, MapPin, Square } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAuthContext } from "@/contexts/AuthContext"
import { getDocument } from "@/lib/firestore"

interface Props {
  params: { uid: string; propertyId: string }
}

export default function PropertyPage({ params }: Props) {
  const { uid, propertyId } = params
  const { user } = useAuthContext()
  const [property, setProperty] = useState<any | null>(null)
  const [owner, setOwner] = useState<any | null>(null)
  const [activePhoto, setActivePhoto] = useState(0)

  useEffect(() => {
    const fetch = async () => {
      const doc = await getDocument(`users/${uid}/user_property`, propertyId)
      if (doc) {
        setProperty({ id: doc.id, ...doc.data() })
      }
      const ownerDoc = await getDocument("users", uid)
      if (ownerDoc) {
        setOwner(ownerDoc.data())
      }
    }
    fetch()
  }, [uid, propertyId])

  if (!property) return <p className="p-4">กำลังโหลด...</p>

  const photos: string[] = Array.isArray(property.photos) ? property.photos : []

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          {photos.length > 0 ? (
            <>
              <img
                src={photos[activePhoto]}
                alt={property.title || "property-photo"}
                className="w-full h-64 md:h-96 object-cover rounded-lg"
              />
              {photos.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {photos.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt={property.title || `thumb-${idx}`}
                      onClick={() => setActivePhoto(idx)}
                      className={`w-20 h-20 object-cover rounded cursor-pointer border-2 ${
                        idx === activePhoto ? "border-blue-500" : "border-transparent"
                      }`}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-64 md:h-96 bg-gray-200 rounded" />
          )}
        </div>

        <div className="space-y-4">
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
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div />
        <div className="space-y-4">
          <div className="border rounded-lg p-4 space-y-4">
            <h2 className="text-lg font-semibold">ติดต่อเอเจนซี่</h2>
            <div className="space-y-2">
              <div className="space-y-1">
                <Label htmlFor="name">ชื่อ</Label>
                <Input id="name" placeholder="ชื่อของคุณ" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
                <Input id="phone" placeholder="08x-xxx-xxxx" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="message">ข้อความ</Label>
                <Textarea id="message" rows={3} />
              </div>
              <Button className="w-full">ส่งข้อความ</Button>
            </div>
          </div>

          {owner && (
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              {owner.photoURL && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={owner.photoURL}
                  alt={owner.name || "agent"}
                  className="w-12 h-12 rounded-full object-cover"
                />
              )}
              <div>
                <p className="font-medium">{owner.name}</p>
                {owner.phoneNumber && (
                  <p className="text-sm text-gray-600">{owner.phoneNumber}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
