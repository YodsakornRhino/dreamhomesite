import { deleteDocument, getDocument, getDocuments, setDocument } from "@/lib/firestore"
import {
  createUserNotification,
  deleteUserNotificationsByRelatedId,
} from "@/lib/notifications"
import { deleteFile, extractStoragePathFromUrl } from "@/lib/storage"

const toStringValue = (value: unknown): string => {
  if (typeof value === "string") return value
  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toString()
  }
  return ""
}

const toOptionalString = (value: unknown): string | null => {
  const text = toStringValue(value).trim()
  return text.length > 0 ? text : null
}

type CancelInitiator = "buyer" | "seller"

interface PropertyParticipants {
  sellerUid: string | null
  buyerUid: string | null
  title: string | null
}

const resolvePropertyParticipants = async (
  propertyId: string,
): Promise<PropertyParticipants> => {
  const doc = await getDocument("property", propertyId)
  if (!doc) {
    throw new Error("ไม่พบประกาศสำหรับการยกเลิก")
  }

  const data = doc.data() as Record<string, unknown>

  return {
    sellerUid: toOptionalString(data.userUid),
    buyerUid: toOptionalString(data.confirmedBuyerId),
    title: toOptionalString(data.title),
  }
}

const cleanInspectionCollection = async (propertyId: string): Promise<void> => {
  try {
    await deleteDocument(`property/${propertyId}/inspection`, "state")
  } catch (error) {
    console.error("Failed to delete inspection state", error)
  }

  try {
    const checklistDocs = await getDocuments(`property/${propertyId}/inspectionChecklist`)
    await Promise.all(
      checklistDocs.map((doc) =>
        deleteDocument(`property/${propertyId}/inspectionChecklist`, doc.id).catch((err) => {
          console.error("Failed to delete inspection checklist", err)
        }),
      ),
    )
  } catch (error) {
    console.error("Failed to clean inspection checklist", error)
  }

  let photoPaths: string[] = []

  try {
    const issueDocs = await getDocuments(`property/${propertyId}/inspectionIssues`)

    photoPaths = issueDocs.reduce<string[]>((paths, doc) => {
      const data = doc.data() as Record<string, unknown>
      const collectPaths = (value: unknown) => {
        if (!Array.isArray(value)) return
        for (const entry of value) {
          if (!entry || typeof entry !== "object") continue
          const record = entry as Record<string, unknown>
          const storagePath = toOptionalString(record.storagePath)
          if (storagePath) {
            paths.push(storagePath)
            continue
          }
          const url = toOptionalString(record.url)
          if (url) {
            const maybePath = extractStoragePathFromUrl(url)
            if (maybePath) {
              paths.push(maybePath)
            }
          }
        }
      }

      collectPaths(data.beforePhotos)
      collectPaths(data.afterPhotos)

      return paths
    }, [])

    await Promise.all(
      issueDocs.map((doc) =>
        deleteDocument(`property/${propertyId}/inspectionIssues`, doc.id).catch((err) => {
          console.error("Failed to delete inspection issue", err)
        }),
      ),
    )
  } catch (error) {
    console.error("Failed to clean inspection issues", error)
  }

  if (photoPaths.length > 0) {
    const uniquePaths = Array.from(new Set(photoPaths))
    await Promise.all(
      uniquePaths.map((path) =>
        deleteFile(path).catch((error) => {
          console.error("Failed to delete inspection photo", error)
        }),
      ),
    )
  }

  try {
    const notificationDocs = await getDocuments(`property/${propertyId}/inspectionNotifications`)
    await Promise.all(
      notificationDocs.map((doc) =>
        deleteDocument(`property/${propertyId}/inspectionNotifications`, doc.id).catch((err) => {
          console.error("Failed to delete inspection notification", err)
        }),
      ),
    )
  } catch (error) {
    console.error("Failed to clean inspection notifications", error)
  }
}

