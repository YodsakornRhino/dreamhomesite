export interface UserProperty {
  id: string
  sellerName: string
  sellerPhone: string
  sellerEmail: string
  sellerRole: string
  title: string
  propertyType: string
  transactionType: string
  price: number
  address: string
  city: string
  province: string
  postal: string
  lat: number | null
  lng: number | null
  landArea: string
  usableArea: string
  bedrooms: string
  bathrooms: string
  parking?: string | null
  yearBuilt?: string | null
  description: string
  photos: string[]
  video: string | null
  createdAt: string
}
