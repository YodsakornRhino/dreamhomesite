"use client"

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react"
import { LocateFixed } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  CURRENT_LOCATION_LABEL,
  DEFAULT_LOCATION_RADIUS_KM,
  MAP_LOCATION_FALLBACK_LABEL,
  type LocationFilterValue,
  type LocationFilterSource,
} from "@/types/location-filter"

interface LocationSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialValue: LocationFilterValue | null
  onApply: (value: LocationFilterValue | null) => void
}

const DEFAULT_CENTER: google.maps.LatLngLiteral = { lat: 13.7563, lng: 100.5018 }
const RADIUS_OPTIONS = [1, 3, 5, 10, 15, 20, 30]

interface SelectedLocation {
  lat: number
  lng: number
  label: string
  source: LocationFilterSource
}

export default function LocationSearchDialog({
  open,
  onOpenChange,
  initialValue,
  onApply,
}: LocationSearchDialogProps) {
  const [mapsReady, setMapsReady] = useState(false)
  const [mapsError, setMapsError] = useState<string | null>(null)
  const [isLoadingMaps, setIsLoadingMaps] = useState(false)
  const [isGeolocating, setIsGeolocating] = useState(false)
  const [geolocationError, setGeolocationError] = useState<string | null>(null)

  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null)
  const [radiusKm, setRadiusKm] = useState<number>(DEFAULT_LOCATION_RADIUS_KM)
  const latestRadiusRef = useRef(radiusKm)

  useEffect(() => {
    latestRadiusRef.current = radiusKm
  }, [radiusKm])

  const updateSelectedLocation = useCallback(
    (
      position: google.maps.LatLngLiteral,
      options?: { formattedAddress?: string; source?: LocationFilterSource },
    ) => {
      const fallbackLabel =
        options?.source === "current" ? CURRENT_LOCATION_LABEL : MAP_LOCATION_FALLBACK_LABEL

      setSelectedLocation({
        lat: position.lat,
        lng: position.lng,
        label: options?.formattedAddress ?? fallbackLabel,
        source: options?.source ?? "pin",
      })
    },
    [],
  )

  const [mapResetCounter, setMapResetCounter] = useState(0)
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markerRef = useRef<google.maps.Marker | null>(null)
  const circleRef = useRef<google.maps.Circle | null>(null)
  const geocoderRef = useRef<google.maps.Geocoder | null>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const autocompleteInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!open) return

    setMapResetCounter((counter) => counter + 1)
  }, [open])

  useEffect(() => {
    if (!open) return

    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!key) {
      setMapsError("กรุณากำหนด NEXT_PUBLIC_GOOGLE_MAPS_API_KEY เพื่อใช้งานแผนที่")
      setMapsReady(false)
      return
    }

    if (mapsReady || isLoadingMaps) return

    setIsLoadingMaps(true)
    const loadMaps = async () => {
      try {
        const { Loader } = await import("@googlemaps/js-api-loader")
        const loader = new Loader({
          apiKey: key,
          version: "weekly",
          libraries: ["places"],
        })
        await loader.load()
        setMapsReady(true)
      } catch (error) {
        console.error("Failed to load Google Maps", error)
        setMapsError("ไม่สามารถโหลดแผนที่ได้ กรุณาลองใหม่อีกครั้ง")
      } finally {
        setIsLoadingMaps(false)
      }
    }

    void loadMaps()
  }, [open, mapsReady, isLoadingMaps])

  useEffect(() => {
    if (!open) return
    if (initialValue) {
      setSelectedLocation({
        lat: initialValue.lat,
        lng: initialValue.lng,
        label: initialValue.label,
        source: initialValue.source ?? "pin",
      })
      setRadiusKm(initialValue.radiusKm)
    } else {
      setSelectedLocation(null)
      setRadiusKm(DEFAULT_LOCATION_RADIUS_KM)
    }
    setGeolocationError(null)
    setIsGeolocating(false)
  }, [open, initialValue])

  useEffect(() => {
    if (!open || !mapsReady) return

    let cancelAnimation = 0
    let cleanup: (() => void) | undefined

    cancelAnimation = window.requestAnimationFrame(() => {
      const container = mapContainerRef.current
      if (!container) return

      const center: google.maps.LatLngLiteral = initialValue
        ? { lat: initialValue.lat, lng: initialValue.lng }
        : DEFAULT_CENTER

      // Clear any previous Google Map instance markup before creating a new map.
      container.innerHTML = ""

      const map = new google.maps.Map(container, {
        center,
        zoom: initialValue ? 14 : 11,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      })
      mapInstanceRef.current = map

      const marker = new google.maps.Marker({
        map,
        position: initialValue ?? undefined,
        draggable: true,
      })
      markerRef.current = marker

      const circle = new google.maps.Circle({
        map,
        center: initialValue ?? undefined,
        radius: (initialValue?.radiusKm ?? latestRadiusRef.current) * 1000,
        fillColor: "#2563EB",
        fillOpacity: 0.15,
        strokeColor: "#2563EB",
        strokeOpacity: 0.5,
        strokeWeight: 1,
      })
      circleRef.current = circle

      geocoderRef.current = new google.maps.Geocoder()

      const updateFromLatLng = (latLng: google.maps.LatLng) => {
        const position = latLng.toJSON()
        marker.setPosition(position)
        circle.setCenter(position)
        updateSelectedLocation(position, { source: "pin" })

        geocoderRef.current?.geocode({ location: position }, (results, status) => {
          if (status === "OK" && results && results[0]) {
            updateSelectedLocation(position, {
              formattedAddress: results[0].formatted_address ?? undefined,
              source: "pin",
            })
          }
        })
      }

      const mapClickListener = map.addListener("click", (event: google.maps.MapMouseEvent) => {
        if (event.latLng) {
          updateFromLatLng(event.latLng)
        }
      })

      const markerDragListener = marker.addListener("dragend", () => {
        const position = marker.getPosition()
        if (position) {
          updateFromLatLng(position)
        }
      })

      if (autocompleteInputRef.current) {
        autocompleteRef.current = new google.maps.places.Autocomplete(autocompleteInputRef.current, {
          fields: ["geometry", "formatted_address"],
          types: ["geocode"],
        })
        autocompleteRef.current.bindTo("bounds", map)
        autocompleteRef.current.addListener("place_changed", () => {
          const place = autocompleteRef.current?.getPlace()
          if (!place?.geometry?.location) return

          const loc = place.geometry.location
          map.panTo(loc)
          map.setZoom(15)
          marker.setPosition(loc)
          circle.setCenter(loc)
          updateSelectedLocation(
            { lat: loc.lat(), lng: loc.lng() },
            { formattedAddress: place.formatted_address ?? undefined, source: "search" },
          )
        })
      }

      if (initialValue) {
        const position = new google.maps.LatLng(initialValue.lat, initialValue.lng)
        map.panTo(position)
        map.setZoom(15)
        marker.setPosition(position)
        circle.setCenter(position)
      }

      const idleListener = google.maps.event.addListenerOnce(map, "idle", () => {
        google.maps.event.trigger(map, "resize")
      })

      cleanup = () => {
        google.maps.event.removeListener(mapClickListener)
        google.maps.event.removeListener(markerDragListener)
        google.maps.event.removeListener(idleListener)
        marker.setMap(null)
        circle.setMap(null)
        autocompleteRef.current?.unbindAll()
        autocompleteRef.current = null
        geocoderRef.current = null
        markerRef.current = null
        circleRef.current = null
        mapInstanceRef.current = null
      }
    })

    return () => {
      if (cancelAnimation) {
        window.cancelAnimationFrame(cancelAnimation)
      }
      cleanup?.()
    }
  }, [open, mapsReady, initialValue, updateSelectedLocation, mapResetCounter])

  useEffect(() => {
    if (!open) return
    if (circleRef.current) {
      circleRef.current.setRadius(radiusKm * 1000)
    }
  }, [radiusKm, open])

  useEffect(() => {
    if (!open) return
    if (selectedLocation && mapInstanceRef.current) {
      mapInstanceRef.current.panTo({ lat: selectedLocation.lat, lng: selectedLocation.lng })
    }
  }, [selectedLocation, open])

  const handleRadiusInput = (event: ChangeEvent<HTMLInputElement>) => {
    setRadiusKm(Number(event.target.value))
  }

  const handleApply = () => {
    if (!selectedLocation) {
      onApply(null)
      onOpenChange(false)
      return
    }

    const fallbackLabel =
      selectedLocation.source === "current"
        ? CURRENT_LOCATION_LABEL
        : MAP_LOCATION_FALLBACK_LABEL

    onApply({
      lat: selectedLocation.lat,
      lng: selectedLocation.lng,
      radiusKm,
      label: selectedLocation.label || fallbackLabel,
      source: selectedLocation.source,
    })
    onOpenChange(false)
  }

  const handleClearLocation = () => {
    setSelectedLocation(null)
    onApply(null)
    onOpenChange(false)
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

  const handleUseCurrentLocation = () => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setGeolocationError("อุปกรณ์ของคุณไม่รองรับการระบุตำแหน่งผ่าน GPS")
      return
    }

    setIsGeolocating(true)
    setGeolocationError(null)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsGeolocating(false)
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }

        updateSelectedLocation(coords, { source: "current" })

        mapInstanceRef.current?.panTo(coords)
        mapInstanceRef.current?.setZoom(15)
        markerRef.current?.setPosition(coords)
        circleRef.current?.setCenter(coords)

        geocoderRef.current?.geocode({ location: coords }, (results, status) => {
          if (status === "OK" && results && results[0]) {
            updateSelectedLocation(coords, {
              formattedAddress: results[0].formatted_address ?? undefined,
              source: "current",
            })
          }
        })
      },
      (error) => {
        setIsGeolocating(false)
        setGeolocationError(describeGeolocationError(error))
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  useEffect(() => {
    if (!open || !mapsReady) return

    const map = mapInstanceRef.current
    if (!map || typeof google === "undefined") return

    const resizeTimer = window.setTimeout(() => {
      google.maps.event.trigger(map, "resize")

      if (selectedLocation) {
        map.setCenter({ lat: selectedLocation.lat, lng: selectedLocation.lng })
        return
      }

      if (initialValue) {
        map.setCenter({ lat: initialValue.lat, lng: initialValue.lng })
        return
      }

      map.setCenter(DEFAULT_CENTER)
    }, 150)

    return () => {
      window.clearTimeout(resizeTimer)
    }
  }, [open, mapsReady, selectedLocation, initialValue])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex w-[95vw] max-w-3xl flex-col overflow-hidden p-0 sm:w-[90vw] max-h-[90vh]">
        <DialogHeader className="shrink-0 space-y-1 border-b border-gray-200 bg-white px-6 py-5">
          <DialogTitle className="text-lg font-semibold text-gray-900 sm:text-xl">เลือกพื้นที่การค้นหา</DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            ปักหมุดตำแหน่งบนแผนที่ แล้วเลือกระยะรอบๆ เพื่อค้นหาอสังหาริมทรัพย์ใกล้เคียง
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {mapsError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              {mapsError}
            </div>
          ) : !mapsReady ? (
            <div className="flex h-[260px] items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-500 sm:h-[320px] md:h-[360px] lg:h-[420px]">
              {isLoadingMaps ? "กำลังโหลดแผนที่..." : "กำลังเตรียมแผนที่"}
            </div>
          ) : (
            <>
              <div key={mapResetCounter} className="relative">
                <input
                  ref={autocompleteInputRef}
                  type="text"
                  placeholder="ค้นหาตำแหน่ง (เช่น ชื่อสถานที่ ถนน หรือจังหวัด)"
                  className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={isGeolocating}
                    className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition ${
                      isGeolocating
                        ? "border-blue-200 bg-blue-100 text-blue-400"
                        : "border-blue-200 bg-white text-blue-600 hover:bg-blue-50"
                    }`}
                  >
                    <LocateFixed size={16} />
                    {isGeolocating ? "กำลังระบุตำแหน่ง..." : "ใช้ตำแหน่งปัจจุบัน"}
                  </button>
                  {geolocationError ? (
                    <span className="text-xs text-red-600">{geolocationError}</span>
                  ) : null}
                </div>
              </div>

              <div
                key={`map-${mapResetCounter}`}
                ref={mapContainerRef}
                className="h-[260px] w-full overflow-hidden rounded-xl border border-gray-200 sm:h-[320px] md:h-[360px] lg:h-[420px]"
              />

              <div className="space-y-3 rounded-lg border border-gray-100 bg-gray-50 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-sm font-medium text-gray-700">รัศมีการค้นหา</span>
                  <span className="text-sm text-gray-600">{radiusKm.toLocaleString()} กม.</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  step="1"
                  value={radiusKm}
                  onChange={handleRadiusInput}
                  className="w-full"
                />
                <div className="flex flex-wrap gap-2">
                  {RADIUS_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setRadiusKm(option)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        radiusKm === option
                          ? "bg-blue-600 text-white"
                          : "bg-white text-gray-700 hover:bg-blue-50 border border-gray-200"
                      }`}
                    >
                      {option} กม.
                    </button>
                  ))}
                </div>

                <div className="rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-700">
                  {selectedLocation
                    ? `ค้นหาในรัศมี ${radiusKm.toLocaleString()} กม. รอบๆ ${selectedLocation.label}`
                    : "ยังไม่ได้เลือกตำแหน่งบนแผนที่"}
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="shrink-0 flex flex-col gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={handleClearLocation}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
          >
            ล้างตำแหน่ง
          </button>
          <div className="flex w-full justify-end gap-3 sm:w-auto">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              disabled={!!mapsError || (!mapsReady && !isLoadingMaps)}
            >
              ยืนยันตำแหน่ง
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