const notifyCancellation = async (
  propertyId: string,
  participants: PropertyParticipants,
  initiatedBy: CancelInitiator,
): Promise<void> => {
  const title = participants.title ? `ทรัพย์ ${participants.title}` : "ประกาศของคุณ"

  const notifications: Promise<void>[] = []

  if (participants.buyerUid) {
    const buyerMessage =
      initiatedBy === "buyer"
        ? "คุณยกเลิกรายการซื้อแล้ว ระบบได้ล้างข้อมูลการตรวจให้เรียบร้อย"
        : "ผู้ขายยกเลิกรายการซื้อแล้ว รายการนี้ถูกลบออกจากรายการของคุณ"

    notifications.push(
      createUserNotification(participants.buyerUid, {
        title: initiatedBy === "buyer" ? "ยกเลิกการซื้อเรียบร้อย" : "ผู้ขายยกเลิกการซื้อ",
        message: `${title} • ${buyerMessage}`,
        category: "system",
        relatedId: propertyId,
        actionType: "navigate",
        actionHref: "/buy/my-properties",
      }).catch((error) => {
        console.error("Failed to notify buyer cancellation", error)
      }),
    )
  }

  if (participants.sellerUid) {
    const sellerMessage =
      initiatedBy === "seller"
        ? "คุณได้ยกเลิกการซื้อและระบบคืนสถานะประกาศให้เรียบร้อย"
        : "ผู้ซื้อยกเลิกการซื้อแล้ว คุณสามารถรอผู้สนใจรายถัดไปได้"

    notifications.push(
      createUserNotification(participants.sellerUid, {
        title: initiatedBy === "seller" ? "ยกเลิกการซื้อเรียบร้อย" : "ผู้ซื้อยกเลิกการซื้อ",
        message: `${title} • ${sellerMessage}`,
        category: "system",
        relatedId: propertyId,
        actionType: "navigate",
        actionHref: "/sell",
      }).catch((error) => {
        console.error("Failed to notify seller cancellation", error)
      }),
    )
  }

  if (notifications.length > 0) {
    await Promise.all(notifications)
  }
}

export const cancelPropertyPurchase = async (
  propertyId: string,
  initiatedBy: CancelInitiator,
): Promise<void> => {
  const participants = await resolvePropertyParticipants(propertyId)

  if (!participants.buyerUid) {
    throw new Error("ประกาศนี้ไม่มีผู้ซื้อที่ยืนยันอยู่")
  }

  await Promise.all([
    setDocument("property", propertyId, {
      isUnderPurchase: false,
      confirmedBuyerId: null,
      buyerConfirmed: false,
      sellerDocumentsConfirmed: false,
    }),
    participants.sellerUid
      ? setDocument(`users/${participants.sellerUid}/user_property`, propertyId, {
          isUnderPurchase: false,
          confirmedBuyerId: null,
          buyerConfirmed: false,
          sellerDocumentsConfirmed: false,
        })
      : Promise.resolve(),
    deleteDocument(`users/${participants.buyerUid}/buyer_properties`, propertyId).catch((error) => {
      console.error("Failed to delete buyer property record", error)
    }),
  ])

  await cleanInspectionCollection(propertyId)

  const notificationCleanups: Promise<void>[] = []

  if (participants.buyerUid) {
    notificationCleanups.push(
      deleteUserNotificationsByRelatedId(participants.buyerUid, propertyId).catch((error) => {
        console.error("Failed to delete buyer notifications for property", error)
      }),
    )
  }

  if (participants.sellerUid) {
    notificationCleanups.push(
      deleteUserNotificationsByRelatedId(participants.sellerUid, propertyId).catch((error) => {
        console.error("Failed to delete seller notifications for property", error)
      }),
    )
  }

  if (notificationCleanups.length > 0) {
    await Promise.all(notificationCleanups)
  }

  await notifyCancellation(propertyId, participants, initiatedBy)
}

