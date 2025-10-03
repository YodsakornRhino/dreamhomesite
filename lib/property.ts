export const TRANSACTION_LABELS: Record<string, string> = {
  sale: "ขาย",
  rent: "ให้เช่า",
}

export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  house: "บ้าน",
  condo: "คอนโด",
  land: "ที่ดิน",
  apartment: "อพาร์ตเมนต์",
}

export const SELLER_ROLE_LABELS: Record<string, string> = {
  owner: "เจ้าของ",
  agent: "นายหน้า",
}

export const formatPropertyPrice = (price: number, transactionType: string) => {
  if (!Number.isFinite(price)) return "-"

  const formatted = new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(price)

  return transactionType === "rent" ? `${formatted}/เดือน` : formatted
}
