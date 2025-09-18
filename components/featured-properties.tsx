"use client"

import { useMemo, useState } from "react"

import { UserPropertyCard } from "@/components/user-property-card"
import { UserPropertyModal } from "@/components/user-property-modal"
import { useAllUserProperties } from "@/hooks/use-user-properties"
import type { UserProperty } from "@/types/user-property"

export default function FeaturedProperties() {
  const { properties, loading, error } = useAllUserProperties()
  const [selectedProperty, setSelectedProperty] = useState<UserProperty | null>(null)

  const featuredProperties = useMemo(() => properties.slice(0, 3), [properties])

  const handleViewDetails = (property: UserProperty) => {
    setSelectedProperty(property)
  }

  const handleCloseModal = () => {
    setSelectedProperty(null)
  }

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">อสังหาริมทรัพย์แนะนำ</h2>
          <p className="text-gray-600 text-lg">คัดสรรอสังหาริมทรัพย์พิเศษเพื่อคุณ</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => (
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
            ))
          ) : error ? (
            <p className="text-sm text-red-600 lg:col-span-3">{error}</p>
          ) : featuredProperties.length === 0 ? (
            <p className="text-gray-500 lg:col-span-3">ยังไม่มีประกาศที่จะแสดง</p>
          ) : (
            featuredProperties.map((property) => (
              <UserPropertyCard
                key={property.id}
                property={property}
                onViewDetails={handleViewDetails}
              />
            ))
          )}
        </div>
      </div>

      <UserPropertyModal
        open={Boolean(selectedProperty)}
        property={selectedProperty}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseModal()
          }
        }}
      />
    </section>
  )
}
