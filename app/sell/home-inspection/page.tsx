"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import {
  AlertCircle,
  Calendar as CalendarIcon,
  Check,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Home,
  Images as ImagesIcon,
  MessageCircle,
  Plus,
  ShieldCheck,
  Wrench,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface InspectionChecklistItem {
  id: string;
  title: string;
  description: string;
  status: "pending" | "passed" | "issue";
  createdBy: "buyer" | "seller";
  lastUpdatedAt: string;
}

interface DefectIssue {
  id: string;
  title: string;
  location: string;
  description: string;
  status: DefectStatus;
  reportedBy: "buyer" | "seller";
  reportedAt: string;
  expectedCompletion?: string;
  resolvedAt?: string;
  attachments?: number;
}

type DefectStatus = "pending" | "in-progress" | "verified" | "completed";

const defectStatusMeta: Record<DefectStatus, { label: string; badgeClass: string; progressColor: string }> = {
  pending: {
    label: "รอดำเนินการ",
    badgeClass: "bg-amber-100 text-amber-700 border border-amber-200",
    progressColor: "bg-amber-500",
  },
  "in-progress": {
    label: "กำลังแก้ไข",
    badgeClass: "bg-blue-100 text-blue-700 border border-blue-200",
    progressColor: "bg-blue-500",
  },
  verified: {
    label: "รอตรวจสอบ",
    badgeClass: "bg-purple-100 text-purple-700 border border-purple-200",
    progressColor: "bg-purple-500",
  },
  completed: {
    label: "แก้ไขเสร็จ",
    badgeClass: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    progressColor: "bg-emerald-500",
  },
};

const initialChecklist: InspectionChecklistItem[] = [
  {
    id: "exterior",
    title: "ตรวจรอบนอกอาคาร",
    description: "ผนังภายนอก สี และรอยแตกร้าว",
    status: "pending",
    createdBy: "seller",
    lastUpdatedAt: new Date().toISOString(),
  },
  {
    id: "plumbing",
    title: "ระบบน้ำและท่อ",
    description: "แรงดันน้ำ การรั่วซึม และสุขภัณฑ์",
    status: "pending",
    createdBy: "buyer",
    lastUpdatedAt: new Date().toISOString(),
  },
  {
    id: "electric",
    title: "ระบบไฟฟ้า",
    description: "สวิตช์ ปลั๊กไฟ และตู้ควบคุม",
    status: "pending",
    createdBy: "seller",
    lastUpdatedAt: new Date().toISOString(),
  },
];

const initialIssues: DefectIssue[] = [
  {
    id: "kitchen-faucet",
    title: "ก็อกน้ำห้องครัวหยด",
    location: "ห้องครัว",
    description: "น้ำหยดจากหัวก็อกครัวตลอดเวลา",
    status: "in-progress",
    reportedBy: "buyer",
    reportedAt: new Date().toISOString(),
    expectedCompletion: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    attachments: 2,
  },
  {
    id: "bathroom-tile",
    title: "กระเบื้องห้องน้ำร้าว",
    location: "ห้องน้ำชั้นบน",
    description: "รอยร้าวยาว 10 ซม. บริเวณพื้น",
    status: "pending",
    reportedBy: "buyer",
    reportedAt: new Date().toISOString(),
    expectedCompletion: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    attachments: 1,
  },
];

