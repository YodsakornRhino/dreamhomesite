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
import { Menu, User, LogOut, Settings, Home, Search, PlusCircle, BookOpen, Loader2 } from "lucide-react"
import SignInModal from "./sign-in-modal"
import SignUpModal from "./sign-up-modal"
import { useAuthContext } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"

export default function Navigation() {
  const { user, loading, signOut } = useAuthContext()
  const { toast } = useToast()

  const [isSignInOpen, setIsSignInOpen] = useState(false)
  const [isSignUpOpen, setIsSignUpOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut()
      toast({
        title: "ออกจากระบบสำเร็จ",
        description: "ขอบคุณที่ใช้งาน DreamHome",
      })
    } catch (error) {
      console.error("Sign out error:", error)
      toast({
        title: "ออกจากระบบไม่สำเร็จ",
        description: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      })
    } finally {
      setIsSigningOut(false)
    }
  }

  const switchToSignUp = () => {
    setIsSignInOpen(false)
    setIsSignUpOpen(true)
  }

  const switchToSignIn = () => {
    setIsSignUpOpen(false)
    setIsSignInOpen(true)
  }

  const getUserInitials = (email: string) => {
    return email.charAt(0).toUpperCase()
  }

  const navigationItems = [
    { href: "/", label: "หน้าหลัก", icon: Home },
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
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Desktop Auth Section */}
            <div className="hidden md:flex items-center space-x-4">
              {loading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-gray-600">กำลังโหลด...</span>
                </div>
              ) : user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.photoURL || ""} alt={user.email || ""} />
                        <AvatarFallback className="bg-blue-600 text-white">
                          {getUserInitials(user.email || "U")}
                        </AvatarFallback>
                      </Avatar>
                      {!user.emailVerified && (
                        <Badge
                          variant="destructive"
                          className="absolute -top-1 -right-1 h-3 w-3 p-0 flex items-center justify-center text-xs"
                        >
                          !
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">บัญชีของคุณ</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                        {!user.emailVerified && (
                          <Badge variant="outline" className="text-xs w-fit">
                            ยังไม่ยืนยันอีเมล
                          </Badge>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        <span>โปรไฟล์</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>การตั้งค่า</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} disabled={isSigningOut}>
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
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" onClick={() => setIsSignInOpen(true)}>
                    เข้าสู่ระบบ
                  </Button>
                  <Button onClick={() => setIsSignUpOpen(true)}>สมัครสมาชิก</Button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                  <div className="flex flex-col space-y-4 mt-6">
                    {/* Mobile Navigation Links */}
                    {navigationItems.map((item) => {
                      const Icon = item.icon
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="flex items-center space-x-3 text-lg font-medium text-gray-700 hover:text-blue-600 transition-colors"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Icon className="h-5 w-5" />
                          <span>{item.label}</span>
                        </Link>
                      )
                    })}

                    <div className="border-t pt-4">
                      {loading ? (
                        <div className="flex items-center space-x-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm text-gray-600">กำลังโหลด...</span>
                        </div>
                      ) : user ? (
                        <div className="space-y-4">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={user.photoURL || ""} alt={user.email || ""} />
                              <AvatarFallback className="bg-blue-600 text-white">
                                {getUserInitials(user.email || "U")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{user.email}</span>
                              {!user.emailVerified && (
                                <Badge variant="outline" className="text-xs w-fit">
                                  ยังไม่ยืนยันอีเมล
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Link
                              href="/profile"
                              className="flex items-center space-x-3 text-lg font-medium text-gray-700 hover:text-blue-600 transition-colors"
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              <User className="h-5 w-5" />
                              <span>โปรไฟล์</span>
                            </Link>
                            <Link
                              href="/settings"
                              className="flex items-center space-x-3 text-lg font-medium text-gray-700 hover:text-blue-600 transition-colors"
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              <Settings className="h-5 w-5" />
                              <span>การตั้งค่า</span>
                            </Link>
                            <Button
                              variant="ghost"
                              className="w-full justify-start p-0 h-auto text-lg font-medium text-gray-700 hover:text-blue-600"
                              onClick={() => {
                                handleSignOut()
                                setIsMobileMenuOpen(false)
                              }}
                              disabled={isSigningOut}
                            >
                              <div className="flex items-center space-x-3">
                                {isSigningOut ? (
                                  <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                  <LogOut className="h-5 w-5" />
                                )}
                                <span>{isSigningOut ? "กำลังออกจากระบบ..." : "ออกจากระบบ"}</span>
                              </div>
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <Button
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={() => {
                              setIsSignInOpen(true)
                              setIsMobileMenuOpen(false)
                            }}
                          >
                            เข้าสู่ระบบ
                          </Button>
                          <Button
                            className="w-full"
                            onClick={() => {
                              setIsSignUpOpen(true)
                              setIsMobileMenuOpen(false)
                            }}
                          >
                            สมัครสมาชิก
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>

      {/* Auth Modals */}
      <SignInModal isOpen={isSignInOpen} onClose={() => setIsSignInOpen(false)} onSwitchToSignUp={switchToSignUp} />
      <SignUpModal isOpen={isSignUpOpen} onClose={() => setIsSignUpOpen(false)} onSwitchToSignIn={switchToSignIn} />
    </>
  )
}
