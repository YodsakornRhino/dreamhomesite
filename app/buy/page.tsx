import { Inter } from "next/font/google"
import HeroSection from "@/components/hero-section"
import FeaturedProperties from "@/components/featured-properties"
import PropertyListings from "@/components/property-listings"
import CallToAction from "@/components/call-to-action"
import ChatWidget from "@/components/chat-widget"

const inter = Inter({ subsets: ["latin"] })

export default function BuyPage() {
  return (
    <div className={`${inter.className} bg-gray-50`}>
      <HeroSection />
      <FeaturedProperties />
      <PropertyListings />
      <CallToAction />
      <ChatWidget />
    </div>
  )
}
