"use client";

import React, { useState, useEffect, useMemo } from "react";
import type { Booth, Application } from "@/app/utils/schemaTypes";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

// shadcn-ui
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

// icons
import { MapPin, Info, Calendar, Clock, Loader2 } from "lucide-react";

interface BoothModalProps {
  booth: Booth | null;
  userApplications: Application[];
  onClose: () => void;
}

export default function BoothModal({ booth, userApplications, onClose }: BoothModalProps) {
  const { data: session } = useSession();
  const router = useRouter();
  // 1) 슬롯별 수락 카운트
  const [slotCounts, setSlotCounts] = useState<Record<number, number>>({});
  useEffect(() => {
    if (!booth) return setSlotCounts({});
    fetch(`/api/applications/count?boothId=${booth.id}`)
      .then((r) => r.json())
      .then((data) => {
        const m: Record<number, number> = {};
        data.counts.forEach((c: { slotIndex: number; count: number }) => (m[c.slotIndex] = c.count));
        setSlotCounts(m);
      })
      .catch(() => setSlotCounts({}));
  }, [booth]);

  // 2) 이미 신청했는지 / 운영자인지
  const hasApplied = useMemo(
    () => !!booth && userApplications.some((app) => app.boothId === booth.id),
    [userApplications, booth]
  );
  const amIOperator = useMemo(
    () => !!booth && !!session?.user && booth.operatorId === session.user.id,
    [booth, session]
  );

  // 3) 슬롯 계산
  const slots = useMemo(() => {
    if (!booth) return [];
    const out: { slotIndex: number; start: Date; end: Date }[] = [];
    const startMs = new Date(booth.startAt).getTime();
    const endMs = new Date(booth.endAt).getTime();
    const step = booth.slotInterval * 60 * 1000;
    let idx = 0;
    for (let t = startMs; t + step <= endMs; t += step, idx++) {
      out.push({
        slotIndex: idx,
        start: new Date(t),
        end: new Date(t + step),
      });
    }
    return out;
  }, [booth]);

  // 4) 내 Accepted 일정 (겹침 체크)
  const myWindows = useMemo(() => {
    return userApplications
      .filter((a) => a.isAccepted && a.booth)
      .map((a) => {
        const base = new Date(a.booth!.startAt).getTime();
        const s = base + a.slotIndex * a.booth!.slotInterval * 60 * 1000;
        return { start: s, end: s + a.booth!.slotInterval * 60 * 1000 };
      });
  }, [userApplications]);

  // 5) form state
  const [selected, setSelected] = useState<string>("");
  const [loading, setLoading] = useState(false);

  if (!booth) return null;

  const fmt = (d: Date) =>
    d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  const apply = async () => {
    if (!selected) {
      return alert("세션을 선택해주세요.");
    }
    setLoading(true);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boothId: booth.id,
          slotIndex: parseInt(selected, 10),
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "실패");
      alert("신청 완료!");
      router.refresh();
      onClose();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg rounded-lg border bg-white shadow-xl p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">{booth.name}</DialogTitle>
          <DialogDescription> 부스 상세 정보를 확인하고, 원하는 세션에 신청하세요.</DialogDescription>
        </DialogHeader>

        <div className="divide-y divide-gray-200 text-gray-700">
          {/* 부스 메타 정보 */}
          <div className="pb-4">
            {/* grid-cols-1 은 모바일, sm 부터 grid-template-columns: max-content 1fr */}
            <dl className="grid grid-cols-1 gap-y-3 gap-x-6 sm:grid-cols-[max-content_1fr] sm:items-start">
              <dt className="flex items-center space-x-1 text-sm font-medium text-gray-900">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span>장소</span>
              </dt>
              <dd className="text-sm text-gray-700">{booth.where}</dd>

              <dt className="flex items-center space-x-1 text-sm font-medium text-gray-900">
                <Info className="h-4 w-4 text-gray-400" />
                <span>설명</span>
              </dt>
              <dd className="text-sm text-gray-700">{booth.description || "-"}</dd>

              <dt className="flex items-center space-x-1 text-sm font-medium text-gray-900">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>기간</span>
              </dt>
              <dd className="text-sm text-gray-700">
                {new Date(booth.startAt).toLocaleDateString()} – {new Date(booth.endAt).toLocaleDateString()}
              </dd>

              <dt className="flex items-center space-x-1 text-sm font-medium text-gray-900">
                <Clock className="h-4 w-4 text-gray-400" />
                <span>시간</span>
              </dt>
              <dd className="text-sm text-gray-700">
                {new Date(booth.startAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} –{" "}
                {new Date(booth.endAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </dd>

              <dt className="flex items-center space-x-1 text-sm font-medium text-gray-900">
                <span>슬롯 인원</span>
              </dt>
              <dd className="text-sm">
                <Badge variant="outline" className="text-sm">
                  {booth.capacity}명
                </Badge>
              </dd>
            </dl>
          </div>

          {/* 세션 셀렉트 */}
          <div className="py-4 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="slot">세션 선택</Label>
              <Select value={selected} onValueChange={setSelected} disabled={hasApplied || amIOperator}>
                <SelectTrigger className="w-full border-gray-300">
                  <SelectValue placeholder="세션을 선택해 주세요." />
                </SelectTrigger>
                <SelectContent>
                  {slots.map((s) => {
                    const used = slotCounts[s.slotIndex] || 0;
                    const full = used >= booth.capacity;
                    const overlap = myWindows.some(
                      (w) => Math.max(w.start, s.start.getTime()) < Math.min(w.end, s.end.getTime())
                    );
                    const label = `${fmt(s.start)} – ${fmt(s.end)} (${used}/${booth.capacity}) ${
                      overlap ? "(겹침)" : ""
                    }`;
                    return (
                      <SelectItem key={s.slotIndex} value={s.slotIndex.toString()} disabled={full || overlap}>
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            {hasApplied && <p className="mb-2 text-sm text-red-600">이미 이 부스에 신청하셨습니다.</p>}
            {amIOperator && <p className="mb-2 text-sm text-red-600">운영자는 본인 부스에 신청할 수 없습니다.</p>}
          </div>
        </div>

        <DialogFooter className="mt-6 pt-4 border-t border-gray-200 flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            닫기
          </Button>
          <Button onClick={apply} disabled={loading || hasApplied || !selected}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : hasApplied ? "이미 예약됨" : "신청"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
