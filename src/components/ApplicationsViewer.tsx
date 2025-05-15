// src/components/ApplicationsViewer.tsx
"use client";

import React, { useEffect, useState } from "react";
import type { Application } from "@/app/utils/schemaTypes";
import { Divider, Typography, Box, Button, CircularProgress } from "@mui/material";

interface ApplicationsViewerProps {
  applications: Application[];
}

export default function ApplicationsViewer({ applications }: ApplicationsViewerProps) {
  // 1) 로컬 상태로 복사
  const [appList, setAppList] = useState<Application[]>(applications);
  useEffect(() => {
    setAppList(applications);
  }, [applications]);

  // 2) 삭제 처리 중인 ID 집합
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  // 3) 취소 핸들러
  const handleCancel = async (appId: string) => {
    if (!confirm("이 신청을 정말 취소하시겠습니까?")) return;
    setDeletingIds((s) => new Set(s).add(appId));
    try {
      const res = await fetch(`/api/applications/${appId}`, {
        method: "DELETE",
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "취소 실패");
      // 로컬 리스트에서 제거
      setAppList((list) => list.filter((a) => a.id !== appId));
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

  // 4) 승인된 / 대기중 분리
  const accepted = appList.filter((a) => a.isAccepted);
  const pending = appList.filter((a) => !a.isAccepted);

  // 5) 슬롯 시간 계산 헬퍼
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

  const renderList = (list: Application[]) =>
    list.map((app) => {
      const isDeleting = deletingIds.has(app.id);
      return (
        <Box key={app.id} display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Box>
            <Typography variant="subtitle1">{app.booth?.name || "알 수 없는 부스"}</Typography>
            <Typography variant="body2" color="text.secondary">
              {formatSlot(app)} <small>({new Date(app.createdAt).toLocaleDateString()})</small>
            </Typography>
          </Box>
          <Button size="small" color="error" disabled={isDeleting} onClick={() => handleCancel(app.id)}>
            {isDeleting ? <CircularProgress size={16} color="inherit" /> : "취소"}
          </Button>
        </Box>
      );
    });

  return (
    <Box mt={2}>
      <Typography variant="h5" fontWeight={700}>
        나의 신청 현황
      </Typography>

      <Box display="flex" height={240} mt={1}>
        {/* 승인된 신청 */}
        <Box width="50%" px={1} sx={{ overflowY: "auto" }}>
          <Typography variant="h6">✔️ 승인된 신청</Typography>
          {accepted.length > 0 ? (
            renderList(accepted)
          ) : (
            <Typography variant="body2" color="text.secondary">
              승인된 신청이 없습니다.
            </Typography>
          )}
        </Box>

        <Divider orientation="vertical" flexItem />

        {/* 대기중인 신청 */}
        <Box width="50%" px={1} sx={{ overflowY: "auto" }}>
          <Typography variant="h6">⏳ 대기중인 신청</Typography>
          {pending.length > 0 ? (
            renderList(pending)
          ) : (
            <Typography variant="body2" color="text.secondary">
              대기중인 신청이 없습니다.
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
}
