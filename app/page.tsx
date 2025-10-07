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

const missionHighlights = [
  "ให้บริการที่โปร่งใสและน่าเชื่อถือ",
  "ใช้เทคโนโลยีเพื่อความสะดวกสบาย",
  "สร้างประสบการณ์ที่ดีที่สุดให้ลูกค้า",
]

const visionHighlights = [
  "เป็นผู้นำในตลาดอสังหาริมทรัพย์ออนไลน์",
  "ขยายบริการครอบคลุมทั่วประเทศ",
  "พัฒนานวัตกรรมใหม่ๆ อย่างต่อเนื่อง",
]

const features = [
  {
    icon: Search,
    title: "ค้นหาทรงพลัง",
    description:
      "ค้นหาบ้านที่ตรงใจได้รวดเร็วด้วยตัวกรองที่ละเอียดและเครื่องมือค้นหาที่ใช้งานง่าย",
  },
  {
    icon: Shield,
    title: "ปลอดภัยรอบด้าน",
    description:
      "ระบบปกป้องข้อมูลหลายชั้น พร้อมการยืนยันตัวตนและตรวจสอบรายการอย่างเข้มงวดในทุกขั้นตอน",
  },
  {
    icon: MessageSquare,
    title: "แชทสดทันที",
    description: "ติดต่อกับเจ้าของบ้านหรือนายหน้าได้ทันทีผ่านระบบแชทในแอป",
  },
  {
    icon: Gauge,
    title: "รวดเร็วทันใจ",
    description: "เว็บไซต์โหลดเร็ว ใช้งานง่าย ทั้งบนมือถือและคอมพิวเตอร์",
  },
  {
    icon: Award,
    title: "บริการมืออาชีพ",
    description: "ทีมงานมืออาชีพพร้อมให้คำปรึกษาและช่วยเหลือตลอด 24 ชั่วโมง",
  },
  {
    icon: Star,
    title: "รีวิวจริงจากผู้ใช้",
    description: "คะแนนความพึงพอใจสูงจากผู้ใช้จริงทั่วประเทศ",
  },
]

const stats = [
  {
    icon: Building2,
    value: "10,000+",
    label: "ประกาศอสังหาฯ",
  },
  {
    icon: Users,
    value: "50,000+",
    label: "ผู้ใช้งาน",
  },
  {
    icon: TrendingUp,
    value: "5,000+",
    label: "การขายสำเร็จ",
  },
  {
    icon: Clock,
    value: "24/7",
    label: "บริการลูกค้า",
  },
]

const howItWorks = [
  {
    step: "1",
    title: "สมัครสมาชิก",
    description:
      "สร้างบัญชีผู้ใช้ฟรี ใช้เวลาเพียงไม่กี่นาที พร้อมยืนยันตัวตนเพื่อความปลอดภัย",
  },
  {
    step: "2",
    title: "ค้นหาหรือลงประกาศ",
    description:
      "ค้นหาบ้านที่ใช่ด้วยระบบกรองที่ทรงพลัง หรือลงประกาศขายบ้านของคุณ",
  },
  {
    step: "3",
    title: "ติดต่อและปิดดีล",
    description:
      "แชทกับเจ้าของบ้านหรือผู้สนใจ นัดดูบ้าน และปิดการขายได้อย่างปลอดภัย",
  },
]

const faqs = [
  {
    value: "item-1",
    question: "DreamHome คืออะไร?",
    answer:
      "DreamHome เป็นแพลตฟอร์มอสังหาริมทรัพย์ออนไลน์ที่ช่วยให้คุณค้นหา ซื้อ ขาย และเช่าอสังหาริมทรัพย์ได้อย่างง่ายดายและปลอดภัย",
  },
  {
    value: "item-2",
    question: "ใช้บริการฟรีหรือไม่?",
    answer:
      "การสมัครสมาชิกและค้นหาอสังหาริมทรัพย์ใช้ฟรี การลงประกาศขายพื้นฐานก็ฟรีเช่นกัน อาจมีค่าบริการเสริมสำหรับฟีเจอร์พิเศษ",
  },
  {
    value: "item-3",
    question: "ปลอดภัยแค่ไหน?",
    answer:
      "เรามีระบบรักษาความปลอดภัยระดับสูง การยืนยันตัวตน และการตรวจสอบประกาศทุกรายการ เพื่อให้คุณมั่นใจในการใช้บริการ",
  },
  {
    value: "item-4",
    question: "มีบริการช่วยเหลือหรือไม่?",
    answer:
      "มีทีมงานคอยให้บริการและช่วยเหลือตลอด 24 ชั่วโมง ผ่านแชท อีเมล หรือโทรศัพท์ พร้อมคู่มือการใช้งานที่ครบถ้วน",
  },
  {
    value: "item-5",
    question: "สามารถใช้งานบนมือถือได้หรือไม่?",
    answer:
      "ได้ครับ เว็บไซต์ของเราออกแบบมาให้ใช้งานได้ดีทั้งบนมือถือ แท็บเล็ต และคอมพิวเตอร์ รองรับทุกขนาดหน้าจอ",
  },
]

