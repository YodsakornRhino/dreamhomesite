"use client";

import { useEffect, useState } from "react";

import { subscribeToCollection } from "@/lib/firestore";
import {
  mapDocumentToBuyerProperty,
  parseBuyerPropertyConfirmedAt,
} from "@/lib/buyer-property-mapper";
import type { BuyerProperty } from "@/types/buyer-property";

interface UseBuyerPropertiesResult {
  properties: BuyerProperty[];
  loading: boolean;
  error: string | null;
}

export function useBuyerProperties(buyerUid: string | null): UseBuyerPropertiesResult {
  const [properties, setProperties] = useState<BuyerProperty[]>([]);
  const [loading, setLoading] = useState(Boolean(buyerUid));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    if (!buyerUid) {
      setProperties([]);
      setLoading(false);
      setError(null);
      return () => {};
    }

    setLoading(true);
    setError(null);

    const load = async () => {
      try {
        unsubscribe = await subscribeToCollection(
          `users/${buyerUid}/buyer_properties`,
          (docs) => {
            if (cancelled) return;
            const mapped = docs.map(mapDocumentToBuyerProperty);
            mapped.sort(
              (a, b) =>
                parseBuyerPropertyConfirmedAt(b.confirmedAt) -
                parseBuyerPropertyConfirmedAt(a.confirmedAt),
            );
            setProperties(mapped);
            setLoading(false);
          },
        );
      } catch (err) {
        console.error("Failed to load buyer properties", err);
        if (cancelled) return;
        setError("ไม่สามารถโหลดรายการทรัพย์ของผู้ซื้อได้");
        setProperties([]);
        setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [buyerUid]);

  return { properties, loading, error };
}
