"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { CheckCircle2, FileText, Home, ListChecks, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthContext } from "@/contexts/AuthContext";
import { useBuyerProperties } from "@/hooks/use-buyer-properties";
import { formatPropertyPrice, TRANSACTION_LABELS } from "@/lib/property";
import type { BuyerProperty } from "@/types/buyer-property";

const safeFormatDate = (value: string | null) => {
  if (!value) return null;
  try {
    return format(parseISO(value), "d MMM yyyy");
  } catch (error) {
    console.error("Failed to format date", error);
    return null;
  }
};

const safeFormatDateTime = (value: string | null) => {
  if (!value) return null;
  try {
    return format(parseISO(value), "d MMM yyyy HH:mm");
  } catch (error) {
    console.error("Failed to format datetime", error);
    return null;
  }
};

const buildLocationLabel = (property: BuyerProperty) => {
  return [property.address, property.city, property.province]
    .map((segment) => segment?.trim())
    .filter(Boolean)
    .join(", ");
};

const resolvePriceLabel = (property: BuyerProperty) => {
  if (property.price == null || property.transactionType == null) return "ราคาไม่ระบุ";
  return formatPropertyPrice(property.price, property.transactionType);
};

export default function BuyerPropertiesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext();
  const { properties, loading, error } = useBuyerProperties(user?.uid ?? null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/");
    }
  }, [authLoading, router, user]);

  const showEmptyState = !loading && properties.length === 0;

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
            <Home className="h-4 w-4" />
            อสังหาที่ซื้อของฉัน
          </div>
          <h1 className="text-3xl font-semibold text-slate-900">ติดตามขั้นตอนการซื้อบ้านของคุณได้ที่นี่</h1>
          <p className="max-w-3xl text-sm text-slate-600 sm:text-base">
            รวมทุกประกาศที่คุณยืนยันการซื้อ พร้อมสถานะการส่งเอกสาร การตรวจสภาพบ้าน และการส่งมอบ
            เพื่อให้คุณวางแผนการย้ายเข้าได้อย่างมั่นใจ
          </p>
        </div>

        {error && (
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-amber-800">ไม่สามารถโหลดข้อมูลได้</CardTitle>
              <CardDescription className="text-sm text-amber-700">
                {error}
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={`buyer-property-skeleton-${index}`}
                className="h-64 animate-pulse rounded-3xl bg-white shadow-sm"
              />
            ))}
          </div>
        ) : showEmptyState ? (
          <Card className="border-none bg-white shadow-sm">
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
              <div className="rounded-full bg-slate-100 p-4">
                <Home className="h-8 w-8 text-slate-400" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">ยังไม่มีรายการที่ยืนยันการซื้อ</h2>
              <p className="max-w-md text-sm text-slate-600">
                เริ่มต้นคุยกับผู้ขายผ่านแชทเพื่อยืนยันการซื้อ เมื่อผู้ขายอนุมัติ ระบบจะแสดงทรัพย์ที่นี่พร้อมขั้นตอนถัดไปให้คุณทันที
              </p>
              <Button asChild className="bg-indigo-600 text-white hover:bg-indigo-700">
                <Link href="/buy">ค้นหาบ้านที่สนใจ</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {properties.map((property) => {
              const locationLabel = buildLocationLabel(property);
              const priceLabel = resolvePriceLabel(property);
              const confirmedAtLabel = safeFormatDateTime(property.confirmedAt);
              const handoverDateLabel = safeFormatDate(property.handoverDate);

              const transactionLabel = property.transactionType
                ? TRANSACTION_LABELS[property.transactionType] ?? property.transactionType
                : null;

              return (
                <Card key={property.id} className="overflow-hidden border-none bg-white shadow-sm">
                  <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-start">
                    <div className="w-full sm:w-52">
                      <div className="relative h-40 w-full overflow-hidden rounded-2xl bg-slate-100 sm:h-48">
                        {property.thumbnailUrl ? (
                          <Image
                            src={property.thumbnailUrl}
                            alt={property.title}
                            fill
                            sizes="(min-width: 768px) 200px, 100vw"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-400">
                            <Home className="h-8 w-8" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {transactionLabel && (
                            <Badge className="rounded-full bg-indigo-600 text-white">
                              {transactionLabel}
                            </Badge>
                          )}
                          <Badge className="rounded-full bg-emerald-50 text-emerald-700">
                            ยืนยันแล้ว
                          </Badge>
                          {property.sellerDocumentsConfirmed && (
                            <Badge className="rounded-full bg-blue-50 text-blue-700">
                              ผู้ขายตรวจเอกสารแล้ว
                            </Badge>
                          )}
                        </div>
                        <h2 className="text-2xl font-semibold text-slate-900">{property.title}</h2>
                        <p className="text-lg font-medium text-indigo-600">{priceLabel}</p>
                        {locationLabel && (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <MapPin className="h-4 w-4" />
                            {locationLabel}
                          </div>
                        )}
                        {confirmedAtLabel && (
                          <p className="text-xs text-slate-500">
                            ยืนยันเมื่อ {confirmedAtLabel}
                          </p>
                        )}
                      </div>

                      <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2">
                        <div className="space-y-1 text-sm text-slate-600">
                          <p className="flex items-center gap-2 font-semibold text-slate-800">
                            <FileText className="h-4 w-4 text-indigo-500" />
                            การส่งเอกสาร
                          </p>
                          <p>
                            {property.sellerDocumentsConfirmed
                              ? "ผู้ขายตรวจสอบเอกสารเรียบร้อย รอนัดส่งตัวจริง"
                              : "เตรียมเอกสารให้ครบและส่งให้ผู้ขายตรวจสอบ"}
                          </p>
                        </div>
                        <div className="space-y-1 text-sm text-slate-600">
                          <p className="flex items-center gap-2 font-semibold text-slate-800">
                            <ListChecks className="h-4 w-4 text-emerald-500" />
                            นัดหมายตรวจและส่งมอบ
                          </p>
                          <p>
                            {handoverDateLabel
                              ? `นัดหมายส่งมอบวันที่ ${handoverDateLabel}`
                              : "กำหนดวันตรวจและส่งมอบร่วมกับผู้ขาย"}
                          </p>
                          {property.handoverNote && (
                            <p className="text-xs text-slate-500">โน้ต: {property.handoverNote}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          asChild
                          className="bg-indigo-600 text-white hover:bg-indigo-700"
                        >
                          <Link href={`/buy/send-documents?propertyId=${property.propertyId}`}>
                            ส่งเอกสาร
                          </Link>
                        </Button>
                        <Button
                          asChild
                          variant="outline"
                          className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        >
                          <Link href={`/buy/home-inspection?propertyId=${property.propertyId}`}>
                            เช็คสภาพบ้าน
                          </Link>
                        </Button>
                        <Button
                          asChild
                          variant="outline"
                          className="border-slate-200 text-slate-700 hover:bg-slate-100"
                        >
                          <Link href={`/buy/home-inspection?propertyId=${property.propertyId}#timeline`}>
                            ติดตามการส่งบ้าน
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <Card className="border-none bg-slate-900 text-slate-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              เคล็ดลับการเตรียมส่งมอบบ้านให้ราบรื่น
            </CardTitle>
            <CardDescription className="text-sm text-slate-300">
              สรุปขั้นตอนสำคัญเพื่อให้ทั้งผู้ซื้อและผู้ขายเห็นภาพรวมเดียวกัน
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-800/60 p-4 text-sm">
              <p className="font-semibold text-slate-100">1. รวบรวมเอกสาร</p>
              <p className="mt-2 text-slate-300">
                ตรวจสอบเอกสารตามรายการที่ DreamHome แนะนำ และอัปเดตผู้ขายเมื่อพร้อมส่งมอบตัวจริง
              </p>
            </div>
            <div className="rounded-2xl bg-slate-800/60 p-4 text-sm">
              <p className="font-semibold text-slate-100">2. นัดหมายตรวจสภาพบ้าน</p>
              <p className="mt-2 text-slate-300">
                บันทึกวันที่สะดวกและสิ่งที่ต้องเตรียม ผู้ขายจะได้รับแจ้งเตือนและยืนยันการนัดหมายให้ทันที
              </p>
            </div>
            <div className="rounded-2xl bg-slate-800/60 p-4 text-sm">
              <p className="font-semibold text-slate-100">3. ปิดงานส่งมอบ</p>
              <p className="mt-2 text-slate-300">
                ติดตามงานแก้ไข ตรวจสอบสถานะการส่งมอบ และเก็บหลักฐานไว้ในระบบเพื่อการอ้างอิงในอนาคต
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
