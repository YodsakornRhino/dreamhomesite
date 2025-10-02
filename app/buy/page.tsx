"use client"

import { useCallback, useMemo, useState } from "react"
import { Inter } from "next/font/google"

import HeroSection from "@/components/hero-section"
import FeaturedProperties from "@/components/featured-properties"
import PropertyListings from "@/components/property-listings"
import CallToAction from "@/components/call-to-action"

const inter = Inter({ subsets: ["latin"] })

const parseNumericInput = (value: string): number | null => {
  if (!value) return null
  const numericValue = Number(value.replace(/,/g, ""))
  return Number.isFinite(numericValue) ? numericValue : null
}

interface HeroFilters {
  searchTerm: string
  propertyType: string | null
  priceRange: {
    min: number | null
    max: number | null
  }
}

export default function BuyPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPropertyType, setSelectedPropertyType] = useState<string | null>(null)
  const [minPrice, setMinPrice] = useState("")
  const [maxPrice, setMaxPrice] = useState("")
  const [selectedBedrooms, setSelectedBedrooms] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const heroPriceRange = useMemo(
    () => ({
      min: parseNumericInput(minPrice),
      max: parseNumericInput(maxPrice),
    }),
    [minPrice, maxPrice],
  )

  const handleHeroSearch = useCallback((filters: HeroFilters) => {
    setSearchTerm(filters.searchTerm)
    setSelectedPropertyType(filters.propertyType)
    setMinPrice(filters.priceRange.min != null ? String(filters.priceRange.min) : "")
    setMaxPrice(filters.priceRange.max != null ? String(filters.priceRange.max) : "")
    setCurrentPage(1)
  }, [])

  const handleSearchTermChange = useCallback((value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }, [])

  const handlePropertyTypeChange = useCallback((propertyType: string | null) => {
    setSelectedPropertyType(propertyType)
    setCurrentPage(1)
  }, [])

  const handleBedroomFilter = useCallback((bedrooms: string) => {
    setSelectedBedrooms((previous) => (previous === bedrooms ? null : bedrooms))
    setCurrentPage(1)
  }, [])

  const handlePriceRangeChange = useCallback((type: "min" | "max", value: string) => {
    if (type === "min") {
      setMinPrice(value)
    } else {
      setMaxPrice(value)
    }
    setCurrentPage(1)
  }, [])

  const handleClearFilters = useCallback(() => {
    setSelectedBedrooms(null)
    setSelectedPropertyType(null)
    setMinPrice("")
    setMaxPrice("")
    setCurrentPage(1)
  }, [])

  const handleFiltersApplied = useCallback(() => {
    setCurrentPage(1)
  }, [])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  return (
    <div className={`${inter.className} bg-gray-50`}>
      <HeroSection
        searchTerm={searchTerm}
        selectedPropertyType={selectedPropertyType}
        priceRange={heroPriceRange}
        onSearch={handleHeroSearch}
      />
      <FeaturedProperties />
      <PropertyListings
        searchTerm={searchTerm}
        onSearchTermChange={handleSearchTermChange}
        selectedPropertyType={selectedPropertyType}
        onPropertyTypeChange={handlePropertyTypeChange}
        minPrice={minPrice}
        maxPrice={maxPrice}
        onPriceRangeChange={handlePriceRangeChange}
        selectedBedrooms={selectedBedrooms}
        onBedroomFilter={handleBedroomFilter}
        onClearFilters={handleClearFilters}
        onFiltersApplied={handleFiltersApplied}
        currentPage={currentPage}
        onPageChange={handlePageChange}
      />
      <CallToAction />
    </div>
  )
}
