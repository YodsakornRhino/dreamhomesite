"use client"

import type React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
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
import { useConversations } from "@/hooks/use-conversations"
import { useConversationMessages } from "@/hooks/use-conversation-messages"
import { ensureDirectConversation, sendConversationMessage } from "@/lib/conversations"

const Navigation: React.FC = () => {
  const { user, loading, signOut } = useAuthContext()
  const { toast } = useToast()
  const pathname = usePathname()

  const [isSignInOpen, setIsSignInOpen] = useState(false)
  const [isSignUpOpen, setIsSignUpOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [messageDraft, setMessageDraft] = useState("")
  const [sendingMessage, setSendingMessage] = useState(false)
  const pendingConversationIdRef = useRef<string | null>(null)

  // คุมเมนูมือถือ (Sheet)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const messagesContainerRef = useRef<HTMLDivElement | null>(null)
  const chatContainerRef = useRef<HTMLDivElement | null>(null)

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

  const conversationsState = useConversations(user?.uid ?? null)
  const { messages, loading: messagesLoading, error: messagesError } =
    useConversationMessages(selectedConversationId)

  const selectedConversation = useMemo(
    () =>
      conversationsState.conversations.find(
        (conversation) => conversation.id === selectedConversationId,
      ) ?? null,
    [conversationsState.conversations, selectedConversationId],
  )

  const activeParticipant = selectedConversation?.participants.find(
    (participant) => participant.uid !== user?.uid,
  )

  useEffect(() => {
    if (!isChatOpen) {
      setSelectedConversationId(null)
    }
  }, [isChatOpen])

  useEffect(() => {
    if (!selectedConversationId) return
    if (conversationsState.loading) {
      return
    }

    const exists = conversationsState.conversations.some(
      (conversation) => conversation.id === selectedConversationId,
    )
    if (!exists) {
      if (pendingConversationIdRef.current === selectedConversationId) {
        return
      }
      setSelectedConversationId(null)
      return
    }
    if (pendingConversationIdRef.current === selectedConversationId) {
      pendingConversationIdRef.current = null
    }
  }, [
    conversationsState.conversations,
    conversationsState.loading,
    selectedConversationId,
  ])

  useEffect(() => {
    if (!messagesContainerRef.current) return
    messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
  }, [messages, selectedConversationId, isChatOpen])

  useEffect(() => {
    setMessageDraft("")
  }, [selectedConversationId])

  useEffect(() => {
    if (!isChatOpen) return

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target
      if (!chatContainerRef.current) return
      if (target instanceof Node && chatContainerRef.current.contains(target)) {
        return
      }
      setIsChatOpen(false)
    }

    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("touchstart", handlePointerDown)

    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("touchstart", handlePointerDown)
    }
  }, [isChatOpen])

  useEffect(() => {
    if (typeof window === "undefined") return undefined

    const handler = (event: Event) => {
      const { detail } = event as CustomEvent<{ participantId?: string | null }>
      const participantId = detail?.participantId
      if (!participantId) {
        return
      }

      if (!user) {
        setIsSignInOpen(true)
        toast({
          variant: "destructive",
          title: "กรุณาเข้าสู่ระบบ",
          description: "ต้องเข้าสู่ระบบก่อนจึงจะสามารถเริ่มแชทได้",
        })
        return
      }

      if (participantId === user.uid) {
        toast({
          title: "ไม่สามารถเริ่มแชทได้",
          description: "ไม่สามารถสนทนากับบัญชีของตนเองได้",
          variant: "destructive",
        })
        return
      }

      setIsChatOpen(true)

      void (async () => {
        try {
          const { conversationId } = await ensureDirectConversation({
            currentUserId: user.uid,
            otherUserId: participantId,
          })
          pendingConversationIdRef.current = conversationId
          setSelectedConversationId(conversationId)
        } catch (error) {
          console.error("Failed to start chat", error)
          toast({
            variant: "destructive",
            title: "ไม่สามารถเปิดแชทได้",
            description: "กรุณาลองใหม่อีกครั้ง",
          })
        }
      })()
    }

    window.addEventListener("dreamhome:chat-with-user", handler)

    return () => {
      window.removeEventListener("dreamhome:chat-with-user", handler)
    }
  }, [toast, user])

  const formatRelativeTime = (isoString: string | null) => {
    if (!isoString) return ""
    const date = new Date(isoString)
    if (Number.isNaN(date.getTime())) return ""

    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / 60000)

    if (diffMinutes < 1) return "เมื่อสักครู่"
    if (diffMinutes < 60) return `${diffMinutes} นาทีที่แล้ว`

    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours} ชม.ที่แล้ว`

    return new Intl.DateTimeFormat("th-TH", { dateStyle: "short" }).format(date)
  }

  const formatMessageTime = (isoString: string | null) => {
    if (!isoString) return ""
    const date = new Date(isoString)
    if (Number.isNaN(date.getTime())) return ""

    return new Intl.DateTimeFormat("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date)
  }

  const getParticipantInitials = (name: string | null | undefined, email: string | null | undefined) => {
    const source = name?.trim() || email?.trim() || "ผู้ใช้"
    const parts = source.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return source.slice(0, 2).toUpperCase()
  }

  const handleSendMessage = async () => {
    if (!user || !selectedConversation) return
    const trimmed = messageDraft.trim()
    if (!trimmed) return

    setSendingMessage(true)
    try {
      await sendConversationMessage({
        conversationId: selectedConversation.id,
        participantIds: selectedConversation.participantIds,
        senderId: user.uid,
        text: trimmed,
      })
      setMessageDraft("")
    } catch (error) {
      console.error("Failed to send message", error)
      toast({
        variant: "destructive",
        title: "ส่งข้อความไม่สำเร็จ",
        description: "กรุณาลองใหม่อีกครั้ง",
      })
    } finally {
      setSendingMessage(false)
    }
  }

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
        ref={chatContainerRef}
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
                selectedConversationId ? "-translate-x-full" : "translate-x-0",
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
                {conversationsState.loading ? (
                  <div className="flex h-full items-center justify-center text-sm text-slate-400">
                    กำลังโหลด...
                  </div>
                ) : conversationsState.conversations.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-slate-400">
                    ยังไม่มีประวัติการสนทนา
                  </div>
                ) : (
                  conversationsState.conversations.map((conversation) => {
                    const participant =
                      conversation.otherParticipant ??
                      conversation.participants.find((item) => item.uid !== user?.uid) ??
                      null
                    const isActive = conversation.id === selectedConversationId
                    const initials = getParticipantInitials(
                      participant?.name,
                      participant?.email ?? null,
                    )
                    const displayName = participant?.name ?? "ผู้ใช้งาน"
                    const lastMessageText = conversation.lastMessage?.text || "ยังไม่มีข้อความ"
                    const lastMessageTime = formatRelativeTime(
                      conversation.lastMessage?.createdAt ?? conversation.updatedAt,
                    )

                    return (
                      <button
                        key={conversation.id}
                        type="button"
                        onClick={() => setSelectedConversationId(conversation.id)}
                        className={cn(
                          "flex w-full items-center space-x-3 rounded-xl border border-transparent bg-white p-3 text-left shadow-sm transition hover:-translate-y-[1px] hover:bg-blue-50",
                          isActive && "border-blue-200 bg-blue-50",
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600",
                            isActive && "bg-blue-600 text-white",
                          )}
                        >
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
                            <span className="ml-2 text-[11px] text-slate-400">{lastMessageTime}</span>
                          </div>
                          <p className="truncate text-xs text-slate-500">{lastMessageText}</p>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
              {conversationsState.error ? (
                <p className="text-xs text-destructive">{conversationsState.error}</p>
              ) : null}
            </div>

            <div
              className={cn(
                "absolute inset-0 flex h-full flex-col bg-white transition-transform duration-300",
                selectedConversationId ? "translate-x-0" : "translate-x-full",
              )}
            >
              <div className="flex items-center gap-3 border-b px-4 py-3">
                <Button variant="ghost" size="icon" onClick={() => setSelectedConversationId(null)}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
                  {getParticipantInitials(activeParticipant?.name, activeParticipant?.email ?? null)}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-900">
                    {activeParticipant?.name ?? "เลือกการสนทนา"}
                  </span>
                  <span className="text-xs text-slate-500">
                    {activeParticipant?.email ?? "สนทนา 1 ต่อ 1"}
                  </span>
                </div>
              </div>
              <div
                ref={messagesContainerRef}
                className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-4"
              >
                {!selectedConversation ? (
                  <div className="flex h-full items-center justify-center text-sm text-slate-400">
                    เลือกแชทเพื่อเริ่มต้นสนทนา
                  </div>
                ) : messagesLoading ? (
                  <div className="flex h-full items-center justify-center text-sm text-slate-400">
                    กำลังโหลดข้อความ...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-slate-400">
                    ยังไม่มีข้อความในแชทนี้
                  </div>
                ) : (
                  messages.map((message) => {
                    const isMine = message.senderId === user?.uid
                    return (
                      <div
                        key={message.id}
                        className={cn(
                          "max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                          isMine ? "ml-auto bg-blue-600 text-white" : "bg-white text-slate-700",
                        )}
                      >
                        <p className="whitespace-pre-line leading-relaxed">{message.text}</p>
                        <span
                          className={cn(
                            "mt-1 block text-right text-[10px]",
                            isMine ? "text-blue-100" : "text-slate-400",
                          )}
                        >
                          {formatMessageTime(message.createdAt)}
                        </span>
                      </div>
                    )
                  })
                )}
              </div>
              {messagesError ? (
                <p className="px-4 text-xs text-destructive">{messagesError}</p>
              ) : null}
              <div className="border-t bg-white px-4 py-3">
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder={selectedConversation ? "พิมพ์ข้อความ..." : "เลือกแชทก่อน"}
                    className="flex-1"
                    value={messageDraft}
                    onChange={(event) => setMessageDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault()
                        void handleSendMessage()
                      }
                    }}
                    disabled={!selectedConversation || sendingMessage}
                  />
                  <Button
                    onClick={() => void handleSendMessage()}
                    disabled={
                      !selectedConversation || sendingMessage || messageDraft.trim().length === 0
                    }
                    className="bg-blue-600 text-white hover:bg-blue-600"
                  >
                    {sendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : "ส่ง"}
                  </Button>
                </div>
                <p className="mt-2 text-[11px] text-slate-400">ข้อความจะถูกบันทึกไว้ในระบบเพื่อใช้งานต่อ</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Navigation
