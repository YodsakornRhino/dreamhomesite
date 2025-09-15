"use client"

import Link from "next/link"
import { Bed, Bath, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"

interface UserPropertyCardProps {
  property: any
  ownerUid: string
}

export default function UserPropertyCard({ property, ownerUid }: UserPropertyCardProps) {
  return (
    <div className="overflow-hidden rounded-lg border shadow-sm bg-white">
      {Array.isArray(property.photos) && property.photos[0] && (
        <img
          src={property.photos[0]}
          alt={property.title || "property-photo"}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-4 space-y-2">
        <h3 className="text-lg font-semibold">{property.title || "(ไม่มีชื่อ)"}</h3>
        {property.price && <p className="text-blue-600 font-bold">{property.price}</p>}
        {(property.address || property.city || property.province) && (
          <p className="text-sm text-gray-500 flex items-center">
            <MapPin className="w-4 h-4 mr-1" />
            {[property.address, property.city, property.province].filter(Boolean).join(", ")}
          </p>
        )}
        <div className="flex gap-4 text-sm text-gray-600">
          {property.bedrooms && (
            <span className="flex items-center">
              <Bed className="w-4 h-4 mr-1" />
              {property.bedrooms} นอน
            </span>
          )}
          {property.bathrooms && (
            <span className="flex items-center">
              <Bath className="w-4 h-4 mr-1" />
              {property.bathrooms} น้ำ
            </span>
          )}
        </div>
        <div className="flex gap-2 pt-2">
          <Link href={`/sell/${ownerUid}/${property.id}`} className="flex-1">
            <Button variant="outline" className="w-full">
              ดูรายละเอียด
            </Button>
          </Link>
          <Link href={`/sell/${ownerUid}/${property.id}/edit`} className="flex-1">
            <Button className="w-full">แก้ไข</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

