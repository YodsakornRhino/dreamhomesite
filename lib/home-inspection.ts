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
  HomeInspectionNotification,
  HomeInspectionNotificationAudience,
  HomeInspectionNotificationCategory,
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

const isNotificationAudience = (
  value: unknown,
): value is HomeInspectionNotificationAudience => {
  return value === "buyer" || value === "seller" || value === "all"
}

const isNotificationCategory = (
  value: unknown,
): value is HomeInspectionNotificationCategory => {
  return (
    value === "general" ||
    value === "schedule" ||
    value === "checklist" ||
    value === "issue" ||
    value === "note"
  )
}

const formatNotificationDate = (value: string | null | undefined): string => {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ""
  }
  try {
    return new Intl.DateTimeFormat("th-TH", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date)
  } catch (error) {
    console.error("Failed to format notification date", error)
    return ""
  }
}

const buyerStatusLabels: Record<BuyerChecklistStatus, string> = {
  pending: "รอตรวจ",
  accepted: "ผ่าน",
  "follow-up": "ขอตรวจซ้ำ",
}

const sellerStatusLabels: Record<SellerChecklistStatus, string> = {
  scheduled: "พร้อมให้ตรวจ",
  fixing: "ผู้ขายกำลังแก้",
  done: "ผู้ขายยืนยันแล้ว",
}

