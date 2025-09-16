"use client"

import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import {
  Bath,
  Bed,
  Calendar,
  Car,
  ImageIcon,
  MapPin,
  Phone,
  Mail,
  Ruler,
  Square,
  User,
  Video,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  formatPropertyPrice,
  PROPERTY_TYPE_LABELS,
  SELLER_ROLE_LABELS,
  TRANSACTION_LABELS,
} from "@/lib/property"
import { cn } from "@/lib/utils"
import type { UserProperty } from "@/types/user-property"

interface UserPropertyModalProps {
  open: boolean
  property: UserProperty | null
  onOpenChange: (open: boolean) => void
}

export function UserPropertyModal({ open, property, onOpenChange }: UserPropertyModalProps) {
  const [activePhotoIndex, setActivePhotoIndex] = useState(0)

  useEffect(() => {
    setActivePhotoIndex(0)
  }, [property?.id])

  if (!property) return null

  const photos = Array.isArray(property.photos) ? property.photos : []
  const safeIndex = photos.length > 0 ? Math.min(activePhotoIndex, photos.length - 1) : 0
  const mainPhoto = photos[safeIndex]

  const locationText = useMemo(() => {
    const segments = [property.address, property.city, property.province]
      .map((segment) => segment?.trim())
      .filter(Boolean)
    return segments.join(", ")
  }, [property.address, property.city, property.province])

  const createdAtDisplay = useMemo(() => {
    if (!property.createdAt) return null
    const date = new Date(property.createdAt)
    if (Number.isNaN(date.getTime())) return null
    return date.toLocaleDateString("th-TH", {
      dateStyle: "medium",
      timeZone: "Asia/Bangkok",
    })
  }, [property.createdAt])

  const landAreaDisplay = useMemo(() => {
    const numeric = Number(property.landArea)
    if (Number.isFinite(numeric) && numeric > 0) {
      return `${numeric.toLocaleString("th-TH")} ตร.ว.`
    }
    return property.landArea
  }, [property.landArea])

  const usableAreaDisplay = useMemo(() => {
    const numeric = Number(property.usableArea)
    if (Number.isFinite(numeric) && numeric > 0) {
      return `${numeric.toLocaleString("th-TH")} ตร.ม.`
    }
    return property.usableArea
  }, [property.usableArea])

  const bedroomsDisplay = useMemo(() => {
    const numeric = Number(property.bedrooms)
    if (Number.isFinite(numeric) && numeric > 0) return numeric
    return property.bedrooms || "-"
  }, [property.bedrooms])

  const bathroomsDisplay = useMemo(() => {
    const numeric = Number(property.bathrooms)
    if (Number.isFinite(numeric) && numeric > 0) return numeric
    return property.bathrooms || "-"
  }, [property.bathrooms])

  const parkingDisplay = useMemo(() => {
    if (!property.parking) return null
    if (property.parking === "none") return "ไม่มีที่จอดรถ"
    const numeric = Number(property.parking)
    if (Number.isFinite(numeric) && numeric >= 0) {
      return `${numeric} คัน`
    }
    return property.parking
  }, [property.parking])

  const sellerRoleLabel = SELLER_ROLE_LABELS[property.sellerRole] ?? property.sellerRole
  const transactionLabel = TRANSACTION_LABELS[property.transactionType] ?? property.transactionType
  const typeLabel = PROPERTY_TYPE_LABELS[property.propertyType] ?? property.propertyType

  const mapUrl =
    typeof property.lat === "number" && typeof property.lng === "number"
      ? `https://www.google.com/maps?q=${property.lat},${property.lng}&hl=th&z=16&output=embed`
      : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <div className="space-y-2">
            <DialogTitle className="text-2xl font-bold text-gray-900">{property.title}</DialogTitle>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {locationText || property.address || "-"}
              </span>
              {createdAtDisplay && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  ประกาศเมื่อ {createdAtDisplay}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="bg-blue-600 text-white hover:bg-blue-600">{transactionLabel}</Badge>
            <Badge variant="outline">{typeLabel}</Badge>
            <DialogDescription className="text-3xl font-bold text-blue-600">
              {formatPropertyPrice(property.price, property.transactionType)}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-6">
            <section className="space-y-3">
              <div className="relative overflow-hidden rounded-2xl bg-muted shadow">
                {mainPhoto ? (
                  <Image
                    src={mainPhoto}
                    alt={property.title}
                    fill
                    sizes="(min-width: 1280px) 60vw, (min-width: 1024px) 55vw, 100vw"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full min-h-[240px] w-full items-center justify-center bg-gradient-to-r from-sky-400 to-indigo-500 text-white">
                    <ImageIcon className="h-12 w-12" />
                  </div>
                )}
              </div>
              {photos.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {photos.map((photo, index) => (
                    <button
                      key={photo + index}
                      type="button"
                      onClick={() => setActivePhotoIndex(index)}
                      className={cn(
                        "relative h-20 w-28 flex-shrink-0 overflow-hidden rounded-lg border transition",
                        index === safeIndex
                          ? "ring-2 ring-blue-500"
                          : "hover:border-blue-200",
                      )}
                    >
                      <Image
                        src={photo}
                        alt={`รูปที่ ${index + 1}`}
                        fill
                        sizes="120px"
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </section>

            {property.video && (
              <section className="space-y-3">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <Video className="h-5 w-5 text-blue-600" /> วิดีโอทรัพย์สิน
                </h3>
                <div className="overflow-hidden rounded-2xl border bg-black">
                  <video controls className="h-full w-full">
                    <source src={property.video} />
                    เบราว์เซอร์ของคุณไม่รองรับการเล่นวิดีโอ
                  </video>
                </div>
              </section>
            )}

            <section className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">รายละเอียด</h3>
              <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700">
                {property.description || "ไม่มีรายละเอียดเพิ่มเติม"}
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">ข้อมูลทรัพย์สิน</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-xl border p-4">
                  <Bed className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">ห้องนอน</p>
                    <p className="text-base font-semibold text-gray-900">{bedroomsDisplay}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border p-4">
                  <Bath className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">ห้องน้ำ</p>
                    <p className="text-base font-semibold text-gray-900">{bathroomsDisplay}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border p-4">
                  <Ruler className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">พื้นที่ดิน</p>
                    <p className="text-base font-semibold text-gray-900">{landAreaDisplay || "-"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border p-4">
                  <Square className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">พื้นที่ใช้สอย</p>
                    <p className="text-base font-semibold text-gray-900">{usableAreaDisplay || "-"}</p>
                  </div>
                </div>
                {parkingDisplay && (
                  <div className="flex items-center gap-3 rounded-xl border p-4">
                    <Car className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">ที่จอดรถ</p>
                      <p className="text-base font-semibold text-gray-900">{parkingDisplay}</p>
                    </div>
                  </div>
                )}
                {property.yearBuilt && (
                  <div className="flex items-center gap-3 rounded-xl border p-4">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">สร้างเมื่อปี</p>
                      <p className="text-base font-semibold text-gray-900">{property.yearBuilt}</p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">แผนที่</h3>
              {mapUrl ? (
                <iframe
                  src={mapUrl}
                  title="ตำแหน่งทรัพย์สิน"
                  className="h-64 w-full rounded-2xl border"
                  loading="lazy"
                  allowFullScreen
                />
              ) : (
                <div className="flex h-48 w-full items-center justify-center rounded-2xl border border-dashed text-sm text-muted-foreground">
                  ไม่มีพิกัดแผนที่สำหรับประกาศนี้
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            <section className="space-y-4 rounded-2xl border p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">ข้อมูลผู้ขาย</h3>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-base font-semibold text-gray-900">{property.sellerName}</p>
                    <p className="text-muted-foreground">{sellerRoleLabel}</p>
                  </div>
                </div>
                <a href={`tel:${property.sellerPhone}`} className="flex items-center gap-3 text-blue-600 hover:underline">
                  <Phone className="h-5 w-5" />
                  {property.sellerPhone}
                </a>
                <a href={`mailto:${property.sellerEmail}`} className="flex items-center gap-3 text-blue-600 hover:underline">
                  <Mail className="h-5 w-5" />
                  {property.sellerEmail}
                </a>
              </div>
            </section>

            <section className="space-y-3 rounded-2xl border p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">ที่อยู่</h3>
              <div className="space-y-1 text-sm text-gray-700">
                <p>{property.address}</p>
                <p>{[property.city, property.province, property.postal].filter(Boolean).join(" ")}</p>
              </div>
            </section>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  )
}
