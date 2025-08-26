"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, User, LogOut, Settings, Home, Search, PlusCircle, BookOpen, Loader2, AlertTriangle } from "lucide-react"
import SignInModal from "./sign-in-modal"
import SignUpModal from "./sign-up-modal"
import { useAuthContext } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"

export default function Navigation() {
  const { user, loading, signOut } = useAuthContext()
  const { toast } = useToast()

  const [isSignInOpen, setIsSignInOpen] = useState(false)
  const [isSignUpOpen, setIsSignUpOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut()
      toast({
        title: "ออกจากระบบสำเร็จ",
        description: "ขอบคุณที่ใช้งาน DreamHome",
      })
    } catch (error) {
      console.error("Error signing out:", error)
      toast({
        title: "ออกจากระบบไม่สำเร็จ",
        description: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      })
    } finally {
      setIsSigningOut(false)
    }
  }

  const getUserInitials = (email: string) => {
    return email.charAt(0).toUpperCase()
  }

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + "..."
  }

  const navItems = [
    { href: "/", label: "หน้าแรก", icon: Home },
    { href: "/buy", label: "ซื้อ", icon: Search },
    { href: "/rent", label: "เช่า", icon: Search },
    { href: "/sell", label: "ขาย", icon: PlusCircle },
    { href: "/blog", label: "บล็อก", icon: BookOpen },
  ]

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <Home className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">DreamHome</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* User Section */}
            <div className="flex items-center space-x-4">
              {loading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-gray-600 hidden sm:inline">กำลังโหลด...</span>
                </div>
              ) : user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-auto px-2 sm:px-3">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                          <AvatarImage src="/placeholder.svg" alt={user.email || ""} />
                          <AvatarFallback className="text-xs sm:text-sm bg-blue-600 text-white">
                            {getUserInitials(user.email || "U")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col items-start min-w-0 max-w-[120px] sm:max-w-[200px]">
                          <span className="text-xs sm:text-sm font-medium text-gray-900 truncate w-full">
                            {user.displayName || truncateText(user.email?.split("@")[0] || "ผู้ใช้", 15)}
                          </span>
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-gray-500 truncate max-w-[100px] sm:max-w-[150px]">
                              {truncateText(user.email || "", 20)}
                            </span>
                            {!user.emailVerified && (
                              <Badge variant="secondary" className="text-xs px-1 py-0 h-4 flex items-center">
                                <AlertTriangle className="h-2 w-2 mr-1" />
                                <span className="hidden sm:inline">ยังไม่ยืนยัน</span>
                                <span className="sm:hidden">!</span>
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.displayName || "ผู้ใช้"}</p>
                        <p className="text-xs leading-none text-muted-foreground break-all">{user.email}</p>
                        {!user.emailVerified && (
                          <Badge variant="outline" className="text-xs w-fit">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            อีเมลยังไม่ได้รับการยืนยัน
                          </Badge>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>โปรไฟล์</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>การตั้งค่า</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="cursor-pointer text-red-600 focus:text-red-600"
                      onClick={handleSignOut}
                      disabled={isSigningOut}
                    >
                      {isSigningOut ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <LogOut className="mr-2 h-4 w-4" />
                      )}
                      <span>{isSigningOut ? "กำลังออกจากระบบ..." : "ออกจากระบบ"}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center space-x-2 sm:space-x-4">
                  <Button variant="ghost" onClick={() => setIsSignInOpen(true)} className="text-sm font-medium">
                    เข้าสู่ระบบ
                  </Button>
                  <Button
                    onClick={() => setIsSignUpOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-sm font-medium"
                  >
                    สมัครสมาชิก
                  </Button>
                </div>
              )}

              {/* Mobile Menu */}
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">เปิดเมนู</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                  <div className="flex flex-col space-y-4 mt-6">
                    {navItems.map((item) => {
                      const Icon = item.icon
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="flex items-center space-x-3 text-lg font-medium text-gray-600 hover:text-gray-900 transition-colors"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Icon className="h-5 w-5" />
                          <span>{item.label}</span>
                        </Link>
                      )
                    })}

                    {!user && (
                      <>
                        <div className="border-t pt-4 mt-6">
                          <div className="flex flex-col space-y-3">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setIsSignInOpen(true)
                                setIsMobileMenuOpen(false)
                              }}
                              className="w-full justify-start"
                            >
                              <User className="mr-2 h-4 w-4" />
                              เข้าสู่ระบบ
                            </Button>
                            <Button
                              onClick={() => {
                                setIsSignUpOpen(true)
                                setIsMobileMenuOpen(false)
                              }}
                              className="w-full justify-start bg-blue-600 hover:bg-blue-700"
                            >
                              <PlusCircle className="mr-2 h-4 w-4" />
                              สมัครสมาชิก
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>

      {/* Modals */}
      <SignInModal
        isOpen={isSignInOpen}
        onClose={() => setIsSignInOpen(false)}
        onSwitchToSignUp={() => {
          setIsSignInOpen(false)
          setIsSignUpOpen(true)
        }}
      />
      <SignUpModal
        isOpen={isSignUpOpen}
        onClose={() => setIsSignUpOpen(false)}
        onSwitchToSignIn={() => {
          setIsSignUpOpen(false)
          setIsSignInOpen(true)
        }}
      />
    </>
  )
}
