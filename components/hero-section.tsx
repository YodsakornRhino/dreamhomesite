"use client"

import { MapPin, Home, DollarSign, Search } from "lucide-react"

export default function HeroSection() {
  const handleSearch = () => {
    alert("Search functionality would filter properties based on your criteria!")
  }

  return (
    <section className="bg-gradient-to-br from-blue-600 via-purple-600 to-purple-700 text-white py-12 sm:py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
          Find Your Dream Home
        </h1>
        <p className="text-lg sm:text-xl md:text-2xl mb-6 sm:mb-8 opacity-90 max-w-3xl mx-auto">
          Discover the perfect property in your ideal location
        </p>

        {/* Search Bar */}
        <div className="bg-white rounded-lg p-3 sm:p-4 md:p-6 shadow-2xl max-w-4xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="relative">
              <MapPin className="absolute left-3 top-3 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Location"
                className="w-full pl-10 pr-4 py-2.5 sm:py-2 border rounded-lg text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
              />
            </div>
            <div className="relative">
              <Home className="absolute left-3 top-3 text-gray-400" size={16} />
              <select className="w-full pl-10 pr-4 py-2.5 sm:py-2 border rounded-lg text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base">
                <option>Property Type</option>
                <option>House</option>
                <option>Apartment</option>
                <option>Condo</option>
                <option>Land</option>
              </select>
            </div>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 text-gray-400" size={16} />
              <select className="w-full pl-10 pr-4 py-2.5 sm:py-2 border rounded-lg text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base">
                <option>Price Range</option>
                <option>$0 - $200,000</option>
                <option>$200,000 - $500,000</option>
                <option>$500,000 - $1,000,000</option>
                <option>$1,000,000+</option>
              </select>
            </div>
            <button
              onClick={handleSearch}
              className="bg-blue-600 text-white px-4 sm:px-6 py-2.5 sm:py-2 rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center text-sm sm:text-base"
            >
              <Search className="mr-2" size={16} />
              Search
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
