"use client"

import { useState } from "react"
import { MapPin, Bed, Bath, Square, Heart } from "lucide-react"

interface PropertyCardProps {
  id: number
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
  const [isFavorited, setIsFavorited] = useState(false)

  const toggleFavorite = () => {
    setIsFavorited(!isFavorited)
  }

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
          {type === "sale" ? "For Sale" : "For Rent"}
        </div>
        <button
          onClick={toggleFavorite}
          className="absolute top-4 right-4 bg-white rounded-full p-2 cursor-pointer hover:bg-gray-100 transition-colors"
        >
          <Heart
            className={`${isFavorited ? "text-red-500 fill-current" : "text-gray-400"} transition-colors`}
            size={16}
          />
        </button>
      </div>
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
          <span className="text-2xl font-bold text-blue-600">{price}</span>
        </div>
        <p className="text-gray-600 mb-4 flex items-center">
          <MapPin className="mr-1" size={14} />
          {location}
        </p>
        <div className="flex items-center space-x-4 mb-4 text-gray-600">
          <span className="flex items-center">
            <Bed className="mr-1" size={14} />
            {beds} Beds
          </span>
          <span className="flex items-center">
            <Bath className="mr-1" size={14} />
            {baths} Baths
          </span>
          <span className="flex items-center">
            <Square className="mr-1" size={14} />
            {sqft.toLocaleString()} sqft
          </span>
        </div>
        <button
          onClick={() => onViewDetails(id)}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium"
        >
          View Details
        </button>
      </div>
    </div>
  )
}
