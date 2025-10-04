"use client"

import type React from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip"
import ProfileModal from "./profile-modal"
import { UserPropertyModal } from "./user-property-modal"
import BuyerConfirmationPrompt from "./buyer-confirmation-prompt"
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
  Bell,
  AlertCircle,
  Loader2,
  KeyRound,
} from "lucide-react"
import SignInModal from "./sign-in-modal"
import SignUpModal from "./sign-up-modal"
import { useAuthContext } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { ToastAction } from "@/components/ui/toast"
import ChatPanel from "./chat-panel"
import useNotificationSound from "@/hooks/use-notification-sound"
import type {
  ChatOpenEventDetail,
  PropertyPreviewOpenEventDetail,
  PropertyPreviewPayload,
} from "@/types/chat"
import type { UserProperty } from "@/types/user-property"
import { getDocument } from "@/lib/firestore"
import { mapDocumentToUserProperty } from "@/lib/user-property-mapper"
import { subscribeToUserNotifications, markUserNotificationsRead } from "@/lib/notifications"
import type { UserNotification } from "@/types/notifications"
import { cn } from "@/lib/utils"

const notificationCategoryMeta: Record<
  UserNotification["category"],
  { label: string; tone: string }
> = {
  inspection: {
    label: "การตรวจบ้าน",
    tone: "bg-blue-100 text-blue-700 border-blue-200",
  },
  message: {
    label: "ข้อความ",
    tone: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  system: {
    label: "ระบบ",
    tone: "bg-slate-100 text-slate-700 border-slate-200",
  },
}

const formatNotificationDateTime = (value: string) => {
  if (!value) return ""

  try {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return ""
    }

    return new Intl.DateTimeFormat("th-TH", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date)
  } catch (error) {
    console.error("Failed to format notification time", error)
    return value
  }
}

