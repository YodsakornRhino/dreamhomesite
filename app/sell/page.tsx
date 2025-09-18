"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore"

import ChatWidget from "@/components/chat-widget"
import { UserPropertyCard } from "@/components/user-property-card"
import { UserPropertyModal } from "@/components/user-property-modal"
import SellAuthPrompt from "@/components/sell-auth-prompt"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuthContext } from "@/contexts/AuthContext"
import { subscribeToCollection } from "@/lib/firestore"
import type { UserProperty } from "@/types/user-property"

const toStringValue = (value: unknown): string => {
  if (typeof value === "string") return value
  if (typeof value === "number" && Number.isFinite(value)) return value.toString()
  return ""
}

const toOptionalString = (value: unknown): string | null => {
  if (typeof value === "string") return value || null
  if (typeof value === "number" && Number.isFinite(value)) return value.toString()
  return null
}

const toNumberOrNull = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

const toNumberOrZero = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return 0
}

const toIsoString = (value: unknown): string => {
  if (typeof value === "string") return value
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate?: () => Date }).toDate === "function"
  ) {
    const date = (value as { toDate: () => Date }).toDate()
    if (date instanceof Date && !Number.isNaN(date.getTime())) {
      return date.toISOString()
    }
  }
  return ""
}

const parseCreatedAt = (createdAt: string): number => {
  if (!createdAt) return 0
  const time = Date.parse(createdAt)
  return Number.isNaN(time) ? 0 : time
}

const mapDocumentToProperty = (
  doc: QueryDocumentSnapshot<DocumentData>,
): UserProperty => {
  const data = doc.data()
  const photos = Array.isArray(data.photos)
    ? data.photos.filter((item: unknown): item is string => typeof item === "string")
    : []

  return {
    id: doc.id,
    ownerUid: doc.ref.parent?.parent?.id ?? null,
    sellerName: toStringValue(data.sellerName),
    sellerPhone: toStringValue(data.sellerPhone),
    sellerEmail: toStringValue(data.sellerEmail),
    sellerRole: toStringValue(data.sellerRole),
    title: toStringValue(data.title),
    propertyType: toStringValue(data.propertyType),
    transactionType: toStringValue(data.transactionType),
    price: toNumberOrZero(data.price),
    address: toStringValue(data.address),
    city: toStringValue(data.city),
    province: toStringValue(data.province),
    postal: toStringValue(data.postal),
    lat: toNumberOrNull(data.lat),
    lng: toNumberOrNull(data.lng),
    landArea: toStringValue(data.landArea),
    usableArea: toStringValue(data.usableArea),
    bedrooms: toStringValue(data.bedrooms),
    bathrooms: toStringValue(data.bathrooms),
    parking: toOptionalString(data.parking),
    yearBuilt: toOptionalString(data.yearBuilt),
    description: toStringValue(data.description),
    photos,
    video:
      typeof data.video === "string" && data.video.trim().length > 0
        ? data.video
        : null,
    createdAt: toIsoString(data.createdAt),
  }
}

export default function SellDashboardPage() {
  const { user, loading } = useAuthContext()
  const [properties, setProperties] = useState<UserProperty[]>([])
  const [propertiesLoading, setPropertiesLoading] = useState(true)
  const [propertiesError, setPropertiesError] = useState<string | null>(null)
  const [selectedProperty, setSelectedProperty] = useState<UserProperty | null>(null)

  useEffect(() => {
    if (loading) {
      return
    }

    let unsubscribe: (() => void) | undefined
    let isActive = true

    if (!user) {
      setProperties([])
      setSelectedProperty(null)
      setPropertiesError(null)
      setPropertiesLoading(false)
      return
    }

    setPropertiesLoading(true)
    setPropertiesError(null)

    const loadProperties = async () => {
      try {
        unsubscribe = await subscribeToCollection(
          `users/${user.uid}/user_property`,
          (docs) => {
            if (!isActive) return
            const mapped = docs.map(mapDocumentToProperty)
            mapped.sort(
              (a, b) => parseCreatedAt(b.createdAt) - parseCreatedAt(a.createdAt),
            )
            setProperties(mapped)
            setPropertiesLoading(false)
          },
        )
      } catch (error) {
        console.error("Failed to load user properties:", error)
        if (!isActive) return
        setProperties([])
        setPropertiesError("ไม่สามารถโหลดประกาศของคุณได้ กรุณาลองใหม่อีกครั้ง")
        setPropertiesLoading(false)
      }
    }

    void loadProperties()

    return () => {
      isActive = false
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [user, loading])

  const handleViewDetails = (property: UserProperty) => {
    setSelectedProperty(property)
  }

  const handleModalChange = (open: boolean) => {
    if (!open) {
      setSelectedProperty(null)
    }
  }

  if (loading) return null
  if (!user) return <SellAuthPrompt />

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold">ประกาศขายของฉัน</h1>
        <div className="flex gap-2">
          <Link href="/sell/create">
            <Button>สร้างประกาศ</Button>
          </Link>
        </div>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>ประกาศของคุณ</CardTitle>
        </CardHeader>
        <CardContent>
          {propertiesLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="flex h-full flex-col overflow-hidden rounded-2xl border bg-white p-4 shadow-sm animate-pulse"
                >
                  <div className="mb-4 h-40 w-full rounded-xl bg-gray-200" />
                  <div className="space-y-3">
                    <div className="h-4 w-3/4 rounded bg-gray-200" />
                    <div className="h-4 w-1/2 rounded bg-gray-200" />
                    <div className="h-4 w-full rounded bg-gray-200" />
                  </div>
                </div>
              ))}
            </div>
          ) : propertiesError ? (
            <p className="text-sm text-red-600">{propertiesError}</p>
          ) : properties.length === 0 ? (
            <p className="text-gray-500">คุณยังไม่ได้สร้างประกาศขายใดๆ</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {properties.map((property) => (
                <UserPropertyCard
                  key={property.id}
                  property={property}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ChatWidget />

      <UserPropertyModal
        open={Boolean(selectedProperty)}
        property={selectedProperty}
        onOpenChange={handleModalChange}
      />
    </div>
  )
}
