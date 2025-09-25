"use client"

import { useMemo, useState } from "react"
import { Grid, List, ChevronLeft, ChevronRight } from "lucide-react"

import { useAllUserProperties } from "@/hooks/use-all-user-properties"
import type { UserProperty } from "@/types/user-property"

import MobileFilterDrawer from "./mobile-filter-drawer"
import { UserPropertyCard } from "./user-property-card"
import { UserPropertyModal } from "./user-property-modal"

const BEDROOM_OPTIONS = ["1+", "2+", "3+", "4+"]

export default function PropertyListings() {
  const { properties, loading, error } = useAllUserProperties()
  const [selectedProperty, setSelectedProperty] = useState<UserProperty | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedBedrooms, setSelectedBedrooms] = useState<string | null>(null)

  const filteredProperties = useMemo(() => {
    if (!selectedBedrooms) return properties

    const minBedrooms = parseInt(selectedBedrooms, 10)
    if (!Number.isFinite(minBedrooms)) return properties

    return properties.filter((property) => {
      const numericBedrooms = Number(property.bedrooms)
      return Number.isFinite(numericBedrooms) && numericBedrooms >= minBedrooms
    })
  }, [properties, selectedBedrooms])

  const handleViewDetails = (property: UserProperty) => {
    setSelectedProperty(property)
  }

  const handleModalChange = (open: boolean) => {
    if (!open) {
      setSelectedProperty(null)
    }
  }

  const handleApplyFilters = () => {
    alert("ใช้ตัวกรองแล้ว! ระบบจะกรองอสังหาริมทรัพย์ตามที่คุณเลือก")
  }

  const handleBedroomFilter = (bedrooms: string) => {
    setSelectedBedrooms(selectedBedrooms === bedrooms ? null : bedrooms)
  }

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-1/4">
            <div className="sticky top-24 rounded-lg bg-gray-50 p-4 sm:p-6">
              <div className="mb-4 flex items-center justify-between sm:mb-6">
                <h3 className="text-lg font-semibold text-gray-800 sm:text-xl">ตัวกรอง</h3>
                <button
                  className="text-sm text-blue-600 hover:text-blue-700"
                  onClick={() => setSelectedBedrooms(null)}
                >
                  ล้างทั้งหมด
                </button>
              </div>

              {/* Price Range */}
              <div className="mb-4 sm:mb-6">
                <label className="mb-2 block text-sm font-medium text-gray-700">ช่วงราคา</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="ต่ำสุด"
                    className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="สูงสุด"
                    className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Property Type */}
              <div className="mb-4 sm:mb-6">
                <label className="mb-2 block text-sm font-medium text-gray-700">ประเภทอสังหาริมทรัพย์</label>
                <div className="space-y-2">
                  {["บ้าน", "อพาร์ตเมนต์", "คอนโด", "ที่ดิน"].map((type) => (
                    <label key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        disabled
                      />
                      <span className="text-sm sm:text-base">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Bedrooms */}
              <div className="mb-4 sm:mb-6">
                <label className="mb-2 block text-sm font-medium text-gray-700">จำนวนห้องนอน</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {BEDROOM_OPTIONS.map((bedrooms) => (
                    <button
                      key={bedrooms}
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
                onClick={handleApplyFilters}
                className="w-full rounded-lg bg-blue-600 py-2.5 text-sm text-white transition hover:bg-blue-700 sm:py-2 sm:text-base"
              >
                ใช้ตัวกรอง
              </button>
            </div>
          </div>

          {/* Listings */}
          <div className="lg:w-3/4">
            <div className="mb-6 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <h2 className="text-xl font-bold text-gray-800 sm:text-2xl">อสังหาริมทรัพย์ทั้งหมด</h2>
              <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
                <select className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:px-4 sm:text-base">
                  <option>เรียงโดย: ใหม่ล่าสุด</option>
                  <option>ราคา: จากต่ำไปสูง</option>
                  <option>ราคา: จากสูงไปต่ำ</option>
                  <option>ขนาด: ใหญ่ที่สุดก่อน</option>
                </select>
                <div className="flex self-start rounded-lg border sm:self-auto">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`rounded-l-lg px-3 py-2 transition-colors ${
                      viewMode === "grid" ? "bg-blue-600 text-white" : "hover:bg-gray-50"
                    }`}
                  >
                    <Grid size={16} />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`rounded-r-lg border-l px-3 py-2 transition-colors ${
                      viewMode === "list" ? "bg-blue-600 text-white" : "hover:bg-gray-50"
                    }`}
                  >
                    <List size={16} />
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
                {Array.from({ length: 4 }).map((_, index) => (
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
            ) : error ? (
              <p className="text-sm text-red-600">{error}</p>
            ) : filteredProperties.length === 0 ? (
              <p className="text-gray-500">ไม่พบอสังหาริมทรัพย์ที่ตรงกับการค้นหาของคุณ</p>
            ) : (
              <div
                className={`grid gap-4 sm:gap-6 ${
                  viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
                }`}
              >
                {filteredProperties.map((property) => (
                  <UserPropertyCard
                    key={property.id}
                    property={property}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            <div className="flex justify-center mt-12">
              <div className="flex items-center space-x-2">
                <button className="px-3 py-2 border rounded-lg hover:bg-gray-50 transition-colors">
                  <ChevronLeft size={16} />
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">1</button>
                <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors">2</button>
                <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors">3</button>
                <button className="px-3 py-2 border rounded-lg hover:bg-gray-50 transition-colors">
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