const issueStatusLabels: Record<HomeInspectionIssueStatus, string> = {
  pending: "รอตรวจสอบ",
  "in-progress": "กำลังแก้ไข",
  "buyer-review": "รอผู้ซื้อตรวจซ้ำ",
  completed: "แก้ไขเสร็จแล้ว",
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

const mapNotificationDoc = (
  doc: QueryDocumentSnapshot<DocumentData>,
  role: HomeInspectionRole,
): HomeInspectionNotification | null => {
  const data = doc.data()

  const audience = isNotificationAudience(data.audience) ? data.audience : "all"
  if (audience !== "all" && audience !== role) {
    return null
  }

  const category = isNotificationCategory(data.category) ? data.category : "general"
  const createdAt = toIsoString(data.createdAt)

  const readByBuyer = Boolean(data.readByBuyer)
  const readBySeller = Boolean(data.readBySeller)

  const read = role === "buyer" ? readByBuyer : readBySeller

  return {
    id: doc.id,
    title: toStringValue(data.title),
    message: toStringValue(data.message),
    category,
    audience,
    createdAt,
    triggeredBy: data.triggeredBy === "seller" ? "seller" : "buyer",
    relatedId: toOptionalString(data.relatedId),
    read,
  }
}

const createInspectionNotification = async (
  propertyId: string,
  input: {
    title: string
    message: string
    category: HomeInspectionNotificationCategory
    triggeredBy: HomeInspectionRole
    audience?: HomeInspectionNotificationAudience
    relatedId?: string | null
  },
): Promise<void> => {
  const audience = input.audience ?? "all"
  const now = new Date().toISOString()

  await addDocument(`property/${propertyId}/inspectionNotifications`, {
    title: input.title,
    message: input.message,
    category: input.category,
    audience,
    triggeredBy: input.triggeredBy,
    relatedId: input.relatedId ?? null,
    createdAt: now,
    readByBuyer: audience === "seller",
    readBySeller: audience === "buyer",
  })
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

  const changes: string[] = []
  if (Object.prototype.hasOwnProperty.call(updates, "handoverDate")) {
    const dateLabel = formatNotificationDate(updates.handoverDate ?? null)
    changes.push(
      updates.handoverDate && dateLabel
        ? `วันที่นัดหมาย: ${dateLabel}`
        : "ยังไม่ได้ระบุวันส่งมอบ"
    )
  }

  if (Object.prototype.hasOwnProperty.call(updates, "handoverNote")) {
    const note = (updates.handoverNote ?? "").toString().trim()
    changes.push(note ? `โน้ตเพิ่มเติม: ${note}` : "ลบโน้ตแนบไว้")
  }

  const message = changes.length > 0 ? changes.join(" • ") : "มีการอัปเดตข้อมูลการนัดหมาย"

  await createInspectionNotification(propertyId, {
    title: "อัปเดตนัดหมายส่งมอบบ้าน",
    message,
    category: "schedule",
    triggeredBy: updates.lastUpdatedBy,
  })
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
  const docRef = await addDocument(`property/${propertyId}/inspectionChecklist`, {
    title: input.title,
    description: input.description ?? "",
    createdBy,
    sellerStatus: createdBy === "seller" ? "fixing" : "scheduled",
    buyerStatus: "pending",
    createdAt: now,
    updatedAt: now,
  })

  const details: string[] = [input.title]
  if (input.description && input.description.trim().length > 0) {
    details.push(`รายละเอียด: ${input.description.trim()}`)
  }

  await createInspectionNotification(propertyId, {
    title: createdBy === "seller" ? "ผู้ขายเพิ่มรายการตรวจใหม่" : "ผู้ซื้อเพิ่มรายการตรวจใหม่",
    message: details.join(" • "),
    category: "checklist",
    triggeredBy: createdBy,
    relatedId: docRef.id,
  })
}

export const updateInspectionChecklistItem = async (
  propertyId: string,
  itemId: string,
  updates: Partial<Pick<HomeInspectionChecklistItem, "title" | "description" | "sellerStatus" | "buyerStatus">>,
  meta?: { updatedBy?: HomeInspectionRole; itemTitle?: string },
): Promise<void> => {
  const payload = filterUndefined({
    ...updates,
    updatedAt: new Date().toISOString(),
  })
  await updateDocument(`property/${propertyId}/inspectionChecklist`, itemId, payload)

  const changes: string[] = []

  if (
    Object.prototype.hasOwnProperty.call(updates, "buyerStatus") &&
    updates.buyerStatus &&
    buyerStatusLabels[updates.buyerStatus]
  ) {
    changes.push(`สถานะผู้ซื้อ: ${buyerStatusLabels[updates.buyerStatus]}`)
  }

  if (
    Object.prototype.hasOwnProperty.call(updates, "sellerStatus") &&
    updates.sellerStatus &&
    sellerStatusLabels[updates.sellerStatus]
  ) {
    changes.push(`สถานะผู้ขาย: ${sellerStatusLabels[updates.sellerStatus]}`)
  }

  if (Object.prototype.hasOwnProperty.call(updates, "title") && updates.title) {
    changes.push(`หัวข้อใหม่: ${updates.title}`)
  }

  if (Object.prototype.hasOwnProperty.call(updates, "description")) {
    const description = (updates.description ?? "").toString().trim()
    changes.push(description ? `รายละเอียด: ${description}` : "ลบรายละเอียดรายการ")
  }

  const message = changes.length > 0 ? changes.join(" • ") : "มีการอัปเดตรายการตรวจ"
  const title = meta?.itemTitle ? `อัปเดตรายการตรวจ: ${meta.itemTitle}` : "อัปเดตรายการตรวจ"

  await createInspectionNotification(propertyId, {
    title,
    message,
    category: "checklist",
    triggeredBy: meta?.updatedBy ?? "buyer",
    relatedId: itemId,
  })
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
  const docRef = await addDocument(`property/${propertyId}/inspectionIssues`, {
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

  const details: string[] = [
    `หัวข้อ: ${input.title}`,
    `ตำแหน่ง: ${input.location}`,
  ]

  if (input.description && input.description.trim().length > 0) {
    details.push(`รายละเอียด: ${input.description.trim()}`)
  }

  if (input.expectedCompletion) {
    const due = formatNotificationDate(input.expectedCompletion)
    if (due) {
      details.push(`กำหนดเสร็จ: ${due}`)
    }
  }

  if (input.owner && input.owner.trim().length > 0) {
    details.push(`ผู้รับผิดชอบ: ${input.owner.trim()}`)
  }

  await createInspectionNotification(propertyId, {
    title: reportedBy === "buyer" ? "ผู้ซื้อแจ้งปัญหาใหม่" : "ผู้ขายสร้างงานแก้ไขใหม่",
    message: details.join(" • "),
    category: "issue",
    triggeredBy: reportedBy,
    relatedId: docRef.id,
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
  meta?: { updatedBy?: HomeInspectionRole; issueTitle?: string },
): Promise<void> => {
  const payload = filterUndefined({
    ...updates,
    updatedAt: new Date().toISOString(),
  })
  await updateDocument(`property/${propertyId}/inspectionIssues`, issueId, payload)

  const changes: string[] = []

  if (Object.prototype.hasOwnProperty.call(updates, "status") && updates.status) {
    const label = issueStatusLabels[updates.status]
    changes.push(label ? `สถานะ: ${label}` : `สถานะใหม่: ${updates.status}`)
  }

  if (Object.prototype.hasOwnProperty.call(updates, "expectedCompletion")) {
    const due = formatNotificationDate(updates.expectedCompletion ?? null)
    changes.push(due ? `กำหนดเสร็จ: ${due}` : "ลบกำหนดเสร็จ")
  }

  if (Object.prototype.hasOwnProperty.call(updates, "resolvedAt")) {
    const resolved = formatNotificationDate(updates.resolvedAt ?? null)
    changes.push(resolved ? `ปิดงานเมื่อ: ${resolved}` : "ยกเลิกการปิดงาน")
  }

  if (Object.prototype.hasOwnProperty.call(updates, "owner")) {
    const owner = (updates.owner ?? "").toString().trim()
    changes.push(owner ? `ผู้รับผิดชอบ: ${owner}` : "ยังไม่ระบุผู้รับผิดชอบ")
  }

  if (Object.prototype.hasOwnProperty.call(updates, "title") && updates.title) {
    changes.push(`หัวข้อใหม่: ${updates.title}`)
  }

  if (Object.prototype.hasOwnProperty.call(updates, "location") && updates.location) {
    changes.push(`ตำแหน่ง: ${updates.location}`)
  }

  if (Object.prototype.hasOwnProperty.call(updates, "description")) {
    const description = (updates.description ?? "").toString().trim()
    changes.push(description ? `รายละเอียด: ${description}` : "ลบรายละเอียดงาน")
  }

  const message = changes.length > 0 ? changes.join(" • ") : "มีการอัปเดตรายการแจ้งซ่อม"
  const title = meta?.issueTitle ? `อัปเดตงานซ่อม: ${meta.issueTitle}` : "อัปเดตงานซ่อม"

  await createInspectionNotification(propertyId, {
    title,
    message,
    category: "issue",
    triggeredBy: meta?.updatedBy ?? "seller",
    relatedId: issueId,
  })
}

export const subscribeToInspectionNotifications = async (
  propertyId: string,
  role: HomeInspectionRole,
  callback: (notifications: HomeInspectionNotification[]) => void,
): Promise<() => void> => {
  return subscribeToCollection(`property/${propertyId}/inspectionNotifications`, (docs) => {
    const notifications = docs
      .map((doc) => mapNotificationDoc(doc, role))
      .filter((notification): notification is HomeInspectionNotification => notification !== null)

    notifications.sort((a, b) => {
      const timeA = Date.parse(a.createdAt)
      const timeB = Date.parse(b.createdAt)
      if (Number.isNaN(timeA) || Number.isNaN(timeB)) {
        return 0
      }
      return timeB - timeA
    })

    callback(notifications)
  })
}

export const markInspectionNotificationsRead = async (
  propertyId: string,
  notificationIds: string[],
  role: HomeInspectionRole,
): Promise<void> => {
  if (notificationIds.length === 0) {
    return
  }

  const field = role === "buyer" ? "readByBuyer" : "readBySeller"

  await Promise.all(
    notificationIds.map((id) =>
      updateDocument(`property/${propertyId}/inspectionNotifications`, id, {
        [field]: true,
      }),
    ),
  )
}
