"use client"

import { Bed, Bath, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import UserPropertyModal from "@/components/user-property-modal"

interface UserPropertyCardProps {
  property: any
  ownerUid: string
}

export default function UserPropertyCard({ property, ownerUid }: UserPropertyCardProps) {
  return (
    <div className="overflow-hidden rounded-lg border shadow-sm bg-white flex flex-col">
      {Array.isArray(property.photos) && property.photos[0] && (
        <img
          src={property.photos[0]}
          alt={property.title || "property-photo"}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-4 space-y-2 flex-1">
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
        <div className="pt-2">
          <UserPropertyModal
            property={property}
            ownerUid={ownerUid}
            trigger={
              <Button variant="outline" className="w-full">
                ดูรายละเอียด
              </Button>
            }
          />
        </div>
      </div>
    </div>
  )
}

