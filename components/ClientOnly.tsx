// components/ClientOnly.tsx
"use client";

import { useEffect, useState } from "react";

export default function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null; // รอจน mount ก่อนค่อยแสดง
  return <>{children}</>;
}
