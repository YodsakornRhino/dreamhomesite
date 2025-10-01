import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";

import type { UserProperty } from "@/types/user-property";

const toStringValue = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value))
    return value.toString();
  return "";
};

const toOptionalString = (value: unknown): string | null => {
  if (typeof value === "string") return value || null;
  if (typeof value === "number" && Number.isFinite(value))
    return value.toString();
  return null;
};

const toNumberOrNull = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const toNumberOrZero = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
};

const toIsoString = (value: unknown): string => {
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
  return "";
};

export const parseUserPropertyCreatedAt = (createdAt: string): number => {
  if (!createdAt) return 0;
  const time = Date.parse(createdAt);
  return Number.isNaN(time) ? 0 : time;
};

export const mapDocumentToUserProperty = (
  doc: QueryDocumentSnapshot<DocumentData>,
): UserProperty => {
  const data = doc.data();
  const photos = Array.isArray(data.photos)
    ? data.photos.filter(
        (item: unknown): item is string => typeof item === "string",
      )
    : [];

  return {
    id: doc.id,
    userUid:
      toStringValue(data.userUid) ||
      (doc.ref.parent.parent ? toStringValue(doc.ref.parent.parent.id) : ""),
    sellerName: toStringValue(data.sellerName),
    sellerPhone: toStringValue(data.sellerPhone),
    sellerEmail: toStringValue(data.sellerEmail),
    sellerRole: toStringValue(data.sellerRole),
    title: toStringValue(data.title),
    propertyType: toStringValue(data.propertyType),
    transactionType: toStringValue(data.transactionType),
    price: toNumberOrZero(data.price),
    address: toStringValue(data.address),
    city: toStringValue(data.city),
    province: toStringValue(data.province),
    postal: toStringValue(data.postal),
    lat: toNumberOrNull(data.lat),
    lng: toNumberOrNull(data.lng),
    landArea: toStringValue(data.landArea),
    usableArea: toStringValue(data.usableArea),
    bedrooms: toStringValue(data.bedrooms),
    bathrooms: toStringValue(data.bathrooms),
    parking: toOptionalString(data.parking),
    yearBuilt: toOptionalString(data.yearBuilt),
    description: toStringValue(data.description),
    photos,
    video:
      typeof data.video === "string" && data.video.trim().length > 0
        ? data.video
        : null,
    createdAt: toIsoString(data.createdAt),
    isUnderPurchase: Boolean(data.isUnderPurchase),
    confirmedBuyerId:
      typeof data.confirmedBuyerId === "string" && data.confirmedBuyerId.trim().length > 0
        ? data.confirmedBuyerId
        : null,
    buyerConfirmed: Boolean(data.buyerConfirmed),
    sellerDocumentsConfirmed: Boolean(data.sellerDocumentsConfirmed),
  };
};
