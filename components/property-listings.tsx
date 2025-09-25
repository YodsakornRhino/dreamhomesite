"use client"

import { useState } from "react"
import PropertyCard from "./property-card"
import PropertyModal from "./property-modal"
import { Grid, List, ChevronLeft, ChevronRight } from "lucide-react"
import MobileFilterDrawer from "./mobile-filter-drawer"

const allProperties = [
  {
    id: 4,
    title: "ลอฟต์ใจกลางเมือง",
    price: "$380,000",
    location: "321 ถนนบรอดเวย์ ใจกลางเมือง",
    beds: 1,
    baths: 1,
    sqft: 750,
    type: "sale" as const,
    gradient: "bg-gradient-to-r from-yellow-400 to-orange-500",
  },
  {
    id: 5,
    title: "วิลล่าสวน",
    price: "$3,200/mo",
    location: "654 ซอยการ์เดน ย่านฝั่งตะวันตก",
    beds: 4,
    baths: 3,
    sqft: 1800,
    type: "rent" as const,
    gradient: "bg-gradient-to-r from-teal-400 to-blue-500",
  },
]

export default function PropertyListings() {
  const [selectedProperty, setSelectedProperty] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedBedrooms, setSelectedBedrooms] = useState<string | null>(null)

  const handleViewDetails = (id: number) => {
    setSelectedProperty(id)
  }

  const handleCloseModal = () => {
    setSelectedProperty(null)
  }

  const handleApplyFilters = () => {
    alert("ใช้ตัวกรองแล้ว! ระบบจะกรองอสังหาริมทรัพย์ตามที่คุณเลือก")
  }

  const handleBedroomFilter = (bedrooms: string) => {
    setSelectedBedrooms(selectedBedrooms === bedrooms ? null : bedrooms)
  }

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-1/4">
            <div className="bg-gray-50 rounded-lg p-4 sm:p-6 sticky top-24">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800">ตัวกรอง</h3>
                <button className="text-blue-600 hover:text-blue-700 text-sm">ล้างทั้งหมด</button>
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
                      />
                      <span className="text-sm sm:text-base">{type}</span>
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
                <select className="px-3 sm:px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base">
                  <option>เรียงโดย: ใหม่ล่าสุด</option>
                  <option>ราคา: จากต่ำไปสูง</option>
                  <option>ราคา: จากสูงไปต่ำ</option>
                  <option>ขนาด: ใหญ่ที่สุดก่อน</option>
                </select>
                <div className="flex border rounded-lg self-start sm:self-auto">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`px-3 py-2 rounded-l-lg transition-colors ${
                      viewMode === "grid" ? "bg-blue-600 text-white" : "hover:bg-gray-50"
                    }`}
                  >
                    <Grid size={16} />
                  </button>
                  <button
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
              {allProperties.map((property) => (
                <PropertyCard key={property.id} {...property} onViewDetails={handleViewDetails} />
              ))}
            </div>

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

      {selectedProperty && <PropertyModal propertyId={selectedProperty} onClose={handleCloseModal} />}

      <MobileFilterDrawer
        selectedBedrooms={selectedBedrooms}
        onBedroomFilter={handleBedroomFilter}
        onApplyFilters={handleApplyFilters}
      />
    </section>
  )
}
