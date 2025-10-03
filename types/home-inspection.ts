export type HomeInspectionRole = "buyer" | "seller";

export interface HomeInspectionState {
  handoverDate: string | null;
  handoverNote: string;
  lastUpdatedBy: HomeInspectionRole | null;
  lastUpdatedAt: string | null;
}

export type BuyerChecklistStatus = "pending" | "accepted" | "follow-up";
export type SellerChecklistStatus = "scheduled" | "fixing" | "done";

export interface HomeInspectionChecklistItem {
  id: string;
  title: string;
  description: string;
  createdBy: HomeInspectionRole;
  buyerStatus: BuyerChecklistStatus;
  sellerStatus: SellerChecklistStatus;
  createdAt: string;
  updatedAt: string;
}

export type HomeInspectionIssueStatus =
  | "pending"
  | "in-progress"
  | "buyer-review"
  | "completed";

export interface HomeInspectionIssue {
  id: string;
  title: string;
  location: string;
  description: string;
  status: HomeInspectionIssueStatus;
  reportedBy: HomeInspectionRole;
  reportedAt: string;
  updatedAt: string;
  expectedCompletion?: string | null;
  resolvedAt?: string | null;
  owner?: string | null;
}

export type HomeInspectionNotificationAudience = "buyer" | "seller" | "all";

export type HomeInspectionNotificationCategory =
  | "general"
  | "schedule"
  | "checklist"
  | "issue"
  | "note";

export interface HomeInspectionNotification {
  id: string;
  title: string;
  message: string;
  category: HomeInspectionNotificationCategory;
  audience: HomeInspectionNotificationAudience;
  createdAt: string;
  triggeredBy: HomeInspectionRole;
  relatedId?: string | null;
  read: boolean;
}

export interface HomeInspectionNotificationCountDetail {
  count: number;
}
