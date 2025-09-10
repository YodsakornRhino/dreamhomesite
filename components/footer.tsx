import Link from "next/link"
import { Home, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Home className="h-8 w-8 text-emerald-500" />
              <span className="text-2xl font-bold">DreamHome</span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              แพลตฟอร์มอสังหาริมทรัพย์ออนไลน์ที่ทันสมัยและน่าเชื่อถือ ช่วยให้คุณหาบ้านในฝันได้อย่างง่ายดาย
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-emerald-500 transition-colors" aria-label="Facebook">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-emerald-500 transition-colors" aria-label="Twitter">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-emerald-500 transition-colors" aria-label="Instagram">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-emerald-500 transition-colors" aria-label="Youtube">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">ลิงก์ด่วน</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-300 hover:text-emerald-500 transition-colors text-sm">
                  หน้าแรก
                </Link>
              </li>
              <li>
                <Link href="/buy" className="text-gray-300 hover:text-emerald-500 transition-colors text-sm">
                  ซื้ออสังหาฯ
                </Link>
              </li>
              <li>
                <Link href="/rent" className="text-gray-300 hover:text-emerald-500 transition-colors text-sm">
                  เช่าอสังหาฯ
                </Link>
              </li>
              <li>
                <Link href="/sell" className="text-gray-300 hover:text-emerald-500 transition-colors text-sm">
                  ขายอสังหาฯ
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-lg font-semibold mb-4">ทรัพยากร</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/blog" className="text-gray-300 hover:text-emerald-500 transition-colors text-sm">
                  บล็อก
                </Link>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-emerald-500 transition-colors text-sm">
                  คู่มือการใช้งาน
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-emerald-500 transition-colors text-sm">
                  เงื่อนไขการใช้งาน
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-emerald-500 transition-colors text-sm">
                  นโยบายความเป็นส่วนตัว
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">ติดต่อเรา</h3>
            <ul className="space-y-3">
              <li className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                <span className="text-gray-300 text-sm">02-123-4567</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                <span className="text-gray-300 text-sm">info@dreamhome.co.th</span>
              </li>
              <li className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-300 text-sm">
                  123 ถนนสุขุมวิท แขวงคลองตัน
                  <br />
                  เขตวัฒนา กรุงเทพฯ 10110
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">© 2024 DreamHome. สงวนลิขสิทธิ์ทุกประการ</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-emerald-500 transition-colors text-sm">
                เงื่อนไขการใช้งาน
              </a>
              <a href="#" className="text-gray-400 hover:text-emerald-500 transition-colors text-sm">
                นโยบายความเป็นส่วนตัว
              </a>
              <a href="#" className="text-gray-400 hover:text-emerald-500 transition-colors text-sm">
                คุกกี้
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
