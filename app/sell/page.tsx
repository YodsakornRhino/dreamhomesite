import { Inter } from "next/font/google"
import ChatWidget from "@/components/chat-widget"
import { Camera, TrendingUp, Users, Calculator, CheckCircle, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

const inter = Inter({ subsets: ["latin"] })

export default function SellPage() {
  return (
    <div className={`${inter.className} bg-gray-50 min-h-screen`}>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">Sell Your Property with Confidence</h1>
              <p className="text-xl opacity-90 mb-8">
                Get the best value for your property with our expert guidance and marketing
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100">
                  Get Free Valuation
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-purple-600 bg-transparent"
                >
                  List Your Property
                </Button>
              </div>
            </div>

            {/* Quick Valuation Form */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Get Instant Property Valuation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Property Address"
                  className="bg-white/20 border-white/30 text-white placeholder:text-white/70"
                />
                <Input
                  placeholder="Property Type"
                  className="bg-white/20 border-white/30 text-white placeholder:text-white/70"
                />
                <Input
                  placeholder="Square Footage"
                  className="bg-white/20 border-white/30 text-white placeholder:text-white/70"
                />
                <Button className="w-full bg-white text-purple-600 hover:bg-gray-100">
                  <Calculator className="mr-2" size={20} />
                  Get My Valuation
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Sell With Us */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Sell With DreamHome?</h2>
            <p className="text-gray-600">We provide comprehensive services to maximize your property's value</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="text-purple-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Market Expertise</h3>
              <p className="text-gray-600">Deep knowledge of local market trends and pricing strategies</p>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Camera className="text-blue-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Professional Marketing</h3>
              <p className="text-gray-600">High-quality photography and comprehensive online marketing</p>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="text-green-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Expert Agents</h3>
              <p className="text-gray-600">Experienced agents dedicated to getting you the best deal</p>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="text-orange-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Full Service</h3>
              <p className="text-gray-600">End-to-end support from listing to closing</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Selling Process */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Selling Process</h2>
            <p className="text-gray-600">Simple steps to sell your property successfully</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Property Valuation",
                description: "We assess your property's market value using comprehensive market analysis",
              },
              {
                step: "2",
                title: "Marketing & Listing",
                description: "Professional photography, staging advice, and multi-channel marketing campaign",
              },
              {
                step: "3",
                title: "Sale & Closing",
                description: "Handle negotiations, paperwork, and guide you through the closing process",
              },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Success Stories</h2>
            <p className="text-gray-600">See what our satisfied sellers have to say</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Johnson",
                location: "Downtown",
                testimonial: "Sold my condo 15% above asking price in just 2 weeks!",
                rating: 5,
              },
              {
                name: "Mike Chen",
                location: "Suburbs",
                testimonial: "The marketing was incredible. Had multiple offers within days.",
                rating: 5,
              },
              {
                name: "Lisa Rodriguez",
                location: "Midtown",
                testimonial: "Professional service from start to finish. Highly recommended!",
                rating: 5,
              },
            ].map((testimonial, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-center mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="text-yellow-400 fill-current" size={20} />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">"{testimonial.testimonial}"</p>
                <div>
                  <div className="font-semibold">{testimonial.name}</div>
                  <div className="text-sm text-gray-500">{testimonial.location}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-16 bg-purple-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Ready to Sell?</h2>
            <p className="text-gray-600">Contact us today for a free consultation</p>
          </div>

          <Card>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <Input placeholder="Your full name" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <Input placeholder="your.email@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <Input placeholder="(555) 123-4567" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Property Address</label>
                  <Input placeholder="123 Main Street" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Tell us about your property</label>
                  <Textarea placeholder="Property details, timeline, questions..." rows={4} />
                </div>
                <div className="md:col-span-2">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700" size="lg">
                    Get Started - Free Consultation
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <ChatWidget />
    </div>
  )
}
