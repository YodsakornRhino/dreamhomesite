"use client"

import { useCallback, useRef } from "react"

/**
 * Simple notification tone shared across components to signal new alerts.
 * Reuses a single AudioContext per hook instance to avoid repeated user prompts.
 */
export const useNotificationSound = () => {
  const audioContextRef = useRef<AudioContext | null>(null)

  const playNotificationSound = useCallback(async () => {
    try {
      if (typeof window === "undefined") return

      const AudioContextConstructor =
        window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AudioContextConstructor) return

      const audioContext = audioContextRef.current ?? new AudioContextConstructor()

      if (audioContext.state === "suspended") {
        await audioContext.resume()
      }

      const now = audioContext.currentTime
      const oscillator = audioContext.createOscillator()
      const gain = audioContext.createGain()

      const peakGain = 0.7
      const fadeOutTime = 0.6

      oscillator.type = "sine"
      oscillator.frequency.setValueAtTime(880, now)

      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(peakGain, now + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + fadeOutTime)

      oscillator.connect(gain)
      gain.connect(audioContext.destination)

      oscillator.start(now)
      oscillator.stop(now + fadeOutTime)

      audioContextRef.current = audioContext
    } catch (error) {
      console.error("Failed to play notification sound", error)
    }
  }, [])

  return playNotificationSound
}

export default useNotificationSound
