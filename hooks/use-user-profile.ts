"use client";

import { useEffect, useState } from "react";

import { subscribeToDocument } from "@/lib/firestore";
import { mapDocumentToUserProfile } from "@/lib/user-profile-mapper";
import type { UserProfile } from "@/types/user-profile";

interface UseUserProfileResult {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}

export function useUserProfile(userUid: string | null): UseUserProfileResult {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(Boolean(userUid));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let isActive = true;

    if (!userUid) {
      setProfile(null);
      setLoading(false);
      setError(null);
      return () => {};
    }

    setLoading(true);
    setError(null);

    const loadProfile = async () => {
      try {
        unsubscribe = await subscribeToDocument({
          collectionPath: "users",
          docId: userUid,
          onNext: (doc) => {
            if (!isActive) return;

            if (doc) {
              setProfile(mapDocumentToUserProfile(doc));
            } else {
              setProfile(null);
            }
            setLoading(false);
          },
          onError: () => {
            if (!isActive) return;
            setProfile(null);
            setError("ไม่สามารถโหลดข้อมูลผู้ขายได้");
            setLoading(false);
          },
        });
      } catch (err) {
        console.error("Failed to load user profile:", err);
        if (!isActive) return;
        setProfile(null);
        setError("ไม่สามารถโหลดข้อมูลผู้ขายได้");
        setLoading(false);
      }
    };

    void loadProfile();

    return () => {
      isActive = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [userUid]);

  return { profile, loading, error };
}
