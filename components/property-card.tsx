"use client"

import { MapPin, Bed, Bath, Square } from "lucide-react"

interface PropertyCardProps {
  id: number | string
  title: string
  price: string
  location: string
  beds: number
  baths: number
  sqft: number
  type: "sale" | "rent"
  gradient: string
  onViewDetails: (id: number) => void
}

export default function PropertyCard({
  id,
  title,
  price,
  location,
  beds,
  baths,
  sqft,
  type,
  gradient,
  onViewDetails,
}: PropertyCardProps) {
  return (
    <div className="property-card bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-xl">
      <div className="relative">
        <div className={`h-48 ${gradient} flex items-center justify-center`}>
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <div className="w-8 h-8 bg-white bg-opacity-40 rounded"></div>
          </div>
        </div>
        <div
          className={`absolute top-4 left-4 ${
            type === "sale" ? "bg-green-500" : "bg-orange-500"
          } text-white px-3 py-1 rounded-full text-sm font-medium`}
        >
          {type === "sale" ? "ขาย" : "ให้เช่า"}
        </div>
      </div>
      <div className="p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
          <span className="text-2xl font-bold text-blue-600">{price}</span>
        </div>
        <p className="mt-3 mb-4 flex items-center text-gray-600">
          <MapPin className="mr-2 h-4 w-4 text-blue-500" />
          <span className="line-clamp-2">{location}</span>
        </p>
        <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <Bed className="h-4 w-4" />
            {beds} ห้องนอน
          </span>
          <span className="flex items-center gap-1">
            <Bath className="h-4 w-4" />
            {baths} ห้องน้ำ
          </span>
          <span className="flex items-center gap-1">
            <Square className="h-4 w-4" />
            {sqft.toLocaleString()} ตร.ฟุต
          </span>
        </div>
        <button
          onClick={() => onViewDetails(id)}
          className="w-full rounded-xl bg-blue-600 py-2.5 font-semibold text-white transition hover:bg-blue-700"
        >
          ดูรายละเอียด
        </button>
      </div>
    </div>
  )
}
