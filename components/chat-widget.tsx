"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { MessageCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import type { ChatOpenEventDetail } from "@/types/chat"

const SHRINK_DURATION_MS = 220
const OPEN_DELAY_MS = 140

export default function ChatWidget() {
  const [isButtonShrinking, setIsButtonShrinking] = useState(false)
  const shrinkTimeoutRef = useRef<number | null>(null)
  const openTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (shrinkTimeoutRef.current !== null) {
        window.clearTimeout(shrinkTimeoutRef.current)
      }
      if (openTimeoutRef.current !== null) {
        window.clearTimeout(openTimeoutRef.current)
      }
    }
  }, [])

  const handleOpenChat = useCallback(() => {
    if (isButtonShrinking) return

    setIsButtonShrinking(true)

    if (typeof window === "undefined") {
      setIsButtonShrinking(false)
      return
    }

    if (openTimeoutRef.current !== null) {
      window.clearTimeout(openTimeoutRef.current)
    }
    if (shrinkTimeoutRef.current !== null) {
      window.clearTimeout(shrinkTimeoutRef.current)
    }

    openTimeoutRef.current = window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent<ChatOpenEventDetail>("dreamhome:open-chat"))
    }, OPEN_DELAY_MS)

    shrinkTimeoutRef.current = window.setTimeout(() => {
      setIsButtonShrinking(false)
    }, SHRINK_DURATION_MS)
  }, [isButtonShrinking])

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <button
        type="button"
        onClick={handleOpenChat}
        aria-label="เปิดแชทสด"
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-transform duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400",
          isButtonShrinking ? "scale-90" : "scale-100 hover:bg-blue-700",
          !isButtonShrinking && "animate-bounce",
        )}
      >
        <MessageCircle size={24} />
      </button>
    </div>
  )
}
