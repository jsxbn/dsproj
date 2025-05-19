// src/components/ApplicationsViewer.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Application } from "@/app/utils/schemaTypes";

// shadcn-ui
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

// lucide icons for spinner + status icons
import { Loader2, Check, Hourglass } from "lucide-react";

interface ApplicationsViewerProps {
  applications: Application[];
}

export default function ApplicationsViewer({ applications }: ApplicationsViewerProps) {
  const router = useRouter();

  // 1) 로컬 복사
  const [appList, setAppList] = useState<Application[]>(applications);
  useEffect(() => {
    setAppList(applications);
  }, [applications]);

  // 2) 삭제 중 ID 세트
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  // 3) 취소 핸들러
  const handleCancel = async (appId: string) => {
    if (!confirm("이 신청을 정말 취소하시겠습니까?")) return;
    setDeletingIds((s) => new Set(s).add(appId));

    try {
      const res = await fetch(`/api/applications/${appId}`, { method: "DELETE" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "취소 실패");
      // 로컬 리스트에서 제거
      setAppList((list) => list.filter((a) => a.id !== appId));
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeletingIds((s) => {
        const next = new Set(s);
        next.delete(appId);
        return next;
      });
    }
  };

  // 4) 승인 / 대기 분리
  const accepted = appList.filter((a) => a.isAccepted);
  const pending = appList.filter((a) => !a.isAccepted);

  // 5) 슬롯 포맷터
  const formatSlot = (app: Application) => {
    const b = app.booth;
    if (!b) return "";
    const base = new Date(b.startAt).getTime();
    const interval = b.slotInterval * 60 * 1000;
    const s = new Date(base + app.slotIndex * interval);
    const e = new Date(s.getTime() + interval);
    const fmt = (d: Date) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return `${fmt(s)} - ${fmt(e)}`;
  };

  return (
    <div className="space-y-4 mt-6">
      {/* 헤더 */}
      <h3 className="text-lg font-semibold">나의 신청 현황</h3>

      {/* 좌우 카드 그리드 */}
      <div className="grid grid-cols-2 gap-4 h-[240px]">
        {/* 승인된 신청 */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Check className="w-5 h-5 text-green-500" />
              <CardTitle>승인된 신청</CardTitle>
            </div>
          </CardHeader>

          <Separator />

          <CardContent className="p-0">
            <ScrollArea className="h-[192px]">
              <div className="p-4 space-y-3">
                {accepted.length > 0 ? (
                  accepted.map((app) => {
                    const isDeleting = deletingIds.has(app.id);
                    return (
                      <div key={app.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{app.booth?.name ?? "알 수 없는 부스"}</p>
                          <p className="text-sm text-muted-foreground">{formatSlot(app)} </p>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={isDeleting}
                          onClick={() => handleCancel(app.id)}
                        >
                          {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "취소"}
                        </Button>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground">승인된 신청이 없습니다.</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* 대기중인 신청 */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Hourglass className="w-5 h-5 text-yellow-500" />
              <CardTitle>대기중인 신청</CardTitle>
            </div>
          </CardHeader>

          <Separator />

          <CardContent className="p-0">
            <ScrollArea className="h-[192px]">
              <div className="p-4 space-y-3">
                {pending.length > 0 ? (
                  pending.map((app) => {
                    const isDeleting = deletingIds.has(app.id);
                    return (
                      <div key={app.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{app.booth?.name ?? "알 수 없는 부스"}</p>
                          <p className="text-sm text-muted-foreground">{formatSlot(app)} </p>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={isDeleting}
                          onClick={() => handleCancel(app.id)}
                        >
                          {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "취소"}
                        </Button>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground">대기중인 신청이 없습니다.</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
