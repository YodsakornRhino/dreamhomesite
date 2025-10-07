"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams, type ReadonlyURLSearchParams } from "next/navigation"
import { Inter } from "next/font/google"
import { ArrowLeft, Compass, Filter, Home } from "lucide-react"

import HeroSection from "@/components/hero-section"
import PropertyListings from "@/components/property-listings"
import CallToAction from "@/components/call-to-action"
import LocationSearchDialog from "@/components/location-search-dialog"
import { PROPERTY_TYPE_LABELS } from "@/lib/property"
import type { LocationFilterValue, LocationFilterSource } from "@/types/location-filter"
import {
  CURRENT_LOCATION_LABEL,
  DEFAULT_LOCATION_RADIUS_KM,
  MAP_LOCATION_FALLBACK_LABEL,
} from "@/types/location-filter"

const inter = Inter({ subsets: ["latin"] })

const parseNumericInput = (value: string): number | null => {
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

const areLocationsEqual = (a: LocationFilterValue | null, b: LocationFilterValue | null) => {
  if (a === b) return true
  if (!a || !b) return false

  return (
    Math.abs(a.lat - b.lat) < 1e-6 &&
    Math.abs(a.lng - b.lng) < 1e-6 &&
    Math.abs(a.radiusKm - b.radiusKm) < 1e-3 &&
    a.label === b.label &&
    a.source === b.source
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
      return "เกิดข้อผิดพลาดในการเข้าถึงตำแหน่ง กรุณาลองใหม่"
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

  const minPriceValue = useMemo(() => parseNumericInput(minPrice), [minPrice])
  const maxPriceValue = useMemo(() => parseNumericInput(maxPrice), [maxPrice])

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
      min: minPriceValue,
      max: maxPriceValue,
    }),
    [minPriceValue, maxPriceValue],
  )

  const activeFilterBadges = useMemo(() => {
    const items: { label: string; value: string }[] = []
    const formatter = new Intl.NumberFormat("th-TH", { maximumFractionDigits: 0 })

    if (selectedPropertyType) {
      const label = PROPERTY_TYPE_LABELS[selectedPropertyType] ?? selectedPropertyType
      items.push({ label: "ประเภท", value: label })
    }

    if (selectedBedrooms) {
      items.push({ label: "ห้องนอน", value: `${selectedBedrooms} ขึ้นไป` })
    }

    if (minPriceValue != null || maxPriceValue != null) {
      const parts = [] as string[]
      if (minPriceValue != null) {
        parts.push(`ต่ำสุด ${formatter.format(minPriceValue)} ฿`)
      }
      if (maxPriceValue != null) {
        parts.push(`สูงสุด ${formatter.format(maxPriceValue)} ฿`)
      }
      items.push({ label: "ช่วงราคา", value: parts.join(" • ") })
    }

    if (locationFilter) {
      const locationLabel =
        locationFilter.source === "current"
          ? CURRENT_LOCATION_LABEL
          : locationFilter.label ?? "ปักหมุดบนแผนที่"
      items.push({
        label: "พื้นที่",
        value: `${locationLabel} • ${locationFilter.radiusKm.toLocaleString()} กม.`,
      })
    }

    if (!items.length) {
      items.push({ label: "ตัวกรอง", value: "กำลังค้นหาทั่วประเทศ" })
    }

    return items
  }, [locationFilter, maxPriceValue, minPriceValue, selectedBedrooms, selectedPropertyType])

  const activeFilterCount = useMemo(
    () => activeFilterBadges.filter((badge) => badge.label !== "ตัวกรอง").length,
    [activeFilterBadges],
  )

  const locationSummary = useMemo(() => {
    if (!locationFilter) {
      return "ทั่วประเทศ"
    }

    if (locationFilter.source === "current") {
      return "ใกล้ตำแหน่งของคุณ"
    }

    return locationFilter.label ?? "ปักหมุดในแผนที่"
  }, [locationFilter])

  const propertyTypeSummary = useMemo(() => {
    if (!selectedPropertyType) return "ทุกประเภท"
    return PROPERTY_TYPE_LABELS[selectedPropertyType] ?? selectedPropertyType
  }, [selectedPropertyType])

  const bedroomSummary = useMemo(() => {
    if (!selectedBedrooms) return "ทุกจำนวนห้องนอน"
    return `${selectedBedrooms} ห้องนอนขึ้นไป`
  }, [selectedBedrooms])

  const priceSummary = useMemo(() => {
    if (minPriceValue == null && maxPriceValue == null) {
      return "ทุกราคา"
    }

    const formatter = new Intl.NumberFormat("th-TH", { maximumFractionDigits: 0 })
    const parts: string[] = []

    if (minPriceValue != null) {
      parts.push(`${formatter.format(minPriceValue)} ฿ ขึ้นไป`)
    }

    if (maxPriceValue != null) {
      parts.push(`ไม่เกิน ${formatter.format(maxPriceValue)} ฿`)
    }

    return parts.join(" • ")
  }, [maxPriceValue, minPriceValue])

  const quickBudgets = useMemo(
    () => [
      { label: "ไม่เกิน 3 ล้าน", min: 0, max: 3_000_000 },
      { label: "3-5 ล้าน", min: 3_000_000, max: 5_000_000 },
      { label: "5-10 ล้าน", min: 5_000_000, max: 10_000_000 },
      { label: "10 ล้านขึ้นไป", min: 10_000_000, max: null },
    ],
    [],
  )

  const quickPropertyTypes = useMemo(
    () =>
      Object.entries(PROPERTY_TYPE_LABELS)
        .slice(0, 4)
        .map(([value, label]) => ({ value, label })),
    [],
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
        if (nextValues.location.source) {
          params.set("source", nextValues.location.source)
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
      if (page === currentPage) {
        return
      }

      setCurrentPage(page)
      updateQuery({ page })

      if (typeof window !== "undefined") {
        window.requestAnimationFrame(() => {
          const listingsSection = document.getElementById("property-listings")

          if (listingsSection) {
            listingsSection.scrollIntoView({ behavior: "smooth", block: "start" })
            return
          }

          window.scrollTo({ top: 0, behavior: "smooth" })
        })
      }
    },
    [currentPage, updateQuery],
  )

  const handleLocationApplied = useCallback(
    (value: LocationFilterValue | null) => {
      const normalizedValue = value
        ? {
            ...value,
            source: isValidLocationSource(value.source ?? null) ? value.source : "pin",
          }
        : null

      setLocationFilter(normalizedValue)
      setCurrentPage(1)

      if (normalizedValue) {
        const shouldClearSearchTerm =
          !searchTerm || (locationFilter && searchTerm === locationFilter.label)

        if (shouldClearSearchTerm) {
          setSearchTerm("")
          updateQuery({ location: normalizedValue, searchTerm: "", page: 1 })
        } else {
          updateQuery({ location: normalizedValue, page: 1 })
        }
        setLocationError(null)
        return
      }

      if (!normalizedValue && locationFilter && searchTerm === locationFilter.label) {
        setSearchTerm("")
        updateQuery({ location: null, searchTerm: "", page: 1 })
        setLocationError(null)
        return
      }

    updateQuery({ location: normalizedValue, page: 1 })
      setLocationError(null)
    },
    [locationFilter, searchTerm, updateQuery],
  )

  const applyQuickBudget = useCallback(
    (min: number | null, max: number | null) => {
      const minString = min != null ? String(min) : ""
      const maxString = max != null ? String(max) : ""
      setMinPrice(minString)
      setMaxPrice(maxString)
      setCurrentPage(1)
      updateQuery({ minPrice: minString, maxPrice: maxString, page: 1 })
    },
    [updateQuery],
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

        const nextValue: LocationFilterValue = {
          lat: coords.lat,
          lng: coords.lng,
          radiusKm: locationFilter?.radiusKm ?? DEFAULT_LOCATION_RADIUS_KM,
          label: CURRENT_LOCATION_LABEL,
          source: "current",
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
      <header className="border-b border-blue-100/60 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/buy"
            className="inline-flex items-center gap-3 rounded-full border border-blue-100 bg-blue-50/60 px-4 py-2 text-sm font-medium text-blue-700 transition hover:border-blue-200 hover:bg-blue-100"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white">
              <ArrowLeft size={16} />
            </span>
            กลับสู่หน้าซื้ออสังหาริมทรัพย์
          </Link>
          <div className="hidden items-center gap-3 text-sm text-gray-500 sm:flex">
            <Compass size={16} className="text-blue-500" />
            <span>สำรวจทรัพย์กว่า 1,500 รายการที่อัปเดตใหม่ทุกสัปดาห์</span>
          </div>
        </div>
      </header>
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
      <main className="space-y-20 pb-24">
        <section className="-mt-16 lg:-mt-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
              <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-black/5 sm:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <span className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                      ภาพรวมการค้นหา
                    </span>
                    <h2 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
                      {searchTerm ? `ผลการค้นหา “${searchTerm}”` : "ผลการค้นหาอสังหาริมทรัพย์"}
                    </h2>
                  </div>
                  <p className="text-sm text-gray-500 sm:max-w-xs">
                    {activeFilterCount > 0
                      ? `กำลังใช้ตัวกรอง ${activeFilterCount} รายการเพื่อให้คุณได้ตัวเลือกที่ตรงใจที่สุด`
                      : "ยังไม่มีตัวกรองพิเศษ สามารถเลือกช่วงราคา ทำเล หรือประเภทเพื่อปรับผลลัพธ์ได้ทันที"}
                  </p>
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  {activeFilterBadges.map((badge) => (
                    <span
                      key={`${badge.label}-${badge.value}`}
                      className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/70 px-4 py-1.5 text-xs font-medium text-blue-700 sm:text-sm"
                    >
                      <Filter size={14} className="hidden sm:inline" />
                      <span className="font-semibold">{badge.label}:</span>
                      <span className="text-blue-600/90">{badge.value}</span>
                    </span>
                  ))}
                </div>
                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">ทำเลเป้าหมาย</p>
                    <p className="mt-2 text-lg font-semibold text-blue-900">{locationSummary}</p>
                    {locationFilter ? (
                      <p className="text-sm text-blue-600/80">
                        ในรัศมี {locationFilter.radiusKm.toLocaleString()} กม.
                      </p>
                    ) : (
                      <p className="text-sm text-blue-600/80">พร้อมสำรวจได้ทุกจังหวัด</p>
                    )}
                  </div>
                  <div className="rounded-2xl border border-purple-100 bg-purple-50/50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-purple-600">ช่วงราคา</p>
                    <p className="mt-2 text-lg font-semibold text-purple-900">{priceSummary}</p>
                    <p className="text-sm text-purple-600/80">
                      ปรับเพิ่ม/ลดเพื่อให้เข้ากับงบประมาณได้ทันที
                    </p>
                  </div>
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">สไตล์ที่ต้องการ</p>
                    <p className="mt-2 text-lg font-semibold text-emerald-900">{propertyTypeSummary}</p>
                    <p className="text-sm text-emerald-600/80">{bedroomSummary}</p>
                  </div>
                </div>
              </div>
              <div className="flex h-full flex-col gap-4">
                <div className="rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-6 text-white shadow-xl">
                  <div className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 text-white">
                      <Home size={20} />
                    </span>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold">ค้นหาเร็วขึ้นด้วยตัวช่วยอัจฉริยะ</h3>
                      <p className="text-sm text-blue-50">
                        ระบบจะแนะนำรายการที่คล้ายกับความต้องการของคุณ พร้อมแจ้งเตือนทันทีเมื่อมีทรัพย์ใหม่เข้ามาในเกณฑ์ที่เลือก
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      scrollToResults()
                    }}
                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/25"
                  >
                    ดูผลลัพธ์ล่าสุด
                  </button>
                </div>
                <div className="rounded-3xl border border-blue-100 bg-white/70 p-6 shadow-sm backdrop-blur">
                  <p className="text-sm font-semibold text-gray-900">เลือกตัวเลือกยอดนิยมทันที</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {quickPropertyTypes.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => handlePropertyTypeChange(type.value)}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                          selectedPropertyType === type.value
                            ? "bg-blue-600 text-white"
                            : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {quickBudgets.map((budget) => (
                      <button
                        key={budget.label}
                        onClick={() => applyQuickBudget(budget.min, budget.max)}
                        className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-xs font-semibold text-gray-600 transition hover:border-blue-200 hover:text-blue-600 sm:text-sm"
                      >
                        {budget.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

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
      </main>
      <LocationSearchDialog
        open={isLocationPickerOpen}
        onOpenChange={setIsLocationPickerOpen}
        initialValue={locationFilter}
        onApply={handleLocationApplied}
      />
    </div>
  )
}
