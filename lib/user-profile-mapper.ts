import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";

import type { UserProfile, UserStatus } from "@/types/user-profile";

const toStringOrNull = (value: unknown): string | null => {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value))
    return value.toString();
  return null;
};

const toBoolean = (value: unknown): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return false;
};

const toIsoStringOrNull = (value: unknown): string | null => {
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

const toUserStatus = (value: unknown): UserStatus | null => {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const state = record.state === "online" ? "online" : record.state === "offline" ? "offline" : undefined;
  const lastActiveAt = toIsoStringOrNull(record.lastActiveAt);

  if (!state && !lastActiveAt) {
    return null;
  }

  return {
    state: state ?? "offline",
    lastActiveAt: lastActiveAt ?? null,
  };
};

export const mapDocumentToUserProfile = (
  doc: QueryDocumentSnapshot<DocumentData>,
): UserProfile => {
  const data = doc.data();

  return {
    uid: doc.id,
    name: (toStringOrNull(data.name) ?? "").trim() || "ผู้ใช้งาน",
    email: toStringOrNull(data.email),
    photoURL: toStringOrNull(data.photoURL),
    phoneNumber: toStringOrNull(data.phoneNumber),
    phoneVerified: toBoolean(data.phoneVerified),
    createdAt: toIsoStringOrNull(data.createdAt),
    updatedAt: toIsoStringOrNull(data.updatedAt),
    status: toUserStatus(data.status),
  };
};
