import { Inter } from "next/font/google"
import Navigation from "@/components/navigation"
import HeroSection from "@/components/hero-section"
import FeaturedProperties from "@/components/featured-properties"
import PropertyListings from "@/components/property-listings"
import CallToAction from "@/components/call-to-action"
import Footer from "@/components/footer"
import ChatWidget from "@/components/chat-widget"

const inter = Inter({ subsets: ["latin"] })

export default function Home() {
  return (
    <div className={`${inter.className} bg-gray-50`}>
      <Navigation />
      <HeroSection />
      <FeaturedProperties />
      <PropertyListings />
      <CallToAction />
      <Footer />
      <ChatWidget />
    </div>
  )
}
