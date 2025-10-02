"use client"

import { useMemo, useState } from "react"
import { Filter, X } from "lucide-react"

import { PROPERTY_TYPE_LABELS } from "@/lib/property"

type PriceChangeType = "min" | "max"

interface MobileFilterDrawerProps {
  selectedBedrooms: string | null
  onBedroomFilter: (bedrooms: string) => void
  selectedPropertyType: string | null
  onPropertyTypeChange: (value: string | null) => void
  minPrice: string
  maxPrice: string
  onPriceRangeChange: (type: PriceChangeType, value: string) => void
  onApplyFilters: () => void
  onClearFilters: () => void
}

export default function MobileFilterDrawer({
  selectedBedrooms,
  onBedroomFilter,
  selectedPropertyType,
  onPropertyTypeChange,
  minPrice,
  maxPrice,
  onPriceRangeChange,
  onApplyFilters,
  onClearFilters,
}: MobileFilterDrawerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const propertyTypeOptions = useMemo(
    () => Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => ({ value, label })),
    [],
  )

  const toggleDrawer = () => {
    setIsOpen(!isOpen)
  }

  const handlePropertyTypeToggle = (propertyType: string) => {
    onPropertyTypeChange(selectedPropertyType === propertyType ? null : propertyType)
  }

  const handlePriceChange = (type: PriceChangeType, value: string) => {
    onPriceRangeChange(type, value)
  }

  return (
    <>
      {/* Mobile Filter Button */}
      <button
        onClick={toggleDrawer}
        className="lg:hidden fixed bottom-32 left-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-40"
      >
        <Filter size={20} />
      </button>

      {/* Mobile Filter Drawer */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-white bg-opacity-50" onClick={toggleDrawer} />

          {/* Drawer */}
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">ตัวกรอง</h3>
                <button
                  onClick={() => {
                    onClearFilters()
                  }}
                  className="mt-1 text-sm text-blue-600 hover:text-blue-700"
                >
                  ล้างทั้งหมด
                </button>
              </div>
              <button onClick={toggleDrawer} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            {/* Price Range */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">ช่วงราคา</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={minPrice}
                  onChange={(event) => handlePriceChange("min", event.target.value)}
                  placeholder="ต่ำสุด"
                  className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900 font-medium"
                />
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(event) => handlePriceChange("max", event.target.value)}
                  placeholder="สูงสุด"
                  className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900 font-medium"
                />
              </div>
            </div>

            {/* Property Type */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">ประเภทอสังหาริมทรัพย์</label>
              <div className="space-y-3">
                {propertyTypeOptions.map((option) => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={selectedPropertyType === option.value}
                      onChange={() => handlePropertyTypeToggle(option.value)}
                    />
                    <span className="text-base font-medium text-gray-900">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Bedrooms */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">จำนวนห้องนอน</label>
              <div className="grid grid-cols-2 gap-2">
                {["1+", "2+", "3+", "4+"].map((bedrooms) => (
                  <button
                    key={bedrooms}
                    onClick={() => onBedroomFilter(bedrooms)}
                    className={`px-4 py-3 border rounded-lg text-sm transition-colors font-medium ${
                      selectedBedrooms === bedrooms
                        ? "bg-blue-50 border-blue-300 text-blue-600"
                        : "hover:bg-blue-50 hover:border-blue-300 text-gray-900"
                    }`}
                  >
                    {bedrooms}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  onClearFilters()
                  toggleDrawer()
                }}
                className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition font-semibold"
              >
                ล้างทั้งหมด
              </button>
              <button
                onClick={() => {
                  onApplyFilters()
                  toggleDrawer()
                }}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                ใช้ตัวกรอง
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
