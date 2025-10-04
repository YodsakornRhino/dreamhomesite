import type { HomeInspectionRole } from "@/types/home-inspection";

export interface BuyerProperty {
  id: string;
  propertyId: string;
  buyerUid: string;
  sellerUid: string | null;
  confirmedBuyerId: string | null;
  title: string;
  price: number | null;
  transactionType: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  thumbnailUrl: string | null;
  confirmedAt: string | null;
  isUnderPurchase: boolean;
  buyerConfirmed: boolean;
  sellerDocumentsConfirmed: boolean;
  handoverDate: string | null;
  handoverNote: string;
  lastInspectionUpdateAt: string | null;
  lastInspectionUpdatedBy: HomeInspectionRole | null;
  sellerName: string | null;
  sellerPhone: string | null;
  sellerEmail: string | null;
}
