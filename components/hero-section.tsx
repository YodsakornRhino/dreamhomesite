"use client"

import { useEffect, useMemo, useState } from "react"
import { MapPin, Home, DollarSign, Search, LocateFixed } from "lucide-react"

import { PROPERTY_TYPE_LABELS } from "@/lib/property"
import { CURRENT_LOCATION_LABEL, type LocationFilterValue } from "@/types/location-filter"

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
  onUseCurrentLocation: () => void
  isLocatingCurrentLocation: boolean
  locationError?: string | null
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
  onUseCurrentLocation,
  isLocatingCurrentLocation,
  locationError,
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

  const isUsingCurrentLocation = locationFilter?.source === "current"
  const locationStatus = isUsingCurrentLocation
    ? CURRENT_LOCATION_LABEL
    : locationFilter?.label

  return (
    <section className="full-bleed rounded-3xl bg-gradient-to-br from-blue-600 via-purple-600 to-purple-700 px-6 py-12 text-white shadow-2xl sm:px-10 sm:py-16 lg:px-16 lg:py-20">
      <div className="mx-auto max-w-5xl text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
          ค้นหาบ้านในฝันของคุณ
        </h1>
        <p className="text-lg sm:text-xl md:text-2xl mb-6 sm:mb-8 opacity-90 max-w-3xl mx-auto">
          ค้นหาอสังหาริมทรัพย์ที่เหมาะสมในทำเลที่คุณต้องการ
        </p>

        {/* Search Bar */}
        <div className="mx-auto w-full max-w-5xl rounded-2xl bg-white/95 p-3 shadow-2xl shadow-blue-900/20 backdrop-blur sm:p-4 md:p-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:gap-5 lg:[grid-template-columns:minmax(0,1.75fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
            {/* Location */}
            <div className="flex flex-col gap-2">
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
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-[13px]">
                <button
                  type="button"
                  onClick={onOpenLocationPicker}
                  className="inline-flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 font-medium text-blue-600 transition hover:bg-blue-100"
                >
                  <LocateFixed size={14} />
                  เลือกบนแผนที่
                </button>
                <button
                  type="button"
                  onClick={onUseCurrentLocation}
                  disabled={isLocatingCurrentLocation}
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 font-medium transition ${
                    isLocatingCurrentLocation
                      ? "border-blue-200 bg-blue-100 text-blue-400"
                      : "border-blue-100 bg-white text-blue-600 hover:bg-blue-50"
                  }`}
                >
                  <LocateFixed size={14} />
                  {isLocatingCurrentLocation ? "กำลังระบุตำแหน่ง..." : "ใช้ตำแหน่งปัจจุบัน"}
                </button>
                {locationFilter ? (
                  <div className="flex w-full flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white sm:text-sm">
                        {`ในรัศมี ${locationFilter.radiusKm.toLocaleString()} กม.`}
                      </span>
                      {locationStatus ? (
                        isUsingCurrentLocation ? (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 sm:text-sm">
                            {locationStatus}
                          </span>
                        ) : (
                          <span className="flex min-w-0 items-center text-left text-sm font-medium text-blue-700 sm:text-base">
                            <span className="truncate">{locationStatus}</span>
                          </span>
                        )
                      ) : null}
                      <button
                        type="button"
                        onClick={onClearLocation}
                        className="inline-flex items-center rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-red-700 sm:text-sm"
                      >
                        ล้างตำแหน่ง
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="w-full text-left text-gray-500">
                    ปักหมุดหรือใช้ GPS เพื่อค้นหาทรัพย์ใกล้ตำแหน่งที่สนใจ
                  </p>
                )}
                {locationError ? (
                  <p className="w-full text-left text-red-200">
                    {locationError}
                  </p>
                ) : null}
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
              className="flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 sm:px-6 sm:py-2 sm:text-base lg:h-full"
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
