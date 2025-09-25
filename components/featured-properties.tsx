"use client"

import { useState } from "react"
import PropertyCard from "./property-card"
import PropertyModal from "./property-modal"

const featuredProperties = [
  {
    id: 1,
    title: "บ้านครอบครัวสมัยใหม่",
    price: "$450,000",
    location: "123 ถนนโอ๊ค ใจกลางเมือง",
    beds: 3,
    baths: 2,
    sqft: 1200,
    type: "sale" as const,
    gradient: "bg-gradient-to-r from-blue-400 to-purple-500",
  },
  {
    id: 2,
    title: "อพาร์ตเมนต์หรู",
    price: "$2,500/mo",
    location: "456 ถนนไพน์ ย่านมิดทาวน์",
    beds: 2,
    baths: 2,
    sqft: 950,
    type: "rent" as const,
    gradient: "bg-gradient-to-r from-green-400 to-blue-500",
  },
  {
    id: 3,
    title: "คอทเทจอบอุ่น",
    price: "$320,000",
    location: "789 ถนนเมเปิล ชานเมือง",
    beds: 2,
    baths: 1,
    sqft: 800,
    type: "sale" as const,
    gradient: "bg-gradient-to-r from-purple-400 to-pink-500",
  },
]

export default function FeaturedProperties() {
  const [selectedProperty, setSelectedProperty] = useState<number | null>(null)

  const handleViewDetails = (id: number) => {
    setSelectedProperty(id)
  }

  const handleCloseModal = () => {
    setSelectedProperty(null)
  }

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">อสังหาริมทรัพย์แนะนำ</h2>
          <p className="text-gray-600 text-lg">คัดสรรอสังหาริมทรัพย์พิเศษเพื่อคุณ</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredProperties.map((property) => (
            <PropertyCard key={property.id} {...property} onViewDetails={handleViewDetails} />
          ))}
        </div>
      </div>

      {selectedProperty && <PropertyModal propertyId={selectedProperty} onClose={handleCloseModal} />}
    </section>
  )
}
