"use client"

import { MapPin, Home, DollarSign, Search } from "lucide-react"

export default function HeroSection() {
  const handleSearch = () => {
    alert("ฟังก์ชันค้นหาจะกรองอสังหาริมทรัพย์ตามเงื่อนไขของคุณ!")
  }

  return (
    <section className="bg-gradient-to-br from-blue-600 via-purple-600 to-purple-700 text-white py-12 sm:py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
          ค้นหาบ้านในฝันของคุณ
        </h1>
        <p className="text-lg sm:text-xl md:text-2xl mb-6 sm:mb-8 opacity-90 max-w-3xl mx-auto">
          ค้นหาอสังหาริมทรัพย์ที่เหมาะสมในทำเลที่คุณต้องการ
        </p>

        {/* Search Bar */}
        <div className="bg-white rounded-lg p-3 sm:p-4 md:p-6 shadow-2xl max-w-4xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Location */}
            <div className="relative">
              <MapPin className="absolute left-3 top-3 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="ทำเล"
                className="w-full pl-10 pr-4 py-2.5 sm:py-2 bg-white dark:bg-white text-gray-900 placeholder-gray-400 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
              />
            </div>

            {/* Property Type */}
            <div className="relative">
              <Home className="absolute left-3 top-3 text-gray-400" size={16} />
              <select
                className="w-full pl-10 pr-4 py-2.5 sm:py-2 bg-white dark:bg-white text-gray-900 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base appearance-none"
                defaultValue=""
              >
                <option value="" disabled>ประเภทอสังหาริมทรัพย์</option>
                <option>บ้าน</option>
                <option>อพาร์ตเมนต์</option>
                <option>คอนโด</option>
                <option>ที่ดิน</option>
              </select>
            </div>

            {/* Price Range */}
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 text-gray-400" size={16} />
              <select
                className="w-full pl-10 pr-4 py-2.5 sm:py-2 bg-white dark:bg-white text-gray-900 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base appearance-none"
                defaultValue=""
              >
                <option value="" disabled>ช่วงราคา</option>
                <option>$0 - $200,000</option>
                <option>$200,000 - $500,000</option>
                <option>$500,000 - $1,000,000</option>
                <option>$1,000,000+</option>
              </select>
            </div>

            {/* Search Button */}
            <button
              onClick={handleSearch}
              className="bg-blue-600 text-white px-4 sm:px-6 py-2.5 sm:py-2 rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center text-sm sm:text-base"
            >
              <Search className="mr-2" size={16} />
              ค้นหา
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
