"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip"
import ProfileModal from "./profile-modal"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Menu,
  Home,
  ShoppingCart,
  Building,
  PenTool,
  BookOpen,
  LogOut,
  User,
  Mail,
  AlertCircle,
  Loader2,
  MessageCircle,
  Search,
  X,
  ArrowLeft,
} from "lucide-react"
import SignInModal from "./sign-in-modal"
import SignUpModal from "./sign-up-modal"
import { useAuthContext } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { ToastAction } from "@/components/ui/toast"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type ChatMessage = {
  from: "me" | "them"
  text: string
  time: string
}

const Navigation: React.FC = () => {
  const { user, loading, signOut } = useAuthContext()
  const { toast } = useToast()
  const pathname = usePathname()

  const [isSignInOpen, setIsSignInOpen] = useState(false)
  const [isSignUpOpen, setIsSignUpOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)

  // คุมเมนูมือถือ (Sheet)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // ปิดเมนูมือถืออัตโนมัติเมื่อมีการเปลี่ยนหน้า
  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    if (typeof window === "undefined") return

    const openChat = () => setIsChatOpen(true)
    const closeChat = () => setIsChatOpen(false)

    window.addEventListener("dreamhome:open-chat", openChat)
    window.addEventListener("dreamhome:close-chat", closeChat)

    return () => {
      window.removeEventListener("dreamhome:open-chat", openChat)
      window.removeEventListener("dreamhome:close-chat", closeChat)
    }
  }, [])

  const handleMobileNavClick = () => {
    setIsMobileOpen(false)
  }

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + "..."
  }

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase()
  }

  const confirmSignOut = async () => {
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
        description: "กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      })
    } finally {
      setIsSigningOut(false)
    }
  }

  const handleSignOut = () => {
    const { dismiss } = toast({
      variant: "destructive",
      title: "ยืนยันการออกจากระบบ",
      description: "แน่ใจว่าจะออกจากระบบหรือไม่?",
      action: (
        <ToastAction
          altText="confirm sign out"
          onClick={() => {
            dismiss()
            confirmSignOut()
          }}
        >
          ยืนยัน
        </ToastAction>
      ),
    })
  }

  // เพิ่ม flag disabled สำหรับ “เช่า”
  const navItems = [
    { href: "/", label: "หน้าแรก", icon: Home },
    { href: "/buy", label: "ซื้อ", icon: ShoppingCart },
    { href: "/rent", label: "เช่า (เร็วๆนี้)", icon: Building, disabled: true as const },
    { href: "/sell", label: "ขาย", icon: PenTool },
    { href: "/blog", label: "บล็อก", icon: BookOpen },
  ]

  const switchToSignUp = () => {
    setIsSignInOpen(false)
    setIsSignUpOpen(true)
  }

  const switchToSignIn = () => {
    setIsSignUpOpen(false)
    setIsSignInOpen(true)
  }

  const chatContacts = useMemo(
    () => [
      {
        id: "1",
        name: "วรารัตน์ กานต์พิพัฒน์",
        lastMessage: "มีบ้านแนะนำแถวสุขุมวิทไหมคะ",
        time: "2 ชม.",
        unread: 2,
        status: "ออนไลน์",
      },
      {
        id: "2",
        name: "คมกริช ใจดี",
        lastMessage: "สนใจบ้านเดี่ยวที่ส่งมา",
        time: "5 ชม.",
        unread: 0,
        status: "ออฟไลน์",
      },
      {
        id: "3",
        name: "ครอบครัว ธนภัทร",
        lastMessage: "พรุ่งนี้นัดชมบ้านได้ไหม",
        time: "เมื่อวาน",
        unread: 1,
        status: "ออนไลน์",
      },
    ],
    []
  )

  const chatMessages = useMemo<Record<string, ChatMessage[]>>(
    () => ({
      "1": [
        { from: "them", text: "สวัสดีค่ะ สนใจคอนโดใกล้ BTS", time: "14:02" },
        { from: "me", text: "ได้เลยค่ะ เดี๋ยวส่งรายละเอียดให้นะครับ", time: "14:05" },
        { from: "them", text: "ขอบคุณค่ะ", time: "14:06" },
      ],
      "2": [
        { from: "them", text: "บ้านเดี่ยวที่ส่งมาราคาเท่าไหร่ครับ", time: "09:15" },
        { from: "me", text: "เริ่มต้นที่ 4.5 ล้านครับ มีโปรโมชันพิเศษด้วย", time: "09:20" },
      ],
      "3": [
        { from: "them", text: "สนใจนัดชมบ้านโครงการ A", time: "19:30" },
        { from: "me", text: "ได้เลยครับ วันไหนสะดวกบ้างครับ", time: "19:32" },
      ],
    }),
    []
  )

  useEffect(() => {
    if (!isChatOpen) {
      setSelectedChatId(null)
    }
  }, [isChatOpen])

  const activeChat = selectedChatId
    ? chatContacts.find((contact) => contact.id === selectedChatId)
    : null

  const activeMessages = selectedChatId ? chatMessages[selectedChatId] ?? [] : []

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4">
          <div className="flex h-14 sm:h-16 w-full items-center">
            {/* Logo */}
            <div className="flex flex-1 items-center">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Home className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <span className="text-lg sm:text-xl font-bold text-gray-900">DreamHome</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <TooltipProvider delayDuration={0}>
              <div className="hidden md:flex items-center justify-center space-x-1">
                {navItems.map((item) =>
                  item.disabled ? (
                    <Tooltip key={item.label}>
                      <TooltipTrigger asChild>
                        {/* ปุ่ม Disabled (ไม่ลิงก์) */}
                        <Button
                          variant="ghost"
                          className="flex items-center text-sm font-medium opacity-60 cursor-not-allowed"
                          aria-disabled="true"
                          aria-label={item.label}
                          type="button"
                          onClick={(e) => e.preventDefault()}
                        >
                          <item.icon className="w-4 h-4 lg:w-5 lg:h-5" />
                          <span className="hidden lg:inline ml-2">{item.label}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">{item.label}</TooltipContent>
                    </Tooltip>
                  ) : (
                    <Tooltip key={item.href}>
                      <TooltipTrigger asChild>
                        <Link href={item.href}>
                          <Button
                            variant="ghost"
                            className="flex items-center text-sm font-medium"
                            aria-label={item.label}
                          >
                            <item.icon className="w-4 h-4 lg:w-5 lg:h-5" />
                            <span className="hidden lg:inline ml-2">{item.label}</span>
                          </Button>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">{item.label}</TooltipContent>
                    </Tooltip>
                  )
                )}
              </div>
            </TooltipProvider>

            {/* User Section */}
            <div className="flex flex-1 items-center justify-end space-x-2 sm:space-x-3">
              {loading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  <span className="text-sm text-gray-500 hidden sm:inline">กำลังโหลด...</span>
                </div>
              ) : user ? (
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="relative h-8 w-8 sm:h-9 sm:w-auto sm:px-3 rounded-full sm:rounded-md"
                      >
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                            <AvatarImage src={user.photoURL || ""} alt={user.email || ""} />
                            <AvatarFallback className="text-xs sm:text-sm bg-blue-100 text-blue-700">
                              {getInitials(user.email || "U")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="hidden sm:flex flex-col items-start min-w-0 max-w-[120px] lg:max-w-[200px]">
                            <div className="flex items-center space-x-1">
                              <span className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                                {truncateText(
                                  user.displayName || user.email?.split("@")[0] || "ผู้ใช้",
                                  15
                                )}
                              </span>
                              {!user.emailVerified && (
                                <Badge variant="destructive" className="text-xs px-1 py-0 h-4 lg:px-2 lg:h-5">
                                  <span className="lg:hidden">!</span>
                                  <span className="hidden lg:inline">ยังไม่ยืนยัน</span>
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-gray-500 truncate max-w-full">
                              {truncateText(user.email || "", 20)}
                            </span>
                          </div>
                        </div>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {user.displayName || user.email?.split("@")[0] || "ผู้ใช้"}
                          </p>
                          <p className="text-xs leading-none text-muted-foreground break-all">{user.email}</p>
                          {!user.emailVerified && (
                            <div className="flex items-center space-x-1 mt-2">
                              <AlertCircle className="h-3 w-3 text-yellow-600" />
                              <span className="text-xs text-yellow-600">อีเมลยังไม่ได้รับการยืนยัน</span>
                            </div>
                          )}
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setIsProfileOpen(true)}>
                        <User className="mr-2 h-4 w-4" />
                        <span>โปรไฟล์</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setIsChatOpen(true)}>
                        <Mail className="mr-2 h-4 w-4" />
                        <span>ข้อความ</span>
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
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className="text-xs sm:text-sm"
                  >
                    {isSigningOut ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <LogOut className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">ออกจากระบบ</span>
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsSignInOpen(true)}
                    className="text-xs sm:text-sm"
                  >
                    เข้าสู่ระบบ
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setIsSignUpOpen(true)}
                    className="text-xs sm:text-sm bg-blue-600 hover:bg-blue-700"
                  >
                    สมัครสมาชิก
                  </Button>
                </div>
              )}

              {/* Mobile Menu */}
              <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="md:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                  <div className="flex flex-col space-y-4 mt-6">
                    {navItems.map((item) =>
                      item.disabled ? (
                        // ปุ่ม Disabled บนมือถือ (ไม่ปิดเมนู, ไม่นำทาง)
                        <Button
                          key={item.label}
                          variant="ghost"
                          className="w-full justify-start text-base opacity-60 cursor-not-allowed"
                          aria-disabled="true"
                          title="ฟีเจอร์นี้จะมาเร็วๆนี้"
                          type="button"
                          onClick={(e) => e.preventDefault()}
                        >
                          <item.icon className="w-5 h-5 mr-3" />
                          {item.label}
                        </Button>
                      ) : (
                        <Link key={item.href} href={item.href}>
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-base"
                            onClick={handleMobileNavClick}
                          >
                            <item.icon className="w-5 h-5 mr-3" />
                            {item.label}
                          </Button>
                        </Link>
                      )
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>

      {/* Modals */}
      <SignInModal isOpen={isSignInOpen} onClose={() => setIsSignInOpen(false)} onSwitchToSignUp={switchToSignUp} />
      <SignUpModal isOpen={isSignUpOpen} onClose={() => setIsSignUpOpen(false)} onSwitchToSignIn={switchToSignIn} />
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />

      <div
        className={cn(
          "fixed top-[72px] right-4 z-[60] h-[calc(100vh-96px)] w-full max-w-md transition-all duration-300",
          isChatOpen
            ? "translate-x-0 opacity-100"
            : "pointer-events-none translate-x-full opacity-0"
        )}
        aria-hidden={!isChatOpen}
      >
        <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center space-x-2">
              <div className="rounded-full bg-blue-100 p-2 text-blue-600">
                <MessageCircle className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-900">ข้อความ</span>
                <span className="text-xs text-slate-500">พูดคุยกับลูกค้าของคุณได้จากที่นี่</span>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsChatOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="relative flex-1 overflow-hidden">
            <div
              className={cn(
                "absolute inset-0 flex h-full flex-col gap-4 bg-white px-4 py-4 transition-transform duration-300",
                selectedChatId ? "-translate-x-full" : "translate-x-0"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm font-medium text-slate-700">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">ทั้งหมด</span>
                  <span className="text-xs text-slate-400">ยังไม่ได้อ่าน</span>
                  <span className="text-xs text-slate-400">กลุ่ม</span>
                </div>
                <Button variant="ghost" size="icon" className="text-slate-500">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              <Input placeholder="ค้นหาในข้อความ" className="h-9 bg-slate-50" />
              <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                {chatContacts.map((contact) => (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => setSelectedChatId(contact.id)}
                    className="flex w-full items-center space-x-3 rounded-xl bg-white p-3 text-left shadow-sm transition hover:-translate-y-[1px] hover:bg-blue-50"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
                      {contact.name.substring(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="truncate text-sm font-semibold text-slate-900">{contact.name}</p>
                        <span className="ml-2 text-[11px] text-slate-400">{contact.time}</span>
                      </div>
                      <p className="truncate text-xs text-slate-500">{contact.lastMessage}</p>
                    </div>
                    {contact.unread > 0 && (
                      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-semibold text-white">
                        {contact.unread}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div
              className={cn(
                "absolute inset-0 flex h-full flex-col bg-white transition-transform duration-300",
                selectedChatId ? "translate-x-0" : "translate-x-full"
              )}
            >
              <div className="flex items-center gap-3 border-b px-4 py-3">
                <Button variant="ghost" size="icon" onClick={() => setSelectedChatId(null)}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
                  {activeChat?.name.substring(0, 2) ?? ""}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-900">{activeChat?.name}</span>
                  <span className="text-xs text-slate-500">{activeChat?.status}</span>
                </div>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-4">
                {activeMessages.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-slate-400">
                    เลือกแชทเพื่อเริ่มต้นสนทนา
                  </div>
                ) : (
                  activeMessages.map((message, index) => (
                    <div
                      key={`${message.time}-${index}`}
                      className={cn(
                        "max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                        message.from === "me"
                          ? "ml-auto bg-blue-600 text-white"
                          : "bg-white text-slate-700"
                      )}
                    >
                      <p className="whitespace-pre-line leading-relaxed">{message.text}</p>
                      <span
                        className={cn(
                          "mt-1 block text-right text-[10px]",
                          message.from === "me" ? "text-blue-100" : "text-slate-400"
                        )}
                      >
                        {message.time}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <div className="border-t bg-white px-4 py-3">
                <div className="flex items-center space-x-2">
                  <Input placeholder="พิมพ์ข้อความ..." className="flex-1" disabled />
                  <Button disabled className="bg-blue-600 text-white hover:bg-blue-600">
                    ส่ง
                  </Button>
                </div>
                <p className="mt-2 text-[11px] text-slate-400">ฟีเจอร์สนทนาจะพร้อมใช้งานเร็วๆ นี้</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Navigation
