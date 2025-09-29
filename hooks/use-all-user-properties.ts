"use client"

import { useEffect, useState } from "react"

import { subscribeToCollection } from "@/lib/firestore"
import {
  mapDocumentToUserProperty,
  parseUserPropertyCreatedAt,
} from "@/lib/user-property-mapper"
import type { UserProperty } from "@/types/user-property"

interface UseAllUserPropertiesResult {
  properties: UserProperty[]
  loading: boolean
  error: string | null
}

export function useAllUserProperties(): UseAllUserPropertiesResult {
  const [properties, setProperties] = useState<UserProperty[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    let isActive = true

    const loadProperties = async () => {
      setLoading(true)
      setError(null)

      try {
        unsubscribe = await subscribeToCollection({
          collectionPath: "property",
          onNext: (docs) => {
            if (!isActive) return

            const mapped = docs.map(mapDocumentToUserProperty)
            mapped.sort(
              (a, b) =>
                parseUserPropertyCreatedAt(b.createdAt) -
                parseUserPropertyCreatedAt(a.createdAt),
            )

            setProperties(mapped)
            setLoading(false)
          },
          onError: () => {
            if (!isActive) return
            setProperties([])
            setError("ไม่สามารถโหลดรายการอสังหาริมทรัพย์ได้ กรุณาลองใหม่อีกครั้ง")
            setLoading(false)
          },
        })
      } catch (error) {
        console.error("Failed to load properties:", error)
        if (!isActive) return
        setProperties([])
        setError("ไม่สามารถโหลดรายการอสังหาริมทรัพย์ได้ กรุณาลองใหม่อีกครั้ง")
        setLoading(false)
      }
    }

    void loadProperties()

    return () => {
      isActive = false
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  return { properties, loading, error }
}
