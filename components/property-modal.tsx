"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { X, Bed, Bath, Square, Check, MapPin } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useAuthContext } from "@/contexts/AuthContext"

interface PropertyModalProps {
  property: any
  onClose: () => void
}

export default function PropertyModal({ property, onClose }: PropertyModalProps) {
  const { user } = useAuthContext()
  const isOwner = user?.uid === property.ownerId
  const [activePhoto, setActivePhoto] = useState(0)
  const photos: string[] = Array.isArray(property.photos) ? property.photos : []

  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = "auto"
    }
  }, [])

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const location = [property.address, property.city, property.province].filter(Boolean).join(", ")

  return (
    <div
      className="fixed inset-0 bg-white bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto mx-2 sm:mx-4">
        <div className="p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
              {property.title || "รายละเอียดอสังหาริมทรัพย์"}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors p-1">
              <X size={24} />
            </button>
          </div>

          {photos.length > 0 && (
            <div className="mb-4 sm:mb-6">
              <img
                src={photos[activePhoto]}
                alt={property.title || "property-photo"}
                className="h-48 sm:h-64 md:h-96 w-full object-cover rounded-lg mb-4"
              />
              {photos.length > 1 && (
                <div className="grid grid-cols-4 gap-1 sm:gap-2">
                  {photos.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt={property.title || `thumb-${idx}`}
                      onClick={() => setActivePhoto(idx)}
                      className={`h-16 sm:h-20 w-full object-cover rounded cursor-pointer ${idx === activePhoto ? "ring-2 ring-blue-500" : ""}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            <div>
              {location && (
                <p className="text-gray-600 mb-4 flex items-center text-sm sm:text-base">
                  <MapPin className="mr-1" size={16} />
                  {location}
                </p>
              )}
              {property.price && (
                <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-4 sm:mb-6">
                  {property.price}
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
                {property.bedrooms && (
                  <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <Bed className="mx-auto text-blue-600 mb-2" size={20} />
                    <div className="font-semibold text-sm sm:text-base">{property.bedrooms}</div>
                    <div className="text-xs sm:text-sm text-gray-600">ห้องนอน</div>
                  </div>
                )}
                {property.bathrooms && (
                  <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <Bath className="mx-auto text-blue-600 mb-2" size={20} />
                    <div className="font-semibold text-sm sm:text-base">{property.bathrooms}</div>
                    <div className="text-xs sm:text-sm text-gray-600">ห้องน้ำ</div>
                  </div>
                )}
                {property.usableArea && (
                  <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <Square className="mx-auto text-blue-600 mb-2" size={20} />
                    <div className="font-semibold text-sm sm:text-base">{property.usableArea}</div>
                    <div className="text-xs sm:text-sm text-gray-600">ตร.ฟุต</div>
                  </div>
                )}
              </div>

              {property.description && (
                <div className="mb-4 sm:mb-6">
                  <h4 className="font-semibold mb-2 text-sm sm:text-base">คำอธิบาย</h4>
                  <p className="text-gray-600 text-sm sm:text-base whitespace-pre-line">
                    {property.description}
                  </p>
                </div>
              )}

              {Array.isArray(property.features) && property.features.length > 0 && (
                <div className="mb-4 sm:mb-6">
                  <h4 className="font-semibold mb-2 text-sm sm:text-base">คุณสมบัติ</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2 text-xs sm:text-sm">
                    {property.features.map((feature: string) => (
                      <div key={feature} className="flex items-center">
                        <Check className="text-green-500 mr-2" size={14} />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isOwner && (
                <Link href={`/sell/${property.ownerId}/${property.id}/edit`}>
                  <Button>แก้ไขประกาศ</Button>
                </Link>
              )}
            </div>

            <div>
              <div className="h-48 sm:h-64 bg-gray-200 rounded-lg mb-4 sm:mb-6 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <MapPin className="mx-auto mb-2" size={24} />
                  <div className="text-sm sm:text-base">แผนที่แบบโต้ตอบ</div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
                <h4 className="font-semibold mb-4 text-sm sm:text-base">ติดต่อเอเจนต์</h4>
                <div className="space-y-3 sm:space-y-4">
                  <input
                    type="text"
                    placeholder="ชื่อของคุณ"
                    className="w-full px-3 sm:px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
                  />
                  <input
                    type="email"
                    placeholder="อีเมลของคุณ"
                    className="w-full px-3 sm:px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
                  />
                  <input
                    type="tel"
                    placeholder="เบอร์โทร"
                    className="w-full px-3 sm:px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
                  />
                  <textarea
                    placeholder="ข้อความ"
                    rows={3}
                    className="w-full px-3 sm:px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
                  />
                  <button className="w-full bg-blue-600 text-white py-2.5 sm:py-2 rounded-lg hover:bg-blue-700 transition text-sm sm:text-base">
                    สงข้อความ
                  </button>
                </div>

                <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="w-10 sm:w-12 h-10 sm:h-12 bg-blue-600 rounded-full flex items-center justify-center">
                      <div className="w-5 sm:w-6 h-5 sm:h-6 bg-white rounded-full"></div>
                    </div>
                    <div>
                      <div className="font-semibold text-sm sm:text-base">Sarah Johnson</div>
                      <div className="text-xs sm:text-sm text-gray-600">ตัวแทนอสังหาริมทรัพย์ที่ได้รับใบอนุญาต</div>
                      <div className="text-xs sm:text-sm text-blue-600">(555) 123-4567</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

