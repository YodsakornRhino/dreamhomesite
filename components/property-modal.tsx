"use client"

import type React from "react"

import { X, Bed, Bath, Square, Check, MapPin } from "lucide-react"
import { useEffect } from "react"

interface PropertyModalProps {
  propertyId: number
  onClose: () => void
}

export default function PropertyModal({ propertyId, onClose }: PropertyModalProps) {
  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = "auto"
    }
  }, [])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-white bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto mx-2 sm:mx-4">
        <div className="p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Property Details</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors p-1">
              <X size={24} />
            </button>
          </div>

          {/* Image Gallery */}
          <div className="mb-4 sm:mb-6">
            <div className="h-48 sm:h-64 md:h-96 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center mb-4">
              <div className="w-16 sm:w-20 h-16 sm:h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <div className="w-8 sm:w-10 h-8 sm:h-10 bg-white bg-opacity-40 rounded"></div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-1 sm:gap-2">
              {[
                "bg-gradient-to-r from-green-400 to-blue-500",
                "bg-gradient-to-r from-purple-400 to-pink-500",
                "bg-gradient-to-r from-yellow-400 to-orange-500",
                "bg-gradient-to-r from-teal-400 to-blue-500",
              ].map((gradient, index) => (
                <div
                  key={index}
                  className={`h-16 sm:h-20 ${gradient} rounded flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity`}
                >
                  <div className="w-4 sm:w-6 h-4 sm:h-6 bg-white bg-opacity-30 rounded"></div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            <div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Modern Family Home</h3>
              <p className="text-gray-600 mb-4 flex items-center text-sm sm:text-base">
                <MapPin className="mr-1" size={16} />
                123 Oak Street, Downtown
              </p>
              <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-4 sm:mb-6">$450,000</div>

              <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
                <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <Bed className="mx-auto text-blue-600 mb-2" size={20} />
                  <div className="font-semibold text-sm sm:text-base">3</div>
                  <div className="text-xs sm:text-sm text-gray-600">Bedrooms</div>
                </div>
                <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <Bath className="mx-auto text-blue-600 mb-2" size={20} />
                  <div className="font-semibold text-sm sm:text-base">2</div>
                  <div className="text-xs sm:text-sm text-gray-600">Bathrooms</div>
                </div>
                <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <Square className="mx-auto text-blue-600 mb-2" size={20} />
                  <div className="font-semibold text-sm sm:text-base">1,200</div>
                  <div className="text-xs sm:text-sm text-gray-600">Sq Ft</div>
                </div>
              </div>

              <div className="mb-4 sm:mb-6">
                <h4 className="font-semibold mb-2 text-sm sm:text-base">Description</h4>
                <p className="text-gray-600 text-sm sm:text-base">
                  Beautiful modern family home in a quiet neighborhood. Features include updated kitchen, hardwood
                  floors, spacious backyard, and two-car garage. Perfect for families looking for comfort and
                  convenience.
                </p>
              </div>

              <div className="mb-4 sm:mb-6">
                <h4 className="font-semibold mb-2 text-sm sm:text-base">Features</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2 text-xs sm:text-sm">
                  {[
                    "Hardwood Floors",
                    "Updated Kitchen",
                    "Two-Car Garage",
                    "Backyard",
                    "Central Air",
                    "Near Schools",
                  ].map((feature) => (
                    <div key={feature} className="flex items-center">
                      <Check className="text-green-500 mr-2" size={14} />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              {/* Map Placeholder */}
              <div className="h-48 sm:h-64 bg-gray-200 rounded-lg mb-4 sm:mb-6 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <MapPin className="mx-auto mb-2" size={24} />
                  <div className="text-sm sm:text-base">Interactive Map</div>
                </div>
              </div>

              {/* Contact Form */}
              <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
                <h4 className="font-semibold mb-4 text-sm sm:text-base">Contact Agent</h4>
                <div className="space-y-3 sm:space-y-4">
                  <input
                    type="text"
                    placeholder="Your Name"
                    className="w-full px-3 sm:px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
                  />
                  <input
                    type="email"
                    placeholder="Your Email"
                    className="w-full px-3 sm:px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
                  />
                  <input
                    type="tel"
                    placeholder="Your Phone"
                    className="w-full px-3 sm:px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
                  />
                  <textarea
                    placeholder="Message"
                    rows={3}
                    className="w-full px-3 sm:px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
                  />
                  <button className="w-full bg-blue-600 text-white py-2.5 sm:py-2 rounded-lg hover:bg-blue-700 transition text-sm sm:text-base">
                    Send Message
                  </button>
                </div>

                <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="w-10 sm:w-12 h-10 sm:h-12 bg-blue-600 rounded-full flex items-center justify-center">
                      <div className="w-5 sm:w-6 h-5 sm:h-6 bg-white rounded-full"></div>
                    </div>
                    <div>
                      <div className="font-semibold text-sm sm:text-base">Sarah Johnson</div>
                      <div className="text-xs sm:text-sm text-gray-600">Licensed Real Estate Agent</div>
                      <div className="text-xs sm:text-sm text-blue-600">(555) 123-4567</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
