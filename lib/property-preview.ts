import type { PropertyPreviewPayload } from "@/types/chat"

export const sanitizePropertyPreview = (
  preview: PropertyPreviewPayload,
): PropertyPreviewPayload => {
  return {
    propertyId: preview.propertyId,
    ownerUid: preview.ownerUid,
    title: preview.title,
    price: typeof preview.price === "number" ? preview.price : null,
    transactionType:
      typeof preview.transactionType === "string" ? preview.transactionType : null,
    thumbnailUrl:
      typeof preview.thumbnailUrl === "string" && preview.thumbnailUrl.trim().length > 0
        ? preview.thumbnailUrl
        : null,
    address:
      typeof preview.address === "string" && preview.address.trim().length > 0
        ? preview.address
        : null,
    city:
      typeof preview.city === "string" && preview.city.trim().length > 0
        ? preview.city
        : null,
    province:
      typeof preview.province === "string" && preview.province.trim().length > 0
        ? preview.province
        : null,
  }
}

export const buildPreviewFromPropertyRecord = (
  propertyId: string,
  record: Record<string, unknown>,
): PropertyPreviewPayload | null => {
  const ownerUid =
    typeof record.userUid === "string" && record.userUid.trim().length > 0
      ? record.userUid
      : null

  const title =
    typeof record.title === "string" && record.title.trim().length > 0
      ? record.title
      : null

  if (!ownerUid || !title) {
    return null
  }

  let price: number | null = null
  if (typeof record.price === "number" && Number.isFinite(record.price)) {
    price = record.price
  } else if (typeof record.price === "string") {
    const parsed = Number(record.price)
    price = Number.isFinite(parsed) ? parsed : null
  }

  const transactionType =
    typeof record.transactionType === "string" && record.transactionType.trim().length > 0
      ? record.transactionType
      : null

  const address =
    typeof record.address === "string" && record.address.trim().length > 0
      ? record.address
      : null

  const city =
    typeof record.city === "string" && record.city.trim().length > 0 ? record.city : null

  const province =
    typeof record.province === "string" && record.province.trim().length > 0
      ? record.province
      : null

  let thumbnailUrl: string | null = null
  if (typeof record.photos === "string" && record.photos.trim().length > 0) {
    thumbnailUrl = record.photos
  } else if (Array.isArray(record.photos)) {
    const firstPhoto = record.photos.find(
      (value): value is string => typeof value === "string" && value.trim().length > 0,
    )
    thumbnailUrl = firstPhoto ?? null
  }

  return sanitizePropertyPreview({
    propertyId,
    ownerUid,
    title,
    price,
    transactionType,
    thumbnailUrl,
    address,
    city,
    province,
  })
}
