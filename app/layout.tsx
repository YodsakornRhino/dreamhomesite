import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/AuthContext"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "DreamHome - ค้นหาบ้านในฝันของคุณ",
  description: "แพลตฟอร์มอสังหาริมทรัพย์ออนไลน์ที่ดีที่สุด สำหรับการซื้อ ขาย และเช่าบ้าน",
  keywords: "บ้าน, อสังหาริมทรัพย์, ซื้อบ้าน, ขายบ้าน, เช่าบ้าน, DreamHome",
  authors: [{ name: "DreamHome Team" }],
  creator: "DreamHome",
  publisher: "DreamHome",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
