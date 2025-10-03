"use client"

import { useCallback, useMemo, useState } from "react"
import { useRouter, useSearchParams, type ReadonlyURLSearchParams } from "next/navigation"
import { Inter } from "next/font/google"

import HeroSection from "@/components/hero-section"
import FeaturedProperties from "@/components/featured-properties"
import CallToAction from "@/components/call-to-action"
import LocationSearchDialog from "@/components/location-search-dialog"
import type { LocationFilterValue, LocationFilterSource } from "@/types/location-filter"
import {
  CURRENT_LOCATION_LABEL,
  DEFAULT_LOCATION_RADIUS_KM,
  MAP_LOCATION_FALLBACK_LABEL,
} from "@/types/location-filter"

const inter = Inter({ subsets: ["latin"] })

type PriceRange = {
  min: number | null
  max: number | null
}

interface HeroFilters {
  searchTerm: string
  propertyType: string | null
  priceRange: PriceRange
  location: LocationFilterValue | null
}

const parseNumericInput = (value: string | null): number | null => {
  if (!value) return null
  const numericValue = Number(value.replace(/,/g, ""))
  return Number.isFinite(numericValue) ? numericValue : null
}

const isValidLocationSource = (value: string | null): value is LocationFilterSource =>
  value === "current" || value === "pin" || value === "search"

const parseLocationFromParams = (
  params: ReadonlyURLSearchParams,
): LocationFilterValue | null => {
  const latParam = params.get("lat")
  const lngParam = params.get("lng")
  const radiusParam = params.get("radius")
  const sourceParam = params.get("source")

  if (!latParam || !lngParam || !radiusParam) return null

  const lat = Number(latParam)
  const lng = Number(lngParam)
  const radius = Number(radiusParam)

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(radius)) {
    return null
  }

  const source = isValidLocationSource(sourceParam) ? sourceParam : undefined

  const label =
    params.get("label") ??
    (source === "current" ? CURRENT_LOCATION_LABEL : MAP_LOCATION_FALLBACK_LABEL)

  return {
    lat,
    lng,
    radiusKm: Math.max(0.1, radius),
    label,
    source,
  }
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
      return "เกิดข้อผิดพลาดในการเข้าถึงตำแหน่ง กรุณาลองใหม่"
  }
}

const buildQueryString = (values: HeroFilters) => {
  const params = new URLSearchParams()

  if (values.searchTerm) {
    params.set("search", values.searchTerm)
  }

  if (values.propertyType) {
    params.set("type", values.propertyType)
  }

  if (values.priceRange.min != null) {
    params.set("minPrice", String(values.priceRange.min))
  }

  if (values.priceRange.max != null) {
    params.set("maxPrice", String(values.priceRange.max))
  }

  if (values.location) {
    params.set("lat", values.location.lat.toFixed(6))
    params.set("lng", values.location.lng.toFixed(6))
    params.set("radius", values.location.radiusKm.toString())
    if (values.location.label) {
      params.set("label", values.location.label)
    }
    if (values.location.source) {
      params.set("source", values.location.source)
    }
  }

  return params.toString()
}

export default function BuyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [searchTerm, setSearchTerm] = useState(() => searchParams.get("search") ?? "")
  const [selectedPropertyType, setSelectedPropertyType] = useState<string | null>(() => {
    const type = searchParams.get("type")
    return type || null
  })
  const [priceRange, setPriceRange] = useState<PriceRange>(() => ({
    min: parseNumericInput(searchParams.get("minPrice")),
    max: parseNumericInput(searchParams.get("maxPrice")),
  }))
  const [locationFilter, setLocationFilter] = useState<LocationFilterValue | null>(() =>
    parseLocationFromParams(searchParams),
  )
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false)
  const [isLocatingCurrentLocation, setIsLocatingCurrentLocation] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  const heroPriceRange = useMemo(() => ({ ...priceRange }), [priceRange])

  const handleHeroSearch = useCallback(
    (filters: HeroFilters) => {
      setSearchTerm(filters.searchTerm)
      setSelectedPropertyType(filters.propertyType)
      setPriceRange(filters.priceRange)
      setLocationFilter(filters.location)
      setLocationError(null)

      const queryString = buildQueryString({
        searchTerm: filters.searchTerm,
        propertyType: filters.propertyType,
        priceRange: filters.priceRange,
        location: filters.location,
      })

      router.push(`/search${queryString ? `?${queryString}` : ""}`)
    },
    [router],
  )

  const handleLocationApplied = useCallback((value: LocationFilterValue | null) => {
    const normalizedValue = value
      ? {
          ...value,
          source: isValidLocationSource(value.source ?? null) ? value.source : "pin",
        }
      : null
    setLocationFilter((previous) => {
      setSearchTerm((current) => {
        if (normalizedValue) {
          if (previous && current === previous.label) {
            return ""
          }
          return current
        }

        if (previous && current === previous.label) {
          return ""
        }

        return current
      })
      return normalizedValue
    })
    setLocationError(null)
  }, [])

  const handleOpenLocationPicker = useCallback(() => {
    setIsLocationPickerOpen(true)
    setLocationError(null)
  }, [])

  const handleClearLocation = useCallback(() => {
    setLocationFilter((previous) => {
      setSearchTerm((current) => {
        if (previous && current === previous.label) {
          return ""
        }
        return current
      })
      return null
    })
    setLocationError(null)
  }, [])

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

        setSearchTerm("")
        setLocationFilter((previous) => ({
          lat: coords.lat,
          lng: coords.lng,
          radiusKm: previous?.radiusKm ?? DEFAULT_LOCATION_RADIUS_KM,
          label: CURRENT_LOCATION_LABEL,
          source: "current",
        }))
      },
      (error) => {
        setIsLocatingCurrentLocation(false)
        setLocationError(describeGeolocationError(error))
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }, [])

  return (
    <div className={`${inter.className} bg-gray-50`}>
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
      <FeaturedProperties />
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
