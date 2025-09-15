"use client"

import { useState } from "react"
import Link from "next/link"
import { Bed, Bath, MapPin, Square } from "lucide-react"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useAuthContext } from "@/contexts/AuthContext"

interface UserPropertyModalProps {
  property: any
  ownerUid: string
  trigger: React.ReactNode
}

export default function UserPropertyModal({ property, ownerUid, trigger }: UserPropertyModalProps) {
  const { user } = useAuthContext()
  const [activePhoto, setActivePhoto] = useState(0)
  const photos: string[] = Array.isArray(property.photos) ? property.photos : []
  const isOwner = user?.uid === ownerUid

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{property.title || "(ไม่มีชื่อ)"}</DialogTitle>
        </DialogHeader>
        <div className="grid md:grid-cols-2 gap-6">
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
            {property.price && (
              <p className="text-xl font-semibold text-blue-600">{property.price}</p>
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
            {isOwner && (
              <Link href={`/sell/${ownerUid}/${property.id}/edit`}>
                <Button>แก้ไขประกาศ</Button>
              </Link>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

