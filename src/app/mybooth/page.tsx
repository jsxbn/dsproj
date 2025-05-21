"use client";

import React, { useEffect, useState, FormEvent } from "react";
import { useSession } from "next-auth/react";
import type { Booth } from "@/app/utils/schemaTypes";
import { Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table";

const ADMIN_PASSWORD = "sachedule";

const dayOptions = [
  { label: "전야제", date: new Date("2024-10-31") },
  { label: "1일차", date: new Date("2024-11-01") },
  { label: "2일차", date: new Date("2024-11-02") },
  { label: "3일차", date: new Date("2024-11-03") },
];

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [booths, setBooths] = useState<Booth[]>([]);
  const [loading, setLoading] = useState(true);

  // create-dialog state
  const [open, setOpen] = useState(false);

  // form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [where, setWhere] = useState("");
  const [selectedDay, setSelectedDay] = useState(dayOptions[0].label);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [slotInterval, setSlotInterval] = useState<number>(15);
  const [capacity, setCapacity] = useState<number>(1);
  const [password, setPassword] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // fetch booths once authenticated
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/booths")
      .then((res) => res.json())
      .then((data: Booth[]) => setBooths(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-8 text-center">
        <p>로그인이 필요합니다.</p>
      </div>
    );
  }

  const userId = session.user?.id ?? "";
  const myBooths = booths.filter((b) => b.operatorId === userId);

  // application handlers
  const handleAccept = async (boothId: string, appId: string) => {
    try {
      const res = await fetch(`/api/applications/${appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAccepted: true }),
      });
      if (!res.ok) throw new Error(await res.text());
      setBooths((prev) =>
        prev.map((b) =>
          b.id !== boothId
            ? b
            : {
                ...b,
                applications: b.applications!.map((a) => (a.id === appId ? { ...a, isAccepted: true } : a)),
              }
        )
      );
    } catch (e: any) {
      alert("승인 중 오류: " + e.message);
    }
  };

  const handleReject = async (boothId: string, appId: string) => {
    if (!confirm("정말 거절하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/applications/${appId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(await res.text());
      setBooths((prev) =>
        prev.map((b) =>
          b.id !== boothId
            ? b
            : {
                ...b,
                applications: b.applications!.filter((a) => a.id !== appId),
              }
        )
      );
    } catch (e: any) {
      alert("거절 중 오류: " + e.message);
    }
  };

  // create booth handler
  const handleCreateBooth = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== ADMIN_PASSWORD) {
      alert("비밀번호가 올바르지 않습니다.");
      return;
    }
    setIsCreating(true);
    try {
      const dayObj = dayOptions.find((d) => d.label === selectedDay)!.date;
      const [sh, sm] = startTime.split(":").map(Number);
      const [eh, em] = endTime.split(":").map(Number);

      const startAtDate = new Date(dayObj);
      startAtDate.setHours(sh, sm);
      const endAtDate = new Date(dayObj);
      endAtDate.setHours(eh, em);

      const res = await fetch("/api/booths", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          where,
          startAt: startAtDate.toISOString(),
          endAt: endAtDate.toISOString(),
          slotInterval,
          capacity,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "생성 실패");
      const newBooth: Booth = await res.json();
      setBooths((prev) => [...prev, { ...newBooth, applications: [] }]);
      setOpen(false);
      // reset form
      setName("");
      setDescription("");
      setWhere("");
      setSelectedDay(dayOptions[0].label);
      setStartTime("09:00");
      setEndTime("17:00");
      setSlotInterval(15);
      setCapacity(1);
      setPassword("");
    } catch (e: any) {
      alert("부스 생성 오류: " + e.message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">관리 페이지</h1>

      {/* Create Booth Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="mb-6">새 부스 생성</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>신규 부스 생성</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateBooth} className="space-y-6">
            {/* Booth Name */}
            <div className="flex flex-col space-y-1">
              <Label htmlFor="booth-name">부스 이름</Label>
              <Input id="booth-name" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            {/* Description */}
            <div className="flex flex-col space-y-1">
              <Label htmlFor="booth-desc">설명</Label>
              <Input id="booth-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            {/* Where */}
            <div className="flex flex-col space-y-1">
              <Label htmlFor="booth-where">위치</Label>
              <Input id="booth-where" required value={where} onChange={(e) => setWhere(e.target.value)} />
            </div>

            {/* Day Select */}
            <div className="flex flex-col space-y-1">
              <Label>날짜 선택</Label>
              <Select value={selectedDay} onValueChange={(v) => setSelectedDay(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="날짜 선택" />
                </SelectTrigger>
                <SelectContent>
                  {dayOptions.map((opt) => (
                    <SelectItem key={opt.label} value={opt.label}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Times and Numbers */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1">
                <Label htmlFor="start-time">시작시간</Label>
                <Input
                  id="start-time"
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="flex flex-col space-y-1">
                <Label htmlFor="end-time">종료시간</Label>
                <Input
                  id="end-time"
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
              <div className="flex flex-col space-y-1">
                <Label htmlFor="slot-interval">세션 길이(분)</Label>
                <Input
                  id="slot-interval"
                  type="number"
                  required
                  value={slotInterval}
                  onChange={(e) => setSlotInterval(Number(e.target.value))}
                />
              </div>
              <div className="flex flex-col space-y-1">
                <Label htmlFor="capacity">수용량</Label>
                <Input
                  id="capacity"
                  type="number"
                  required
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                />
              </div>
            </div>

            {/* Admin Password */}
            <div className="flex flex-col space-y-1">
              <Label htmlFor="admin-pass">관리 비밀번호</Label>
              <Input
                id="admin-pass"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <DialogFooter className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                취소
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : "생성"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Separator className="my-6" />

      {/* My Booths */}
      {myBooths.map((booth) => {
        const start = new Date(booth.startAt).getTime();
        const intervalMs = booth.slotInterval * 60_000;
        const totalSlots = Math.ceil((new Date(booth.endAt).getTime() - start) / intervalMs);
        const slots = Array.from({ length: totalSlots }, (_, i) => i);

        return (
          <Card key={booth.id} className="mb-6 p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{booth.name}</h2>
              <Button
                className="bg-black text-white hover:bg-zinc-800"
                onClick={() => window.open(`/api/booths/${booth.id}/export`, "_blank")}
              >
                명단 다운로드
              </Button>
            </div>
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>시간대</TableHead>
                    <TableHead>수락된 학생 번호</TableHead>
                    <TableHead>대기 중 학생 번호</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {slots.map((idx) => {
                    const slotStart = new Date(start + idx * intervalMs);
                    const slotEnd = new Date(slotStart.getTime() + intervalMs);
                    const two = (n: number) => String(n).padStart(2, "0");
                    const label = `${two(slotStart.getHours())}:${two(slotStart.getMinutes())} - ${two(
                      slotEnd.getHours()
                    )}:${two(slotEnd.getMinutes())}`;

                    const accepted = booth.applications?.filter((a) => a.slotIndex === idx && a.isAccepted) || [];
                    const pending = booth.applications?.filter((a) => a.slotIndex === idx && !a.isAccepted) || [];

                    return (
                      <TableRow key={idx}>
                        <TableCell>{label}</TableCell>
                        <TableCell className="space-x-2">
                          {accepted.map((a) => (
                            <span key={a.id} className="inline-flex items-center space-x-1">
                              <span>{a.user!.studentNo}</span>
                              <Button variant="ghost" size="icon" onClick={() => handleReject(booth.id, a.id)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </span>
                          ))}
                        </TableCell>
                        <TableCell className="space-x-2">
                          {pending.map((a) => (
                            <span key={a.id} className="inline-flex items-center space-x-1">
                              <span>{a.user!.studentNo}</span>
                              <Button variant="ghost" size="icon" onClick={() => handleAccept(booth.id, a.id)}>
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleReject(booth.id, a.id)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </span>
                          ))}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
