import Link from "next/link"
import { Search, Plus } from "lucide-react"

export default function CallToAction() {
  return (
    <section className="full-bleed rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 px-6 py-16 text-white shadow-2xl sm:px-10 sm:py-20">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 text-center">
        <Link
          href="/search"
          className="inline-flex items-center justify-center rounded-full bg-white px-8 py-3 font-semibold text-blue-600 shadow-lg transition hover:bg-gray-100"
        >
          <Search className="mr-2" size={20} />
          เริ่มค้นหา
        </Link>
        <div className="space-y-4">
          <h2 className="text-3xl font-bold md:text-4xl">พร้อมจะค้นหาบ้านในฝันหรือยัง?</h2>
          <p className="text-lg opacity-90 md:text-xl">
            ร่วมกับผู้ใช้นับพันที่พบอสังหาริมทรัพย์ที่ใช่กับเรา
          </p>
        </div>
        <Link
          href="/sell"
          className="inline-flex items-center justify-center rounded-lg border-2 border-white/80 px-8 py-3 font-semibold text-white transition hover:bg-white hover:text-blue-600"
        >
          <Plus className="mr-2" size={20} />
          ลงประกาศของคุณ
        </Link>
      </div>
    </section>
  )
}
