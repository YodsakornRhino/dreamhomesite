"use client"

import { useMemo, useState } from "react"

import { useAllUserProperties } from "@/hooks/use-all-user-properties"
import type { UserProperty } from "@/types/user-property"

import { UserPropertyCard } from "./user-property-card"
import { UserPropertyModal } from "./user-property-modal"

export default function FeaturedProperties() {
  const { properties, loading, error } = useAllUserProperties()
  const [selectedProperty, setSelectedProperty] = useState<UserProperty | null>(null)

  const featuredProperties = useMemo(() => properties.slice(0, 3), [properties])

  const handleViewDetails = (property: UserProperty) => {
    setSelectedProperty(property)
  }

  const handleModalChange = (open: boolean) => {
    if (!open) {
      setSelectedProperty(null)
    }
  }

  return (
    <section className="surface-card px-6 py-12 sm:py-16">
      <div className="mb-12 text-center">
        <h2 className="mb-4 text-3xl font-bold text-gray-800 md:text-4xl">อสังหาริมทรัพย์แนะนำ</h2>
        <p className="text-lg text-gray-600">คัดสรรอสังหาริมทรัพย์พิเศษเพื่อคุณ</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm shadow-slate-200/60 animate-pulse"
            >
              <div className="mb-4 h-40 w-full rounded-xl bg-slate-200/80" />
              <div className="space-y-3">
                <div className="h-4 w-3/4 rounded bg-slate-200/80" />
                <div className="h-4 w-1/2 rounded bg-slate-200/80" />
                <div className="h-4 w-full rounded bg-slate-200/80" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <p className="text-center text-sm text-red-600">{error}</p>
      ) : featuredProperties.length === 0 ? (
        <p className="text-center text-gray-500">ยังไม่มีประกาศแนะนำในขณะนี้</p>
      ) : (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {featuredProperties.map((property) => (
            <UserPropertyCard
              key={property.id}
              property={property}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )}

      <UserPropertyModal
        open={Boolean(selectedProperty)}
        property={selectedProperty}
        onOpenChange={handleModalChange}
      />
    </section>
  )
}
