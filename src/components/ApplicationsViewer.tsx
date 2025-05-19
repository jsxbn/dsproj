// src/components/ApplicationsViewer.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Application } from "@/app/utils/schemaTypes";

// shadcn-ui
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

// sonner
import { toast } from "sonner";

import { Loader2, CheckCircle2, Hourglass } from "lucide-react";

interface ApplicationsViewerProps {
  applications: Application[];
}

function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
      <div className="text-[2rem]">{icon}</div>
      <h4 className="mt-4 text-lg font-semibold">{title}</h4>
      <p className="mt-1 text-sm">{description}</p>
    </div>
  );
}

export default function ApplicationsViewer({ applications }: ApplicationsViewerProps) {
  const router = useRouter();

  const [appList, setAppList] = useState<Application[]>(applications);
  useEffect(() => {
    setAppList(applications);
  }, [applications]);

  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const handleCancel = async (appId: string) => {
    if (!confirm("정말 이 신청을 취소하시겠습니까?")) return;
    setDeletingIds((s) => new Set(s).add(appId));

    try {
      const res = await fetch(`/api/applications/${appId}`, { method: "DELETE" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "취소 실패");
      setAppList((list) => list.filter((a) => a.id !== appId));

      // sonner 성공 토스트
      toast.success("신청이 성공적으로 취소되었습니다.");

      router.refresh();
    } catch (err: any) {
      // sonner 에러 토스트
      toast.error(err.message || "취소 과정에서 오류가 발생했습니다.");
    } finally {
      setDeletingIds((s) => {
        const next = new Set(s);
        next.delete(appId);
        return next;
      });
    }
  };

  const accepted = appList.filter((a) => a.isAccepted);
  const pending = appList.filter((a) => !a.isAccepted);

  const formatSlot = (app: Application) => {
    const b = app.booth;
    if (!b) return "";
    const base = new Date(b.startAt).getTime();
    const interval = b.slotInterval * 60 * 1000;
    const s = new Date(base + app.slotIndex * interval);
    const e = new Date(s.getTime() + interval);
    const fmt = (d: Date) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return `${fmt(s)} ~ ${fmt(e)}`;
  };

  const renderList = (list: Application[], icon: React.ReactNode) => {
    if (list.length === 0) {
      return <EmptyState icon={icon} title="내역이 없습니다" description="아직 해당 상태의 신청이 없어요." />;
    }
    return (
      <div className="space-y-4 p-4">
        {list.map((app) => {
          const isDeleting = deletingIds.has(app.id);
          return (
            <div key={app.id} className="flex items-center justify-between rounded-lg border p-3 hover:shadow">
              <div>
                <p className="font-medium">{app.booth?.name ?? "알 수 없는 부스"}</p>
                <p className="text-sm text-muted-foreground">{formatSlot(app)}</p>
              </div>
              <Button variant="destructive" size="sm" disabled={isDeleting} onClick={() => handleCancel(app.id)}>
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "취소"}
              </Button>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card className="mt-6 w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>나의 신청 현황</CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="p-0">
        <Tabs defaultValue="accepted">
          <div className="flex justify-center">
            <TabsList className="border-b">
              <TabsTrigger value="accepted" className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>승인된 신청</span>
                <Badge>{accepted.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="pending" className="flex items-center space-x-2">
                <Hourglass className="w-4 h-4 text-yellow-500" />
                <span>대기중인 신청</span>
                <Badge variant="secondary">{pending.length}</Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="accepted" className="p-0">
            <ScrollArea className="max-h-[400px]">{renderList(accepted, <CheckCircle2 />)}</ScrollArea>
          </TabsContent>

          <TabsContent value="pending" className="p-0">
            <ScrollArea className="max-h-[400px]">{renderList(pending, <Hourglass />)}</ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
