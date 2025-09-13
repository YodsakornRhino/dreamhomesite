// src/components/profile-photo-modal.tsx
"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import Cropper, { type Area } from "react-easy-crop"

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener("load", () => resolve(image))
    image.addEventListener("error", (e) => reject(e))
    image.setAttribute("crossOrigin", "anonymous")
    image.src = url
  })

async function getCroppedFile(
  src: string,
  pixelCrop: Area,
  rotation: number,
  flipX: number,
  flipY: number,
): Promise<File> {
  const image = await createImage(src)
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("ไม่สามารถสร้าง canvas ได้")

  const rotRad = (rotation * Math.PI) / 180
  const width = image.width
  const height = image.height
  const bBoxWidth = Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height)
  const bBoxHeight = Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height)
  canvas.width = bBoxWidth
  canvas.height = bBoxHeight
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2)
  ctx.rotate(rotRad)
  ctx.scale(flipX, flipY)
  ctx.drawImage(image, -width / 2, -height / 2)

  const data = ctx.getImageData(pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height)
  const tmpCanvas = document.createElement("canvas")
  tmpCanvas.width = pixelCrop.width
  tmpCanvas.height = pixelCrop.height
  tmpCanvas.getContext("2d")?.putImageData(data, 0, 0)

  const outCanvas = document.createElement("canvas")
  outCanvas.width = 512
  outCanvas.height = 512
  outCanvas.getContext("2d")?.drawImage(tmpCanvas, 0, 0, 512, 512)

  return await new Promise((resolve) => {
    outCanvas.toBlob((blob) => {
      if (!blob) return
      resolve(new File([blob], `avatar-${Date.now()}.jpeg`, { type: "image/jpeg" }))
    }, "image/jpeg", 0.92)
  })
}

export interface ProfilePhotoModalProps {
  open: boolean
  src: string
  onCancel: () => void
  onComplete: (file: File) => void
}

export default function ProfilePhotoModal({ open, src, onCancel, onComplete }: ProfilePhotoModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [flipX, setFlipX] = useState(1)
  const [flipY, setFlipY] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [cropSize, setCropSize] = useState({ width: 640, height: 360 })
  const controlsH = 240

  useEffect(() => {
    if (!src) return
    const img = new Image()
    img.onload = () => {
      const maxW = Math.min(window.innerWidth * 0.9, 768)
      const maxDialogH = window.innerHeight * 0.95
      const maxCropH = Math.max(100, maxDialogH - controlsH)
      let w = maxW
      let h = (img.height / img.width) * w
      if (h > maxCropH) {
        h = maxCropH
        w = (img.width / img.height) * h
      }
      setCropSize({ width: w, height: h })
    }
    img.src = src
  }, [src])

  const reset = () => {
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setRotation(0)
    setFlipX(1)
    setFlipY(1)
    setCroppedAreaPixels(null)
  }

  const handleCancel = () => {
    reset()
    onCancel()
  }

  const handleConfirm = async () => {
    if (!src || !croppedAreaPixels) return
    const file = await getCroppedFile(src, croppedAreaPixels, rotation, flipX, flipY)
    reset()
    onComplete(file)
  }

  const handleFlipX = () => setFlipX((x) => -x)
  const handleFlipY = () => setFlipY((y) => -y)

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleCancel()}>
      <DialogContent
        className="max-w-[90vw] max-h-[95vh] overflow-hidden"
        style={{ width: cropSize.width, height: cropSize.height + controlsH }}
      >
        <DialogHeader>
          <DialogTitle>ครอปรูปโปรไฟล์</DialogTitle>
          <DialogDescription>ปรับกรอบให้พอดีแล้วกดยืนยัน</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {src ? (
            <div
              className="relative mx-auto overflow-hidden rounded-md"
              style={{ width: cropSize.width, height: cropSize.height }}
            >
              <Cropper
                image={src}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels)}
                zoomWithScroll
                style={{
                  containerStyle: { width: "100%", height: "100%" },
                  mediaStyle: { transform: `scaleX(${flipX}) scaleY(${flipY})` },
                }}
              />
            </div>
          ) : (
            <div className="text-sm text-gray-500">ไม่มีภาพ</div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" onClick={() => setRotation((r) => r - 90)}>
              หมุนซ้าย 90°
            </Button>
            <Button type="button" variant="outline" onClick={() => setRotation((r) => r + 90)}>
              หมุนขวา 90°
            </Button>
            <Button type="button" variant="outline" onClick={handleFlipX}>
              กลับซ้าย-ขวา
            </Button>
            <Button type="button" variant="outline" onClick={handleFlipY}>
              กลับบน-ล่าง
            </Button>
            <Button type="button" variant="outline" onClick={reset}>
              รีเซ็ต
            </Button>

            <div className="ml-auto flex gap-2">
              <Button variant="ghost" onClick={handleCancel}>ยกเลิก</Button>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleConfirm}>
                ใช้รูปนี้
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

