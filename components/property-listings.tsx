"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, Grid, List, Search as SearchIcon } from "lucide-react"

import { PROPERTY_TYPE_LABELS } from "@/lib/property"
import { useAllUserProperties } from "@/hooks/use-all-user-properties"
import type { UserProperty } from "@/types/user-property"
import type { LocationFilterValue } from "@/types/location-filter"

import MobileFilterDrawer from "./mobile-filter-drawer"
import { UserPropertyCard } from "./user-property-card"
import { UserPropertyModal } from "./user-property-modal"

const BEDROOM_OPTIONS = ["1+", "2+", "3+", "4+"] as const

type SortOption = "newest" | "price-asc" | "price-desc" | "area-desc"

type PriceChangeType = "min" | "max"

interface PropertyListingsProps {
  searchTerm: string
  onSearchTermChange: (value: string) => void
  selectedPropertyType: string | null
  onPropertyTypeChange: (value: string | null) => void
  minPrice: string
  maxPrice: string
  onPriceRangeChange: (type: PriceChangeType, value: string) => void
  selectedBedrooms: string | null
  onBedroomFilter: (bedrooms: string) => void
  onClearFilters: () => void
  onFiltersApplied?: () => void
  currentPage: number
  onPageChange: (page: number) => void
  itemsPerPage?: number
  locationFilter: LocationFilterValue | null
  onOpenLocationPicker: () => void
  onClearLocation: () => void
}

const parseNumericInput = (value: string): number | null => {
  if (!value) return null
  const numericValue = Number(value.replace(/,/g, ""))
  return Number.isFinite(numericValue) ? numericValue : null
}

const parseBedrooms = (value: string | null): number | null => {
  if (!value) return null
  const numericValue = parseInt(value, 10)
  return Number.isFinite(numericValue) ? numericValue : null
}

const parseArea = (value: string): number | null => {
  if (!value) return null
  const numericValue = Number(value.replace(/[^0-9.]/g, ""))
  return Number.isFinite(numericValue) ? numericValue : null
}

interface Coordinates {
  lat: number
  lng: number
}

const EARTH_RADIUS_KM = 6371

const toRadians = (degrees: number) => (degrees * Math.PI) / 180

const calculateDistanceKm = (origin: Coordinates, target: Coordinates) => {
  const dLat = toRadians(target.lat - origin.lat)
  const dLng = toRadians(target.lng - origin.lng)
  const lat1 = toRadians(origin.lat)
  const lat2 = toRadians(target.lat)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_KM * c
}

const propertyTypeOptions = Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}))

const buildPageRange = (current: number, total: number) => {
  const visiblePages = 5
  let start = Math.max(1, current - Math.floor(visiblePages / 2))
  let end = Math.min(total, start + visiblePages - 1)

  if (end - start + 1 < visiblePages) {
    start = Math.max(1, end - visiblePages + 1)
  }

  const pages: number[] = []
  for (let page = start; page <= end; page += 1) {
    pages.push(page)
  }
  return pages
}

