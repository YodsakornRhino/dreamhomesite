import type { PropertyPreviewPayload } from "@/types/chat";
import type { HomeInspectionRole } from "@/types/home-inspection";

import { setDocument } from "@/lib/firestore";

const toStringValue = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toString();
  }
  return "";
};

const toOptionalString = (value: unknown): string | null => {
  const text = toStringValue(value).trim();
  return text.length > 0 ? text : null;
};

const toNumberOrNull = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const resolveThumbnail = (
  listingPhotos: unknown,
  previewThumbnail?: string | null,
): string | null => {
  if (typeof previewThumbnail === "string" && previewThumbnail.trim().length > 0) {
    return previewThumbnail.trim();
  }

  if (typeof listingPhotos === "string" && listingPhotos.trim().length > 0) {
    return listingPhotos.trim();
  }

  if (Array.isArray(listingPhotos)) {
    const candidate = listingPhotos.find(
      (item): item is string => typeof item === "string" && item.trim().length > 0,
    );
    if (candidate) return candidate.trim();
  }

  return null;
};

interface BuyerPropertyCreationInput {
  buyerUid: string;
  propertyId: string;
  listingData?: Record<string, unknown> | null;
  preview?: PropertyPreviewPayload | null;
  confirmedAt?: string;
}

export const saveBuyerPropertyFromListing = async ({
  buyerUid,
  propertyId,
  listingData,
  preview,
  confirmedAt,
}: BuyerPropertyCreationInput): Promise<void> => {
  const sellerUid = toOptionalString(listingData?.userUid);
  const confirmedBuyerId = toOptionalString(listingData?.confirmedBuyerId);
  const title =
    toStringValue(listingData?.title) ||
    (preview?.title ? preview.title : `ประกาศ ${propertyId}`);
  const price = toNumberOrNull(listingData?.price ?? preview?.price ?? null);
  const transactionType =
    toOptionalString(listingData?.transactionType) ||
    toOptionalString(preview?.transactionType) ||
    "sale";
  const address = toOptionalString(listingData?.address) ?? toOptionalString(preview?.address);
  const city = toOptionalString(listingData?.city) ?? toOptionalString(preview?.city);
  const province =
    toOptionalString(listingData?.province) ?? toOptionalString(preview?.province);
  const sellerName = toOptionalString(listingData?.sellerName);
  const sellerPhone = toOptionalString(listingData?.sellerPhone);
  const sellerEmail = toOptionalString(listingData?.sellerEmail);
  const thumbnailUrl = resolveThumbnail(listingData?.photos, preview?.thumbnailUrl ?? null);
  const nowIso = confirmedAt ?? new Date().toISOString();

  const payload: Record<string, unknown> = {
    propertyId,
    buyerUid,
    sellerUid,
    confirmedBuyerId: confirmedBuyerId || buyerUid,
    title,
    price,
    transactionType,
    address,
    city,
    province,
    thumbnailUrl,
    confirmedAt: nowIso,
    isUnderPurchase: Boolean(listingData?.isUnderPurchase ?? true),
    buyerConfirmed: true,
    sellerDocumentsConfirmed: Boolean(listingData?.sellerDocumentsConfirmed),
    handoverDate: null,
    handoverNote: "",
    lastInspectionUpdateAt: null,
    lastInspectionUpdatedBy: null,
    sellerName,
    sellerPhone,
    sellerEmail,
  };

  await setDocument(`users/${buyerUid}/buyer_properties`, propertyId, payload);
};

interface BuyerInspectionUpdateInput {
  buyerUid: string;
  propertyId: string;
  handoverDate?: string | null;
  handoverNote?: string;
  lastInspectionUpdatedBy?: HomeInspectionRole;
}

export const updateBuyerPropertyInspectionStateRecord = async (
  input: BuyerInspectionUpdateInput,
): Promise<void> => {
  const { buyerUid, propertyId, handoverDate, handoverNote, lastInspectionUpdatedBy } = input;

  const payload: Record<string, unknown> = {
    lastInspectionUpdateAt: new Date().toISOString(),
  };

  if (Object.prototype.hasOwnProperty.call(input, "handoverDate")) {
    payload.handoverDate = handoverDate ?? null;
  }

  if (Object.prototype.hasOwnProperty.call(input, "handoverNote")) {
    payload.handoverNote = typeof handoverNote === "string" ? handoverNote : "";
  }

  if (lastInspectionUpdatedBy) {
    payload.lastInspectionUpdatedBy = lastInspectionUpdatedBy;
  }

  await setDocument(`users/${buyerUid}/buyer_properties`, propertyId, payload);
};
