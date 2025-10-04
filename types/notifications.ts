export type UserNotificationCategory = "inspection" | "message" | "system";

export type UserNotificationActionType = "navigate" | "open-chat" | null;

export interface UserNotification {
  id: string;
  title: string;
  message: string;
  category: UserNotificationCategory;
  createdAt: string;
  read: boolean;
  context?: string | null;
  relatedId?: string | null;
  actionType?: UserNotificationActionType;
  actionTarget?: string | null;
  actionHref?: string | null;
}
