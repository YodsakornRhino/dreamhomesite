"use client";

import { useEffect, useState } from "react";

import { subscribeToCollection } from "@/lib/firestore";

export interface SellerHandoverProperty {
  id: string;
  title: string;
  handoverDate: string | null;
  confirmedBuyerId: string | null;
  isUnderPurchase: boolean;
  address: string | null;
  city: string | null;
  province: string | null;
}

interface UseSellerHandoverPropertiesResult {
  properties: SellerHandoverProperty[];
  loading: boolean;
}

const toStringValue = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toString();
  }
  return "";
};

const toOptionalString = (value: unknown): string | null => {
  const text = toStringValue(value).trim();
  return text.length > 0 ? text : null;
};

const toIsoString = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate?: () => Date }).toDate === "function"
  ) {
    const date = (value as { toDate: () => Date }).toDate();
    if (date instanceof Date && !Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
  }
  return "";
};

export function useSellerHandoverProperties(
  sellerUid: string | null,
): UseSellerHandoverPropertiesResult {
  const [properties, setProperties] = useState<SellerHandoverProperty[]>([]);
  const [loading, setLoading] = useState(Boolean(sellerUid));

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    if (!sellerUid) {
      setProperties([]);
      setLoading(false);
      return () => {};
    }

    setLoading(true);

    const load = async () => {
      try {
        const { where } = await import("firebase/firestore");
        unsubscribe = await subscribeToCollection(
          "property",
          (docs) => {
            if (cancelled) return;
            const mapped = docs.map((doc) => {
              const data = doc.data() as Record<string, unknown>;
              return {
                id: doc.id,
                title: toStringValue(data.title) || `ประกาศ ${doc.id}`,
                handoverDate: (() => {
                  const iso = toIsoString(data.handoverDate);
                  return iso ? iso : null;
                })(),
                confirmedBuyerId: toOptionalString(data.confirmedBuyerId),
                isUnderPurchase: Boolean(data.isUnderPurchase),
                address: toOptionalString(data.address),
                city: toOptionalString(data.city),
                province: toOptionalString(data.province),
              } satisfies SellerHandoverProperty;
            });
            setProperties(mapped);
            setLoading(false);
          },
          where("userUid", "==", sellerUid),
        );
      } catch (error) {
        console.error("Failed to load seller properties", error);
        if (cancelled) return;
        setProperties([]);
        setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [sellerUid]);

  return { properties, loading };
}
