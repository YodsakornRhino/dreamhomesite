import { Inter } from "next/font/google"
import ChatWidget from "@/components/chat-widget"
import { Search, MapPin, Building, Calendar, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

const inter = Inter({ subsets: ["latin"] })

export default function RentPage() {
  return (
    <div className={`${inter.className} bg-gray-50 min-h-screen`}>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-600 to-teal-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">ค้นหาเช่าที่ใช่สำหรับคุณ</h1>
            <p className="text-xl opacity-90">ค้นหาอสังหาริมทรัพย์ให้เช่าที่ยอดเยี่ยมในพื้นที่ของคุณ</p>
          </div>

          {/* Rental Search */}
          <div className="bg-white rounded-lg p-6 shadow-xl max-w-4xl mx-auto">
            <Tabs defaultValue="monthly" className="mb-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="monthly">ค่าเช่ารายเดือน</TabsTrigger>
                <TabsTrigger value="short-term">เช่าระยะสั้น</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-gray-400 z-10" size={20} />
                <Input placeholder="ทำเล" className="pl-10 text-gray-900 placeholder:text-gray-500 font-medium" />
              </div>
              <Select>
                <SelectTrigger className="text-gray-900 font-medium">
                  <SelectValue placeholder="ประเภทอสังหา" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apartment">อพาร์ตเมนต์</SelectItem>
                  <SelectItem value="house">บ้าน</SelectItem>
                  <SelectItem value="studio">สตูดิโอ</SelectItem>
                  <SelectItem value="room">ห้อง</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="text-gray-900 font-medium">
                  <SelectValue placeholder="งบประมาณต่อเดือน" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0-1000">$0 - $1,000</SelectItem>
                  <SelectItem value="1000-2000">$1,000 - $2,000</SelectItem>
                  <SelectItem value="2000-3000">$2,000 - $3,000</SelectItem>
                  <SelectItem value="3000+">$3,000+</SelectItem>
                </SelectContent>
              </Select>
              <Button className="bg-green-600 hover:bg-green-700 font-semibold">
                <Search className="mr-2" size={20} />
                ค้นหาที่เช่า
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Rentals */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">ประกาศเช่าเด่น</h2>
            <p className="text-gray-600">อสังหาริมทรัพย์ให้เช่าที่คัดสรรไว้</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative">
                  <div className="h-48 bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center">
                    <Building className="text-white" size={48} />
                  </div>
                  <Badge className="absolute top-2 left-2 bg-orange-500">ให้เช่า</Badge>
                  <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded">
                    <span className="text-sm font-semibold">พร้อมเข้าอยู่ทันที</span>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">อพาร์ตเมนต์หรู</h3>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        ${(Math.random() * 2000 + 1000).toFixed(0)}
                      </div>
                      <div className="text-sm text-gray-500">/เดือน</div>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-3 flex items-center">
                    <MapPin size={16} className="mr-1" />
                    456 Pine Avenue, Midtown
                  </p>
                  <div className="flex justify-between text-sm text-gray-600 mb-4">
                    <span>2 ห้องนอน</span>
                    <span>2 ห้องน้ำ</span>
                    <span>950 ตร.ฟุต</span>
                  </div>
                  <div className="flex gap-2 mb-4">
                    <Badge variant="secondary">เลี้ยงสัตว์ได้</Badge>
                    <Badge variant="secondary">ที่จอดรถ</Badge>
                  </div>
                  <Button className="w-full bg-green-600 hover:bg-green-700">นัดชม</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Rental Services */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">บริการสำหรับการเช่า</h2>
            <p className="text-gray-600">ทุกอย่างที่คุณต้องการเพื่อประสบการณ์การเช่าที่ราบรื่น</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="text-green-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">ค้นหาอสังหาริมทรัพย์</h3>
              <p className="text-gray-600">ตัวกรองขั้นสูงเพื่อค้นหาที่เช่าที่ตรงใจ</p>
            </Card>

            <Card className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="text-blue-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">ทัวร์เสมือนจริง</h3>
              <p className="text-gray-600">นัดชมอสังหาริมทรัพย์แบบเสมือนหรือแบบจริง</p>
            </Card>

            <Card className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="text-purple-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">เครื่องคำนวณค่าเช่า</h3>
              <p className="text-gray-600">เครื่องมือคำนวณความสามารถและวางแผนงบประมาณ</p>
            </Card>
          </div>
        </div>
      </section>

      <ChatWidget />
    </div>
  )
}
