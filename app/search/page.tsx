"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams, type ReadonlyURLSearchParams } from "next/navigation"
import { Inter } from "next/font/google"
import { ArrowLeft } from "lucide-react"

import HeroSection from "@/components/hero-section"
import PropertyListings from "@/components/property-listings"
import CallToAction from "@/components/call-to-action"
import LocationSearchDialog from "@/components/location-search-dialog"
import type { LocationFilterValue } from "@/types/location-filter"
import { DEFAULT_LOCATION_RADIUS_KM } from "@/types/location-filter"

const inter = Inter({ subsets: ["latin"] })

const parseNumericInput = (value: string): number | null => {
  if (!value) return null
  const numericValue = Number(value.replace(/,/g, ""))
  return Number.isFinite(numericValue) ? numericValue : null
}

const parseLocationFromParams = (
  params: ReadonlyURLSearchParams,
): LocationFilterValue | null => {
  const latParam = params.get("lat")
  const lngParam = params.get("lng")
  const radiusParam = params.get("radius")

  if (!latParam || !lngParam || !radiusParam) return null

  const lat = Number(latParam)
  const lng = Number(lngParam)
  const radius = Number(radiusParam)

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(radius)) {
    return null
  }

  const label = params.get("label") ?? `${lat.toFixed(3)}, ${lng.toFixed(3)}`

  return {
    lat,
    lng,
    radiusKm: Math.max(0.1, radius),
    label,
  }
}

const areLocationsEqual = (a: LocationFilterValue | null, b: LocationFilterValue | null) => {
  if (a === b) return true
  if (!a || !b) return false

  return (
    Math.abs(a.lat - b.lat) < 1e-6 &&
    Math.abs(a.lng - b.lng) < 1e-6 &&
    Math.abs(a.radiusKm - b.radiusKm) < 1e-3 &&
    a.label === b.label
  )
}

interface HeroFilters {
  searchTerm: string
  propertyType: string | null
  priceRange: {
    min: number | null
    max: number | null
  }
  location: LocationFilterValue | null
}

type QueryValues = {
  searchTerm: string
  propertyType: string | null
  minPrice: string
  maxPrice: string
  bedrooms: string | null
  location: LocationFilterValue | null
  page: number
}

const describeGeolocationError = (error: GeolocationPositionError) => {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "กรุณาอนุญาตให้เข้าถึงตำแหน่งของคุณเพื่อใช้งาน GPS"
    case error.POSITION_UNAVAILABLE:
      return "ไม่พบตำแหน่งปัจจุบันของคุณ ลองใหม่อีกครั้ง"
    case error.TIMEOUT:
      return "ใช้เวลานานเกินไปในการระบุตำแหน่ง กรุณาลองใหม่"
    default:
      return "ไม่สามารถระบุตำแหน่งได้ กรุณาลองใหม่"
  }
}

