import { Inter } from "next/font/google"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import ChatWidget from "@/components/chat-widget"
import { Calendar, User, ArrowRight, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const inter = Inter({ subsets: ["latin"] })

export default function BlogPage() {
  const blogPosts = [
    {
      title: "10 Tips for First-Time Home Buyers",
      excerpt: "Essential advice for navigating your first home purchase successfully.",
      author: "Sarah Johnson",
      date: "March 15, 2024",
      category: "Buying Tips",
      readTime: "5 min read",
      featured: true,
    },
    {
      title: "Market Trends: What to Expect in 2024",
      excerpt: "Analysis of current real estate market conditions and future predictions.",
      author: "Michael Chen",
      date: "March 12, 2024",
      category: "Market Analysis",
      readTime: "8 min read",
      featured: true,
    },
    {
      title: "Staging Your Home for Maximum Appeal",
      excerpt: "Professional staging tips to help your property sell faster and for more money.",
      author: "Emily Rodriguez",
      date: "March 10, 2024",
      category: "Selling Tips",
      readTime: "6 min read",
      featured: false,
    },
    {
      title: "Investment Properties: A Beginner's Guide",
      excerpt: "Everything you need to know about investing in real estate.",
      author: "David Thompson",
      date: "March 8, 2024",
      category: "Investment",
      readTime: "10 min read",
      featured: false,
    },
    {
      title: "Understanding Mortgage Options",
      excerpt: "A comprehensive guide to different types of mortgages and financing options.",
      author: "Lisa Park",
      date: "March 5, 2024",
      category: "Financing",
      readTime: "7 min read",
      featured: false,
    },
    {
      title: "Neighborhood Guide: Downtown Living",
      excerpt: "Explore the benefits and lifestyle of downtown urban living.",
      author: "Robert Wilson",
      date: "March 3, 2024",
      category: "Neighborhoods",
      readTime: "4 min read",
      featured: false,
    },
  ]

  const categories = [
    "All",
    "Buying Tips",
    "Selling Tips",
    "Market Analysis",
    "Investment",
    "Financing",
    "Neighborhoods",
  ]

  return (
    <div className={`${inter.className} bg-gray-50 min-h-screen`}>
      <Navigation />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Real Estate Insights</h1>
            <p className="text-xl opacity-90">Expert advice, market trends, and helpful tips for buyers and sellers</p>
          </div>

          {/* Search */}
          <div className="bg-white rounded-lg p-4 shadow-xl max-w-2xl mx-auto">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                <Input placeholder="Search articles..." className="pl-10" />
              </div>
              <Button className="bg-teal-600 hover:bg-teal-700">Search</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category, index) => (
              <Button
                key={index}
                variant={index === 0 ? "default" : "outline"}
                size="sm"
                className={index === 0 ? "bg-teal-600 hover:bg-teal-700" : ""}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Posts */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-4">Featured Articles</h2>
            <p className="text-gray-600">Our most popular and recent insights</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            {blogPosts
              .filter((post) => post.featured)
              .map((post, index) => (
                <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-48 bg-gradient-to-r from-teal-400 to-blue-500 flex items-center justify-center">
                    <div className="text-white text-6xl opacity-50">📰</div>
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <Badge variant="secondary">{post.category}</Badge>
                      <span className="text-sm text-gray-500">{post.readTime}</span>
                    </div>
                    <h3 className="text-2xl font-bold mb-3">{post.title}</h3>
                    <p className="text-gray-600 mb-4">{post.excerpt}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <User size={16} className="mr-1" />
                          {post.author}
                        </div>
                        <div className="flex items-center">
                          <Calendar size={16} className="mr-1" />
                          {post.date}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        Read More <ArrowRight size={16} className="ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>

          {/* All Posts */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">All Articles</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-32 bg-gradient-to-r from-cyan-400 to-teal-500 flex items-center justify-center">
                  <div className="text-white text-4xl opacity-50">📝</div>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" size="sm">
                      {post.category}
                    </Badge>
                    <span className="text-xs text-gray-500">{post.readTime}</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 line-clamp-2">{post.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{post.excerpt}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center">
                      <User size={12} className="mr-1" />
                      {post.author}
                    </div>
                    <div className="flex items-center">
                      <Calendar size={12} className="mr-1" />
                      {post.date}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="w-full mt-3">
                    Read Article <ArrowRight size={14} className="ml-1" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Load More */}
          <div className="text-center mt-12">
            <Button variant="outline" size="lg">
              Load More Articles
            </Button>
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-16 bg-teal-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
          <p className="text-gray-600 mb-8">
            Subscribe to our newsletter for the latest real estate insights and market updates
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <Input placeholder="Enter your email" className="flex-1" />
            <Button className="bg-teal-600 hover:bg-teal-700">Subscribe</Button>
          </div>
        </div>
      </section>

      <Footer />
      <ChatWidget />
    </div>
  )
}
