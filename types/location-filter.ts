export type LocationFilterSource = "current" | "pin" | "search"

export interface LocationFilterValue {
  lat: number
  lng: number
  radiusKm: number
  label: string
  source?: LocationFilterSource
}

export const DEFAULT_LOCATION_RADIUS_KM = 5

export const CURRENT_LOCATION_LABEL = "อยู่ตำแหน่งปัจจุบันแล้ว"
export const MAP_LOCATION_FALLBACK_LABEL = "ตำแหน่งที่เลือกบนแผนที่"
