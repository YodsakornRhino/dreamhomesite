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
  const [activeMediaIndex, setActiveMediaIndex] = useState(0)

  useEffect(() => {
    setActiveMediaIndex(0)
  }, [property?.id])

  const mediaItems = useMemo(() => {
    if (!property) return []

    const items = (property.photos ?? [])
      .filter((photo): photo is string => typeof photo === "string" && photo.trim().length > 0)
      .map((photo, index) => ({
        id: `photo-${index}`,
        type: "image" as const,
        url: photo,
      }))

    if (property.video) {
      items.push({
        id: "video",
        type: "video" as const,
        url: property.video,
      })
    }

    return items
  }, [property])

  const safeIndex = mediaItems.length > 0 ? Math.min(activeMediaIndex, mediaItems.length - 1) : 0
  const activeMedia = mediaItems[safeIndex]

  const locationText = useMemo(() => {
    if (!property) return ""
    const segments = [property.address, property.city, property.province]
      .map((segment) => segment?.trim())
      .filter(Boolean)
    return segments.join(", ")
  }, [property])

  const createdAtDisplay = useMemo(() => {
    if (!property?.createdAt) return null
    const date = new Date(property.createdAt)
    if (Number.isNaN(date.getTime())) return null
    return date.toLocaleDateString("th-TH", {
      dateStyle: "medium",
      timeZone: "Asia/Bangkok",
    })
  }, [property])

  const landAreaDisplay = useMemo(() => {
    if (!property) return ""
    const numeric = Number(property.landArea)
    if (Number.isFinite(numeric) && numeric > 0) {
      return `${numeric.toLocaleString("th-TH")} ตร.ว.`
    }
    return property.landArea
  }, [property])

  const usableAreaDisplay = useMemo(() => {
    if (!property) return ""
    const numeric = Number(property.usableArea)
    if (Number.isFinite(numeric) && numeric > 0) {
      return `${numeric.toLocaleString("th-TH")} ตร.ม.`
    }
    return property.usableArea
  }, [property])

  const bedroomsDisplay = useMemo(() => {
    if (!property) return "-"
    const numeric = Number(property.bedrooms)
    if (Number.isFinite(numeric) && numeric > 0) return numeric
    return property.bedrooms || "-"
  }, [property])

  const bathroomsDisplay = useMemo(() => {
    if (!property) return "-"
    const numeric = Number(property.bathrooms)
    if (Number.isFinite(numeric) && numeric > 0) return numeric
    return property.bathrooms || "-"
  }, [property])

  const parkingDisplay = useMemo(() => {
    if (!property?.parking) return null
    if (property.parking === "none") return "ไม่มีที่จอดรถ"
    const numeric = Number(property.parking)
    if (Number.isFinite(numeric) && numeric >= 0) {
      return `${numeric} คัน`
    }
    return property.parking
  }, [property])

  if (!property) return null

  const sellerRoleLabel = SELLER_ROLE_LABELS[property.sellerRole] ?? property.sellerRole
  const transactionLabel = TRANSACTION_LABELS[property.transactionType] ?? property.transactionType
  const typeLabel = PROPERTY_TYPE_LABELS[property.propertyType] ?? property.propertyType

  const mapUrl =
    typeof property.lat === "number" && typeof property.lng === "number"
      ? `https://www.google.com/maps?q=${property.lat},${property.lng}&hl=th&z=16&output=embed`
      : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[min(100vw-1.5rem,68rem)] max-h-[calc(100vh-2rem)] overflow-hidden p-0 sm:max-h-[90vh] sm:max-w-4xl sm:rounded-2xl lg:max-w-5xl">
        <div className="flex h-full flex-col">
          <DialogHeader className="border-b px-4 pb-4 pt-6 pr-12 text-left sm:px-6 sm:pb-6 sm:pt-8 sm:pr-16">
            <div className="space-y-2 sm:space-y-3">
              <DialogTitle className="text-xl font-bold text-gray-900 sm:text-2xl">
                {property.title}
              </DialogTitle>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground sm:text-sm">
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
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <Badge className="bg-blue-600 text-white hover:bg-blue-600">{transactionLabel}</Badge>
                <Badge variant="outline">{typeLabel}</Badge>
              </div>
              <DialogDescription className="text-2xl font-bold text-blue-600 sm:text-3xl">
                {formatPropertyPrice(property.price, property.transactionType)}
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            <div className="space-y-6 px-4 pb-6 pt-4 sm:px-6 sm:pb-8 sm:pt-6">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr),minmax(0,2fr)] lg:gap-8">
                <div className="space-y-6">
                  <section className="space-y-3">
                    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-muted shadow">
                      {activeMedia ? (
                        activeMedia.type === "image" ? (
                          <Image
                            src={activeMedia.url}
                            alt={property.title}
                            fill
                            sizes="(min-width: 1280px) 60vw, (min-width: 1024px) 55vw, 100vw"
                            className="object-cover"
                          />
                        ) : (
                          <video controls className="h-full w-full object-cover">
                            <source src={activeMedia.url} />
                            เบราว์เซอร์ของคุณไม่รองรับการเล่นวิดีโอ
                          </video>
                        )
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-r from-sky-400 to-indigo-500 px-4 text-center text-white">
                          <ImageIcon className="h-12 w-12" />
                          <p className="mt-2 text-sm font-medium">ไม่มีรูปหรือวิดีโอสำหรับประกาศนี้</p>
                        </div>
                      )}
                    </div>
                    {mediaItems.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
                        {mediaItems.map((item, index) => (
                          <button
                            key={item.id}
                            type="button"
                            aria-label={item.type === "image" ? `ดูรูปที่ ${index + 1}` : "ดูวิดีโอ"}
                            onClick={() => setActiveMediaIndex(index)}
                            className={cn(
                              "relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:h-20 sm:w-28",
                              index === safeIndex
                                ? "ring-2 ring-blue-500"
                                : "hover:border-blue-200",
                            )}
                          >
                            {item.type === "image" ? (
                              <Image
                                src={item.url}
                                alt={`รูปที่ ${index + 1}`}
                                fill
                                sizes="96px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-black/80 text-white">
                                <Video className="h-6 w-6" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="space-y-3 rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
                    <h3 className="text-lg font-semibold text-gray-900">รายละเอียด</h3>
                    <p className="whitespace-pre-line break-words text-sm leading-relaxed text-gray-700">
                      {property.description || "ไม่มีรายละเอียดเพิ่มเติม"}
                    </p>
                  </section>

                  <section className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
                    <h3 className="text-lg font-semibold text-gray-900">ข้อมูลทรัพย์สิน</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
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
                </div>

                <aside className="space-y-6">
                  <section className="space-y-3 rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
                    <h3 className="text-lg font-semibold text-gray-900">แผนที่</h3>
                    {mapUrl ? (
                      <div className="overflow-hidden rounded-xl border">
                        <iframe
                          src={mapUrl}
                          title="ตำแหน่งทรัพย์สิน"
                          className="h-48 w-full border-0 sm:h-56 lg:h-64"
                          loading="lazy"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <div className="flex h-40 w-full items-center justify-center rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
                        ไม่มีพิกัดแผนที่สำหรับประกาศนี้
                      </div>
                    )}
                  </section>

                  <section className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
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

                  <section className="space-y-3 rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
                    <h3 className="text-lg font-semibold text-gray-900">ที่อยู่</h3>
                    <div className="space-y-1 text-sm text-gray-700">
                      <p>{property.address}</p>
                      <p>{[property.city, property.province, property.postal].filter(Boolean).join(" ")}</p>
                    </div>
                  </section>
                </aside>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
