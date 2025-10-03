"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import {
  AlertCircle,
  Calendar as CalendarIcon,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Compass,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface BuyerChecklistItem {
  id: string;
  title: string;
  description: string;
  sellerStatus: "scheduled" | "fixing" | "done";
  buyerStatus: "pending" | "accepted" | "follow-up";
  lastUpdatedAt: string;
}

type BuyerIssueStatus = "pending" | "in-progress" | "resolved";

interface BuyerIssue {
  id: string;
  title: string;
  location: string;
  description: string;
  status: BuyerIssueStatus;
  reportedAt: string;
  sellerOwner: string;
  expectedCompletion?: string;
  resolvedAt?: string;
}

const sellerStatusMeta: Record<BuyerChecklistItem["sellerStatus"], { label: string; tone: string }> = {
  scheduled: {
    label: "พร้อมให้ตรวจ",
    tone: "bg-blue-100 text-blue-700 border-blue-200",
  },
  fixing: {
    label: "ผู้ขายกำลังแก้",
    tone: "bg-amber-100 text-amber-700 border-amber-200",
  },
  done: {
    label: "ผู้ขายยืนยันแล้ว",
    tone: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
};

const buyerStatusMeta: Record<BuyerChecklistItem["buyerStatus"], { label: string; tone: string; description: string }> = {
  pending: {
    label: "รอตรวจ",
    tone: "bg-slate-100 text-slate-700 border-slate-200",
    description: "ยังไม่ได้ตรวจหรือบันทึกผล",
  },
  accepted: {
    label: "ผ่าน",
    tone: "bg-emerald-100 text-emerald-700 border-emerald-200",
    description: "ยืนยันว่าเรียบร้อย",
  },
  "follow-up": {
    label: "ขอตรวจซ้ำ",
    tone: "bg-purple-100 text-purple-700 border-purple-200",
    description: "ต้องการให้ผู้ขายปรับปรุงเพิ่ม",
  },
};

const issueStatusMeta: Record<BuyerIssueStatus, { label: string; tone: string }> = {
  pending: {
    label: "รอตรวจสอบ",
    tone: "bg-amber-100 text-amber-700 border-amber-200",
  },
  "in-progress": {
    label: "ผู้ขายกำลังแก้",
    tone: "bg-blue-100 text-blue-700 border-blue-200",
  },
  resolved: {
    label: "ตรวจแล้วเรียบร้อย",
    tone: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
};

const initialPlan = {
  sellerDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  location: "โครงการ Dream Ville บางนา",
  sellerContact: "คุณฟ้า (ตัวแทนผู้ขาย)",
};

const initialChecklist: BuyerChecklistItem[] = [
  {
    id: "structure",
    title: "ตรวจโครงสร้างและผนัง",
    description: "เช็คผิวผนัง รอยแตกร้าว และการปรับระดับพื้น",
    sellerStatus: "scheduled",
    buyerStatus: "pending",
    lastUpdatedAt: new Date().toISOString(),
  },
  {
    id: "plumbing",
    title: "ระบบน้ำและสุขภัณฑ์",
    description: "เปิดวาล์ว ทดสอบแรงดันน้ำ และดูการรั่วซึม",
    sellerStatus: "fixing",
    buyerStatus: "follow-up",
    lastUpdatedAt: new Date().toISOString(),
  },
  {
    id: "electrical",
    title: "ระบบไฟฟ้าและสวิตช์",
    description: "ตรวจปลั๊ก แสงสว่าง และเบรกเกอร์",
    sellerStatus: "done",
    buyerStatus: "accepted",
    lastUpdatedAt: new Date().toISOString(),
  },
];

const initialIssues: BuyerIssue[] = [
  {
    id: "kitchen-cabinet",
    title: "บานตู้ครัวปิดไม่สนิท",
    location: "ห้องครัว",
    description: "ขอให้ผู้ขายปรับบานพับเพื่อให้ปิดสนิท",
    status: "in-progress",
    reportedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    sellerOwner: "ทีมช่างผู้ขาย",
    expectedCompletion: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "bathroom-silicone",
    title: "ยาแนวห้องน้ำหลุด",
    location: "ห้องน้ำชั้นบน",
    description: "ต้องการให้เก็บซิลิโคนรอบอ่างอาบน้ำใหม่",
    status: "pending",
    reportedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    sellerOwner: "Foreman คุณเอ็ม",
  },
];

export default function BuyerHomeInspectionPage() {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [preferredDate, setPreferredDate] = useState<string>(() => initialPlan.sellerDate.slice(0, 10));
  const [buyerNote, setBuyerNote] = useState<string>("");
  const [checklistItems, setChecklistItems] = useState<BuyerChecklistItem[]>(initialChecklist);
  const [issues, setIssues] = useState<BuyerIssue[]>(initialIssues);
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [newChecklistDescription, setNewChecklistDescription] = useState("");
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportTitle, setReportTitle] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [reportLocation, setReportLocation] = useState("");
  const [reportExpectedDate, setReportExpectedDate] = useState("");

  const confirmedDateLabel = useMemo(() => {
    try {
      return format(parseISO(`${preferredDate}T09:00:00`), "d MMM yyyy");
    } catch {
      return preferredDate;
    }
  }, [preferredDate]);

  const sellerDateLabel = useMemo(() => {
    return format(parseISO(initialPlan.sellerDate), "d MMM yyyy");
  }, []);

  const displayDateLabel = confirmedDateLabel || sellerDateLabel;

  const overviewStats = useMemo(() => {
    const total = checklistItems.length;
    const accepted = checklistItems.filter((item) => item.buyerStatus === "accepted").length;
    const followUp = checklistItems.filter((item) => item.buyerStatus === "follow-up").length;
    return {
      total,
      accepted,
      followUp,
      completion: total > 0 ? Math.round((accepted / total) * 100) : 0,
    };
  }, [checklistItems]);

  const timelineEvents = useMemo(() => {
    const buyerDateIso = preferredDate
      ? new Date(`${preferredDate}T09:00:00`).toISOString()
      : initialPlan.sellerDate;

    const events: { id: string; title: string; description: string; date: string; tone: string }[] = [
      {
        id: "seller-proposed",
        title: "ผู้ขายเสนอวันส่งมอบ",
        description: format(parseISO(initialPlan.sellerDate), "EEEE d MMMM yyyy"),
        date: initialPlan.sellerDate,
        tone: "border-blue-200 bg-blue-50",
      },
      {
        id: "buyer-confirm",
        title: "ผู้ซื้อเลือกวันที่สะดวก",
        description: confirmedDateLabel
          ? `ตรวจเช้าตามที่สะดวก (${confirmedDateLabel})`
          : "รอผู้ซื้อยืนยันเวลาที่สะดวก",
        date: buyerDateIso,
        tone: "border-emerald-200 bg-emerald-50",
      },
    ];

    issues.forEach((issue) => {
      events.push({
        id: `${issue.id}-reported`,
        title: `รายงานปัญหา: ${issue.title}`,
        description: issue.location,
        date: issue.reportedAt,
        tone: "border-amber-200 bg-amber-50",
      });

      if (issue.expectedCompletion) {
        events.push({
          id: `${issue.id}-due`,
          title: `กำหนดแก้ไขโดย ${issue.sellerOwner}`,
          description: format(parseISO(issue.expectedCompletion), "d MMM yyyy"),
          date: issue.expectedCompletion,
          tone: "border-purple-200 bg-purple-50",
        });
      }

      if (issue.resolvedAt) {
        events.push({
          id: `${issue.id}-resolved`,
          title: `ปิดงาน: ${issue.title}`,
          description: format(parseISO(issue.resolvedAt), "d MMM yyyy"),
          date: issue.resolvedAt,
          tone: "border-emerald-200 bg-emerald-50",
        });
      }
    });

    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [issues, preferredDate, confirmedDateLabel]);

  const handleUpdateBuyerStatus = (id: string, status: BuyerChecklistItem["buyerStatus"]) => {
    setChecklistItems((items) =>
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              buyerStatus: status,
              lastUpdatedAt: new Date().toISOString(),
            }
          : item,
      ),
    );
  };

  const handleAddChecklistItem = () => {
    if (!newChecklistTitle.trim()) return;

    const newItem: BuyerChecklistItem = {
      id: `custom-${Date.now()}`,
      title: newChecklistTitle.trim(),
      description: newChecklistDescription.trim() || "ระบุรายละเอียดสิ่งที่ต้องการตรวจ",
      sellerStatus: "scheduled",
      buyerStatus: "pending",
      lastUpdatedAt: new Date().toISOString(),
    };

    setChecklistItems((items) => [newItem, ...items]);
    setNewChecklistTitle("");
    setNewChecklistDescription("");
  };

  const handleSubmitIssue = () => {
    if (!reportTitle.trim() || !reportLocation.trim()) {
      return;
    }

    const issue: BuyerIssue = {
      id: `issue-${Date.now()}`,
      title: reportTitle.trim(),
      location: reportLocation.trim(),
      description: reportDescription.trim() || "",
      status: "pending",
      reportedAt: new Date().toISOString(),
      sellerOwner: "รอผู้ขายมอบหมาย",
      expectedCompletion: reportExpectedDate ? `${reportExpectedDate}T09:00:00` : undefined,
    };

    setIssues((current) => [issue, ...current]);
    setReportDialogOpen(false);
    setReportTitle("");
    setReportDescription("");
    setReportLocation("");
    setReportExpectedDate("");
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-4 rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
              <ClipboardList className="h-4 w-4" />
              ขั้นตอนตรวจรับบ้าน (ผู้ซื้อ)
            </div>
            <Badge className="rounded-full border border-indigo-200 bg-indigo-50 text-[10px] font-semibold tracking-wide text-indigo-700">
              Demo Preview
            </Badge>
          </div>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3 lg:max-w-2xl">
              <h1 className="text-3xl font-semibold text-slate-900">เตรียมตรวจรับบ้านร่วมกับผู้ขายอย่างมั่นใจ</h1>
              <p className="text-sm text-slate-600 sm:text-base">
                หน้านี้จำลองประสบการณ์ของผู้ซื้อที่สามารถเลือกวันนัดหมาย ตรวจรายการเช็คร่วมกับผู้ขาย และรายงานปัญหาเพื่อติดตามกับทีมผู้ขายได้แบบเรียลไทม์
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                DreamHome จะบันทึกการเปลี่ยนแปลงทั้งหมดไว้ในไทม์ไลน์ร่วมกัน
              </div>
              <div className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-xs font-medium text-slate-600">
                <Sparkles className="h-4 w-4 text-indigo-500" />
                เหมาะสำหรับใช้เป็น Demo โชว์ลูกค้าและผู้มีส่วนเกี่ยวข้อง
              </div>
            </div>
            <Card className="w-full max-w-sm border-none bg-slate-900 text-slate-50 shadow-lg">
              <CardHeader className="space-y-2">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <CalendarIcon className="h-5 w-5 text-indigo-300" />
                  วันที่ผู้ซื้อเลือกไว้
                </CardTitle>
                <CardDescription className="text-sm text-slate-300">
                  {displayDateLabel} • {initialPlan.location}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-slate-400">ผู้ขายติดต่อ</p>
                  <p className="font-medium text-slate-100">{initialPlan.sellerContact}</p>
                </div>
                <div className="rounded-2xl bg-slate-800/70 p-3">
                  <p className="text-xs text-slate-300">โน้ตถึงผู้ขาย</p>
                  <Textarea
                    value={buyerNote}
                    onChange={(event) => setBuyerNote(event.target.value)}
                    placeholder="ระบุสิ่งที่ต้องเตรียมหรือคำถามเพิ่มเติม"
                    className="mt-2 min-h-[72px] border-none bg-transparent text-slate-100 placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="preferred-date" className="text-xs text-slate-300">
                    ปรับวันที่สะดวก
                  </Label>
                  <Input
                    id="preferred-date"
                    type="date"
                    value={preferredDate}
                    onChange={(event) => setPreferredDate(event.target.value)}
                    className="border-none bg-slate-800 text-slate-100"
                  />
                  <p className="text-xs text-slate-400">วันที่ผู้ขายเสนอ: {sellerDateLabel}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex w-full flex-wrap justify-start gap-2 bg-transparent p-0">
            <TabsTrigger value="overview" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium data-[state=active]:border-indigo-600 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
              <CalendarIcon className="mr-2 h-4 w-4" /> ภาพรวม
            </TabsTrigger>
            <TabsTrigger value="checklist" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium data-[state=active]:border-emerald-600 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <ClipboardCheck className="mr-2 h-4 w-4" /> เช็คลิสต์ร่วมกัน
            </TabsTrigger>
            <TabsTrigger value="issues" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium data-[state=active]:border-purple-600 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <Wrench className="mr-2 h-4 w-4" /> ปัญหา / แจ้งซ่อม
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="border-none bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    สถานะการตรวจของผู้ซื้อ
                  </CardTitle>
                  <CardDescription className="text-sm text-slate-600">
                    ตรวจแล้ว {overviewStats.accepted} รายการ • ขอแก้เพิ่ม {overviewStats.followUp} รายการ
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="h-2 w-full rounded-full bg-slate-200">
                    <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${overviewStats.completion}%` }} />
                  </div>
                  <p className="text-xs text-slate-500">รวม {overviewStats.total} รายการในเช็คลิสต์</p>
                  <Button asChild variant="outline" className="w-fit border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                    <Link href="#checklist">ไปที่รายการตรวจ</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-none bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
                    <MessageCircle className="h-5 w-5 text-indigo-500" />
                    ติดต่อผู้ขายได้รวดเร็ว
                  </CardTitle>
                  <CardDescription className="text-sm text-slate-600">
                    บันทึกสิ่งที่ต้องเตรียมและให้ DreamHome แจ้งเตือนผ่านแชทได้ทันที
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <Compass className="h-4 w-4 text-slate-500" />
                    {initialPlan.location}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-500" />
                    เวลาแนะนำ 09:00 - 11:00 น.
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-slate-500" />
                    DreamHome Sync กับฝั่งผู้ขายอัตโนมัติ
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-none bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
                  <CalendarIcon className="h-5 w-5 text-indigo-500" />
                  ไทม์ไลน์ล่าสุด
                </CardTitle>
                <CardDescription className="text-sm text-slate-600">
                  ดูเหตุการณ์สำคัญที่ผู้ซื้อและผู้ขายทำร่วมกัน
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {timelineEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`flex flex-col gap-1 rounded-2xl border p-4 text-sm text-slate-700 ${event.tone}`}
                  >
                    <p className="font-semibold text-slate-900">{event.title}</p>
                    <p>{event.description}</p>
                    <p className="text-xs text-slate-500">{format(parseISO(event.date), "d MMM yyyy")}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="checklist" className="space-y-6" id="checklist">
            <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
              <div className="space-y-4">
                {checklistItems.map((item) => (
                  <Card key={item.id} className="border border-slate-200 bg-white shadow-sm">
                    <CardHeader className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <CardTitle className="text-base font-semibold text-slate-900">{item.title}</CardTitle>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={`rounded-full border px-3 py-1 text-[10px] font-semibold ${sellerStatusMeta[item.sellerStatus].tone}`}>
                            {sellerStatusMeta[item.sellerStatus].label}
                          </Badge>
                          <Badge className={`rounded-full border px-3 py-1 text-[10px] font-semibold ${buyerStatusMeta[item.buyerStatus].tone}`}>
                            {buyerStatusMeta[item.buyerStatus].label}
                          </Badge>
                        </div>
                      </div>
                      <CardDescription className="text-sm text-slate-600">{item.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-xs text-slate-500">อัปเดตล่าสุด {format(parseISO(item.lastUpdatedAt), "d MMM yyyy HH:mm")}</p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant={item.buyerStatus === "accepted" ? "default" : "outline"}
                          className={item.buyerStatus === "accepted" ? "bg-emerald-600 text-white hover:bg-emerald-700" : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"}
                          onClick={() => handleUpdateBuyerStatus(item.id, "accepted")}
                        >
                          ยืนยันผ่านแล้ว
                        </Button>
                        <Button
                          size="sm"
                          variant={item.buyerStatus === "follow-up" ? "default" : "outline"}
                          className={item.buyerStatus === "follow-up" ? "bg-purple-600 text-white hover:bg-purple-700" : "border-purple-200 text-purple-700 hover:bg-purple-50"}
                          onClick={() => handleUpdateBuyerStatus(item.id, "follow-up")}
                        >
                          ขอให้แก้ไขเพิ่ม
                        </Button>
                        <Button
                          size="sm"
                          variant={item.buyerStatus === "pending" ? "default" : "outline"}
                          className={item.buyerStatus === "pending" ? "bg-slate-600 text-white hover:bg-slate-700" : "border-slate-200 text-slate-700 hover:bg-slate-50"}
                          onClick={() => handleUpdateBuyerStatus(item.id, "pending")}
                        >
                          ยังไม่ได้ตรวจ
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Card className="h-fit border border-dashed border-indigo-200 bg-indigo-50 shadow-none">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base font-semibold text-indigo-900">
                    <ClipboardCheck className="h-5 w-5" />
                    เพิ่มรายการที่อยากตรวจเพิ่ม
                  </CardTitle>
                  <CardDescription className="text-sm text-indigo-700">
                    ผู้ซื้อสามารถเพิ่มรายการใหม่เพื่อให้ผู้ขายช่วยเตรียมได้
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-checklist-title" className="text-xs font-semibold text-indigo-800">
                      หัวข้อรายการ
                    </Label>
                    <Input
                      id="new-checklist-title"
                      placeholder="เช่น ตรวจความเรียบร้อยของสวนหน้าบ้าน"
                      value={newChecklistTitle}
                      onChange={(event) => setNewChecklistTitle(event.target.value)}
                      className="border-indigo-200 bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-checklist-description" className="text-xs font-semibold text-indigo-800">
                      รายละเอียด (ไม่บังคับ)
                    </Label>
                    <Textarea
                      id="new-checklist-description"
                      placeholder="อธิบายเพิ่มเติมว่าคาดหวังอะไร"
                      value={newChecklistDescription}
                      onChange={(event) => setNewChecklistDescription(event.target.value)}
                      className="border-indigo-200 bg-white"
                    />
                  </div>
                  <Button onClick={handleAddChecklistItem} className="w-full bg-indigo-600 text-white hover:bg-indigo-700">
                    เพิ่มเข้าเช็คลิสต์
                  </Button>
                  <p className="text-xs text-indigo-700/80">
                    รายการที่เพิ่มจะซิงก์ไปให้ผู้ขายดูผ่าน DreamHome เช่นเดียวกัน
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="issues" className="space-y-6">
            <div className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-slate-900">แจ้งปัญหาเพิ่มเติม</h2>
                <p className="text-sm text-slate-600">
                  บันทึกสิ่งที่พบระหว่างการตรวจรับ ผู้ขายจะเห็นและอัปเดตสถานะได้ทันที
                </p>
              </div>
              <Button onClick={() => setReportDialogOpen(true)} className="bg-purple-600 text-white hover:bg-purple-700">
                <AlertCircle className="mr-2 h-4 w-4" /> สร้างรายการซ่อม
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {issues.map((issue) => (
                <Card key={issue.id} className="border border-slate-200 bg-white shadow-sm">
                  <CardHeader className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <CardTitle className="text-base font-semibold text-slate-900">{issue.title}</CardTitle>
                      <Badge className={`rounded-full border px-3 py-1 text-[10px] font-semibold ${issueStatusMeta[issue.status].tone}`}>
                        {issueStatusMeta[issue.status].label}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm text-slate-600">{issue.location}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-slate-600">
                    <p>{issue.description}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span>รายงานเมื่อ {format(parseISO(issue.reportedAt), "d MMM yyyy")}</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600">
                        <ShieldCheck className="h-3 w-3" />
                        {issue.sellerOwner}
                      </span>
                    </div>
                    {issue.expectedCompletion && (
                      <p className="text-xs text-slate-500">
                        กำหนดเสร็จ: {format(parseISO(issue.expectedCompletion), "d MMM yyyy")}
                      </p>
                    )}
                    {issue.resolvedAt && (
                      <p className="text-xs text-emerald-600">
                        ปิดงานเมื่อ {format(parseISO(issue.resolvedAt), "d MMM yyyy")}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <AlertCircle className="h-5 w-5 text-purple-600" />
              แจ้งปัญหาใหม่ (Demo)
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="issue-title" className="text-xs font-semibold text-slate-700">
                หัวข้อปัญหา
              </Label>
              <Input
                id="issue-title"
                value={reportTitle}
                onChange={(event) => setReportTitle(event.target.value)}
                placeholder="เช่น พื้นไม้มีรอยขีด"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="issue-location" className="text-xs font-semibold text-slate-700">
                ตำแหน่งที่พบ
              </Label>
              <Input
                id="issue-location"
                value={reportLocation}
                onChange={(event) => setReportLocation(event.target.value)}
                placeholder="ระบุห้องหรือบริเวณ"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="issue-description" className="text-xs font-semibold text-slate-700">
                รายละเอียดเพิ่มเติม
              </Label>
              <Textarea
                id="issue-description"
                value={reportDescription}
                onChange={(event) => setReportDescription(event.target.value)}
                placeholder="อธิบายลักษณะปัญหา หรือแนบรายละเอียดที่อยากแจ้ง"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="issue-expected-date" className="text-xs font-semibold text-slate-700">
                อยากให้แก้เสร็จภายใน (ไม่บังคับ)
              </Label>
              <Input
                id="issue-expected-date"
                type="date"
                value={reportExpectedDate}
                onChange={(event) => setReportExpectedDate(event.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setReportDialogOpen(false)}>
                ยกเลิก
              </Button>
              <Button onClick={handleSubmitIssue} className="bg-purple-600 text-white hover:bg-purple-700">
                บันทึกปัญหา
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
