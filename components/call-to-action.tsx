import { Search, Plus } from "lucide-react"

export default function CallToAction() {
  return (
    <section className="py-16 bg-blue-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Find Your Dream Home?</h2>
        <p className="text-xl mb-8 opacity-90">
          Join thousands of satisfied customers who found their perfect property with us
        </p>
        <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
          <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition flex items-center justify-center">
            <Search className="mr-2" size={20} />
            Start Searching
          </button>
          <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition flex items-center justify-center">
            <Plus className="mr-2" size={20} />
            List Your Property
          </button>
        </div>
      </div>
    </section>
  )
}
