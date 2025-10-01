"use client"

import Image from "next/image"
import Link from "next/link"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Bath, Bed, Heart, MapPin, Square, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { formatPropertyPrice, PROPERTY_TYPE_LABELS, TRANSACTION_LABELS } from "@/lib/property"
import { cn } from "@/lib/utils"
import type { UserProperty } from "@/types/user-property"
import { useAuthContext } from "@/contexts/AuthContext"

interface UserPropertyCardProps {
  property: UserProperty
  onViewDetails: (property: UserProperty) => void
  showEditActions?: boolean
  onDelete?: (property: UserProperty) => void
  isDeleting?: boolean
  showInteractiveElements?: boolean
  className?: string
}

const placeholderGradients: Record<string, string> = {
  house: "from-sky-400 via-blue-500 to-indigo-500",
  condo: "from-purple-400 via-pink-500 to-rose-500",
  land: "from-emerald-400 via-green-500 to-lime-500",
}

export function UserPropertyCard({
  property,
  onViewDetails,
  showEditActions = false,
  onDelete,
  isDeleting = false,
  showInteractiveElements = true,
  className,
}: UserPropertyCardProps) {
  const [isFavorited, setIsFavorited] = useState(false)
  const router = useRouter()
  const { user } = useAuthContext()

  const mainPhoto = property.photos?.[0]
  const transactionLabel = TRANSACTION_LABELS[property.transactionType] ?? property.transactionType
  const typeLabel = PROPERTY_TYPE_LABELS[property.propertyType] ?? property.propertyType
  const isUnderPurchase = property.isUnderPurchase
  const buyerConfirmed = property.buyerConfirmed

  const locationText = useMemo(() => {
    const segments = [property.address, property.city, property.province]
      .map((segment) => segment?.trim())
      .filter(Boolean)
    return segments.join(", ")
  }, [property.address, property.city, property.province])

  const usableAreaValue = useMemo(() => {
    const numeric = Number(property.usableArea)
    if (Number.isFinite(numeric) && numeric > 0) {
      return `${numeric.toLocaleString("th-TH")} ตร.ม.`
    }
    return property.usableArea
  }, [property.usableArea])

  const bedroomsText = useMemo(() => {
    const numeric = Number(property.bedrooms)
    if (Number.isFinite(numeric) && numeric > 0) return numeric
    return property.bedrooms || "-"
  }, [property.bedrooms])

  const bathroomsText = useMemo(() => {
    const numeric = Number(property.bathrooms)
    if (Number.isFinite(numeric) && numeric > 0) return numeric
    return property.bathrooms || "-"
  }, [property.bathrooms])

  const gradient = placeholderGradients[property.propertyType] ?? placeholderGradients.house

  const isPropertyOwner = Boolean(user?.uid && property.userUid === user.uid)
  const isConfirmedBuyer = Boolean(
    user?.uid && property.confirmedBuyerId && property.confirmedBuyerId === user.uid,
  )

  const sendDocumentsHref = property.id
    ? isPropertyOwner
      ? `/sell/send-documents?propertyId=${property.id}`
      : isConfirmedBuyer
        ? `/buy/send-documents?propertyId=${property.id}`
        : null
    : null

  const handleSendDocumentsNavigation = () => {
    if (!sendDocumentsHref) return
    router.push(sendDocumentsHref)
  }

  return (
    <div
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg",
        className,
      )}
    >
      <div className="relative h-48 w-full overflow-hidden">
        {mainPhoto ? (
          <Image
            src={mainPhoto}
            alt={property.title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition duration-300 group-hover:scale-105"
            priority={false}
          />
        ) : (
          <div
            className={cn(
              "flex h-full w-full items-center justify-center bg-gradient-to-r text-white",
              gradient,
            )}
          >
            <div className="rounded-full bg-white/25 p-6">
              <div className="h-8 w-8 rounded-full bg-white/40" />
            </div>
          </div>
        )}

        <span
          className={cn(
            "absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold text-white shadow",
            property.transactionType === "rent" ? "bg-orange-500" : "bg-emerald-500",
          )}
        >
          {transactionLabel}
        </span>

        {isUnderPurchase && (
          <button
            type="button"
            onClick={handleSendDocumentsNavigation}
            disabled={!sendDocumentsHref}
            className={cn(
              "absolute left-4 bottom-4 rounded-full px-3 py-1 text-xs font-semibold text-white shadow transition",
              sendDocumentsHref
                ? "bg-amber-500 hover:bg-amber-600"
                : "cursor-not-allowed bg-amber-400/70",
            )}
          >
            มีคนกำลังซื้อแล้ว
          </button>
        )}

        {showInteractiveElements && (
          <button
            type="button"
            onClick={() => setIsFavorited((prev) => !prev)}
            className="absolute right-4 top-4 rounded-full bg-white p-2 text-gray-500 shadow transition hover:bg-gray-100"
            aria-label={isFavorited ? "นำออกจากรายการโปรด" : "เพิ่มในรายการโปรด"}
          >
            <Heart className={cn("h-4 w-4", isFavorited ? "fill-red-500 text-red-500" : "text-gray-400")} />
          </button>
        )}
      </div>

        <div className="flex flex-1 flex-col gap-4 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-blue-600">{typeLabel}</p>
              <h3 className="text-xl font-semibold text-gray-900">{property.title}</h3>
            </div>
            <span className="shrink-0 text-lg font-bold text-blue-600">
              {formatPropertyPrice(property.price, property.transactionType)}
            </span>
          </div>

          {isUnderPurchase && (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleSendDocumentsNavigation}
                disabled={!sendDocumentsHref}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition",
                  sendDocumentsHref
                    ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                    : "cursor-not-allowed bg-amber-50 text-amber-400",
                )}
              >
                มีคนกำลังซื้อแล้ว
              </button>
              {buyerConfirmed && (
                <button
                  type="button"
                  onClick={handleSendDocumentsNavigation}
                  disabled={!sendDocumentsHref}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition",
                    sendDocumentsHref
                      ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      : "cursor-not-allowed bg-emerald-50 text-emerald-400",
                  )}
                >
                  ผู้ซื้อยืนยันเอกสารแล้ว
                </button>
              )}
            </div>
          )}

        <p className="flex items-center text-sm text-gray-600">
          <MapPin className="mr-2 h-4 w-4 text-blue-500" />
          <span className="truncate" title={locationText}>
            {locationText || property.address || "-"}
          </span>
        </p>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600">
          <span className="flex items-center gap-2">
            <Bed className="h-4 w-4 text-blue-500" />
            {bedroomsText} ห้องนอน
          </span>
          <span className="flex items-center gap-2">
            <Bath className="h-4 w-4 text-blue-500" />
            {bathroomsText} ห้องน้ำ
          </span>
          <span className="flex items-center gap-2">
            <Square className="h-4 w-4 text-blue-500" />
            {usableAreaValue || "-"}
          </span>
        </div>

        {showInteractiveElements && (
          <div className="mt-auto pt-2">
            {showEditActions && onDelete ? (
              <div className="grid w-full grid-cols-[minmax(0,1fr)_minmax(0,1fr)] grid-rows-[repeat(2,minmax(0,1fr))] gap-x-2 gap-y-2">
                <Button
                  className="col-start-1 row-start-1 h-full w-full"
                  onClick={() => onViewDetails(property)}
                  disabled={isDeleting}
                >
                  ดูรายละเอียด
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className={cn(
                    "col-start-1 row-start-2 h-full w-full",
                    isDeleting && "pointer-events-none opacity-50",
                  )}
                >
                  <Link href={`/sell/edit/${property.id}`}>แก้ไขประกาศ</Link>
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  className="col-start-2 row-span-2 flex h-full w-full flex-col items-center justify-center gap-2 text-base font-semibold"
                  onClick={() => onDelete(property)}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    "กำลังลบ..."
                  ) : (
                    <>
                      <Trash2 className="h-5 w-5" />
                      ลบประกาศ
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Button
                  className="w-full"
                  onClick={() => onViewDetails(property)}
                  disabled={isDeleting}
                >
                  ดูรายละเอียด
                </Button>
                {showEditActions && (
                  <Button
                    asChild
                    variant="outline"
                    className={cn(
                      "w-full",
                      isDeleting && "pointer-events-none opacity-50",
                    )}
                  >
                    <Link href={`/sell/edit/${property.id}`}>แก้ไขประกาศ</Link>
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