export default function Home() {
  return (
    <div className={`${inter.className} bg-gray-50 text-gray-900`}>
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_60%)]" aria-hidden />
        <div className="layout-container relative section-spacing-lg">
          <div className="max-w-4xl mx-auto text-center">
            <span className="inline-flex items-center justify-center rounded-full bg-white/15 px-4 py-1 text-sm font-semibold tracking-wide text-white shadow-sm ring-1 ring-white/25">
              เกี่ยวกับ DreamHome
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
              แพลตฟอร์มอสังหาริมทรัพย์ที่ทันสมัยที่สุด
            </h1>
            <p className="mt-6 text-lg text-white/90 sm:text-xl">
              DreamHome คือแพลตฟอร์มอสังหาริมทรัพย์ออนไลน์ที่ออกแบบมาเพื่อให้การหาบ้าน การขาย และการเช่าอสังหาริมทรัพย์เป็นเรื่องง่ายและสะดวกสบายที่สุด
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link href="/buy" className="inline-flex">
                <Button size="lg" className="w-full bg-white text-emerald-700 hover:bg-gray-100 sm:w-auto">
                  เริ่มค้นหาบ้าน
                </Button>
              </Link>
              <Link href="/sell" className="inline-flex">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full border-white/40 bg-transparent text-white shadow-sm hover:bg-white/10 hover:text-white sm:w-auto"
                >
                  ลงประกาศขาย
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* MISSION & VISION */}
      <section className="section-spacing bg-white">
        <div className="layout-container">
          <div className="section-header">
            <h2 className="section-title">พันธกิจและวิสัยทัศน์</h2>
            <p className="section-description">เราตั้งใจที่จะเปลี่ยนแปลงวิธีการซื้อขายอสังหาริมทรัพย์ให้ดีขึ้น</p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
            <Card className="h-full shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <Heart className="h-6 w-6" />
                </div>
                <CardTitle className="text-2xl">พันธกิจ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-gray-600">
                <p>
                  เราต้องการสร้างแพลตฟอร์มที่ทำให้การหาบ้านในฝันเป็นเรื่องง่าย โปร่งใส และน่าเชื่อถือ ด้วยเทคโนโลยีที่ทันสมัยและการบริการที่เป็นมิตร
                </p>
                <ul className="space-y-3">
                  {missionHighlights.map((highlight) => (
                    <li key={highlight} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="h-full shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <Globe className="h-6 w-6" />
                </div>
                <CardTitle className="text-2xl">วิสัยทัศน์</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-gray-600">
                <p>
                  เป็นแพลตฟอร์มอสังหาริมทรัพย์อันดับหนึ่งในประเทศไทย ที่ทุกคนเลือกใช้เมื่อต้องการซื้อ ขาย หรือเช่าอสังหาริมทรัพย์
                </p>
                <ul className="space-y-3">
                  {visionHighlights.map((highlight) => (
                    <li key={highlight} className="flex items-start gap-3">
                      <Star className="mt-0.5 h-5 w-5 text-emerald-600" />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="section-spacing bg-gray-50">
        <div className="layout-container">
          <div className="section-header">
            <Badge className="section-eyebrow">คุณสมบัติเด่น</Badge>
            <h2 className="section-title">ทำไมต้องเลือก DreamHome?</h2>
            <p className="section-description">เราให้บริการครบวงจรด้วยเทคโนโลยีที่ทันสมัยและทีมงานมืออาชีพ</p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <Card key={title} className="h-full shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <CardHeader className="items-center text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center text-gray-600">{description}</CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* STATISTICS */}
      <section className="section-spacing bg-white">
        <div className="layout-container">
          <div className="section-header">
            <h2 className="section-title">ตัวเลขที่น่าประทับใจ</h2>
            <p className="section-description">ความไว้วางใจจากลูกค้าหลายพันคนทั่วประเทศ</p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map(({ icon: Icon, value, label }) => (
              <div
                key={label}
                className="flex flex-col items-center rounded-2xl border border-emerald-100 bg-emerald-50/60 px-8 py-10 text-center shadow-sm"
              >
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white text-emerald-600 shadow">
                  <Icon className="h-8 w-8" />
                </div>
                <div className="text-3xl font-bold text-gray-900">{value}</div>
                <div className="mt-2 text-gray-600">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section-spacing bg-gray-50">
        <div className="layout-container">
          <div className="section-header">
            <Badge className="section-eyebrow">วิธีการใช้งาน</Badge>
            <h2 className="section-title">ใช้งานง่ายเพียง 3 ขั้นตอน</h2>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {howItWorks.map(({ step, title, description }) => (
              <Card
                key={step}
                className="h-full border border-emerald-100 bg-white/80 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <CardContent className="flex h-full flex-col items-center gap-4 p-8 text-gray-700">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-2xl font-bold text-white shadow-md">
                    {step}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
                  <p>{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-spacing bg-white">
        <div className="layout-container max-w-3xl">
          <div className="section-header">
            <Badge className="section-eyebrow">คำถามที่พบบ่อย</Badge>
            <h2 className="section-title">FAQ</h2>
          </div>

          <Accordion type="single" collapsible className="mt-10 w-full">
            {faqs.map(({ value, question, answer }) => (
              <AccordionItem key={value} value={value}>
                <AccordionTrigger>{question}</AccordionTrigger>
                <AccordionContent>{answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="section-spacing bg-emerald-600 text-white">
        <div className="layout-container max-w-4xl text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">พร้อมเริ่มต้นแล้วหรือยัง?</h2>
          <p className="mt-4 text-lg opacity-90 sm:text-xl">เข้าร่วมกับผู้ใช้หลายพันคนที่เชื่อมั่นใน DreamHome</p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/buy" className="inline-flex">
              <Button size="lg" className="w-full bg-white text-emerald-700 hover:bg-gray-100 sm:w-auto">
                เริ่มค้นหาบ้าน
              </Button>
            </Link>
            <Link href="/sell" className="inline-flex">
              <Button
                size="lg"
                variant="outline"
                className="w-full border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white sm:w-auto"
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
