"use client";

import { useEffect, useState } from "react";

import { subscribeToCollection } from "@/lib/firestore";
import {
  mapDocumentToUserProperty,
  parseUserPropertyCreatedAt,
} from "@/lib/user-property-mapper";
import type { UserProperty } from "@/types/user-property";

interface UseUserPropertiesResult {
  properties: UserProperty[];
  loading: boolean;
  error: string | null;
}

export function useUserProperties(
  userUid: string | null,
): UseUserPropertiesResult {
  const [properties, setProperties] = useState<UserProperty[]>([]);
  const [loading, setLoading] = useState(Boolean(userUid));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let isActive = true;

    if (!userUid) {
      setProperties([]);
      setLoading(false);
      setError(null);
      return () => {};
    }

    setLoading(true);
    setError(null);

    const loadProperties = async () => {
      try {
        const { where } = await import("firebase/firestore");
        unsubscribe = await subscribeToCollection({
          collectionPath: "property",
          onNext: (docs) => {
            if (!isActive) return;

            const mapped = docs.map(mapDocumentToUserProperty);
            mapped.sort(
              (a, b) =>
                parseUserPropertyCreatedAt(b.createdAt) -
                parseUserPropertyCreatedAt(a.createdAt),
            );

            setProperties(mapped);
            setLoading(false);
          },
          queryConstraints: [where("userUid", "==", userUid)],
          onError: () => {
            if (!isActive) return;
            setProperties([]);
            setError("ไม่สามารถโหลดประกาศของผู้ขายได้");
            setLoading(false);
          },
        });
      } catch (err) {
        console.error("Failed to load user listings:", err);
        if (!isActive) return;
        setProperties([]);
        setError("ไม่สามารถโหลดประกาศของผู้ขายได้");
        setLoading(false);
      }
    };

    void loadProperties();

    return () => {
      isActive = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [userUid]);

  return { properties, loading, error };
}
