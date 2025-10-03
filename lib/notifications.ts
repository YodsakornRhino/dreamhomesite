import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";

import {
  addDocument,
  getDocuments,
  subscribeToCollection,
  updateDocument,
} from "@/lib/firestore";
import type {
  UserNotification,
  UserNotificationActionType,
  UserNotificationCategory,
} from "@/types/notifications";

const toStringValue = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return value.toString();
  return "";
};

const toOptionalString = (value: unknown): string | null => {
  const stringValue = toStringValue(value);
  return stringValue ? stringValue : null;
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

const isNotificationCategory = (
  value: unknown,
): value is UserNotificationCategory => {
  return value === "inspection" || value === "message" || value === "system";
};

const isActionType = (value: unknown): value is Exclude<UserNotificationActionType, null> => {
  return value === "navigate" || value === "open-chat";
};

const mapUserNotificationDoc = (
  doc: QueryDocumentSnapshot<DocumentData>,
): UserNotification => {
  const data = doc.data();

  const category = isNotificationCategory(data.category) ? data.category : "system";
  const actionType = isActionType(data.actionType) ? data.actionType : null;

  return {
    id: doc.id,
    title: toStringValue(data.title),
    message: toStringValue(data.message),
    category,
    createdAt: toIsoString(data.createdAt),
    read: Boolean(data.read),
    context: toOptionalString(data.context),
    relatedId: toOptionalString(data.relatedId),
    actionType,
    actionTarget: toOptionalString(data.actionTarget),
    actionHref: toOptionalString(data.actionHref),
  };
};

export const createUserNotification = async (
  userId: string,
  input: {
    title: string;
    message: string;
    category: UserNotificationCategory;
    context?: string | null;
    relatedId?: string | null;
    actionType?: UserNotificationActionType;
    actionTarget?: string | null;
    actionHref?: string | null;
  },
): Promise<void> => {
  const now = new Date().toISOString();

  await addDocument(`users/${userId}/notifications`, {
    title: input.title,
    message: input.message,
    category: input.category,
    context: input.context ?? null,
    relatedId: input.relatedId ?? null,
    actionType: input.actionType ?? null,
    actionTarget: input.actionTarget ?? null,
    actionHref: input.actionHref ?? null,
    createdAt: now,
    read: false,
  });
};

export const subscribeToUserNotifications = async (
  userId: string,
  callback: (notifications: UserNotification[]) => void,
): Promise<() => void> => {
  return subscribeToCollection(`users/${userId}/notifications`, (docs) => {
    const notifications = docs.map(mapUserNotificationDoc);

    notifications.sort((a, b) => {
      const timeA = Date.parse(a.createdAt);
      const timeB = Date.parse(b.createdAt);
      if (Number.isNaN(timeA) || Number.isNaN(timeB)) {
        return 0;
      }
      return timeB - timeA;
    });

    callback(notifications);
  });
};

export const markUserNotificationsRead = async (
  userId: string,
  notificationIds: string[],
): Promise<void> => {
  if (notificationIds.length === 0) return;

  await Promise.all(
    notificationIds.map((id) =>
      updateDocument(`users/${userId}/notifications`, id, {
        read: true,
      }),
    ),
  );
};

const chunkArray = <T,>(items: T[], size: number): T[][] => {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
};

export const markUserNotificationsReadByRelated = async (
  userId: string,
  relatedIds: string[],
): Promise<void> => {
  if (relatedIds.length === 0) return;

  const chunks = chunkArray(Array.from(new Set(relatedIds)), 10);

  for (const chunk of chunks) {
    const { where } = await import("firebase/firestore");
    const docs = await getDocuments(
      `users/${userId}/notifications`,
      where("relatedId", "in", chunk),
    );

    if (docs.length === 0) continue;

    await Promise.all(
      docs.map((doc) =>
        updateDocument(`users/${userId}/notifications`, doc.id, {
          read: true,
        }),
      ),
    );
  }
};
