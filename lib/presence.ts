export type PresenceState = "online" | "offline"

export interface PresenceLike {
  state?: PresenceState | string | null
  lastActiveAt?: Date | string | null
}

export const ONLINE_THRESHOLD_MS = 2 * 60 * 1000

const parseLastActiveAt = (value?: Date | string | null): Date | null => {
  if (!value) return null
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }

  if (typeof value === "string") {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  return null
}

export const isPresenceOnline = (
  presence?: PresenceLike | null,
  options?: { thresholdMs?: number },
): boolean => {
  if (!presence) return false

  const state = presence.state === "online" ? "online" : presence.state === "offline" ? "offline" : null
  if (state !== "online") {
    return false
  }

  const lastActiveAt = parseLastActiveAt(presence.lastActiveAt ?? null)
  if (!lastActiveAt) {
    return false
  }

  const threshold = options?.thresholdMs ?? ONLINE_THRESHOLD_MS
  return Date.now() - lastActiveAt.getTime() <= threshold
}

export const formatPresenceLastActive = (
  presence?: PresenceLike | null,
): string => {
  const lastActiveAt = parseLastActiveAt(presence?.lastActiveAt ?? null)
  if (!lastActiveAt) return ""

  const diffMs = Date.now() - lastActiveAt.getTime()

  if (diffMs < 60_000) {
    return "เมื่อสักครู่"
  }

  if (diffMs < 3_600_000) {
    const minutes = Math.max(1, Math.floor(diffMs / 60_000))
    return `${minutes} นาทีที่แล้ว`
  }

  if (diffMs < 86_400_000) {
    const hours = Math.max(1, Math.floor(diffMs / 3_600_000))
    return `${hours} ชั่วโมงที่แล้ว`
  }

  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(lastActiveAt)
}

export const getPresenceLabel = (presence?: PresenceLike | null): string => {
  if (isPresenceOnline(presence)) {
    return "ออนไลน์"
  }

  const lastActive = formatPresenceLastActive(presence)
  return lastActive ? `ออฟไลน์ • ${lastActive}` : "ออฟไลน์"
}
