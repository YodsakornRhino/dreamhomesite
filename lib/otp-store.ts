const store = new Map<string, { code: string; expires: number }>();

export function setOtp(phone: string, code: string, ttlMs: number) {
  store.set(phone, { code, expires: Date.now() + ttlMs });
}

export function verifyOtp(phone: string, code: string): boolean {
  const entry = store.get(phone);
  if (!entry) return false;
  if (entry.expires < Date.now()) {
    store.delete(phone);
    return false;
  }
  const ok = entry.code === code;
  if (ok) store.delete(phone);
  return ok;
}
