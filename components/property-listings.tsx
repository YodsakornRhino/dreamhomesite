"use client"

import { useMemo, useState } from "react"
import { Grid, List, ChevronLeft, ChevronRight } from "lucide-react"

import { UserPropertyCard } from "@/components/user-property-card"
import { UserPropertyModal } from "@/components/user-property-modal"
import MobileFilterDrawer from "@/components/mobile-filter-drawer"
import { useAllUserProperties } from "@/hooks/use-user-properties"
import type { UserProperty } from "@/types/user-property"

const parseBedroomFilter = (value: string | null): number | null => {
  if (!value) return null
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : null
}

export default function PropertyListings() {
  const { properties, loading, error } = useAllUserProperties()
  const [selectedProperty, setSelectedProperty] = useState<UserProperty | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedBedrooms, setSelectedBedrooms] = useState<string | null>(null)

  const handleViewDetails = (property: UserProperty) => {
    setSelectedProperty(property)
  }

  const handleModalChange = (open: boolean) => {
    if (!open) {
      setSelectedProperty(null)
    }
  }

  const handleApplyFilters = () => {
    // TODO: Implement real filters when ready
    // eslint-disable-next-line no-alert
    alert("ใช้ตัวกรองแล้ว! ระบบจะกรองอสังหาริมทรัพย์ตามที่คุณเลือก")
  }

  const handleBedroomFilter = (bedrooms: string) => {
    setSelectedBedrooms((current) => (current === bedrooms ? null : bedrooms))
  }

  const filteredProperties = useMemo(() => {
    const minimumBedrooms = parseBedroomFilter(selectedBedrooms)

    if (minimumBedrooms === null) {
      return properties
    }

    return properties.filter((property) => {
      const numericBedrooms = Number(property.bedrooms)
      if (Number.isFinite(numericBedrooms)) {
        return numericBedrooms >= minimumBedrooms
      }
      return false
    })
  }, [properties, selectedBedrooms])

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-1/4">
            <div className="bg-gray-50 rounded-lg p-4 sm:p-6 sticky top-24">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800">ตัวกรอง</h3>
                <button
                  type="button"
                  onClick={() => setSelectedBedrooms(null)}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  ล้างทั้งหมด
                </button>
              </div>

              {/* Price Range */}
              <div className="mb-4 sm:mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">ช่วงราคา</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="ต่ำสุด"
                    className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <input
                    type="number"
                    placeholder="สูงสุด"
                    className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Property Type */}
              <div className="mb-4 sm:mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">ประเภทอสังหาริมทรัพย์</label>
                <div className="space-y-2">
                  {["บ้าน", "อพาร์ตเมนต์", "คอนโด", "ที่ดิน"].map((type) => (
                    <label key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        disabled
                      />
                      <span className="text-sm sm:text-base text-gray-400">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Bedrooms */}
              <div className="mb-4 sm:mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">จำนวนห้องนอน</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {["1+", "2+", "3+", "4+"].map((bedrooms) => (
                    <button
                      key={bedrooms}
                      type="button"
                      onClick={() => handleBedroomFilter(bedrooms)}
                      className={`px-2 sm:px-3 py-2 border rounded-lg text-sm transition-colors ${
                        selectedBedrooms === bedrooms
                          ? "bg-blue-50 border-blue-300 text-blue-600"
                          : "hover:bg-blue-50 hover:border-blue-300"
                      }`}
                    >
                      {bedrooms}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleApplyFilters}
                className="w-full bg-blue-600 text-white py-2.5 sm:py-2 rounded-lg hover:bg-blue-700 transition text-sm sm:text-base"
              >
                ใช้ตัวกรอง
              </button>
            </div>
          </div>

          {/* Listings */}
          <div className="lg:w-3/4">
            <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">อสังหาริมทรัพย์ทั้งหมด</h2>
              <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-4">
                <select className="px-3 sm:px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base" disabled>
                  <option>เรียงโดย: ใหม่ล่าสุด</option>
                </select>
                <div className="flex border rounded-lg self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    className={`px-3 py-2 rounded-l-lg transition-colors ${
                      viewMode === "grid" ? "bg-blue-600 text-white" : "hover:bg-gray-50"
                    }`}
                  >
                    <Grid size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    className={`px-3 py-2 border-l rounded-r-lg transition-colors ${
                      viewMode === "list" ? "bg-blue-600 text-white" : "hover:bg-gray-50"
                    }`}
                  >
                    <List size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div
              className={`grid gap-4 sm:gap-6 ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}
            >
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex h-full flex-col overflow-hidden rounded-2xl border bg-white p-4 shadow-sm animate-pulse"
                  >
                    <div className="mb-4 h-48 w-full rounded-xl bg-gray-200" />
                    <div className="space-y-3">
                      <div className="h-4 w-3/4 rounded bg-gray-200" />
                      <div className="h-4 w-1/2 rounded bg-gray-200" />
                      <div className="h-4 w-full rounded bg-gray-200" />
                    </div>
                  </div>
                ))
              ) : error ? (
                <p className="text-sm text-red-600 sm:col-span-2 lg:col-span-3">{error}</p>
              ) : filteredProperties.length === 0 ? (
                <p className="text-gray-500 sm:col-span-2 lg:col-span-3">ไม่พบประกาศที่ตรงกับเงื่อนไข</p>
              ) : (
                filteredProperties.map((property) => (
                  <UserPropertyCard
                    key={property.id}
                    property={property}
                    onViewDetails={handleViewDetails}
                  />
                ))
              )}
            </div>

            {/* Pagination */}
            <div className="flex justify-center mt-12">
              <div className="flex items-center space-x-2 text-gray-400">
                <button className="px-3 py-2 border rounded-lg cursor-not-allowed" type="button" disabled>
                  <ChevronLeft size={16} />
                </button>
                <button className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg" type="button" disabled>
                  1
                </button>
                <button className="px-4 py-2 border rounded-lg cursor-not-allowed" type="button" disabled>
                  2
                </button>
                <button className="px-4 py-2 border rounded-lg cursor-not-allowed" type="button" disabled>
                  3
                </button>
                <button className="px-3 py-2 border rounded-lg cursor-not-allowed" type="button" disabled>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <UserPropertyModal
        open={Boolean(selectedProperty)}
        property={selectedProperty}
        onOpenChange={handleModalChange}
      />

      <MobileFilterDrawer
        selectedBedrooms={selectedBedrooms}
        onBedroomFilter={handleBedroomFilter}
        onApplyFilters={handleApplyFilters}
      />
    </section>
  )
}
