"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import type { PresenceLike } from "@/lib/presence"
import { getPresenceLabel, isPresenceOnline } from "@/lib/presence"

interface UsePresenceStatusOptions {
  refreshIntervalMs?: number
}

interface PresenceStatusResult {
  label: string
  isOnline: boolean
}

const getLastActiveKey = (presence?: PresenceLike | null): number | string | null => {
  if (!presence) return null

  const value = presence.lastActiveAt
  if (!value) return null

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.getTime()
  }

  if (typeof value === "string") {
    return value
  }

  return null
}

export function usePresenceStatus(
  presence?: PresenceLike | null,
  options?: UsePresenceStatusOptions,
): PresenceStatusResult {
  const refreshIntervalMs = options?.refreshIntervalMs ?? 30_000
  const lastActiveKey = getLastActiveKey(presence)
  const stateKey = presence?.state ?? null

  const computeLabel = useCallback(() => getPresenceLabel(presence), [presence, lastActiveKey, stateKey])
  const [label, setLabel] = useState<string>(() => computeLabel())

  useEffect(() => {
    setLabel(computeLabel())
  }, [computeLabel])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (!presence) return

    if (isPresenceOnline(presence)) {
      return
    }

    const interval = window.setInterval(() => {
      setLabel(computeLabel())
    }, refreshIntervalMs)

    return () => {
      window.clearInterval(interval)
    }
  }, [computeLabel, presence, refreshIntervalMs])

  const isOnline = useMemo(() => isPresenceOnline(presence), [presence, lastActiveKey, stateKey])

  return { label, isOnline }
}
