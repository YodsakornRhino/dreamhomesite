import { Inter } from "next/font/google"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  Search,
  Shield,
  Building2,
  MessageSquare,
  Gauge,
  Star,
  CheckCircle2,
  Users,
  Globe,
  Heart,
  Award,
  TrendingUp,
  Clock,
} from "lucide-react"
import Link from "next/link"

const inter = Inter({ subsets: ["latin"] })

export default function Home() {
  return (
    <div className={`${inter.className} bg-gray-50 text-gray-900`}>
      {/* HERO SECTION */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24 text-white">
          <div className="text-center">
            <Badge className="bg-white/10 hover:bg-white/15 text-white border border-white/20 mb-6">
              เกี่ยวกับ DreamHome
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              แพลตฟอร์มอสังหาริมทรัพย์
              <span className="block mt-2">ที่ทันสมัยที่สุด</span>
            </h1>
            <p className="mt-6 text-white/90 text-lg sm:text-xl max-w-3xl mx-auto">
              DreamHome คือแพลตฟอร์มอสังหาริมทรัพย์ออนไลน์ที่ออกแบบมาเพื่อให้การหาบ้าน การขาย
              และการเช่าอสังหาริมทรัพย์เป็นเรื่องง่ายและสะดวกสบายที่สุด
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/buy">
                <Button size="lg" className="bg-white text-emerald-700 hover:bg-gray-100">
                  เริ่มค้นหาบ้าน
                </Button>
              </Link>
              <Link href="/sell">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
                >
                  ลงประกาศขาย
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* MISSION & VISION */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">พันธกิจและวิสัยทัศน์</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">เราตั้งใจที่จะเปลี่ยนแปลงวิธีการซื้อขายอสังหาริมทรัพย์ให้ดีขึ้น</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="shadow-sm hover:shadow-md transition">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                  <Heart className="h-6 w-6" />
                </div>
                <CardTitle className="text-2xl">พันธกิจ</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600 space-y-4">
                <p>
                  เราต้องการสร้างแพลตฟอร์มที่ทำให้การหาบ้านในฝันเป็นเรื่องง่าย โปร่งใส และน่าเชื่อถือ ด้วยเทคโนโลยีที่ทันสมัยและการบริการที่เป็นมิตร
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>ให้บริการที่โปร่งใสและน่าเชื่อถือ</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>ใช้เทคโนโลยีเพื่อความสะดวกสบาย</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>สร้างประสบการณ์ที่ดีที่สุดให้ลูกค้า</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="shadow-sm hover:shadow-md transition">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                  <Globe className="h-6 w-6" />
                </div>
                <CardTitle className="text-2xl">วิสัยทัศน์</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600 space-y-4">
                <p>เป็นแพลตฟอร์มอสังหาริมทรัพย์อันดับหนึ่งในประเทศไทย ที่ทุกคนเลือกใช้เมื่อต้องการซื้อ ขาย หรือเช่าอสังหาริมทรัพย์</p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-emerald-600" />
                    <span>เป็นผู้นำในตลาดอสังหาริมทรัพย์ออนไลน์</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-emerald-600" />
                    <span>ขยายบริการครอบคลุมทั่วประเทศ</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-emerald-600" />
                    <span>พัฒนานวัตกรรมใหม่ๆ อย่างต่อเนื่อง</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 mb-4">คุณสมบัติเด่น</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">ทำไมต้องเลือก DreamHome?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">เราให้บริการครบวงจรด้วยเทคโนโลยีที่ทันสมัยและทีมงานมืออาชีพ</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="shadow-sm hover:shadow-md transition h-full">
              <CardHeader className="items-center text-center">
                <div className="h-10 w-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Search className="h-5 w-5" />
                </div>
                <CardTitle>ค้นหาทรงพลัง</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600 text-center">
                ค้นหาบ้านที่ตรงใจได้รวดเร็วด้วยตัวกรองที่ละเอียดและเครื่องมือค้นหาที่ใช้งานง่าย
              </CardContent>
            </Card>

            <Card className="shadow-sm hover:shadow-md transition h-full">
              <CardHeader className="items-center text-center">
                <div className="h-10 w-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Shield className="h-5 w-5" />
                </div>
                <CardTitle>ปลอดภัยรอบด้าน</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600 text-center">
                ระบบปกป้องข้อมูลหลายชั้น พร้อมการยืนยันตัวตนและตรวจสอบรายการอย่างเข้มงวดในทุกขั้นตอน
              </CardContent>
            </Card>

            <Card className="shadow-sm hover:shadow-md transition h-full">
              <CardHeader className="items-center text-center">
                <div className="h-10 w-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <CardTitle>แชทสดทันที</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600 text-center">
                ติดต่อกับเจ้าของบ้านหรือนายหน้าได้ทันทีผ่านระบบแชทในแอป
              </CardContent>
            </Card>

            <Card className="shadow-sm hover:shadow-md transition h-full">
              <CardHeader className="items-center text-center">
                <div className="h-10 w-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Gauge className="h-5 w-5" />
                </div>
                <CardTitle>รวดเร็วทันใจ</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600 text-center">
                เว็บไซต์โหลดเร็ว ใช้งานง่าย ทั้งบนมือถือและคอมพิวเตอร์
              </CardContent>
            </Card>

            <Card className="shadow-sm hover:shadow-md transition h-full">
              <CardHeader className="items-center text-center">
                <div className="h-10 w-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Award className="h-5 w-5" />
                </div>
                <CardTitle>บริการมืออาชีพ</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600 text-center">
                ทีมงานมืออาชีพพร้อมให้คำปรึกษาและช่วยเหลือตลอด 24 ชั่วโมง
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* STATISTICS */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">ตัวเลขที่น่าประทับใจ</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">ความไว้วางใจจากลูกค้าหลายพันคนทั่วประเทศ</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4">
                <Building2 className="h-8 w-8" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">10,000+</div>
              <div className="text-gray-600">ประกาศอสังหาฯ</div>
            </div>

            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">50,000+</div>
              <div className="text-gray-600">ผู้ใช้งาน</div>
            </div>

            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">5,000+</div>
              <div className="text-gray-600">การขายสำเร็จ</div>
            </div>

            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">24/7</div>
              <div className="text-gray-600">บริการลูกค้า</div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 mb-4">วิธีการใช้งาน</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">ใช้งานง่ายเพียง 3 ขั้นตอน</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold mb-4">สมัครสมาชิก</h3>
              <p className="text-gray-600">สร้างบัญชีผู้ใช้ฟรี ใช้เวลาเพียงไม่กี่นาที พร้อมยืนยันตัวตนเพื่อความปลอดภัย</p>
            </div>

            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold mb-4">ค้นหาหรือลงประกาศ</h3>
              <p className="text-gray-600">ค้นหาบ้านที่ใช่ด้วยระบบกรองที่ทรงพลัง หรือลงประกาศขายบ้านของคุณ</p>
            </div>

            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold mb-4">ติดต่อและปิดดีล</h3>
              <p className="text-gray-600">แชทกับเจ้าของบ้านหรือผู้สนใจ นัดดูบ้าน และปิดการขายได้อย่างปลอดภัย</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 mb-4">คำถามที่พบบ่อย</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">FAQ</h2>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>DreamHome คืออะไร?</AccordionTrigger>
              <AccordionContent>
                DreamHome เป็นแพลตฟอร์มอสังหาริมทรัพย์ออนไลน์ที่ช่วยให้คุณค้นหา ซื้อ ขาย และเช่าอสังหาริมทรัพย์ได้อย่างง่ายดายและปลอดภัย
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger>ใช้บริการฟรีหรือไม่?</AccordionTrigger>
              <AccordionContent>
                การสมัครสมาชิกและค้นหาอสังหาริมทรัพย์ใช้ฟรี การลงประกาศขายพื้นฐานก็ฟรีเช่นกัน อาจมีค่าบริการเสริมสำหรับฟีเจอร์พิเศษ
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger>ปลอดภัยแค่ไหน?</AccordionTrigger>
              <AccordionContent>
                เรามีระบบรักษาความปลอดภัยระดับสูง การยืนยันตัวตน และการตรวจสอบประกาศทุกรายการ เพื่อให้คุณมั่นใจในการใช้บริการ
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger>มีบริการช่วยเหลือหรือไม่?</AccordionTrigger>
              <AccordionContent>
                มีทีมงานคอยให้บริการและช่วยเหลือตลอด 24 ชั่วโมง ผ่านแชท อีเมล หรือโทรศัพท์ พร้อมคู่มือการใช้งานที่ครบถ้วน
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger>สามารถใช้งานบนมือถือได้หรือไม่?</AccordionTrigger>
              <AccordionContent>
                ได้ครับ เว็บไซต์ของเราออกแบบมาให้ใช้งานได้ดีทั้งบนมือถือ แท็บเล็ต และคอมพิวเตอร์ รองรับทุกขนาดหน้าจอ
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 bg-emerald-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">พร้อมเริ่มต้นแล้วหรือยัง?</h2>
          <p className="text-xl mb-8 opacity-90">เข้าร่วมกับผู้ใช้หลายพันคนที่เชื่อมั่นใน DreamHome</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/buy">
              <Button size="lg" className="bg-white text-emerald-700 hover:bg-gray-100">
                เริ่มค้นหาบ้าน
              </Button>
            </Link>
            <Link href="/sell">
              <Button
                size="lg"
                variant="outline"
                className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                ลงประกาศขาย
              </Button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
