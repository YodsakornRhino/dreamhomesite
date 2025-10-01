"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, MessageCircle } from "lucide-react";

import { UserPropertyCard } from "@/components/user-property-card";
import { UserPropertyModal } from "@/components/user-property-modal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthContext } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useUserProperties } from "@/hooks/use-user-properties";
import type { UserProperty } from "@/types/user-property";
import type { PropertyPreviewOpenEventDetail } from "@/types/chat";

interface UserProfilePageProps {
  uid: string;
  initialPropertyId?: string;
}

export function UserProfilePage({ uid, initialPropertyId }: UserProfilePageProps) {
  const { user } = useAuthContext();
  const {
    profile,
    loading: profileLoading,
    error: profileError,
  } = useUserProfile(uid);
  const {
    properties,
    loading: propertiesLoading,
    error: propertiesError,
  } = useUserProperties(uid);
  const [selectedProperty, setSelectedProperty] = useState<UserProperty | null>(
    null,
  );
  const [requestedPropertyId, setRequestedPropertyId] = useState<string | null>(
    initialPropertyId ?? null,
  );

  useEffect(() => {
    if (!initialPropertyId) return;
    setRequestedPropertyId(initialPropertyId);
  }, [initialPropertyId]);

  useEffect(() => {
    if (!requestedPropertyId) return;
    const found = properties.find((item) => item.id === requestedPropertyId);
    if (!found) return;
    setSelectedProperty(found);
    setRequestedPropertyId(null);
  }, [properties, requestedPropertyId]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOpenPropertyPreview = (event: Event) => {
      const detail = (event as CustomEvent<PropertyPreviewOpenEventDetail>).detail;
      if (!detail?.propertyId) return;
      if (detail.ownerUid && detail.ownerUid !== uid) return;
      setRequestedPropertyId(detail.propertyId);
    };

    window.addEventListener(
      "dreamhome:open-property-preview",
      handleOpenPropertyPreview,
    );

    return () => {
      window.removeEventListener(
        "dreamhome:open-property-preview",
        handleOpenPropertyPreview,
      );
    };
  }, [uid]);

  const profileInitials = useMemo(() => {
    const name = profile?.name || "ผู้ขาย";
    return name
      .split(" ")
      .map((segment) => segment.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [profile?.name]);

  const totalListings = properties.length;

  const handleViewDetails = (property: UserProperty) => {
    setSelectedProperty(property);
  };

  const handleModalChange = (open: boolean) => {
    if (!open) {
      setSelectedProperty(null);
    }
  };

  const isViewingOwnProfile = Boolean(user?.uid && profile?.uid && user.uid === profile.uid);

  const handleOpenChat = useCallback(() => {
    if (!profile?.uid) return;
    if (typeof window === "undefined") return;

    window.dispatchEvent(
      new CustomEvent("dreamhome:open-chat", {
        detail: { participantId: profile.uid },
      }),
    );
  }, [profile?.uid]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/buy"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              กลับไปหน้าซื้อ
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              ข้อมูลผู้ขาย
            </h1>
          </div>
        </div>

        <Card>
          <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
              <Avatar className="h-20 w-20 border">
                <AvatarImage
                  src={profile?.photoURL ?? ""}
                  alt={profile?.name ?? "ผู้ขาย"}
                />
                <AvatarFallback className="text-lg">
                  {profileInitials}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                {profileLoading ? (
                  <p className="text-sm text-muted-foreground">
                    กำลังโหลดข้อมูลผู้ขาย...
                  </p>
                ) : profileError ? (
                  <p className="text-sm text-red-600">{profileError}</p>
                ) : profile ? (
                  <>
                    <p className="text-2xl font-semibold text-gray-900">
                      {profile.name}
                    </p>
                    {profile.email && (
                      <p className="text-sm text-gray-600">
                        อีเมล: {profile.email}
                      </p>
                    )}
                    {profile.phoneNumber && (
                      <p className="text-sm text-gray-600">
                        เบอร์โทร: {profile.phoneNumber}
                      </p>
                    )}
                    <p className="text-sm text-gray-500">
                      ประกาศทั้งหมด {totalListings} รายการ
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-600">ไม่พบข้อมูลผู้ขาย</p>
                )}
              </div>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto">
              {profile?.uid && !isViewingOwnProfile && (
                <Button
                  onClick={handleOpenChat}
                  className="flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
                >
                  <MessageCircle className="h-4 w-4" />
                  แชทกับผู้ขาย
                </Button>
              )}
              {profile?.email && (
                <Button asChild variant="outline">
                  <a href={`mailto:${profile.email}`}>ติดต่อผู้ขายผ่านอีเมล</a>
                </Button>
              )}
              {profile?.phoneNumber && (
                <Button asChild>
                  <a href={`tel:${profile.phoneNumber}`}>โทรหาผู้ขาย</a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <section className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              ประกาศของผู้ขายรายนี้
            </h2>
            <p className="text-sm text-gray-500">แสดง {totalListings} รายการ</p>
          </div>

          {propertiesLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="flex h-full flex-col overflow-hidden rounded-2xl border bg-white p-4 shadow-sm animate-pulse"
                >
                  <div className="mb-4 h-40 w-full rounded-xl bg-gray-200" />
                  <div className="space-y-3">
                    <div className="h-4 w-3/4 rounded bg-gray-200" />
                    <div className="h-4 w-1/2 rounded bg-gray-200" />
                    <div className="h-4 w-full rounded bg-gray-200" />
                  </div>
                </div>
              ))}
            </div>
          ) : propertiesError ? (
            <p className="text-sm text-red-600">{propertiesError}</p>
          ) : properties.length === 0 ? (
            <p className="text-gray-500">ผู้ขายรายนี้ยังไม่มีประกาศขาย</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {properties.map((property) => (
                <UserPropertyCard
                  key={property.id}
                  property={property}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <UserPropertyModal
        open={Boolean(selectedProperty)}
        property={selectedProperty}
        onOpenChange={handleModalChange}
      />

    </div>
  );
}