export default function SearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [searchTerm, setSearchTerm] = useState(() => searchParams.get("search") ?? "")
  const [selectedPropertyType, setSelectedPropertyType] = useState<string | null>(() => {
    const type = searchParams.get("type")
    return type || null
  })
  const [minPrice, setMinPrice] = useState(() => searchParams.get("minPrice") ?? "")
  const [maxPrice, setMaxPrice] = useState(() => searchParams.get("maxPrice") ?? "")
  const [selectedBedrooms, setSelectedBedrooms] = useState<string | null>(() => searchParams.get("bedrooms"))
  const [currentPage, setCurrentPage] = useState(() => {
    const pageParam = Number(searchParams.get("page") ?? "1")
    return Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1
  })
  const [locationFilter, setLocationFilter] = useState<LocationFilterValue | null>(() =>
    parseLocationFromParams(searchParams),
  )
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false)
  const [isLocatingCurrentLocation, setIsLocatingCurrentLocation] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  useEffect(() => {
    const paramSearch = searchParams.get("search") ?? ""
    if (paramSearch !== searchTerm) {
      setSearchTerm(paramSearch)
    }

    const paramType = searchParams.get("type")
    const nextType = paramType || null
    if (nextType !== selectedPropertyType) {
      setSelectedPropertyType(nextType)
    }

    const paramMin = searchParams.get("minPrice") ?? ""
    if (paramMin !== minPrice) {
      setMinPrice(paramMin)
    }

    const paramMax = searchParams.get("maxPrice") ?? ""
    if (paramMax !== maxPrice) {
      setMaxPrice(paramMax)
    }

    const paramBedrooms = searchParams.get("bedrooms")
    if (paramBedrooms !== selectedBedrooms) {
      setSelectedBedrooms(paramBedrooms)
    }

    const pageParam = Number(searchParams.get("page") ?? "1")
    const nextPage = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1
    if (nextPage !== currentPage) {
      setCurrentPage(nextPage)
    }

    const paramLocation = parseLocationFromParams(searchParams)
    if (!areLocationsEqual(paramLocation, locationFilter)) {
      setLocationFilter(paramLocation)
      if (!paramLocation && locationFilter && searchTerm === locationFilter.label) {
        setSearchTerm("")
      }
      setLocationError(null)
    }
  }, [
    searchParams,
    searchTerm,
    selectedPropertyType,
    minPrice,
    maxPrice,
    selectedBedrooms,
    currentPage,
    locationFilter,
  ])

  const heroPriceRange = useMemo(
    () => ({
      min: parseNumericInput(minPrice),
      max: parseNumericInput(maxPrice),
    }),
    [minPrice, maxPrice],
  )

  const updateQuery = useCallback(
    (overrides: Partial<QueryValues>) => {
      const nextValues: QueryValues = {
        searchTerm,
        propertyType: selectedPropertyType,
        minPrice,
        maxPrice,
        bedrooms: selectedBedrooms,
        location: locationFilter,
        page: currentPage,
        ...overrides,
      }

      const params = new URLSearchParams()

      if (nextValues.searchTerm) {
        params.set("search", nextValues.searchTerm)
      }

      if (nextValues.propertyType) {
        params.set("type", nextValues.propertyType)
      }

      if (nextValues.minPrice) {
        params.set("minPrice", nextValues.minPrice)
      }

      if (nextValues.maxPrice) {
        params.set("maxPrice", nextValues.maxPrice)
      }

      if (nextValues.bedrooms) {
        params.set("bedrooms", nextValues.bedrooms)
      }

      if (nextValues.location) {
        params.set("lat", nextValues.location.lat.toFixed(6))
        params.set("lng", nextValues.location.lng.toFixed(6))
        params.set("radius", nextValues.location.radiusKm.toString())
        if (nextValues.location.label) {
          params.set("label", nextValues.location.label)
        }
      }

      if (nextValues.page > 1) {
        params.set("page", nextValues.page.toString())
      }

      const queryString = params.toString()
      router.replace(`/search${queryString ? `?${queryString}` : ""}`, { scroll: false })
    },
    [
      router,
      searchTerm,
      selectedPropertyType,
      minPrice,
      maxPrice,
      selectedBedrooms,
      locationFilter,
      currentPage,
    ],
  )

  const scrollToResults = useCallback(() => {
    if (typeof window === "undefined") return
    const element = document.getElementById("property-listings")
    element?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [])

  const handleHeroSearch = useCallback(
    (filters: HeroFilters) => {
      const trimmedSearch = filters.searchTerm.trim()
      const minValue = filters.priceRange.min != null ? String(filters.priceRange.min) : ""
      const maxValue = filters.priceRange.max != null ? String(filters.priceRange.max) : ""

      setSearchTerm(trimmedSearch)
      setSelectedPropertyType(filters.propertyType)
      setMinPrice(minValue)
      setMaxPrice(maxValue)
      setCurrentPage(1)
      setLocationError(null)

      updateQuery({
        searchTerm: trimmedSearch,
        propertyType: filters.propertyType,
        minPrice: minValue,
        maxPrice: maxValue,
        page: 1,
        location: filters.location ?? locationFilter,
      })

      scrollToResults()
    },
    [locationFilter, scrollToResults, updateQuery],
  )

  const handleSearchTermChange = useCallback(
    (value: string) => {
      const sanitized = value.trim()
      setSearchTerm(sanitized)
      setCurrentPage(1)
      updateQuery({ searchTerm: sanitized, page: 1 })
    },
    [updateQuery],
  )

  const handlePropertyTypeChange = useCallback(
    (propertyType: string | null) => {
      setSelectedPropertyType(propertyType)
      setCurrentPage(1)
      updateQuery({ propertyType, page: 1 })
    },
    [updateQuery],
  )

  const handleBedroomFilter = useCallback(
    (bedrooms: string) => {
      setSelectedBedrooms((previous) => {
        const nextValue = previous === bedrooms ? null : bedrooms
        updateQuery({ bedrooms: nextValue, page: 1 })
        return nextValue
      })
      setCurrentPage(1)
    },
    [updateQuery],
  )

  const handlePriceRangeChange = useCallback(
    (type: "min" | "max", value: string) => {
      const sanitized = value.trim()
      if (type === "min") {
        setMinPrice(sanitized)
        updateQuery({ minPrice: sanitized, maxPrice, page: 1 })
      } else {
        setMaxPrice(sanitized)
        updateQuery({ maxPrice: sanitized, minPrice, page: 1 })
      }
      setCurrentPage(1)
    },
    [maxPrice, minPrice, updateQuery],
  )

  const handleClearFilters = useCallback(() => {
    setSelectedBedrooms(null)
    setSelectedPropertyType(null)
    setMinPrice("")
    setMaxPrice("")
    setSearchTerm("")
    setLocationFilter(null)
    setCurrentPage(1)
    setLocationError(null)
    updateQuery({
      searchTerm: "",
      propertyType: null,
      minPrice: "",
      maxPrice: "",
      bedrooms: null,
      location: null,
      page: 1,
    })
  }, [updateQuery])

  const handleFiltersApplied = useCallback(() => {
    setCurrentPage(1)
    updateQuery({ page: 1 })
  }, [updateQuery])

  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page)
      updateQuery({ page })
    },
    [updateQuery],
  )

  const handleLocationApplied = useCallback(
    (value: LocationFilterValue | null) => {
      setLocationFilter(value)
      setCurrentPage(1)

      if (value) {
        const shouldClearSearchTerm =
          !searchTerm || (locationFilter && searchTerm === locationFilter.label)

        if (shouldClearSearchTerm) {
          setSearchTerm("")
          updateQuery({ location: value, searchTerm: "", page: 1 })
        } else {
          updateQuery({ location: value, page: 1 })
        }
        setLocationError(null)
        return
      }

      if (!value && locationFilter && searchTerm === locationFilter.label) {
        setSearchTerm("")
        updateQuery({ location: null, searchTerm: "", page: 1 })
        setLocationError(null)
        return
      }

      updateQuery({ location: value, page: 1 })
      setLocationError(null)
    },
    [locationFilter, searchTerm, updateQuery],
  )

  const handleOpenLocationPicker = useCallback(() => {
    setIsLocationPickerOpen(true)
    setLocationError(null)
  }, [])

  const handleClearLocation = useCallback(() => {
    handleLocationApplied(null)
    setLocationError(null)
  }, [handleLocationApplied])

  const handleUseCurrentLocation = useCallback(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setLocationError("อุปกรณ์ของคุณไม่รองรับการระบุตำแหน่งผ่าน GPS")
      return
    }

    setIsLocatingCurrentLocation(true)
    setLocationError(null)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocatingCurrentLocation(false)
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }

        const label = `ตำแหน่งปัจจุบัน (${coords.lat.toFixed(3)}, ${coords.lng.toFixed(3)})`
        const nextValue: LocationFilterValue = {
          lat: coords.lat,
          lng: coords.lng,
          radiusKm: locationFilter?.radiusKm ?? DEFAULT_LOCATION_RADIUS_KM,
          label,
        }

        handleLocationApplied(nextValue)
      },
      (error) => {
        setIsLocatingCurrentLocation(false)
        setLocationError(describeGeolocationError(error))
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }, [handleLocationApplied, locationFilter])

  return (
    <div className={`${inter.className} bg-gray-50`}>
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-3 sm:px-6 lg:px-8">
          <ArrowLeft className="h-4 w-4 text-blue-600" />
          <Link
            href="/buy"
            className="text-sm font-medium text-blue-600 transition hover:text-blue-700"
          >
            กลับสู่หน้าซื้ออสังหาริมทรัพย์
          </Link>
        </div>
      </div>
      <HeroSection
        searchTerm={searchTerm}
        selectedPropertyType={selectedPropertyType}
        priceRange={heroPriceRange}
        locationFilter={locationFilter}
        onSearch={handleHeroSearch}
        onOpenLocationPicker={handleOpenLocationPicker}
        onClearLocation={handleClearLocation}
        onUseCurrentLocation={handleUseCurrentLocation}
        isLocatingCurrentLocation={isLocatingCurrentLocation}
        locationError={locationError}
      />
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
        locationFilter={locationFilter}
        onOpenLocationPicker={handleOpenLocationPicker}
        onClearLocation={handleClearLocation}
        onUseCurrentLocation={handleUseCurrentLocation}
        isLocatingCurrentLocation={isLocatingCurrentLocation}
        locationError={locationError}
      />
      <CallToAction />
      <LocationSearchDialog
        open={isLocationPickerOpen}
        onOpenChange={setIsLocationPickerOpen}
        initialValue={locationFilter}
        onApply={handleLocationApplied}
      />
    </div>
  )
}
