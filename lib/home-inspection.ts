import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore"

import {
  addDocument,
  setDocument,
  subscribeToCollection,
  subscribeToDocument,
  updateDocument,
} from "@/lib/firestore"
import type {
  HomeInspectionChecklistItem,
  HomeInspectionIssue,
  HomeInspectionIssueStatus,
  HomeInspectionRole,
  HomeInspectionState,
  SellerChecklistStatus,
  BuyerChecklistStatus,
} from "@/types/home-inspection"

const toStringValue = (value: unknown): string => {
  if (typeof value === "string") return value
  if (typeof value === "number" && Number.isFinite(value)) return value.toString()
  return ""
}

const toOptionalString = (value: unknown): string | null => {
  const stringValue = toStringValue(value)
  return stringValue ? stringValue : null
}

const toIsoString = (value: unknown): string => {
  if (typeof value === "string") return value
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate?: () => Date }).toDate === "function"
  ) {
    const date = (value as { toDate: () => Date }).toDate()
    if (date instanceof Date && !Number.isNaN(date.getTime())) {
      return date.toISOString()
    }
  }
  return ""
}

const isSellerStatus = (value: unknown): value is SellerChecklistStatus => {
  return value === "scheduled" || value === "fixing" || value === "done"
}

const isBuyerStatus = (value: unknown): value is BuyerChecklistStatus => {
  return value === "pending" || value === "accepted" || value === "follow-up"
}

const isIssueStatus = (value: unknown): value is HomeInspectionIssueStatus => {
  return (
    value === "pending" ||
    value === "in-progress" ||
    value === "buyer-review" ||
    value === "completed"
  )
}

const mapChecklistDoc = (
  doc: QueryDocumentSnapshot<DocumentData>,
): HomeInspectionChecklistItem => {
  const data = doc.data()

  const sellerStatus = isSellerStatus(data.sellerStatus) ? data.sellerStatus : "scheduled"
  const buyerStatus = isBuyerStatus(data.buyerStatus) ? data.buyerStatus : "pending"

  return {
    id: doc.id,
    title: toStringValue(data.title),
    description: toStringValue(data.description),
    createdBy: data.createdBy === "seller" ? "seller" : "buyer",
    sellerStatus,
    buyerStatus,
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
  }
}

const mapIssueDoc = (doc: QueryDocumentSnapshot<DocumentData>): HomeInspectionIssue => {
  const data = doc.data()

  const status = isIssueStatus(data.status) ? data.status : "pending"

  return {
    id: doc.id,
    title: toStringValue(data.title),
    location: toStringValue(data.location),
    description: toStringValue(data.description),
    status,
    reportedBy: data.reportedBy === "seller" ? "seller" : "buyer",
    reportedAt: toIsoString(data.reportedAt),
    updatedAt: toIsoString(data.updatedAt),
    expectedCompletion: toOptionalString(data.expectedCompletion),
    resolvedAt: toOptionalString(data.resolvedAt),
    owner: toOptionalString(data.owner),
  }
}

const stateDefaults: HomeInspectionState = {
  handoverDate: null,
  handoverNote: "",
  lastUpdatedAt: null,
  lastUpdatedBy: null,
}

const filterUndefined = <T extends Record<string, unknown>>(data: T): T => {
  return Object.entries(data).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key as keyof T] = value as T[keyof T]
    }
    return acc
  }, {} as T)
}

export const subscribeToInspectionState = async (
  propertyId: string,
  callback: (state: HomeInspectionState) => void,
): Promise<() => void> => {
  return subscribeToDocument(
    `property/${propertyId}/inspection`,
    "state",
    (doc) => {
      if (!doc) {
        callback(stateDefaults)
        return
      }

      const data = doc.data() as Partial<HomeInspectionState> | undefined
      const handoverDate = toOptionalString(data?.handoverDate) ?? null
      const note = toStringValue(data?.handoverNote)
      const lastUpdatedAt = data?.lastUpdatedAt ? toStringValue(data.lastUpdatedAt) : null
      const lastUpdatedBy = data?.lastUpdatedBy === "seller" ? "seller" : data?.lastUpdatedBy === "buyer" ? "buyer" : null

      callback({
        handoverDate,
        handoverNote: note,
        lastUpdatedAt,
        lastUpdatedBy,
      })
    },
  )
}

