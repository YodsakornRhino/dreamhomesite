"use client"

import { useEffect, useState } from "react"
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore"

import { subscribeToCollectionGroup } from "@/lib/firestore"
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
    id: doc.ref.path,
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

export const useAllUserProperties = () => {
  const [properties, setProperties] = useState<UserProperty[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    let isActive = true

    setLoading(true)
    setError(null)

    const subscribe = async () => {
      try {
        unsubscribe = await subscribeToCollectionGroup("user_property", (docs) => {
          if (!isActive) return
          const mapped = docs.map(mapDocumentToProperty)
          mapped.sort((a, b) => parseCreatedAt(b.createdAt) - parseCreatedAt(a.createdAt))
          setProperties(mapped)
          setLoading(false)
        })
      } catch (err) {
        console.error("Failed to load properties:", err)
        if (!isActive) return
        setProperties([])
        setError("ไม่สามารถโหลดรายการประกาศได้ กรุณาลองใหม่อีกครั้ง")
        setLoading(false)
      }
    }

    void subscribe()

    return () => {
      isActive = false
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  return { properties, loading, error }
}

