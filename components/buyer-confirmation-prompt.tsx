"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuthContext } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import type { PropertyPreviewOpenEventDetail, PropertyPreviewPayload } from "@/types/chat"
import { formatPropertyPrice } from "@/lib/property"
import { subscribeToCollection, getDocument, updateDocument } from "@/lib/firestore"
import { saveBuyerPropertyFromListing } from "@/lib/buyer-properties"
import type { PropertyPurchaseStatus } from "@/types/property-purchase-status"
import { buildPreviewFromPropertyRecord } from "@/lib/property-preview"

interface BuyerConfirmationPromptProps {
  isChatOpen: boolean
}

export const BuyerConfirmationPrompt: React.FC<BuyerConfirmationPromptProps> = ({
  isChatOpen,
}) => {
  const { user } = useAuthContext()
  const router = useRouter()
  const { toast } = useToast()

  const [propertyStatusMap, setPropertyStatusMap] = useState<
    Record<string, PropertyPurchaseStatus>
  >({})
  const [propertyPreviewMap, setPropertyPreviewMap] = useState<
    Record<string, PropertyPreviewPayload>
  >({})
  const [activePropertyId, setActivePropertyId] = useState<string | null>(null)
  const [confirmingPropertyId, setConfirmingPropertyId] = useState<string | null>(null)
  const dismissedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!user?.uid) {
      setPropertyStatusMap({})
      setPropertyPreviewMap({})
      setActivePropertyId(null)
      dismissedRef.current.clear()
      return undefined
    }

    let unsubscribe: (() => void) | undefined
    let cancelled = false

    void (async () => {
      try {
        const { where } = await import("firebase/firestore")
        unsubscribe = await subscribeToCollection(
          "property",
          (docs) => {
            if (cancelled) return

            const nextStatus: Record<string, PropertyPurchaseStatus> = {}
            const nextPreview: Record<string, PropertyPreviewPayload> = {}

            docs.forEach((doc) => {
              const propertyId = doc.id
              const data = doc.data() as Record<string, unknown>

              const isUnderPurchase = Boolean(data.isUnderPurchase)
              const buyerConfirmed = Boolean(data.buyerConfirmed)
              const sellerDocumentsConfirmed = Boolean(data.sellerDocumentsConfirmed)
              const confirmedBuyerId =
                typeof data.confirmedBuyerId === "string" && data.confirmedBuyerId.trim().length > 0
                  ? data.confirmedBuyerId.trim()
                  : null

              if (
                isUnderPurchase &&
                !buyerConfirmed &&
                confirmedBuyerId === user.uid
              ) {
                nextStatus[propertyId] = {
                  isUnderPurchase,
                  confirmedBuyerId,
                  buyerConfirmed,
                  sellerDocumentsConfirmed,
                }

                const preview = buildPreviewFromPropertyRecord(propertyId, data)
                if (preview) {
                  nextPreview[propertyId] = preview
                }
              } else {
                dismissedRef.current.delete(propertyId)
              }
            })

            setPropertyStatusMap((previous) => {
              for (const key of Object.keys(previous)) {
                if (!nextStatus[key]) {
                  dismissedRef.current.delete(key)
                }
              }
              return nextStatus
            })
            setPropertyPreviewMap(nextPreview)
          },
          where("confirmedBuyerId", "==", user.uid),
        )
      } catch (error) {
        console.error("Failed to subscribe buyer confirmation prompt", error)
      }
    })()

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [user?.uid])

  const eligiblePropertyId = useMemo(() => {
    if (!user?.uid || isChatOpen) {
      return null
    }

    return (
      Object.entries(propertyStatusMap).find(([propertyId, status]) => {
        if (!status?.isUnderPurchase) return false
        if (status.buyerConfirmed) return false
        if (dismissedRef.current.has(propertyId)) return false
        return Boolean(propertyPreviewMap[propertyId])
      })?.[0] ?? null
    )
  }, [isChatOpen, propertyPreviewMap, propertyStatusMap, user?.uid])

  useEffect(() => {
    if (eligiblePropertyId && eligiblePropertyId !== activePropertyId) {
      setActivePropertyId(eligiblePropertyId)
    } else if (!eligiblePropertyId) {
      setActivePropertyId(null)
    }
  }, [activePropertyId, eligiblePropertyId])

  const activePreview = activePropertyId ? propertyPreviewMap[activePropertyId] : null
  const activeStatus = activePropertyId ? propertyStatusMap[activePropertyId] : null

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (open) return

      const propertyId = activePropertyId
      if (!propertyId) return

      const status = propertyStatusMap[propertyId]
      if (status?.isUnderPurchase && !status.buyerConfirmed) {
        dismissedRef.current.add(propertyId)
      } else {
        dismissedRef.current.delete(propertyId)
      }

      setActivePropertyId(null)
    },
    [activePropertyId, propertyStatusMap],
  )

  const handleOpenPropertyPreview = useCallback(() => {
    if (!activePreview?.propertyId) return
    if (typeof window === "undefined") return

    const detail: PropertyPreviewOpenEventDetail = {
      propertyId: activePreview.propertyId,
      ownerUid: activePreview.ownerUid,
      preview: activePreview,
    }

    window.dispatchEvent(
      new CustomEvent<PropertyPreviewOpenEventDetail>(
        "dreamhome:open-property-preview",
        {
          detail,
        },
      ),
    )
  }, [activePreview])

  const handleConfirm = useCallback(async () => {
    if (!user?.uid || !activePreview?.propertyId || !activeStatus) {
      return
    }

    if (!activeStatus.isUnderPurchase || activeStatus.confirmedBuyerId !== user.uid) {
      toast({
        variant: "destructive",
        title: "ยืนยันไม่สำเร็จ",
        description: "สถานะประกาศไม่ถูกต้องสำหรับการยืนยัน",
      })
      return
    }

    if (activeStatus.buyerConfirmed) {
      router.push(`/buy/send-documents?propertyId=${activePreview.propertyId}`)
      setActivePropertyId(null)
      return
    }

    setConfirmingPropertyId(activePreview.propertyId)

    try {
      const confirmedAtIso = new Date().toISOString()
      const propertyDoc = await getDocument("property", activePreview.propertyId)
      const listingData = propertyDoc?.data() as Record<string, unknown> | null

      const operations: Promise<void>[] = [
        updateDocument("property", activePreview.propertyId, {
          buyerConfirmed: true,
          confirmedBuyerId: activeStatus.confirmedBuyerId ?? user.uid,
        }),
        saveBuyerPropertyFromListing({
          buyerUid: user.uid,
          propertyId: activePreview.propertyId,
          listingData,
          preview: activePreview,
          confirmedAt: confirmedAtIso,
        }),
      ]

      if (activePreview.ownerUid) {
        operations.push(
          updateDocument(`users/${activePreview.ownerUid}/user_property`, activePreview.propertyId, {
            buyerConfirmed: true,
          }),
        )
      }

      await Promise.all(operations)

      toast({
        title: "ยืนยันการซื้อเรียบร้อย",
        description: "ตรวจสอบรายการเอกสารที่ต้องเตรียมในขั้นตอนถัดไป",
      })

      dismissedRef.current.delete(activePreview.propertyId)
      setActivePropertyId(null)
      router.push(`/buy/send-documents?propertyId=${activePreview.propertyId}`)
    } catch (error) {
      console.error("Failed to auto-confirm buyer property", error)
      toast({
        variant: "destructive",
        title: "ยืนยันไม่สำเร็จ",
        description: error instanceof Error ? error.message : "กรุณาลองใหม่อีกครั้ง",
      })
    } finally {
      setConfirmingPropertyId(null)
    }
  }, [activePreview, activeStatus, router, toast, user?.uid])

  if (!activePreview || !activeStatus) {
    return null
  }

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg space-y-6 break-words text-pretty sm:max-w-xl md:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold sm:text-xl">
            ผู้ขายยืนยันการซื้อแล้ว
          </DialogTitle>
          <DialogDescription className="break-words text-pretty text-sm sm:text-base">
            {`ผู้ขายได้ยืนยันประกาศ ${activePreview.title}`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 break-words rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-pretty text-sm text-amber-800 sm:text-base">
          {activePreview.price && Number.isFinite(activePreview.price) && (
            <p className="break-words font-semibold">
              ราคา {formatPropertyPrice(activePreview.price, activePreview.transactionType ?? "sale")}
            </p>
          )}
          {(activePreview.address || activePreview.city || activePreview.province) && (
            <p className="break-words">
              {[activePreview.address, activePreview.city, activePreview.province]
                .filter((value): value is string => Boolean(value && value.trim()))
                .join(" ")}
            </p>
          )}
          <p className="break-words">
            โปรดเตรียมเอกสารที่จำเป็นและติดตามการติดต่อจากผู้ขายเพื่อดำเนินการขั้นตอนถัดไป
          </p>
        </div>
        <DialogFooter className="flex w-full flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => handleOpenChange(false)}
            className="h-auto min-h-[3.25rem] w-full break-words whitespace-normal px-6 py-3 text-center text-base sm:w-auto sm:px-8 sm:text-lg"
          >
            ภายหลัง
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={handleOpenPropertyPreview}
            className="h-auto min-h-[3.25rem] w-full break-words whitespace-normal px-6 py-3 text-center text-base sm:w-auto sm:px-8 sm:text-lg"
          >
            ดูรายละเอียดประกาศ
          </Button>
          <Button
            type="button"
            size="lg"
            onClick={handleConfirm}
            disabled={confirmingPropertyId === activePreview.propertyId}
            className="h-auto min-h-[3.25rem] w-full break-words whitespace-normal px-6 py-3 text-center text-base sm:w-auto sm:px-8 sm:text-lg"
          >
            {confirmingPropertyId === activePreview.propertyId
              ? "กำลังยืนยัน..."
              : "ยืนยันเพื่อไปขั้นตอนถัดไป"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default BuyerConfirmationPrompt
