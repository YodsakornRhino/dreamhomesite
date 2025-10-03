"use client"

import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"
import {
  Copy,
  Facebook,
  Instagram,
  Link as LinkIcon,
  MessageCircle,
  Share2,
  Twitter,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatPropertyPrice } from "@/lib/property"
import { useToast } from "@/hooks/use-toast"
import type { UserProperty } from "@/types/user-property"

interface PropertySharePanelProps {
  property: ShareableProperty
  className?: string
  hideHeading?: boolean
}

type ShareableProperty = Pick<
  UserProperty,
  | "id"
  | "title"
  | "price"
  | "transactionType"
  | "userUid"
  | "address"
  | "city"
  | "province"
>

interface ShareOption {
  key: string
  label: string
  icon: ReactNode
  onClick: () => void | Promise<void>
  className?: string
  variant?: "default" | "outline"
}

export function PropertySharePanel({
  property,
  className,
  hideHeading = false,
}: PropertySharePanelProps) {
  const { toast } = useToast()
  const envOrigin = useMemo(
    () => (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, ""),
    [],
  )
  const [origin, setOrigin] = useState(envOrigin)

  useEffect(() => {
    if (typeof window === "undefined") return
    setOrigin(window.location.origin)
  }, [])

  const listingUrl = useMemo(() => {
    const base = origin.replace(/\/$/, "")
    if (property.userUid) {
      return base
        ? `${base}/users/${property.userUid}?propertyId=${property.id}`
        : `/users/${property.userUid}?propertyId=${property.id}`
    }
    return base
      ? `${base}/buy?propertyId=${property.id}`
      : `/buy?propertyId=${property.id}`
  }, [origin, property.id, property.userUid])

  const priceLabel = useMemo(
    () => formatPropertyPrice(property.price, property.transactionType),
    [property.price, property.transactionType],
  )

  const locationLine = useMemo(
    () =>
      [property.address, property.city, property.province]
        .map((value) => value?.trim())
        .filter(Boolean)
        .join(", "),
    [property.address, property.city, property.province],
  )

  const shareMessage = useMemo(() => {
    const lines = [
      "🎉 ชมประกาศอสังหาฯ ของฉัน!",
      `${property.title} - ${priceLabel}`,
    ]
    if (locationLine) lines.push(locationLine)
    lines.push(listingUrl)
    return lines.join("\n")
  }, [locationLine, listingUrl, priceLabel, property.title])

  const encodedUrl = useMemo(() => encodeURIComponent(listingUrl), [listingUrl])
  const encodedHeadline = useMemo(
    () => encodeURIComponent(`${property.title} - ${priceLabel}`),
    [priceLabel, property.title],
  )
  const encodedMessage = useMemo(
    () => encodeURIComponent(shareMessage),
    [shareMessage],
  )

  const copyText = useCallback(
    async (text: string, successMessage: string) => {
      try {
        if (
          typeof navigator !== "undefined" &&
          navigator.clipboard &&
          typeof navigator.clipboard.writeText === "function"
        ) {
          await navigator.clipboard.writeText(text)
        } else if (typeof document !== "undefined") {
          const textArea = document.createElement("textarea")
          textArea.value = text
          textArea.style.position = "fixed"
          textArea.style.opacity = "0"
          document.body.appendChild(textArea)
          textArea.focus()
          textArea.select()
          document.execCommand("copy")
          document.body.removeChild(textArea)
        } else {
          throw new Error("clipboard unavailable")
        }

        toast({
          title: "คัดลอกสำเร็จ",
          description: successMessage,
        })
      } catch (error) {
        console.error("Failed to copy text", error)
        toast({
          title: "คัดลอกไม่สำเร็จ",
          description: "โปรดลองอีกครั้ง",
          variant: "destructive",
        })
      }
    },
    [toast],
  )

  const openShareWindow = useCallback((url: string) => {
    if (typeof window === "undefined") return
    window.open(url, "_blank", "noopener,noreferrer")
  }, [])

  const shareOptions: ShareOption[] = useMemo(
    () => [
      {
        key: "facebook",
        label: "Facebook",
        icon: <Facebook className="h-4 w-4" />,
        onClick: () =>
          openShareWindow(
            `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
          ),
        className:
          "bg-[#1877F2] text-white hover:bg-[#1459C3] focus-visible:ring-[#1877F2]",
      },
      {
        key: "instagram",
        label: "Instagram",
        icon: <Instagram className="h-4 w-4" />,
        onClick: async () => {
          await copyText(
            shareMessage,
            "คัดลอกข้อความสำหรับ Instagram แล้ว",
          )
          openShareWindow("https://www.instagram.com/")
        },
        className:
          "bg-gradient-to-r from-pink-500 via-rose-500 to-amber-400 text-white hover:from-pink-600 hover:via-rose-600 hover:to-amber-400 focus-visible:ring-pink-500",
      },
      {
        key: "line",
        label: "Line",
        icon: <MessageCircle className="h-4 w-4" />,
        onClick: () =>
          openShareWindow(
            `https://social-plugins.line.me/lineit/share?url=${encodedUrl}&text=${encodedHeadline}`,
          ),
        className:
          "bg-[#06C755] text-white hover:bg-[#05b44b] focus-visible:ring-[#06C755]",
      },
      {
        key: "whatsapp",
        label: "WhatsApp",
        icon: <MessageCircle className="h-4 w-4" />,
        onClick: () =>
          openShareWindow(
            `https://api.whatsapp.com/send?text=${encodedMessage}`,
          ),
        className:
          "bg-[#25D366] text-white hover:bg-[#1da955] focus-visible:ring-[#25D366]",
      },
      {
        key: "twitter",
        label: "Twitter / X",
        icon: <Twitter className="h-4 w-4" />,
        onClick: () =>
          openShareWindow(
            `https://twitter.com/intent/tweet?text=${encodedHeadline}&url=${encodedUrl}`,
          ),
        className: "bg-black text-white hover:bg-gray-900 focus-visible:ring-black",
      },
      {
        key: "copy-link",
        label: "คัดลอกลิงก์",
        icon: <LinkIcon className="h-4 w-4" />,
        onClick: () =>
          copyText(listingUrl, "คัดลอกลิงก์ประกาศแล้ว"),
        className: "bg-white text-gray-900 hover:bg-gray-100",
        variant: "outline",
      },
    ],
    [
      copyText,
      encodedHeadline,
      encodedMessage,
      encodedUrl,
      listingUrl,
      openShareWindow,
      shareMessage,
    ],
  )

  return (
    <div
      className={cn(
        "space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm",
        className,
      )}
    >
      {!hideHeading && (
        <div className="space-y-1">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
            <Share2 className="h-5 w-5 text-purple-600" />
            แชร์ประกาศของคุณ
          </h2>
          <p className="text-sm text-gray-600">
            ส่งลิงก์ประกาศไปยังโซเชียลมีเดียเพื่อเข้าถึงผู้ซื้อจำนวนมากขึ้น
          </p>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium text-gray-900">ข้อความอัตโนมัติ</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              copyText(shareMessage, "คัดลอกข้อความประกาศแล้ว")
            }
            className="gap-2"
          >
            <Copy className="h-4 w-4" />
            คัดลอกข้อความ
          </Button>
        </div>
        <div className="whitespace-pre-line rounded-xl border border-dashed border-purple-200 bg-purple-50/70 p-4 text-sm text-gray-700">
          {shareMessage}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {shareOptions.map((option) => (
          <Button
            key={option.key}
            type="button"
            variant={option.variant ?? "default"}
            onClick={() => {
              void option.onClick()
            }}
            className={cn(
              "flex items-center justify-center gap-2 py-3 text-sm font-semibold shadow-sm",
              option.className,
            )}
          >
            {option.icon}
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
