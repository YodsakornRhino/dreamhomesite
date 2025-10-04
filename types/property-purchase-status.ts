export interface PropertyPurchaseStatus {
  isUnderPurchase: boolean
  confirmedBuyerId: string | null
  buyerConfirmed: boolean
  sellerDocumentsConfirmed: boolean
}
