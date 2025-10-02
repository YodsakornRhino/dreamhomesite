"use client"

import { useEffect, useMemo, useState } from "react"
import { MapPin, Home, DollarSign, Search, LocateFixed } from "lucide-react"

import { PROPERTY_TYPE_LABELS } from "@/lib/property"
import type { LocationFilterValue } from "@/types/location-filter"

interface PriceRange {
  min: number | null
  max: number | null
}

interface HeroSectionProps {
  searchTerm: string
  selectedPropertyType: string | null
  priceRange: PriceRange
  locationFilter: LocationFilterValue | null
  onSearch: (filters: {
    searchTerm: string
    propertyType: string | null
    priceRange: PriceRange
    location: LocationFilterValue | null
  }) => void
  onOpenLocationPicker: () => void
  onClearLocation: () => void
}

const PRICE_RANGE_OPTIONS = [
  { value: "", label: "ช่วงราคา (ทั้งหมด)" },
  { value: "0-2000000", label: "0 - 2,000,000 ฿", min: 0, max: 2_000_000 },
  { value: "2000000-5000000", label: "2,000,000 - 5,000,000 ฿", min: 2_000_000, max: 5_000_000 },
  { value: "5000000-10000000", label: "5,000,000 - 10,000,000 ฿", min: 5_000_000, max: 10_000_000 },
  { value: "10000000+", label: "10,000,000 ฿ ขึ้นไป", min: 10_000_000, max: null },
]

const findPriceRangeValue = (range: PriceRange) => {
  const option = PRICE_RANGE_OPTIONS.find(
    ({ min, max }) => min === range.min && max === range.max,
  )
  return option?.value ?? ""
}

const parsePriceRangeValue = (value: string): PriceRange => {
  const option = PRICE_RANGE_OPTIONS.find((item) => item.value === value)
  if (!option) return { min: null, max: null }
  return { min: option.min ?? null, max: option.max ?? null }
}

export default function HeroSection({
  searchTerm,
  selectedPropertyType,
  priceRange,
  locationFilter,
  onSearch,
  onOpenLocationPicker,
  onClearLocation,
}: HeroSectionProps) {
  const [location, setLocation] = useState(searchTerm)
  const [propertyType, setPropertyType] = useState<string>(selectedPropertyType ?? "")
  const [selectedPriceRange, setSelectedPriceRange] = useState(() => findPriceRangeValue(priceRange))

  const propertyTypeOptions = useMemo(
    () => [
      { value: "", label: "ประเภททั้งหมด" },
      ...Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => ({ value, label })),
    ],
    [],
  )

  useEffect(() => {
    setLocation(searchTerm)
  }, [searchTerm])

  useEffect(() => {
    setPropertyType(selectedPropertyType ?? "")
  }, [selectedPropertyType])

  useEffect(() => {
    setSelectedPriceRange(findPriceRangeValue(priceRange))
  }, [priceRange])

  const handleSubmit = () => {
    onSearch({
      searchTerm: location.trim(),
      propertyType: propertyType || null,
      priceRange: parsePriceRangeValue(selectedPriceRange),
      location: locationFilter,
    })
  }

  return (
    <section className="bg-gradient-to-br from-blue-600 via-purple-600 to-purple-700 text-white py-12 sm:py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
          ค้นหาบ้านในฝันของคุณ
        </h1>
        <p className="text-lg sm:text-xl md:text-2xl mb-6 sm:mb-8 opacity-90 max-w-3xl mx-auto">
          ค้นหาอสังหาริมทรัพย์ที่เหมาะสมในทำเลที่คุณต้องการ
        </p>

        {/* Search Bar */}
        <div className="bg-white rounded-lg p-3 sm:p-4 md:p-6 shadow-2xl max-w-4xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Location */}
            <div className="space-y-2">
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-gray-400" size={16} />
                <input
                  type="text"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="ทำเลหรือคำค้นหา"
                  className="w-full pl-10 pr-4 py-2.5 sm:py-2 bg-white dark:bg-white text-gray-900 placeholder-gray-400 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={onOpenLocationPicker}
                  className="inline-flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600 transition hover:bg-blue-100"
                >
                  <LocateFixed size={14} />
                  เลือกบนแผนที่
                </button>
                {locationFilter ? (
                  <>
                    <span className="inline-flex items-center rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white">
                      {`ในรัศมี ${locationFilter.radiusKm.toLocaleString()} กม.`}
                    </span>
                    <button
                      type="button"
                      onClick={onClearLocation}
                      className="text-xs font-medium text-blue-100 hover:text-white"
                    >
                      ล้างตำแหน่ง
                    </button>
                    <p className="w-full text-left text-xs text-blue-100">
                      {locationFilter.label}
                    </p>
                  </>
                ) : (
                  <p className="w-full text-left text-xs text-gray-500">
                    ปักหมุดเพื่อค้นหาทรัพย์ใกล้ตำแหน่งที่สนใจ
                  </p>
                )}
              </div>
            </div>

            {/* Property Type */}
            <div className="relative">
              <Home className="absolute left-3 top-3 text-gray-400" size={16} />
              <select
                value={propertyType}
                onChange={(event) => setPropertyType(event.target.value)}
                className="w-full pl-10 pr-4 py-2.5 sm:py-2 bg-white dark:bg-white text-gray-900 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base appearance-none"
              >
                {propertyTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 text-gray-400" size={16} />
              <select
                value={selectedPriceRange}
                onChange={(event) => setSelectedPriceRange(event.target.value)}
                className="w-full pl-10 pr-4 py-2.5 sm:py-2 bg-white dark:bg-white text-gray-900 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base appearance-none"
              >
                {PRICE_RANGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Button */}
            <button
              onClick={handleSubmit}
              className="bg-blue-600 text-white px-4 sm:px-6 py-2.5 sm:py-2 rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center text-sm sm:text-base"
            >
              <Search className="mr-2" size={16} />
              ค้นหา
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