export const updateInspectionState = async (
  propertyId: string,
  updates: Partial<Omit<HomeInspectionState, "lastUpdatedAt" | "lastUpdatedBy">> & {
    lastUpdatedBy: HomeInspectionRole
  },
): Promise<void> => {
  const payload = filterUndefined({
    ...updates,
    handoverDate: updates.handoverDate ?? null,
    lastUpdatedBy: updates.lastUpdatedBy,
    lastUpdatedAt: new Date().toISOString(),
  })

  await setDocument(`property/${propertyId}/inspection`, "state", payload)
}

export const subscribeToInspectionChecklist = async (
  propertyId: string,
  callback: (items: HomeInspectionChecklistItem[]) => void,
): Promise<() => void> => {
  return subscribeToCollection(
    `property/${propertyId}/inspectionChecklist`,
    (docs) => {
      const items = docs.map(mapChecklistDoc)
      items.sort((a, b) => {
        const timeA = Date.parse(a.updatedAt)
        const timeB = Date.parse(b.updatedAt)
        if (Number.isNaN(timeA) || Number.isNaN(timeB)) return 0
        return timeB - timeA
      })
      callback(items)
    },
  )
}

export const createInspectionChecklistItem = async (
  propertyId: string,
  input: { title: string; description?: string },
  createdBy: HomeInspectionRole,
): Promise<void> => {
  const now = new Date().toISOString()
  await addDocument(`property/${propertyId}/inspectionChecklist`, {
    title: input.title,
    description: input.description ?? "",
    createdBy,
    sellerStatus: createdBy === "seller" ? "fixing" : "scheduled",
    buyerStatus: "pending",
    createdAt: now,
    updatedAt: now,
  })
}

export const updateInspectionChecklistItem = async (
  propertyId: string,
  itemId: string,
  updates: Partial<Pick<HomeInspectionChecklistItem, "title" | "description" | "sellerStatus" | "buyerStatus">>,
): Promise<void> => {
  const payload = filterUndefined({
    ...updates,
    updatedAt: new Date().toISOString(),
  })
  await updateDocument(`property/${propertyId}/inspectionChecklist`, itemId, payload)
}

export const subscribeToInspectionIssues = async (
  propertyId: string,
  callback: (issues: HomeInspectionIssue[]) => void,
): Promise<() => void> => {
  return subscribeToCollection(
    `property/${propertyId}/inspectionIssues`,
    (docs) => {
      const issues = docs.map(mapIssueDoc)
      issues.sort((a, b) => {
        const timeA = Date.parse(a.updatedAt)
        const timeB = Date.parse(b.updatedAt)
        if (Number.isNaN(timeA) || Number.isNaN(timeB)) return 0
        return timeB - timeA
      })
      callback(issues)
    },
  )
}

export const createInspectionIssue = async (
  propertyId: string,
  input: {
    title: string
    location: string
    description?: string
    expectedCompletion?: string | null
    owner?: string | null
  },
  reportedBy: HomeInspectionRole,
): Promise<void> => {
  const now = new Date().toISOString()
  await addDocument(`property/${propertyId}/inspectionIssues`, {
    title: input.title,
    location: input.location,
    description: input.description ?? "",
    status: "pending",
    reportedBy,
    reportedAt: now,
    updatedAt: now,
    expectedCompletion: input.expectedCompletion ?? null,
    resolvedAt: null,
    owner: input.owner ?? null,
  })
}

export const updateInspectionIssue = async (
  propertyId: string,
  issueId: string,
  updates: Partial<{
    title: string
    location: string
    description: string
    status: HomeInspectionIssueStatus
    expectedCompletion: string | null
    resolvedAt: string | null
    owner: string | null
  }>,
): Promise<void> => {
  const payload = filterUndefined({
    ...updates,
    updatedAt: new Date().toISOString(),
  })
  await updateDocument(`property/${propertyId}/inspectionIssues`, issueId, payload)
}
