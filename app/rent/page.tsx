import { Inter } from "next/font/google"
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
    <div className={`${inter.className} bg-gray-50 text-gray-900`}>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-green-600 to-teal-600 text-white">
        <div className="layout-container section-spacing-lg">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">ค้นหาเช่าที่ใช่สำหรับคุณ</h1>
            <p className="mt-4 text-lg text-white/90 sm:text-xl">
              ค้นหาอสังหาริมทรัพย์ให้เช่าที่ยอดเยี่ยมในพื้นที่ของคุณ
            </p>
          </div>

          {/* Rental Search */}
          <div className="mx-auto mt-10 max-w-4xl rounded-2xl bg-white p-6 shadow-xl sm:p-8">
            <Tabs defaultValue="monthly" className="mb-6">
              <TabsList className="grid w-full grid-cols-2 rounded-xl bg-gray-100 p-1">
                <TabsTrigger value="monthly" className="rounded-lg text-sm font-semibold">
                  ค่าเช่ารายเดือน
                </TabsTrigger>
                <TabsTrigger value="short-term" className="rounded-lg text-sm font-semibold">
                  เช่าระยะสั้น
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-3 text-gray-400" size={20} />
                <Input
                  placeholder="ทำเล"
                  className="h-12 w-full rounded-xl border-gray-200 pl-10 text-gray-900 placeholder:text-gray-500"
                />
              </div>
              <Select>
                <SelectTrigger className="h-12 rounded-xl border-gray-200 text-gray-900 font-medium">
                  <SelectValue placeholder="ประเภทอสังหา" />
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectItem value="apartment">อพาร์ตเมนต์</SelectItem>
                  <SelectItem value="house">บ้าน</SelectItem>
                  <SelectItem value="studio">สตูดิโอ</SelectItem>
                  <SelectItem value="room">ห้อง</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="h-12 rounded-xl border-gray-200 text-gray-900 font-medium">
                  <SelectValue placeholder="งบประมาณต่อเดือน" />
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectItem value="0-1000">$0 - $1,000</SelectItem>
                  <SelectItem value="1000-2000">$1,000 - $2,000</SelectItem>
                  <SelectItem value="2000-3000">$2,000 - $3,000</SelectItem>
                  <SelectItem value="3000+">$3,000+</SelectItem>
                </SelectContent>
              </Select>
              <Button className="h-12 rounded-xl bg-green-600 font-semibold shadow-sm hover:bg-green-700">
                <Search className="mr-2" size={20} />
                ค้นหาที่เช่า
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Rentals */}
      <section className="section-spacing">
        <div className="layout-container">
          <div className="section-header">
            <h2 className="section-title">ประกาศเช่าเด่น</h2>
            <p className="section-description">อสังหาริมทรัพย์ให้เช่าที่คัดสรรไว้สำหรับคุณ</p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card
                key={index}
                className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="relative">
                  <div className="flex h-48 items-center justify-center bg-gradient-to-r from-green-400 to-blue-500">
                    <Building className="text-white" size={48} />
                  </div>
                  <Badge className="absolute left-4 top-4 rounded-full bg-orange-500 px-3 py-1 text-white shadow">
                    ให้เช่า
                  </Badge>
                  <div className="absolute right-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-gray-700 shadow">
                    พร้อมเข้าอยู่ทันที
                  </div>
                </div>
                <CardContent className="flex flex-1 flex-col gap-4 p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">อพาร์ตเมนต์หรู</h3>
                    <div className="text-left sm:text-right">
                      <div className="text-2xl font-bold text-green-600">
                        ${(Math.random() * 2000 + 1000).toFixed(0)}
                      </div>
                      <div className="text-sm text-gray-500">/เดือน</div>
                    </div>
                  </div>
                  <p className="flex items-center gap-2 text-gray-600">
                    <MapPin size={16} />
                    456 Pine Avenue, Midtown
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <span>2 ห้องนอน</span>
                    <span>2 ห้องน้ำ</span>
                    <span>950 ตร.ฟุต</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-semibold">
                      เลี้ยงสัตว์ได้
                    </Badge>
                    <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-semibold">
                      ที่จอดรถ
                    </Badge>
                  </div>
                  <Button className="mt-auto w-full rounded-xl bg-green-600 font-semibold hover:bg-green-700">
                    นัดชม
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Rental Services */}
      <section className="section-spacing bg-white">
        <div className="layout-container">
          <div className="section-header">
            <h2 className="section-title">บริการสำหรับการเช่า</h2>
            <p className="section-description">ทุกอย่างที่คุณต้องการเพื่อประสบการณ์การเช่าที่ราบรื่น</p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            <Card className="flex flex-col items-center gap-4 rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <Search className="text-green-600" size={28} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">ค้นหาอสังหาริมทรัพย์</h3>
              <p className="text-gray-600">ตัวกรองขั้นสูงเพื่อค้นหาที่เช่าที่ตรงใจ</p>
            </Card>

            <Card className="flex flex-col items-center gap-4 rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <Calendar className="text-blue-600" size={28} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">ทัวร์เสมือนจริง</h3>
              <p className="text-gray-600">นัดชมอสังหาริมทรัพย์แบบเสมือนหรือแบบจริง</p>
            </Card>

            <Card className="flex flex-col items-center gap-4 rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
                <DollarSign className="text-purple-600" size={28} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">เครื่องคำนวณค่าเช่า</h3>
              <p className="text-gray-600">เครื่องมือคำนวณความสามารถและวางแผนงบประมาณ</p>
            </Card>
          </div>
        </div>
      </section>

    </div>
  )
}