export default function PropertyListings({
  searchTerm,
  onSearchTermChange,
  selectedPropertyType,
  onPropertyTypeChange,
  minPrice,
  maxPrice,
  onPriceRangeChange,
  selectedBedrooms,
  onBedroomFilter,
  onClearFilters,
  onFiltersApplied,
  currentPage,
  onPageChange,
  itemsPerPage = 6,
  locationFilter,
  onOpenLocationPicker,
  onClearLocation,
}: PropertyListingsProps) {
  const { properties, loading, error } = useAllUserProperties()
  const [selectedProperty, setSelectedProperty] = useState<UserProperty | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortOption, setSortOption] = useState<SortOption>("newest")

  const bedroomFilterValue = useMemo(() => parseBedrooms(selectedBedrooms), [selectedBedrooms])

  const filteredProperties = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    const minPriceValue = parseNumericInput(minPrice)
    const maxPriceValue = parseNumericInput(maxPrice)

    const filtered = properties.filter((property) => {
      if (normalizedSearch) {
        const haystack = [property.title, property.address, property.city, property.province]
          .map((value) => value?.toLowerCase() ?? "")
        const matchesSearch = haystack.some((value) => value.includes(normalizedSearch))
        if (!matchesSearch) {
          return false
        }
      }

      if (locationFilter) {
        if (property.lat == null || property.lng == null) {
          return false
        }

        const distance = calculateDistanceKm(
          { lat: locationFilter.lat, lng: locationFilter.lng },
          { lat: property.lat, lng: property.lng },
        )

        if (!Number.isFinite(distance) || distance > locationFilter.radiusKm) {
          return false
        }
      }

      if (selectedPropertyType && property.propertyType !== selectedPropertyType) {
        return false
      }

      if (bedroomFilterValue !== null) {
        const numericBedrooms = Number(property.bedrooms)
        if (!Number.isFinite(numericBedrooms) || numericBedrooms < bedroomFilterValue) {
          return false
        }
      }

      if (minPriceValue !== null && property.price < minPriceValue) {
        return false
      }

      if (maxPriceValue !== null && property.price > maxPriceValue) {
        return false
      }

      return true
    })

    if (sortOption === "newest") {
      return filtered
    }

    return filtered.sort((a, b) => {
      switch (sortOption) {
        case "price-asc":
          return a.price - b.price
        case "price-desc":
          return b.price - a.price
        case "area-desc": {
          const areaA = parseArea(a.usableArea) ?? 0
          const areaB = parseArea(b.usableArea) ?? 0
          return areaB - areaA
        }
        default:
          return 0
      }
    })
  }, [
    properties,
    searchTerm,
    selectedPropertyType,
    bedroomFilterValue,
    minPrice,
    maxPrice,
    sortOption,
    locationFilter,
  ])

  const totalResults = filteredProperties.length
  const totalPages = Math.max(1, Math.ceil(totalResults / itemsPerPage))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * itemsPerPage
  const paginatedProperties = filteredProperties.slice(startIndex, startIndex + itemsPerPage)
  const pageNumbers = useMemo(() => buildPageRange(safeCurrentPage, totalPages), [safeCurrentPage, totalPages])

  useEffect(() => {
    if (currentPage !== safeCurrentPage) {
      onPageChange(safeCurrentPage)
    }
  }, [currentPage, safeCurrentPage, onPageChange])

  const handleViewDetails = (property: UserProperty) => {
    setSelectedProperty(property)
  }

  const handleModalChange = (open: boolean) => {
    if (!open) {
      setSelectedProperty(null)
    }
  }

  const handleApplyFilters = () => {
    onFiltersApplied?.()
  }

  const handleBedroomFilter = (bedrooms: string) => {
    onBedroomFilter(bedrooms)
  }

  const handlePropertyTypeToggle = (propertyType: string) => {
    onPropertyTypeChange(selectedPropertyType === propertyType ? null : propertyType)
  }

  const handlePriceChange = (type: PriceChangeType, value: string) => {
    onPriceRangeChange(type, value)
  }

  return (
    <section id="property-listings" className="bg-white py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Filters Sidebar */}
          <div className="lg:w-1/4">
            <div className="sticky top-24 rounded-lg bg-gray-50 p-4 sm:p-6">
              <div className="mb-4 flex items-center justify-between sm:mb-6">
                <h3 className="text-lg font-semibold text-gray-800 sm:text-xl">ตัวกรอง</h3>
                <button
                  className="text-sm text-blue-600 hover:text-blue-700"
                  onClick={onClearFilters}
                >
                  ล้างทั้งหมด
                </button>
              </div>

              {/* Location Filter */}
              <div className="mb-4 sm:mb-6">
                <label className="mb-2 block text-sm font-medium text-gray-700">พื้นที่การค้นหา</label>
                {locationFilter ? (
                  <div className="space-y-3 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-700">
                    <p className="font-medium">
                      ค้นหาในรัศมี {locationFilter.radiusKm.toLocaleString()} กม.
                    </p>
                    <p className="text-xs text-blue-600 sm:text-sm">{locationFilter.label}</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={onOpenLocationPicker}
                        className="rounded-lg bg-white px-3 py-1 text-xs font-medium text-blue-600 shadow-sm transition hover:bg-blue-100"
                      >
                        ปรับตำแหน่ง
                      </button>
                      <button
                        type="button"
                        onClick={onClearLocation}
                        className="rounded-lg border border-transparent px-3 py-1 text-xs font-medium text-blue-600 transition hover:border-blue-200 hover:bg-white"
                      >
                        ล้างตำแหน่ง
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={onOpenLocationPicker}
                    className="w-full rounded-lg border border-dashed border-blue-300 bg-white px-4 py-3 text-sm font-medium text-blue-600 transition hover:bg-blue-50"
                  >
                    ปักหมุดบนแผนที่เพื่อค้นหาใกล้เคียง
                  </button>
                )}
              </div>

              {/* Price Range */}
              <div className="mb-4 sm:mb-6">
                <label className="mb-2 block text-sm font-medium text-gray-700">ช่วงราคา</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={minPrice}
                    onChange={(event) => handlePriceChange("min", event.target.value)}
                    placeholder="ต่ำสุด"
                    className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    inputMode="numeric"
                    value={maxPrice}
                    onChange={(event) => handlePriceChange("max", event.target.value)}
                    placeholder="สูงสุด"
                    className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Property Type */}
              <div className="mb-4 sm:mb-6">
                <label className="mb-2 block text-sm font-medium text-gray-700">ประเภทอสังหาริมทรัพย์</label>
                <div className="space-y-2">
                  {propertyTypeOptions.map((option) => (
                    <label key={option.value} className="flex items-center">
                      <input
                        type="checkbox"
                        className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={selectedPropertyType === option.value}
                        onChange={() => handlePropertyTypeToggle(option.value)}
                      />
                      <span className="text-sm sm:text-base">{option.label}</span>
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
                          ? "border-blue-300 bg-blue-50 text-blue-600"
                          : "hover:border-blue-300 hover:bg-blue-50"
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
              <div>
                <h2 className="text-xl font-bold text-gray-800 sm:text-2xl">อสังหาริมทรัพย์ทั้งหมด</h2>
                <p className="mt-1 text-sm text-gray-500">
                  {loading
                    ? "กำลังโหลดรายการ..."
                    : `พบ ${totalResults.toLocaleString("th-TH") || 0} รายการ`}
                </p>
                {locationFilter && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                    <span className="rounded-full bg-blue-100 px-3 py-1 font-medium text-blue-700">
                      ภายใน {locationFilter.radiusKm.toLocaleString()} กม.
                    </span>
                    <span className="text-blue-600">{locationFilter.label}</span>
                    <button
                      type="button"
                      onClick={onClearLocation}
                      className="text-blue-500 underline-offset-4 hover:underline"
                    >
                      ล้างตำแหน่ง
                    </button>
                  </div>
                )}
              </div>
              <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(event) => onSearchTermChange(event.target.value)}
                    placeholder="ค้นหาตามชื่อหรือที่อยู่"
                    className="w-full rounded-lg border px-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-base"
                  />
                </div>
                <select
                  value={sortOption}
                  onChange={(event) => setSortOption(event.target.value as SortOption)}
                  className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:px-4 sm:text-base"
                >
                  <option value="newest">เรียงโดย: ใหม่ล่าสุด</option>
                  <option value="price-asc">ราคา: จากต่ำไปสูง</option>
                  <option value="price-desc">ราคา: จากสูงไปต่ำ</option>
                  <option value="area-desc">ขนาด: ใหญ่ที่สุดก่อน</option>
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
            ) : totalResults === 0 ? (
              <p className="text-gray-500">ไม่พบอสังหาริมทรัพย์ที่ตรงกับการค้นหาของคุณ</p>
            ) : (
              <div
                className={`grid gap-4 sm:gap-6 ${
                  viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
                }`}
              >
                {paginatedProperties.map((property) => (
                  <UserPropertyCard
                    key={property.id}
                    property={property}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalResults > 0 && (
              <div className="mt-12 flex justify-center">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onPageChange(Math.max(1, safeCurrentPage - 1))}
                    disabled={safeCurrentPage === 1}
                    className={`px-3 py-2 border rounded-lg transition-colors ${
                      safeCurrentPage === 1 ? "cursor-not-allowed text-gray-300" : "hover:bg-gray-50"
                    }`}
                    aria-label="หน้าก่อนหน้า"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {pageNumbers.map((page) => (
                    <button
                      key={page}
                      onClick={() => onPageChange(page)}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        page === safeCurrentPage
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => onPageChange(Math.min(totalPages, safeCurrentPage + 1))}
                    disabled={safeCurrentPage === totalPages}
                    className={`px-3 py-2 border rounded-lg transition-colors ${
                      safeCurrentPage === totalPages
                        ? "cursor-not-allowed text-gray-300"
                        : "hover:bg-gray-50"
                    }`}
                    aria-label="หน้าถัดไป"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
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
        selectedPropertyType={selectedPropertyType}
        onPropertyTypeChange={onPropertyTypeChange}
        minPrice={minPrice}
        maxPrice={maxPrice}
        onPriceRangeChange={onPriceRangeChange}
        onApplyFilters={() => {
          handleApplyFilters()
          onPageChange(1)
        }}
        onClearFilters={onClearFilters}
        locationFilter={locationFilter}
        onOpenLocationPicker={onOpenLocationPicker}
        onClearLocation={onClearLocation}
      />
    </section>
  )
}
