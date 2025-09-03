import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Normalize phone numbers to E.164.
// Removes non-digit characters and converts Thai numbers
// starting with "0" to use the "+66" country code.
export function normalizePhoneNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "")
  if (!digits) return ""
  if (raw.trim().startsWith("+")) return "+" + digits
  if (digits.startsWith("0")) return "+66" + digits.slice(1)
  return "+" + digits
}
