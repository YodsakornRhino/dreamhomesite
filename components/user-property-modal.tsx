"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import {
  Bath,
  Bed,
  Calendar,
  Car,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Loader2,
  MapPin,
  Phone,
  Mail,
  Ruler,
  Share2,
  Square,
  Video,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useUserProperties } from "@/hooks/use-user-properties";
import { usePresenceStatus } from "@/hooks/use-presence-status";
import { useAuthContext } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  formatPropertyPrice,
  PROPERTY_TYPE_LABELS,
  SELLER_ROLE_LABELS,
  TRANSACTION_LABELS,
} from "@/lib/property";
import { cn } from "@/lib/utils";
import type { UserProperty } from "@/types/user-property";
import type { ChatOpenEventDetail, PropertyPreviewPayload } from "@/types/chat";
import { PropertyShareModal } from "@/components/property-share-modal";

interface UserPropertyModalProps {
  open: boolean;
  property: UserProperty | null;
  onOpenChange: (open: boolean) => void;
  loading?: boolean;
}

export function UserPropertyModal({
  open,
  property,
  onOpenChange,
  loading = false,
}: UserPropertyModalProps) {
  const router = useRouter();
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [pointerStartX, setPointerStartX] = useState<number | null>(null);
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [hasSentInterest, setHasSentInterest] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const userUid = property?.userUid?.trim() ? property.userUid : null;
  const sellerProfileHref = userUid ? `/users/${userUid}` : null;
  const {
    profile: sellerProfile,
    loading: sellerProfileLoading,
    error: sellerProfileError,
  } = useUserProfile(userUid);
  const {
    properties: sellerListings,
    loading: sellerListingsLoading,
    error: sellerListingsError,
  } = useUserProperties(userUid);

  useEffect(() => {
    setActiveMediaIndex(0);
    setHasSentInterest(false);
  }, [property?.id]);

  useEffect(() => {
    setShareOpen(false);
  }, [property?.id]);

  const mediaItems = useMemo(() => {
    if (!property) return [];

    const items = (property.photos ?? [])
      .filter(
        (photo): photo is string =>
          typeof photo === "string" && photo.trim().length > 0,
      )
      .map((photo, index) => ({
        id: `photo-${index}`,
        type: "image" as const,
        url: photo,
      }));

    if (property.video) {
      items.push({
        id: "video",
        type: "video" as const,
        url: property.video,
      });
    }

    return items;
  }, [property]);

  const goToPrevious = useCallback(() => {
    if (mediaItems.length === 0) return;
    setActiveMediaIndex((prev) => {
      if (mediaItems.length === 0) return 0;
      return (prev - 1 + mediaItems.length) % mediaItems.length;
    });
  }, [mediaItems.length]);

  const goToNext = useCallback(() => {
    if (mediaItems.length === 0) return;
    setActiveMediaIndex((prev) => {
      if (mediaItems.length === 0) return 0;
      return (prev + 1) % mediaItems.length;
    });
  }, [mediaItems.length]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (mediaItems.length <= 1) return;

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToPrevious();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goToNext();
      }
    },
    [goToNext, goToPrevious, mediaItems.length],
  );

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      setPointerStartX(event.clientX);
    },
    [],
  );

  const handlePointerEnd = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (pointerStartX === null || mediaItems.length <= 1) {
        setPointerStartX(null);
        return;
      }

      const deltaX = event.clientX - pointerStartX;
      const swipeThreshold = 40;

      if (Math.abs(deltaX) > swipeThreshold) {
        if (deltaX > 0) {
          goToPrevious();
        } else {
          goToNext();
        }
      }

      setPointerStartX(null);
    },
    [goToNext, goToPrevious, mediaItems.length, pointerStartX],
  );

  const resetPointer = useCallback(() => {
    setPointerStartX(null);
  }, []);

  const handleViewSellerListings = useCallback(() => {
    if (!sellerProfileHref) {
      return;
    }

    onOpenChange(false);
    router.push(sellerProfileHref);
  }, [onOpenChange, router, sellerProfileHref]);

  const safeIndex =
    mediaItems.length > 0
      ? Math.min(activeMediaIndex, mediaItems.length - 1)
      : 0;
  const activeMedia = mediaItems[safeIndex];

  const locationText = useMemo(() => {
    if (!property) return "";
    const segments = [property.address, property.city, property.province]
      .map((segment) => segment?.trim())
      .filter(Boolean);
    return segments.join(", ");
  }, [property]);

  const createdAtDisplay = useMemo(() => {
    if (!property?.createdAt) return null;
    const date = new Date(property.createdAt);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString("th-TH", {
      dateStyle: "medium",
      timeZone: "Asia/Bangkok",
    });
  }, [property]);

  const landAreaDisplay = useMemo(() => {
    if (!property) return "";
    const numeric = Number(property.landArea);
    if (Number.isFinite(numeric) && numeric > 0) {
      return `${numeric.toLocaleString("th-TH")} ตร.ว.`;
    }
    return property.landArea;
  }, [property]);

  const usableAreaDisplay = useMemo(() => {
    if (!property) return "";
    const numeric = Number(property.usableArea);
    if (Number.isFinite(numeric) && numeric > 0) {
      return `${numeric.toLocaleString("th-TH")} ตร.ม.`;
    }
    return property.usableArea;
  }, [property]);

  const bedroomsDisplay = useMemo(() => {
    if (!property) return "-";
    const numeric = Number(property.bedrooms);
    if (Number.isFinite(numeric) && numeric > 0) return numeric;
    return property.bedrooms || "-";
  }, [property]);

  const bathroomsDisplay = useMemo(() => {
    if (!property) return "-";
    const numeric = Number(property.bathrooms);
    if (Number.isFinite(numeric) && numeric > 0) return numeric;
    return property.bathrooms || "-";
  }, [property]);

  const parkingDisplay = useMemo(() => {
    if (!property?.parking) return null;
    if (property.parking === "none") return "ไม่มีที่จอดรถ";
    const numeric = Number(property.parking);
    if (Number.isFinite(numeric) && numeric >= 0) {
      return `${numeric} คัน`;
    }
    return property.parking;
  }, [property]);

  const sellerInitials = useMemo(() => {
    const name = sellerProfile?.name || property?.sellerName || "";
    if (!name) return "?";
    return name
      .split(" ")
      .map((segment) => segment.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [property?.sellerName, sellerProfile?.name]);
  const { label: sellerPresenceLabel, isOnline: isSellerOnline } =
    usePresenceStatus(sellerProfile?.status);
  const sellerListingsCount = sellerListings.length;

  const handleExpressInterest = useCallback(() => {
    if (!property) {
      toast({
        variant: "destructive",
        title: "ไม่พบรายละเอียดประกาศ",
        description: "ไม่สามารถส่งความสนใจได้ในขณะนี้",
      });
      return;
    }

    if (!property.userUid) {
      toast({
        variant: "destructive",
        title: "ไม่พบข้อมูลผู้ขาย",
        description: "ไม่สามารถส่งความสนใจได้ในขณะนี้",
      });
      return;
    }

    if (!user) {
      toast({
        variant: "destructive",
        title: "กรุณาเข้าสู่ระบบ",
        description: "เข้าสู่ระบบเพื่อแจ้งความสนใจต่อผู้ขาย",
      });
      return;
    }

    if (user.uid === property.userUid) {
      toast({
        title: "นี่คือประกาศของคุณ",
        description: "คุณไม่จำเป็นต้องแจ้งความสนใจประกาศของตัวเอง",
      });
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    if (property.isUnderPurchase) {
      toast({
        title: "มีคนกำลังซื้อแล้ว",
        description: "ประกาศนี้มีผู้กำลังดำเนินการซื้ออยู่ กรุณาติดตามสถานะหรือดูประกาศอื่น",
      });
      return;
    }

    const photos = Array.isArray(property.photos) ? property.photos : [];
    const firstPhoto = photos.find(
      (photo): photo is string => typeof photo === "string" && photo.trim().length > 0,
    );

    const preview: PropertyPreviewPayload = {
      propertyId: property.id,
      ownerUid: property.userUid,
      title: property.title,
      price: Number.isFinite(property.price) ? property.price : null,
      transactionType: property.transactionType,
      thumbnailUrl: firstPhoto ?? null,
      address: property.address,
      city: property.city,
      province: property.province,
    };

    const detail: ChatOpenEventDetail = {
      participantId: property.userUid,
      propertyPreview: preview,
    };

    window.dispatchEvent(
      new CustomEvent<ChatOpenEventDetail>("dreamhome:open-chat", { detail }),
    );

    setHasSentInterest(true);

    onOpenChange(false);
    toast({
      title: "ส่งความสนใจให้ผู้ขายแล้ว",
      description: "เราได้ส่งรายละเอียดประกาศนี้ให้ผู้ขายทราบผ่านระบบแชท",
    });
  }, [onOpenChange, property, toast, user]);

  if (!property && !loading) return null;

  if (!property && loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex w-full max-w-[calc(100vw-2rem)] flex-col items-center justify-center gap-4 py-12 text-center sm:max-w-3xl">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-sm text-muted-foreground">กำลังโหลดรายละเอียดประกาศ...</p>
        </DialogContent>
      </Dialog>
    );
  }

  if (!property) {
    return null;
  }

  const sellerRoleLabel =
    SELLER_ROLE_LABELS[property.sellerRole] ?? property.sellerRole;
  const transactionLabel =
    TRANSACTION_LABELS[property.transactionType] ?? property.transactionType;
  const typeLabel =
    PROPERTY_TYPE_LABELS[property.propertyType] ?? property.propertyType;
  const sellerDisplayName = sellerProfile?.name || property.sellerName;
  const sellerPhone = property.sellerPhone || sellerProfile?.phoneNumber || "";
  const sellerEmail = property.sellerEmail || sellerProfile?.email || "";
  const isUnderPurchase = property.isUnderPurchase;
  const buyerConfirmed = property.buyerConfirmed;
  const isOwnListing = Boolean(
    user?.uid && property.userUid && user.uid === property.userUid,
  );
  const isConfirmedBuyer = Boolean(
    user?.uid && property.confirmedBuyerId && property.confirmedBuyerId === user.uid,
  );
  const interestButtonLabel = isOwnListing
    ? "ประกาศของคุณ"
    : isUnderPurchase
      ? "มีคนกำลังซื้อแล้ว"
      : hasSentInterest
        ? "แจ้งผู้ขายอีกครั้ง"
        : "ต้องการอสังหาริมทรัพย์นี้";

  const sendDocumentsHref = property.id
    ? isOwnListing
      ? `/sell/send-documents?propertyId=${property.id}`
      : isConfirmedBuyer
        ? `/buy/send-documents?propertyId=${property.id}`
        : null
    : null;

  const handleSendDocumentsNavigation = () => {
    if (!sendDocumentsHref) return;
    onOpenChange(false);
    router.push(sendDocumentsHref);
  };

  const mapUrl =
    typeof property.lat === "number" && typeof property.lng === "number"
      ? `https://www.google.com/maps?q=${property.lat},${property.lng}&hl=th&z=16&output=embed`
      : null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-full max-w-[calc(100vw-2rem)] max-h-[calc(100vh-3rem)] overflow-y-auto overflow-x-hidden p-3 xs:p-4 sm:max-w-3xl sm:max-h-[90vh] sm:p-6 md:max-w-5xl lg:max-w-6xl lg:p-8 xl:max-w-7xl">
        <DialogHeader className="space-y-4">
          <div className="space-y-2">
            <DialogTitle className="text-xl font-bold text-gray-900 sm:text-2xl">
              {property.title}
            </DialogTitle>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground sm:gap-3">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {locationText || property.address || "-"}
              </span>
              {createdAtDisplay && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  ประกาศเมื่อ {createdAtDisplay}
                </span>
              )}
            </div>
          </div>
          {isUnderPurchase && (
            <Alert className="border-amber-200 bg-amber-50 text-amber-800">
              <AlertTitle>มีคนกำลังซื้อแล้ว</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>
                  ประกาศนี้มีผู้กำลังดำเนินการซื้ออยู่ หากคุณสนใจกรุณาติดตามความคืบหน้าหรือเลือกประกาศอื่น
                </p>
                {buyerConfirmed && (
                  <p className="font-semibold text-amber-900">
                    ผู้ซื้อได้ยืนยันการเตรียมเอกสารแล้ว กำลังรอขั้นตอนจากผู้ขาย
                  </p>
                )}
              </AlertDescription>
              {sendDocumentsHref && (
                <div className="mt-3">
                  <Button
                    type="button"
                    size="sm"
                    className="bg-blue-600 text-white hover:bg-blue-700"
                    onClick={handleSendDocumentsNavigation}
                  >
                    ไปยังหน้าส่งเอกสาร
                  </Button>
                </div>
              )}
            </Alert>
          )}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Badge className="bg-blue-600 text-white hover:bg-blue-600">
              {transactionLabel}
            </Badge>
            <Badge variant="outline">{typeLabel}</Badge>
            <DialogDescription className="text-2xl font-bold text-blue-600 sm:text-3xl">
              {formatPropertyPrice(property.price, property.transactionType)}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-12 lg:gap-8">
          <div className="space-y-6 md:col-span-7 xl:col-span-8">
            <section className="space-y-3">
              <div
                className="relative h-48 w-full touch-pan-y overflow-hidden rounded-2xl bg-muted shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 xs:h-56 sm:h-64 lg:h-72"
                tabIndex={0}
                role="group"
                aria-label="แกลเลอรีสื่อประกาศ"
                onKeyDown={handleKeyDown}
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerEnd}
                onPointerCancel={resetPointer}
                onPointerLeave={resetPointer}
              >
                {mediaItems.length > 1 && (
                  <>
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      onClick={goToPrevious}
                      className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/80 text-gray-900 shadow backdrop-blur transition hover:bg-white focus-visible:ring-2 focus-visible:ring-blue-500"
                      aria-label="ดูสื่อก่อนหน้า"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      onClick={goToNext}
                      className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/80 text-gray-900 shadow backdrop-blur transition hover:bg-white focus-visible:ring-2 focus-visible:ring-blue-500"
                      aria-label="ดูสื่อถัดไป"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </>
                )}
                {activeMedia ? (
                  activeMedia.type === "image" ? (
                    <Image
                      src={activeMedia.url}
                      alt={property.title}
                      fill
                      sizes="(min-width: 1280px) 60vw, (min-width: 1024px) 55vw, 100vw"
                      className="h-full w-full object-contain object-center"
                    />
                  ) : (
                    <video controls className="h-full w-full object-contain object-center bg-black">
                      <source src={activeMedia.url} />
                      เบราว์เซอร์ของคุณไม่รองรับการเล่นวิดีโอ
                    </video>
                  )
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-r from-sky-400 to-indigo-500 text-white">
                    <ImageIcon className="h-12 w-12" />
                  </div>
                )}
              </div>
              {mediaItems.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {mediaItems.map((item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveMediaIndex(index)}
                      className={cn(
                        "relative h-14 w-20 overflow-hidden rounded-lg border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 xs:h-16 xs:w-24 sm:h-20 sm:w-28",
                        index === safeIndex
                          ? "ring-2 ring-blue-500"
                          : "hover:border-blue-200",
                      )}
                    >
                      {item.type === "image" ? (
                        <Image
                          src={item.url}
                          alt={`รูปที่ ${index + 1}`}
                          fill
                          sizes="120px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-black/80 text-white">
                          <Video className="h-6 w-6" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-3 rounded-2xl border bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">
                รายละเอียด
              </h3>
              <p className="whitespace-pre-line break-words text-sm leading-relaxed text-gray-700">
                {property.description || "ไม่มีรายละเอียดเพิ่มเติม"}
              </p>
            </section>

            <section className="space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">
                ข้อมูลทรัพย์สิน
              </h3>
              <div className="grid gap-4 xs:grid-cols-2">
                <div className="flex items-center gap-3 rounded-xl border p-4">
                  <Bed className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">ห้องนอน</p>
                    <p className="text-base font-semibold text-gray-900">
                      {bedroomsDisplay}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border p-4">
                  <Bath className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">ห้องน้ำ</p>
                    <p className="text-base font-semibold text-gray-900">
                      {bathroomsDisplay}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border p-4">
                  <Ruler className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">พื้นที่ดิน</p>
                    <p className="text-base font-semibold text-gray-900">
                      {landAreaDisplay || "-"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border p-4">
                  <Square className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      พื้นที่ใช้สอย
                    </p>
                    <p className="text-base font-semibold text-gray-900">
                      {usableAreaDisplay || "-"}
                    </p>
                  </div>
                </div>
                {parkingDisplay && (
                  <div className="flex items-center gap-3 rounded-xl border p-4">
                    <Car className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">ที่จอดรถ</p>
                      <p className="text-base font-semibold text-gray-900">
                        {parkingDisplay}
                      </p>
                    </div>
                  </div>
                )}
                {property.yearBuilt && (
                  <div className="flex items-center gap-3 rounded-xl border p-4">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        สร้างเมื่อปี
                      </p>
                      <p className="text-base font-semibold text-gray-900">
                        {property.yearBuilt}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-6 md:col-span-5 xl:col-span-4">
            <section className="space-y-3 rounded-2xl border bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">แผนที่</h3>
              {mapUrl ? (
                <div className="overflow-hidden rounded-xl border">
                  <iframe
                    src={mapUrl}
                    title="ตำแหน่งทรัพย์สิน"
                    className="h-44 w-full border-0 xs:h-48 sm:h-56"
                    loading="lazy"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="flex h-40 w-full items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
                  ไม่มีพิกัดแผนที่สำหรับประกาศนี้
                </div>
              )}
            </section>

            <section className="space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">
                ข้อมูลผู้ขาย
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12 border">
                    <AvatarImage
                      src={sellerProfile?.photoURL ?? ""}
                      alt={sellerDisplayName}
                    />
                    <AvatarFallback>{sellerInitials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <p className="text-base font-semibold text-gray-900">
                      {sellerDisplayName}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full",
                          isSellerOnline ? "bg-emerald-500" : "bg-gray-300",
                        )}
                        aria-hidden="true"
                      />
                      <span>{sellerPresenceLabel}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {sellerRoleLabel}
                    </p>
                    {sellerProfile?.phoneVerified && (
                      <Badge className="mt-1 w-fit border-emerald-200 bg-emerald-50 text-xs font-medium text-emerald-600">
                        ยืนยันเบอร์โทรแล้ว
                      </Badge>
                    )}
                  </div>
                </div>

                {sellerProfileLoading && (
                  <p className="text-sm text-muted-foreground">
                    กำลังโหลดข้อมูลผู้ขาย...
                  </p>
                )}
                {sellerProfileError && (
                  <p className="text-sm text-red-600">{sellerProfileError}</p>
                )}

                <div className="space-y-3 text-sm text-gray-700">
                  {sellerPhone && (
                    <a
                      href={`tel:${sellerPhone}`}
                      className="flex flex-wrap items-center gap-2 text-blue-600 hover:underline sm:flex-nowrap sm:gap-3"
                    >
                      <Phone className="h-5 w-5" />
                      {sellerPhone}
                    </a>
                  )}
                  {sellerEmail && (
                    <a
                      href={`mailto:${sellerEmail}`}
                      className="flex flex-wrap items-center gap-2 break-all text-blue-600 hover:underline sm:flex-nowrap sm:gap-3"
                    >
                      <Mail className="h-5 w-5" />
                      {sellerEmail}
                    </a>
                  )}
                </div>

                {property?.id && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-center gap-2"
                    onClick={() => setShareOpen(true)}
                  >
                    <Share2 className="h-4 w-4" />
                    แชร์ประกาศนี้
                  </Button>
                )}

                {property.userUid && (
                  <Button
                    className="w-full justify-center bg-blue-600 text-white hover:bg-blue-700"
                    onClick={handleExpressInterest}
                    disabled={isOwnListing || isUnderPurchase}
                  >
                    {interestButtonLabel}
                  </Button>
                )}

                {sellerListingsError && (
                  <p className="text-sm text-red-600">{sellerListingsError}</p>
                )}

                {sellerProfileHref && (
                  <Button
                    variant="outline"
                    className="w-full justify-center"
                    onClick={handleViewSellerListings}
                  >
                    {sellerListingsLoading
                      ? "กำลังโหลดประกาศจากผู้ขาย..."
                      : `ดูประกาศทั้งหมดจากผู้ขายรายนี้ (${sellerListingsCount})`}
                  </Button>
                )}
              </div>
            </section>

            <section className="space-y-3 rounded-2xl border bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">ที่อยู่</h3>
              <div className="space-y-1 text-sm text-gray-700">
                <p>{property.address}</p>
                <p>
                  {[property.city, property.province, property.postal]
                    .filter(Boolean)
                    .join(" ")}
                </p>
              </div>
            </section>
          </aside>
        </div>
        {loading && (
          <div className="pointer-events-none absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 rounded-2xl bg-white/70 backdrop-blur-sm">
            <Loader2 className="h-9 w-9 animate-spin text-blue-600" />
            <p className="text-sm text-muted-foreground">กำลังโหลดรายละเอียดล่าสุด...</p>
          </div>
        )}
        </DialogContent>
      </Dialog>
      <PropertyShareModal
        open={shareOpen && Boolean(property)}
        property={property}
        onOpenChange={setShareOpen}
      />
    </>
  );
}
