import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";

import type { BuyerProperty } from "@/types/buyer-property";
import type { HomeInspectionRole } from "@/types/home-inspection";

const toStringValue = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toString();
  }
  return "";
};

const toOptionalString = (value: unknown): string | null => {
  const stringValue = toStringValue(value).trim();
  return stringValue.length > 0 ? stringValue : null;
};

const toNumberOrNull = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const toIsoString = (value: unknown): string | null => {
  if (typeof value === "string") return value;
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate?: () => Date }).toDate === "function"
  ) {
    const date = (value as { toDate: () => Date }).toDate();
    if (date instanceof Date && !Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
  }
  return null;
};

const toInspectionRole = (value: unknown): HomeInspectionRole | null => {
  if (value === "buyer" || value === "seller") {
    return value;
  }
  return null;
};

const resolveThumbnail = (value: unknown): string | null => {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }

  if (Array.isArray(value)) {
    const firstPhoto = value.find((item) => typeof item === "string" && item.trim().length > 0);
    return typeof firstPhoto === "string" ? firstPhoto.trim() : null;
  }

  return null;
};

export const parseBuyerPropertyConfirmedAt = (confirmedAt: string | null): number => {
  if (!confirmedAt) return 0;
  const time = Date.parse(confirmedAt);
  return Number.isNaN(time) ? 0 : time;
};

export const mapDocumentToBuyerProperty = (
  doc: QueryDocumentSnapshot<DocumentData>,
): BuyerProperty => {
  const data = doc.data();

  return {
    id: doc.id,
    propertyId: toStringValue(data.propertyId) || doc.id,
    buyerUid:
      toStringValue(data.buyerUid) ||
      (doc.ref.parent?.parent ? toStringValue(doc.ref.parent.parent.id) : ""),
    sellerUid: toOptionalString(data.sellerUid),
    confirmedBuyerId: toOptionalString(data.confirmedBuyerId),
    title: toStringValue(data.title),
    price: toNumberOrNull(data.price),
    transactionType: toOptionalString(data.transactionType),
    address: toOptionalString(data.address),
    city: toOptionalString(data.city),
    province: toOptionalString(data.province),
    thumbnailUrl: resolveThumbnail(data.thumbnailUrl ?? data.photos),
    confirmedAt: toIsoString(data.confirmedAt),
    isUnderPurchase: Boolean(data.isUnderPurchase),
    buyerConfirmed: Boolean(data.buyerConfirmed),
    sellerDocumentsConfirmed: Boolean(data.sellerDocumentsConfirmed),
    handoverDate: toIsoString(data.handoverDate),
    handoverNote: toStringValue(data.handoverNote),
    lastInspectionUpdateAt: toIsoString(data.lastInspectionUpdateAt),
    lastInspectionUpdatedBy: toInspectionRole(data.lastInspectionUpdatedBy),
    sellerName: toOptionalString(data.sellerName),
    sellerPhone: toOptionalString(data.sellerPhone),
    sellerEmail: toOptionalString(data.sellerEmail),
  };
};
