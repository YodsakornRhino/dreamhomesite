"use client"

import { useCallback, useMemo, useState } from "react"
import { useRouter, useSearchParams, type ReadonlyURLSearchParams } from "next/navigation"
import { Inter } from "next/font/google"

import {
  Building2,
  Compass,
  Handshake,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react"

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

  const highlightFeatures = [
    {
      title: "คัดสรรทรัพย์คุณภาพ",
      description:
        "ทีม DreamHome ตรวจสอบสถานะเอกสารและข้อมูลสำคัญก่อนทุกการประกาศ เพื่อให้คุณมั่นใจในทุกขั้นตอน",
      icon: Sparkles,
      accent: "from-blue-500/20 to-purple-500/30",
    },
    {
      title: "ที่ปรึกษาส่วนตัว",
      description:
        "เชื่อมต่อกับเอเจนต์มืออาชีพที่พร้อมให้คำแนะนำเรื่องราคา การต่อรอง และสินเชื่อแบบตัวต่อตัว",
      icon: Handshake,
      accent: "from-purple-500/20 to-pink-500/30",
    },
    {
      title: "บริการครบวงจร",
      description:
        "ได้รับการสนับสนุนตั้งแต่สำรวจพื้นที่ นัดชมจริง ไปจนถึงปิดการขายและบริการหลังการโอนกรรมสิทธิ์",
      icon: ShieldCheck,
      accent: "from-emerald-400/20 to-blue-500/20",
    },
  ]

  const curatedCollections = [
    {
      title: "บ้านพร้อมอยู่",
      description: "คัดเลือกโครงการสร้างเสร็จพร้อมเข้าอยู่ทันทีในย่านที่เดินทางสะดวก",
      icon: Building2,
      highlight: "ลดสูงสุด 10% ในเดือนนี้",
    },
    {
      title: "ทำเลศักยภาพ",
      description: "สำรวจย่านยอดนิยมใกล้รถไฟฟ้าและศูนย์กลางธุรกิจที่กำลังเติบโต",
      icon: Compass,
      highlight: "แนะนำทำเลใหม่ปี 2024",
    },
    {
      title: "โครงการพิเศษ",
      description: "รับสิทธิพิเศษจากโครงการพาร์ทเนอร์ พร้อมของแถมและแพ็กเกจตกแต่งครบครัน",
      icon: Target,
      highlight: "สิทธิพิเศษเฉพาะสมาชิก DreamHome",
    },
  ]

  const experienceSteps = [
    {
      title: "ออกแบบเกณฑ์การค้นหา",
      description: "ระบุทำเล ช่วงราคา และสไตล์ที่คุณต้องการ เราจะช่วยแนะนำตัวเลือกที่ตรงใจที่สุด",
    },
    {
      title: "เยี่ยมชมเสมือนจริง & นัดชมจริง",
      description:
        "ชมทรัพย์ออนไลน์แบบ 3 มิติ พร้อมจัดตารางนัดชมสถานที่จริงได้ทันทีผ่านแอป",
    },
    {
      title: "ปิดดีลอย่างมั่นใจ",
      description:
        "รับคำปรึกษาด้านสินเชื่อ พร้อมทีมกฎหมายช่วยตรวจสอบเอกสารและดูแลวันโอนกรรมสิทธิ์",
    },
  ]

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
      <main className="space-y-24 pb-24">
        <section className="-mt-20 lg:-mt-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 lg:grid-cols-3">
              {highlightFeatures.map(({ title, description, icon: Icon, accent }) => (
                <div
                  key={title}
                  className={`group relative overflow-hidden rounded-3xl bg-white p-6 shadow-xl transition-transform duration-300 hover:-translate-y-2 hover:shadow-2xl`}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                  />
                  <div className="relative flex flex-col gap-4">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/30">
                      <Icon size={24} />
                    </span>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">{title}</h2>
                      <p className="mt-2 text-sm text-gray-600 sm:text-base">{description}</p>
                    </div>
                    <span className="mt-auto inline-flex items-center text-sm font-semibold text-blue-600 transition group-hover:translate-x-1 group-hover:text-blue-700">
                      เรียนรู้เพิ่มเติม
                      <svg
                        className="ml-2 h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10.293 3.293a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L13.586 10H4a1 1 0 110-2h9.586l-3.293-3.293a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-6">
                <div className="flex flex-col gap-3">
                  <span className="text-sm font-semibold uppercase tracking-wider text-blue-600">เจาะลึกความต้องการ</span>
                  <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                    สำรวจดีลที่ตรงกับไลฟ์สไตล์ของคุณ
                  </h2>
                  <p className="text-sm text-gray-600 sm:text-base">
                    DreamHome รวบรวมคอลเลกชันสุดพิเศษที่คัดเลือกโดยผู้เชี่ยวชาญ ทั้งทำเลเด่น โครงการพร้อมอยู่ และแพ็กเกจตกแต่งครบชุดในที่เดียว
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {curatedCollections.map(({ title, description, icon: Icon, highlight }) => (
                    <div
                      key={title}
                      className="relative overflow-hidden rounded-3xl border border-blue-100 bg-white/80 p-6 shadow-sm backdrop-blur transition hover:shadow-lg"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 via-transparent to-purple-100/40" />
                      <div className="relative flex flex-col gap-4">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md">
                          <Icon size={20} />
                        </span>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                          <p className="mt-2 text-sm text-gray-600">{description}</p>
                        </div>
                        <span className="inline-flex max-w-max rounded-full bg-blue-600/10 px-3 py-1 text-xs font-semibold text-blue-700">
                          {highlight}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-8 text-white shadow-xl">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-semibold">บริการสำหรับผู้ซื้อบ้านยุคใหม่</h3>
                    <p className="mt-2 text-sm text-blue-100">
                      เรามีข้อมูลเชิงลึกและเครื่องมือช่วยตัดสินใจ เช่น รายงานราคา วิเคราะห์ทำเล และเปรียบเทียบสินเชื่อจากธนาคารชั้นนำ
                    </p>
                  </div>
                  <div className="grid gap-4">
                    {[
                      "รายงานตลาดอัปเดตทุกสัปดาห์",
                      "ตัวช่วยคำนวณสินเชื่อและงบประมาณ",
                      "บริการนัดหมายชมโครงการทันใจ",
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-3">
                        <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-white">
                          •
                        </span>
                        <p className="text-sm text-blue-50">{item}</p>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleHeroSearch({
                      searchTerm,
                      propertyType: selectedPropertyType,
                      priceRange,
                      location: locationFilter,
                    })}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/25"
                  >
                    เริ่มค้นหาด้วยเกณฑ์ปัจจุบัน
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-black/5 sm:p-10">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <span className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                    เส้นทางการซื้อบ้านกับ DreamHome
                  </span>
                  <h2 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
                    จัดการทุกขั้นตอนให้ราบรื่นตั้งแต่เริ่มค้นหาจนถึงวันโอน
                  </h2>
                </div>
                <p className="max-w-xl text-sm text-gray-600 sm:text-base">
                  ทีมที่ปรึกษามืออาชีพพร้อมดูแลคุณในทุกช่วง ตั้งแต่การเตรียมงบประมาณ ตรวจสอบโครงการ ไปจนถึงการจัดการเอกสารสำคัญและประสานงานกับหน่วยงานที่เกี่ยวข้อง
                </p>
              </div>
              <div className="mt-10 grid gap-8 md:grid-cols-3">
                {experienceSteps.map(({ title, description }, index) => (
                  <div key={title} className="relative flex flex-col gap-3 rounded-2xl border border-blue-100/80 bg-blue-50/50 p-6">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-lg font-semibold text-white shadow-sm">
                      {index + 1}
                    </span>
                    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                    <p className="text-sm text-gray-600">{description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <FeaturedProperties />
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
