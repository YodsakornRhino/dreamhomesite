export interface PropertyPreviewPayload {
  propertyId: string;
  ownerUid: string;
  title: string;
  price?: number | null;
  transactionType?: string | null;
  thumbnailUrl?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
}

export interface ChatOpenEventDetail {
  participantId?: string;
  propertyPreview?: PropertyPreviewPayload;
}
