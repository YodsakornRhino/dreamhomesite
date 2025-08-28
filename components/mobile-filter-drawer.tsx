"use client"

import { useState } from "react"
import { Filter, X } from "lucide-react"

interface MobileFilterDrawerProps {
  selectedBedrooms: string | null
  onBedroomFilter: (bedrooms: string) => void
  onApplyFilters: () => void
}

export default function MobileFilterDrawer({
  selectedBedrooms,
  onBedroomFilter,
  onApplyFilters,
}: MobileFilterDrawerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleDrawer = () => {
    setIsOpen(!isOpen)
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
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Filters</h3>
              <button onClick={toggleDrawer} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            {/* Price Range */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900 font-medium"
                />
                <input
                  type="number"
                  placeholder="Max"
                  className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900 font-medium"
                />
              </div>
            </div>

            {/* Property Type */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Property Type</label>
              <div className="space-y-3">
                {["House", "Apartment", "Condo", "Land"].map((type) => (
                  <label key={type} className="flex items-center">
                    <input type="checkbox" className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-base text-gray-900 font-medium">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Bedrooms */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms</label>
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
                onClick={toggleDrawer}
                className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onApplyFilters()
                  toggleDrawer()
                }}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
