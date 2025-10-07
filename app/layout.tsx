import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";



import ClientOnly from "@/components/ClientOnly";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DreamHome - ค้นหาบ้านในฝันของคุณ",
  description: "แพลตฟอร์มอสังหาริมทรัพย์ออนไลน์ที่ดีที่สุดในประเทศไทย ค้นหา ซื้อ ขาย เช่า บ้าน คอนโด ที่ดิน",
  keywords: "อสังหาริมทรัพย์, บ้าน, คอนโด, ที่ดิน, ซื้อบ้าน, ขายบ้าน, เช่าบ้าน",
  authors: [{ name: "DreamHome Team" }],
  creator: "DreamHome",
  publisher: "DreamHome",
  formatDetection: { email: false, address: false, telephone: false },
  metadataBase: new URL("https://dreamhome.com"),
  alternates: { canonical: "/" },
  icons: {
    icon: "/dreamhome-favicon.svg",
    shortcut: "/dreamhome-favicon.svg",
    apple: "/dreamhome-favicon.svg",
  },
  openGraph: {
    title: "DreamHome - ค้นหาบ้านในฝันของคุณ",
    description: "แพลตฟอร์มอสังหาริมทรัพย์ออนไลน์ที่ดีที่สุดในประเทศไทย",
    url: "https://dreamhome.com",
    siteName: "DreamHome",
    locale: "th_TH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DreamHome - ค้นหาบ้านในฝันของคุณ",
    description: "แพลตฟอร์มอสังหาริมทรัพย์ออนไลน์ที่ดีที่สุดในประเทศไทย",
    creator: "@dreamhome",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  generator: "v0.app",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" suppressHydrationWarning>
      {/* เพิ่ม suppressHydrationWarning ที่ body ด้วยเพื่อกัน attribute mismatch บางกรณี */}
      <body
        className={`${inter.className} bg-slate-100 text-slate-900 antialiased`}
        suppressHydrationWarning
      >
        <ClientOnly>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            forcedTheme="light"
            enableSystem={false}
            disableTransitionOnChange
          >
              <AuthProvider>
                {/* ✅ reCAPTCHA container แบบถาวร: ใช้ id นี้ให้ตรงกับใน profile-modal */}
                <div
                  id="recaptcha-container-root"
                  // มองไม่เห็น แต่ยังอยู่ใน DOM ตลอดอายุเพจ (อย่าใช้ display:none)
                  className="sr-only"
                  aria-hidden="true"
                />

                <div className="flex min-h-screen flex-col">
                  <Navigation />
                  <main className="flex-1">
                    <div className="mx-auto w-full max-w-7xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
                      <div className="page-shell">{children}</div>
                    </div>
                  </main>
                  <Footer />
                </div>
                <Toaster />
              </AuthProvider>
          </ThemeProvider>
        </ClientOnly>
      </body>
    </html>
  );
}