const Navigation: React.FC = () => {
  const { user, loading, signOut } = useAuthContext()
  const { toast } = useToast()
  const pathname = usePathname()
  const router = useRouter()

  const [isSignInOpen, setIsSignInOpen] = useState(false)
  const [isSignUpOpen, setIsSignUpOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [requestedParticipantId, setRequestedParticipantId] = useState<string | null>(null)
  const [requestedPropertyPreview, setRequestedPropertyPreview] =
    useState<PropertyPreviewPayload | null>(null)
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false)
  const [propertyModalLoading, setPropertyModalLoading] = useState(false)
  const [propertyModalProperty, setPropertyModalProperty] = useState<UserProperty | null>(null)
  const activePropertyRequestIdRef = useRef<string | null>(null)
  const [userNotifications, setUserNotifications] = useState<UserNotification[]>([])
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const [isNotificationDialogOpen, setIsNotificationDialogOpen] = useState(false)
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0)
  const notificationIdsRef = useRef<Set<string>>(new Set())
  const notificationInitializedRef = useRef(false)
  const playNotificationSound = useNotificationSound()

  // คุมเมนูมือถือ (Sheet)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // ปิดเมนูมือถืออัตโนมัติเมื่อมีการเปลี่ยนหน้า
  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  const handleMobileNavClick = () => {
    setIsMobileOpen(false)
  }

  const handleOpenNotifications = useCallback(() => {
    if (!user) return
    setIsNotificationDialogOpen(true)
  }, [user])

  const handleNotificationClick = useCallback(
    (notification: UserNotification) => {
      if (notification.actionType === "open-chat" && notification.actionTarget) {
        setRequestedParticipantId(notification.actionTarget)
        setIsChatOpen(true)
        setIsNotificationDialogOpen(false)
        return
      }

      if (notification.actionType === "navigate" && notification.actionHref) {
        setIsNotificationDialogOpen(false)
        router.push(notification.actionHref)
      }
    },
    [router, setIsChatOpen, setIsNotificationDialogOpen, setRequestedParticipantId],
  )

  const unreadNotifications = useMemo(
    () => userNotifications.filter((notification) => !notification.read),
    [userNotifications],
  )

  useEffect(() => {
    if (!user) {
      setIsChatOpen(false)
      setRequestedParticipantId(null)
      setUserNotifications([])
      setUnreadNotificationCount(0)
      setNotificationsLoading(false)
      setIsNotificationDialogOpen(false)
      notificationIdsRef.current = new Set()
      notificationInitializedRef.current = false
    }
  }, [user])

  useEffect(() => {
    if (!user?.uid) {
      return undefined
    }

    let unsubNotifications: (() => void) | undefined
    let cancelled = false

    setNotificationsLoading(true)
    notificationIdsRef.current = new Set()
    notificationInitializedRef.current = false

    ;(async () => {
      try {
        unsubNotifications = await subscribeToUserNotifications(user.uid, (items) => {
          if (cancelled) return

          const previousIds = notificationIdsRef.current
          const currentIds = new Set(items.map((item) => item.id))
          const hasNewUnread =
            notificationInitializedRef.current &&
            items.some((item) => !item.read && !previousIds.has(item.id))

          setUserNotifications(items)
          setUnreadNotificationCount(items.filter((item) => !item.read).length)
          setNotificationsLoading(false)

          if (hasNewUnread) {
            void playNotificationSound()
          }

          notificationIdsRef.current = currentIds
          notificationInitializedRef.current = true
        })
      } catch (error) {
        console.error("Failed to subscribe user notifications", error)
        if (cancelled) return
        setNotificationsLoading(false)
        toast({
          variant: "destructive",
          title: "โหลดการแจ้งเตือนไม่สำเร็จ",
          description: error instanceof Error ? error.message : "กรุณาลองใหม่อีกครั้ง",
        })
      }
    })()

    return () => {
      cancelled = true
      unsubNotifications?.()
    }
  }, [playNotificationSound, toast, user?.uid])

  useEffect(() => {
    if (!isNotificationDialogOpen || !user?.uid) return
    if (unreadNotifications.length === 0) return

    void markUserNotificationsRead(
      user.uid,
      unreadNotifications.map((notification) => notification.id),
    )
  }, [isNotificationDialogOpen, unreadNotifications, user?.uid])

  const buildPlaceholderProperty = useCallback(
    (preview: PropertyPreviewPayload, fallbackOwner?: string | null): UserProperty => {
      const safeOwner = preview.ownerUid || fallbackOwner || ""
      const priceValue =
        typeof preview.price === "number" && Number.isFinite(preview.price) ? preview.price : 0

      return {
        id: preview.propertyId,
        userUid: safeOwner,
        sellerName: "",
        sellerPhone: "",
        sellerEmail: "",
        sellerRole: "",
        title: preview.title || "ประกาศอสังหาริมทรัพย์",
        propertyType: "",
        transactionType: preview.transactionType ?? "",
        price: priceValue,
        address: preview.address ?? "",
        city: preview.city ?? "",
        province: preview.province ?? "",
        postal: "",
        lat: null,
        lng: null,
        landArea: "",
        usableArea: "",
        bedrooms: "",
        bathrooms: "",
        parking: null,
        yearBuilt: null,
        description: "",
        photos:
          preview.thumbnailUrl && preview.thumbnailUrl.trim().length > 0
            ? [preview.thumbnailUrl]
            : [],
        video: null,
        createdAt: new Date().toISOString(),
        isUnderPurchase: false,
        confirmedBuyerId: null,
        buyerConfirmed: false,
        sellerDocumentsConfirmed: false,
      }
    },
    [],
  )

  const resetPropertyModal = useCallback(() => {
    setIsPropertyModalOpen(false)
    setPropertyModalProperty(null)
    setPropertyModalLoading(false)
    activePropertyRequestIdRef.current = null
  }, [])

  const loadPropertyById = useCallback(
    async (propertyId: string) => {
      try {
        const doc = await getDocument("property", propertyId)
        if (activePropertyRequestIdRef.current !== propertyId) {
          return
        }

        if (!doc) {
          setPropertyModalLoading(false)
          toast({
            variant: "destructive",
            title: "ไม่พบรายละเอียดประกาศ",
            description: "ประกาศอาจถูกลบหรือไม่พร้อมแสดงแล้ว",
          })
          return
        }

        const mapped = mapDocumentToUserProperty(doc)
        setPropertyModalProperty(mapped)
        setPropertyModalLoading(false)
      } catch (error) {
        console.error("Failed to load property for preview", error)
        if (activePropertyRequestIdRef.current !== propertyId) {
          return
        }

        setPropertyModalLoading(false)
        toast({
          variant: "destructive",
          title: "โหลดรายละเอียดประกาศไม่สำเร็จ",
          description: error instanceof Error ? error.message : "กรุณาลองใหม่อีกครั้ง",
        })
      }
    },
    [toast],
  )

  const handleOpenPropertyPreview = useCallback(
    (detail: PropertyPreviewOpenEventDetail | undefined) => {
      if (!detail?.propertyId) {
        return
      }

      activePropertyRequestIdRef.current = detail.propertyId
      if (detail.preview) {
        setPropertyModalProperty(buildPlaceholderProperty(detail.preview, detail.ownerUid ?? null))
      } else if (
        !propertyModalProperty ||
        propertyModalProperty.id !== detail.propertyId
      ) {
        setPropertyModalProperty(null)
      }

      setIsPropertyModalOpen(true)
      setPropertyModalLoading(true)

      void loadPropertyById(detail.propertyId)
    },
    [buildPlaceholderProperty, loadPropertyById, propertyModalProperty],
  )

  const handleOpenInspectionNotifications = useCallback(() => {
    if (typeof window === "undefined") return

    window.dispatchEvent(new CustomEvent("dreamhome:open-inspection-notifications"))
  }, [])

  useEffect(() => {
    const handleOpenChat = (event: Event) => {
      const detail = (event as CustomEvent<ChatOpenEventDetail>).detail
      setRequestedParticipantId(detail?.participantId ?? null)
      if (detail?.propertyPreview) {
        setRequestedPropertyPreview(detail.propertyPreview)
      }
      setIsChatOpen(true)
    }

    window.addEventListener("dreamhome:open-chat", handleOpenChat)

    return () => {
      window.removeEventListener("dreamhome:open-chat", handleOpenChat)
    }
  }, [])

  useEffect(() => {
    const handlePreview = (event: Event) => {
      const detail = (event as CustomEvent<PropertyPreviewOpenEventDetail>).detail
      handleOpenPropertyPreview(detail)
    }

    window.addEventListener("dreamhome:open-property-preview", handlePreview)

    return () => {
      window.removeEventListener("dreamhome:open-property-preview", handlePreview)
    }
  }, [handleOpenPropertyPreview])

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
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-full p-0"
                    onClick={handleOpenNotifications}
                  >
                    <Bell className="h-4 w-4" />
                    <span className="sr-only">เปิดการแจ้งเตือน</span>
                    {unreadNotificationCount > 0 && (
                      <span className="absolute right-0 top-0 inline-flex h-4 min-w-[16px] translate-x-1/4 -translate-y-1/4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-semibold text-white">
                        {unreadNotificationCount > 99
                          ? "99+"
                          : unreadNotificationCount}
                      </span>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    className="h-8 w-8 sm:h-9 sm:w-9 rounded-full p-0"
                    onClick={() => setIsChatOpen(true)}
                  >
                    <Mail className="h-4 w-4" />
                    <span className="sr-only">เปิดข้อความ</span>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-full p-0"
                      >
                        <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                          <AvatarImage src={user.photoURL || ""} alt={user.email || ""} />
                          <AvatarFallback className="text-xs sm:text-sm bg-blue-100 text-blue-700">
                            {getInitials(user.email || "U")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="sr-only">เมนูโปรไฟล์</span>
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
                      <DropdownMenuItem asChild>
                        <Link href="/buy/my-properties" className="flex items-center">
                          <KeyRound className="mr-2 h-4 w-4" />
                          <span>อสังหาที่ซื้อของฉัน</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleOpenNotifications}>
                        <Bell className="mr-2 h-4 w-4" />
                        <span>การแจ้งเตือน</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setIsChatOpen(true)}>
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

      <Dialog open={isNotificationDialogOpen} onOpenChange={setIsNotificationDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>การแจ้งเตือนทั้งหมด</DialogTitle>
            <DialogDescription>
              ติดตามความเคลื่อนไหวล่าสุดจากการตรวจบ้านและการสนทนาของคุณ
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {notificationsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={`notification-skeleton-${index}`}
                    className="h-20 w-full animate-pulse rounded-2xl bg-slate-100"
                  />
                ))}
              </div>
            ) : userNotifications.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">
                ยังไม่มีการแจ้งเตือนใหม่ในขณะนี้
              </p>
            ) : (
              <div className="max-h-[60vh] overflow-y-auto pr-3">
                <div className="space-y-3 pb-1">
                  {userNotifications.map((notification) => {
                    const categoryMeta = notificationCategoryMeta[notification.category]
                    const timeLabel = formatNotificationDateTime(notification.createdAt)

                    return (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => handleNotificationClick(notification)}
                        className={cn(
                          "w-full rounded-2xl border p-4 text-left transition-colors",
                          notification.read
                            ? "border-slate-200 bg-white hover:bg-slate-50"
                            : "border-blue-200 bg-blue-50/60 hover:bg-blue-100/70",
                          notification.actionType ? "cursor-pointer" : "cursor-default",
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <Badge
                            variant="secondary"
                            className={cn(
                              "rounded-full border px-2 py-0.5 text-[11px] font-medium",
                              categoryMeta.tone,
                            )}
                          >
                            {categoryMeta.label}
                          </Badge>
                          {timeLabel && (
                            <span className="text-xs text-slate-500">{timeLabel}</span>
                          )}
                        </div>
                        <div className="mt-3 space-y-1">
                          <p className="text-sm font-semibold text-slate-900">
                            {notification.title}
                          </p>
                          <p className="text-sm text-slate-600">{notification.message}</p>
                          {notification.context && (
                            <p className="text-xs text-slate-500">{notification.context}</p>
                          )}
                        </div>
                        {notification.actionType && (
                          <span className="mt-3 inline-flex items-center text-xs font-medium text-blue-600">
                            {notification.actionType === "open-chat"
                              ? "เปิดบทสนทนา"
                              : "ดูรายละเอียด"}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modals */}
      <SignInModal isOpen={isSignInOpen} onClose={() => setIsSignInOpen(false)} onSwitchToSignUp={switchToSignUp} />
      <SignUpModal isOpen={isSignUpOpen} onClose={() => setIsSignUpOpen(false)} onSwitchToSignIn={switchToSignIn} />
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      <ChatPanel
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        requestedParticipantId={requestedParticipantId}
        onRequestParticipantHandled={() => setRequestedParticipantId(null)}
        requestedPropertyPreview={requestedPropertyPreview}
        onRequestPropertyPreviewHandled={() => setRequestedPropertyPreview(null)}
      />
      <UserPropertyModal
        open={isPropertyModalOpen}
        property={propertyModalProperty}
        loading={propertyModalLoading}
        onOpenChange={(open) => {
          if (!open) {
            resetPropertyModal()
          } else {
            setIsPropertyModalOpen(true)
          }
        }}
      />
      <BuyerConfirmationPrompt isChatOpen={isChatOpen} />
    </>
  )
}

export default Navigation