export default function SellerHomeInspectionPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("schedule");
  const [handoverDate, setHandoverDate] = useState<string>("");
  const [handoverNote, setHandoverNote] = useState<string>("");
  const [checklistItems, setChecklistItems] = useState<InspectionChecklistItem[]>(initialChecklist);
  const [issues, setIssues] = useState<DefectIssue[]>(initialIssues);
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [newChecklistDescription, setNewChecklistDescription] = useState("");
  const [newChecklistOwner, setNewChecklistOwner] = useState<"buyer" | "seller">("buyer");
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportSourceId, setReportSourceId] = useState<string | null>(null);
  const [reportTitle, setReportTitle] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [reportLocation, setReportLocation] = useState("");
  const [reportExpectedDate, setReportExpectedDate] = useState("");
  const [reportBy, setReportBy] = useState<"buyer" | "seller">("buyer");

  const handoverConfirmed = Boolean(handoverDate);

  const handleConfirmHandover = () => {
    if (!handoverDate) {
      toast({
        variant: "destructive",
        title: "กรุณาระบุวันที่ส่งมอบบ้าน",
        description: "เลือกวันที่คาดว่าจะส่งมอบบ้านเพื่อแจ้งให้ผู้เกี่ยวข้องทราบ",
      });
      return;
    }

    toast({
      title: "บันทึกวันส่งมอบเรียบร้อย",
      description: "ระบบได้แจ้งเตือนวันส่งมอบในแชทของทีมงานแล้ว",
    });

    setActiveTab("inspection");

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("dreamhome:open-chat", {
          detail: {
            systemMessage: `ผู้ขายยืนยันวันส่งมอบบ้านเป็นวันที่ ${format(parseISO(handoverDate), "d MMM yyyy")}`,
          },
        }),
      );
    }
  };

  const handleAddChecklistItem = () => {
    if (!newChecklistTitle.trim()) {
      toast({
        variant: "destructive",
        title: "กรุณากรอกหัวข้อ",
        description: "ระบุหัวข้อรายการตรวจเช็คก่อนบันทึก",
      });
      return;
    }

    const item: InspectionChecklistItem = {
      id: `${Date.now()}`,
      title: newChecklistTitle.trim(),
      description: newChecklistDescription.trim(),
      createdBy: newChecklistOwner,
      status: "pending",
      lastUpdatedAt: new Date().toISOString(),
    };

    setChecklistItems((prev) => [item, ...prev]);
    setNewChecklistTitle("");
    setNewChecklistDescription("");
    toast({
      title: "เพิ่มรายการตรวจเช็คแล้ว",
      description: `${item.createdBy === "buyer" ? "ผู้ซื้อ" : "ผู้ขาย"} เป็นผู้เพิ่มรายการนี้`,
    });
  };

  const handleChecklistStatus = (id: string, status: "passed" | "issue") => {
    setChecklistItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status, lastUpdatedAt: new Date().toISOString() }
          : item,
      ),
    );

    if (status === "passed") {
      toast({
        title: "บันทึกผลตรวจเช็ค",
        description: "รายการนี้ผ่านการตรวจเช็คเรียบร้อย",
      });
    } else {
      const source = checklistItems.find((item) => item.id === id);
      setReportSourceId(id);
      setReportTitle(source ? source.title : "");
      setReportDescription(source ? source.description : "");
      setReportLocation("");
      setReportExpectedDate("");
      setReportBy("buyer");
      setReportDialogOpen(true);
    }
  };

  const handleOpenReport = () => {
    setReportSourceId(null);
    setReportTitle("");
    setReportDescription("");
    setReportLocation("");
    setReportExpectedDate("");
    setReportBy("buyer");
    setReportDialogOpen(true);
  };

  const handleSubmitReport = () => {
    if (!reportTitle.trim()) {
      toast({
        variant: "destructive",
        title: "กรุณาระบุหัวข้อปัญหา",
        description: "ใส่หัวข้อสั้น ๆ เพื่อให้ทีมงานเข้าใจประเด็นที่พบ",
      });
      return;
    }

    const newIssue: DefectIssue = {
      id: `${Date.now()}`,
      title: reportTitle.trim(),
      description: reportDescription.trim() || "-",
      location: reportLocation.trim() || "ไม่ระบุ",
      status: "pending",
      reportedBy: reportBy,
      reportedAt: new Date().toISOString(),
      expectedCompletion: reportExpectedDate ? parseISO(reportExpectedDate).toISOString() : undefined,
      attachments: 0,
    };

    setIssues((prev) => [newIssue, ...prev]);

    if (reportSourceId) {
      setChecklistItems((prev) =>
        prev.map((item) =>
          item.id === reportSourceId
            ? { ...item, status: "issue", lastUpdatedAt: new Date().toISOString() }
            : item,
        ),
      );
    }

    setReportDialogOpen(false);
    toast({
      title: "ส่งรายงานปัญหาแล้ว",
      description: "ระบบได้สร้างบัตรติดตามใน Defect Tracking ให้เรียบร้อย",
    });
  };

  const handleIssueStatusChange = (id: string, status: DefectStatus) => {
    setIssues((prev) =>
      prev.map((issue) =>
        issue.id === id
          ? {
              ...issue,
              status,
              resolvedAt:
                status === "completed" ? new Date().toISOString() : issue.resolvedAt,
            }
          : issue,
      ),
    );

    toast({
      title: "อัปเดตสถานะปัญหา",
      description: `ตั้งสถานะเป็น ${defectStatusMeta[status].label} แล้ว`,
    });
  };

  const overallProgress = useMemo(() => {
    if (issues.length === 0) return 100;
    const completed = issues.filter((issue) => issue.status === "completed").length;
    return Math.round((completed / issues.length) * 100);
  }, [issues.length, issues]);

  const issueStatusCounts = useMemo(
    () =>
      issues.reduce(
        (acc, issue) => {
          acc[issue.status] += 1;
          return acc;
        },
        {
          pending: 0,
          "in-progress": 0,
          verified: 0,
          completed: 0,
        } as Record<DefectStatus, number>,
      ),
    [issues],
  );

  const calendarEvents = useMemo(() => {
    const events: { id: string; title: string; date: string; type: "handover" | "report" | "resolved" }[] = [];

    if (handoverDate) {
      events.push({
        id: "handover",
        title: "วันส่งมอบบ้าน",
        date: handoverDate,
        type: "handover",
      });
    }

    issues.forEach((issue) => {
      events.push({
        id: `${issue.id}-reported`,
        title: `แจ้งปัญหา: ${issue.title}`,
        date: issue.reportedAt,
        type: "report",
      });

      if (issue.resolvedAt) {
        events.push({
          id: `${issue.id}-resolved`,
          title: `แก้ไขเสร็จ: ${issue.title}`,
          date: issue.resolvedAt,
          type: "resolved",
        });
      }
    });

    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [handoverDate, issues]);

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                <Home className="h-4 w-4" />
                ขั้นตอนส่งมอบบ้าน (ผู้ขาย)
              </div>
              <Badge className="rounded-full border border-blue-200 bg-blue-50 text-[10px] font-semibold tracking-wide text-blue-700">
                Demo Flow
              </Badge>
            </div>
            <h1 className="text-3xl font-semibold text-gray-900">
              กำหนดวันส่งมอบและตรวจเช็คสภาพบ้าน
            </h1>
            <p className="max-w-2xl text-sm text-gray-600">
              เมื่อยืนยันวันส่งมอบแล้ว ระบบจะพาคุณไปยังรายการตรวจเช็คสภาพบ้านเพื่อให้ผู้ซื้อและผู้ขายร่วมกันตรวจสอบ พร้อมรายงานปัญหาและติดตามความคืบหน้าได้ทันที
            </p>
            {handoverConfirmed && (
              <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                ยืนยันวันส่งมอบแล้ว: {format(parseISO(handoverDate), "d MMM yyyy")}
              </div>
            )}
          </div>
          <div className="flex flex-col items-start gap-2 rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              ภาพรวม Defect
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">{overallProgress}%</span>
              <span className="text-sm text-gray-500">ปัญหาแก้ไขแล้ว</span>
            </div>
            <div className="h-2 w-40 rounded-full bg-slate-200">
              <div
                className="h-2 rounded-full bg-emerald-500 transition-all"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">
              รวม {issues.length} ประเด็นที่ต้องติดตาม
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex w-full flex-wrap justify-start gap-2 bg-transparent p-0">
            <TabsTrigger value="schedule" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium data-[state=active]:border-blue-600 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <CalendarIcon className="mr-2 h-4 w-4" /> นัดหมายส่งมอบ
            </TabsTrigger>
            <TabsTrigger value="inspection" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium data-[state=active]:border-emerald-600 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <ClipboardCheck className="mr-2 h-4 w-4" /> ตรวจสภาพบ้าน
            </TabsTrigger>
            <TabsTrigger value="defects" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium data-[state=active]:border-purple-600 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <Wrench className="mr-2 h-4 w-4" /> Defect Tracking
            </TabsTrigger>
          </TabsList>

          <TabsContent value="schedule" className="space-y-6">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-semibold text-gray-900">
                  <CalendarIcon className="h-5 w-5 text-blue-500" />
                  ยืนยันวันส่งมอบบ้าน
                </CardTitle>
                <CardDescription className="text-sm text-gray-600">
                  เลือกวันที่คาดว่าจะส่งมอบบ้าน เพื่อให้ผู้ซื้อและทีมงานเตรียมความพร้อม รวมถึงสามารถแก้ไขภายหลังได้ตามสถานการณ์จริง
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-3">
                  <Label htmlFor="handover-date" className="text-sm font-medium text-gray-700">
                    วันที่ส่งมอบ (โดยประมาณ)
                  </Label>
                  <Input
                    id="handover-date"
                    type="date"
                    value={handoverDate}
                    onChange={(event) => setHandoverDate(event.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                  />
                  <p className="text-xs text-gray-500">
                    สามารถแก้ไขวันที่ภายหลังได้ หากมีการเปลี่ยนแปลงจากผู้พัฒนาโครงการหรือทีมงาน
                  </p>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="handover-note" className="text-sm font-medium text-gray-700">
                    รายละเอียดเพิ่มเติม (ถ้ามี)
                  </Label>
                  <Textarea
                    id="handover-note"
                    rows={4}
                    placeholder="เช่น ต้องการให้ผู้ซื้อเตรียมบัตรประชาชนตัวจริง หรือ นัดหมายช่วงเวลาเช้า"
                    value={handoverNote}
                    onChange={(event) => setHandoverNote(event.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col justify-between gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:items-center">
                <div className="text-sm text-gray-600">
                  เมื่อกดยืนยัน ระบบจะส่งการแจ้งเตือนในแชท และสามารถย้อนกลับมาแก้ไขได้ทุกเมื่อ
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button className="bg-blue-600 text-white hover:bg-blue-700" onClick={handleConfirmHandover}>
                    {handoverConfirmed ? "อัปเดตวันส่งมอบ" : "ยืนยันวันส่งมอบ"}
                  </Button>
                  {handoverConfirmed && (
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab("inspection")}
                      className="border-blue-200 text-blue-600 hover:bg-blue-50"
                    >
                      ไปยังรายการตรวจเช็ค
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>

            <Card className="border-none bg-blue-50/70 shadow-none">
              <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 text-sm text-blue-700">
                  <MessageCircle className="h-5 w-5" />
                  ระบบจะสร้างข้อความแจ้งเตือนในแชทระหว่างผู้ซื้อและผู้ขายทันทีเมื่อยืนยันวันส่งมอบ
                </div>
                <Link href="/buy/send-documents" className="text-xs text-blue-700 underline">
                  ดูตัวอย่างข้อความในแชท
                </Link>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inspection" className="space-y-6">
            <Card className="border-none shadow-sm">
              <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl font-semibold text-gray-900">
                    <ClipboardList className="h-5 w-5 text-emerald-500" />
                    รายการตรวจเช็คสภาพบ้าน
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-600">
                    ผู้ซื้อและผู้ขายสามารถเพิ่มรายการเพิ่มเติมได้ เพื่อให้ครอบคลุมรายละเอียดทุกจุด
                  </CardDescription>
                </div>
                <Button onClick={handleOpenReport} variant="outline" className="border-rose-200 text-rose-600 hover:bg-rose-50">
                  <AlertCircle className="mr-2 h-4 w-4" /> รายงานปัญหาอื่น ๆ
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/60 p-4 sm:grid-cols-4">
                  <div className="sm:col-span-2">
                    <Label htmlFor="new-checklist-title" className="text-sm font-semibold text-gray-700">
                      เพิ่มรายการตรวจเช็คใหม่
                    </Label>
                    <Input
                      id="new-checklist-title"
                      placeholder="หัวข้อรายการ เช่น ตรวจพื้นห้องนอน"
                      value={newChecklistTitle}
                      onChange={(event) => setNewChecklistTitle(event.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <Label htmlFor="new-checklist-owner" className="text-sm font-semibold text-gray-700">
                      ผู้เพิ่มรายการ
                    </Label>
                    <Select value={newChecklistOwner} onValueChange={(value: "buyer" | "seller") => setNewChecklistOwner(value)}>
                      <SelectTrigger id="new-checklist-owner">
                        <SelectValue placeholder="เลือกบทบาท" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="buyer">ผู้ซื้อ</SelectItem>
                        <SelectItem value="seller">ผู้ขาย</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-3">
                    <Label htmlFor="new-checklist-description" className="text-sm font-semibold text-gray-700">
                      รายละเอียดเพิ่มเติม (ถ้ามี)
                    </Label>
                    <Input
                      id="new-checklist-description"
                      placeholder="รายละเอียดเพิ่มเติมของจุดที่ต้องตรวจ"
                      value={newChecklistDescription}
                      onChange={(event) => setNewChecklistDescription(event.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button type="button" onClick={handleAddChecklistItem} className="w-full bg-emerald-600 text-white hover:bg-emerald-700">
                      <Plus className="mr-2 h-4 w-4" /> เพิ่มรายการ
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4">
                  {checklistItems.map((item) => (
                    <Card key={item.id} className="border border-slate-200">
                      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                              {item.createdBy === "buyer" ? "ผู้ซื้อเพิ่ม" : "ผู้ขายเพิ่ม"}
                            </span>
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                item.status === "pending"
                                  ? "bg-slate-100 text-slate-600"
                                  : item.status === "passed"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-rose-100 text-rose-700"
                              }`}
                            >
                              {item.status === "pending"
                                ? "รอตรวจเช็ค"
                                : item.status === "passed"
                                ? "ผ่านการตรวจ"
                                : "พบปัญหา"}
                            </span>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                          <p className="text-sm text-gray-600">
                            {item.description || "ไม่มีรายละเอียดเพิ่มเติม"}
                          </p>
                          <p className="text-xs text-gray-400">
                            อัปเดตล่าสุด {format(new Date(item.lastUpdatedAt), "d MMM yyyy HH:mm")}
                          </p>
                        </div>
                        <div className="flex flex-col items-stretch gap-2 sm:w-52">
                          <Button
                            variant="outline"
                            className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                            onClick={() => handleChecklistStatus(item.id, "passed")}
                          >
                            <Check className="mr-2 h-4 w-4" /> ผ่านการตรวจ
                          </Button>
                          <Button
                            variant="outline"
                            className="border-rose-200 text-rose-600 hover:bg-rose-50"
                            onClick={() => handleChecklistStatus(item.id, "issue")}
                          >
                            <AlertCircle className="mr-2 h-4 w-4" /> พบปัญหา
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="defects" className="space-y-6">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-semibold text-gray-900">
                  <ShieldCheck className="h-5 w-5 text-purple-500" />
                  Defect Tracking Progress
                </CardTitle>
                <CardDescription className="text-sm text-gray-600">
                  ติดตามความคืบหน้าการแก้ไขปัญหาจากการตรวจรับบ้านแบบเรียลไทม์ พร้อมอัปเดตสถานะให้ผู้เกี่ยวข้องรับทราบ
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Overall Progress
                      </p>
                      <p className="text-3xl font-bold text-gray-900">{overallProgress}%</p>
                    </div>
                    <div className="w-full sm:w-1/2">
                      <div className="h-3 w-full rounded-full bg-white shadow-inner">
                        <div
                          className="h-3 rounded-full bg-purple-500"
                          style={{ width: `${overallProgress}%` }}
                        />
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        ปัญหาที่แก้ไขสำเร็จ {issueStatusCounts.completed} จาก {issues.length} รายการ
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs text-gray-600 sm:w-64">
                      {Object.entries(issueStatusCounts).map(([status, count]) => (
                        <div
                          key={status}
                          className="flex items-center gap-2 rounded-xl border border-white/60 bg-white px-3 py-2"
                        >
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${defectStatusMeta[status as DefectStatus].progressColor}`}
                          />
                          <span className="font-medium text-gray-900">
                            {defectStatusMeta[status as DefectStatus].label}
                          </span>
                          <span>({count})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-5">
                  {issues.map((issue) => (
                    <Card key={issue.id} className="overflow-hidden border border-slate-200">
                      <CardHeader className="flex flex-col gap-3 bg-slate-50/80 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <CardTitle className="text-lg font-semibold text-gray-900">{issue.title}</CardTitle>
                          <CardDescription className="text-sm text-gray-600">{issue.description}</CardDescription>
                        </div>
                        <div className={`inline-flex items-center gap-2 rounded-full px-4 py-1 text-xs font-semibold ${defectStatusMeta[issue.status].badgeClass}`}>
                          <Clock className="h-4 w-4" />
                          {defectStatusMeta[issue.status].label}
                        </div>
                      </CardHeader>
                      <CardContent className="grid gap-4 p-5 sm:grid-cols-3">
                        <div className="space-y-2 text-sm text-gray-600">
                          <p className="font-semibold text-gray-900">รายละเอียด</p>
                          <p>ตำแหน่ง: {issue.location}</p>
                          <p>ผู้แจ้ง: {issue.reportedBy === "buyer" ? "ผู้ซื้อ" : "ผู้ขาย"}</p>
                          <p>วันที่แจ้ง: {format(new Date(issue.reportedAt), "d MMM yyyy")}</p>
                          {issue.expectedCompletion && (
                            <p>คาดว่าจะเสร็จ: {format(new Date(issue.expectedCompletion), "d MMM yyyy")}</p>
                          )}
                          {issue.resolvedAt && (
                            <p className="text-emerald-600">ปิดงานแล้ว: {format(new Date(issue.resolvedAt), "d MMM yyyy")}</p>
                          )}
                        </div>
                        <div className="space-y-2 text-sm text-gray-600">
                          <p className="font-semibold text-gray-900">หลักฐานแนบ</p>
                          <p>{issue.attachments ?? 0} ไฟล์ (รูป/วิดีโอ)</p>
                          <Button variant="outline" size="sm" className="mt-2 w-fit border-slate-200 text-slate-600 hover:bg-slate-100">
                            <ImagesIcon className="mr-2 h-4 w-4" /> ดูไฟล์แนบ
                          </Button>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor={`status-${issue.id}`} className="text-sm font-semibold text-gray-900">
                            อัปเดตสถานะโดยผู้ขาย
                          </Label>
                          <Select value={issue.status} onValueChange={(value: DefectStatus) => handleIssueStatusChange(issue.id, value)}>
                            <SelectTrigger id={`status-${issue.id}`} className="border-purple-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">รอดำเนินการ</SelectItem>
                              <SelectItem value="in-progress">กำลังแก้ไข</SelectItem>
                              <SelectItem value="verified">รอตรวจสอบ</SelectItem>
                              <SelectItem value="completed">แก้ไขเสร็จ</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card className="border border-slate-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                      <CalendarIcon className="h-5 w-5 text-purple-500" />
                      ปฏิทินการส่งมอบและแก้ไขปัญหา
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600">
                      แสดงไทม์ไลน์ของวันส่งมอบ การแจ้งปัญหา และวันที่แก้ไขสำเร็จ เพื่อวางแผนงานให้เป็นระบบ
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {calendarEvents.length === 0 ? (
                      <p className="text-sm text-gray-500">ยังไม่มีนัดหมายหรือการแจ้งปัญหาในระบบ</p>
                    ) : (
                      <div className="space-y-4">
                        {calendarEvents.map((event) => (
                          <div key={event.id} className="flex items-start gap-3">
                            <div
                              className={`mt-1 h-3 w-3 rounded-full ${
                                event.type === "handover"
                                  ? "bg-blue-500"
                                  : event.type === "report"
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                              }`}
                            />
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{event.title}</p>
                              <p className="text-xs text-gray-500">{format(new Date(event.date), "d MMM yyyy HH:mm")}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <AlertCircle className="h-5 w-5 text-rose-500" />
              รายงานปัญหาที่พบระหว่างตรวจรับบ้าน
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="report-title" className="text-sm font-medium text-gray-700">
                หัวข้อปัญหา
              </Label>
              <Input
                id="report-title"
                value={reportTitle}
                onChange={(event) => setReportTitle(event.target.value)}
                placeholder="เช่น ประตูห้องนอนปิดไม่สนิท"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-description" className="text-sm font-medium text-gray-700">
                รายละเอียดเพิ่มเติม
              </Label>
              <Textarea
                id="report-description"
                value={reportDescription}
                onChange={(event) => setReportDescription(event.target.value)}
                rows={3}
                placeholder="อธิบายลักษณะปัญหาเพื่อให้ทีมช่างเข้าใจตรงกัน"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="report-location" className="text-sm font-medium text-gray-700">
                  พื้นที่ที่พบปัญหา
                </Label>
                <Input
                  id="report-location"
                  value={reportLocation}
                  onChange={(event) => setReportLocation(event.target.value)}
                  placeholder="เช่น ห้องน้ำชั้น 2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="report-expected" className="text-sm font-medium text-gray-700">
                  คาดว่าจะเสร็จ (โดยประมาณ)
                </Label>
                <Input
                  id="report-expected"
                  type="date"
                  value={reportExpectedDate}
                  onChange={(event) => setReportExpectedDate(event.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-by" className="text-sm font-medium text-gray-700">
                ผู้รายงาน
              </Label>
              <Select value={reportBy} onValueChange={(value: "buyer" | "seller") => setReportBy(value)}>
                <SelectTrigger id="report-by">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buyer">ผู้ซื้อ</SelectItem>
                  <SelectItem value="seller">ผู้ขาย</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setReportDialogOpen(false)}>
                ยกเลิก
              </Button>
              <Button onClick={handleSubmitReport} className="bg-rose-600 text-white hover:bg-rose-700">
                ส่งรายงานปัญหา
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
