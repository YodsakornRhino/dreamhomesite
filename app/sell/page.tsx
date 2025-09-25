"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

import ChatWidget from "@/components/chat-widget"
import { UserPropertyCard } from "@/components/user-property-card"
import { UserPropertyModal } from "@/components/user-property-modal"
import SellAuthPrompt from "@/components/sell-auth-prompt"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuthContext } from "@/contexts/AuthContext"
import { subscribeToCollection } from "@/lib/firestore"
import { mapDocumentToUserProperty, parseUserPropertyCreatedAt } from "@/lib/user-property-mapper"
import type { UserProperty } from "@/types/user-property"

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
            const mapped = docs.map(mapDocumentToUserProperty)
            mapped.sort(
              (a, b) =>
                parseUserPropertyCreatedAt(b.createdAt) -
                parseUserPropertyCreatedAt(a.createdAt),
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
                  showEditActions
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
