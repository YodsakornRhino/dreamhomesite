"use client"

import type { UserProperty } from "@/types/user-property"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PropertySharePanel } from "@/components/property-share-panel"

interface PropertyShareModalProps {
  open: boolean
  property: UserProperty | null
  onOpenChange: (open: boolean) => void
}

export function PropertyShareModal({
  open,
  property,
  onOpenChange,
}: PropertyShareModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>แชร์ประกาศของคุณ</DialogTitle>
          <DialogDescription>
            ส่งประกาศนี้ไปยังโซเชียลมีเดียเพื่อให้ผู้ซื้อเห็นมากยิ่งขึ้น
          </DialogDescription>
        </DialogHeader>
        {property && (
          <PropertySharePanel
            property={property}
            hideHeading
            className="border-0 bg-transparent p-0 shadow-none"
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
