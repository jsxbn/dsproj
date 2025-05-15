"use client";

import React, { useEffect, useState, FormEvent } from "react";
import { useSession } from "next-auth/react";
import type { Booth, Application } from "@/app/utils/schemaTypes";
import { Box, Typography, TextField, Button, Paper, Divider, CircularProgress } from "@mui/material";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [booths, setBooths] = useState<Booth[]>([]);
  const [loading, setLoading] = useState(true);

  // 신규 부스 form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [where, setWhere] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [slotInterval, setSlotInterval] = useState<number>(15);
  const [capacity, setCapacity] = useState<number>(1);
  const [isCreating, setIsCreating] = useState(false);

  // 1) 로그인 확인 & 부스 fetch
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/booths")
      .then((r) => r.json())
      .then((data: Booth[]) => {
        setBooths(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <Box p={4} textAlign="center">
        <CircularProgress />
      </Box>
    );
  }
  if (!session) {
    return (
      <Box p={4} textAlign="center">
        <Typography>로그인이 필요합니다.</Typography>
      </Box>
    );
  }

  const userId = session.user?.id ?? "";

  // 자신이 운영하는 부스만 필터
  const myBooths = booths.filter((b) => b.operatorId === userId);

  // 2) 신청 수락
  const handleAccept = async (boothId: string, appId: string) => {
    try {
      const res = await fetch(`/api/applications/${appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAccepted: true }),
      });
      if (!res.ok) throw new Error(await res.text());
      // 클라이언트 state 업데이트
      setBooths((prev) =>
        prev.map((b) => {
          if (b.id !== boothId) return b;
          return {
            ...b,
            applications: b.applications!.map((a) => (a.id === appId ? { ...a, isAccepted: true } : a)),
          };
        })
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      alert("승인 중 오류: " + e.message);
    }
  };

  // 3) 신청 거절(삭제)
  const handleReject = async (boothId: string, appId: string) => {
    if (!confirm("정말 거절하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/applications/${appId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(await res.text());
      setBooths((prev) =>
        prev.map((b) => {
          if (b.id !== boothId) return b;
          return {
            ...b,
            applications: b.applications!.filter((a) => a.id !== appId),
          };
        })
      );
    } catch (e: any) {
      alert("거절 중 오류: " + e.message);
    }
  };

  // 4) 신규 부스 생성
  const handleCreateBooth = async (e: FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const res = await fetch("/api/booths", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          where,
          startAt,
          endAt,
          slotInterval,
          capacity,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "생성 실패");
      const newBooth: Booth = await res.json();
      setBooths((prev) => [...prev, { ...newBooth, applications: [] }]);
      // 폼 클리어
      setName("");
      setDescription("");
      setWhere("");
      setStartAt("");
      setEndAt("");
      setSlotInterval(15);
      setCapacity(1);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      alert("부스 생성 오류: " + e.message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Box p={4}>
      <Typography variant="h4" gutterBottom>
        관리 페이지
      </Typography>

      {/* 신규 부스 생성 폼 */}
      <Box
        component="form"
        onSubmit={handleCreateBooth}
        mb={4}
        display="grid"
        gridTemplateColumns={{ xs: "1fr", md: "1fr 1fr" }}
        gap={2}
      >
        <TextField required label="부스 이름" value={name} onChange={(e) => setName(e.target.value)} />
        <TextField label="설명" value={description} onChange={(e) => setDescription(e.target.value)} />
        <TextField required label="위치" value={where} onChange={(e) => setWhere(e.target.value)} />
        <TextField
          required
          label="시작시간"
          type="datetime-local"
          InputLabelProps={{ shrink: true }}
          value={startAt}
          onChange={(e) => setStartAt(e.target.value)}
        />
        <TextField
          required
          label="종료시간"
          type="datetime-local"
          InputLabelProps={{ shrink: true }}
          value={endAt}
          onChange={(e) => setEndAt(e.target.value)}
        />
        <TextField
          required
          label="세션 길이(분)"
          type="number"
          value={slotInterval}
          onChange={(e) => setSlotInterval(Number(e.target.value))}
        />
        <TextField
          required
          label="수용량"
          type="number"
          value={capacity}
          onChange={(e) => setCapacity(Number(e.target.value))}
        />
        <Box display="flex" alignItems="center">
          <Button type="submit" variant="contained" disabled={isCreating} fullWidth>
            {isCreating ? <CircularProgress size={20} color="inherit" /> : "새 부스 생성"}
          </Button>
        </Box>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* 자신이 운영하는 부스 리스트 */}
      {myBooths.length === 0 ? (
        <Typography>아직 운영 중인 부스가 없습니다.</Typography>
      ) : (
        myBooths.map((booth) => {
          const pending = booth.applications!.filter((a) => !a.isAccepted);
          const accepted = booth.applications!.filter((a) => a.isAccepted);
          return (
            <Paper key={booth.id} sx={{ p: 2, mb: 3 }} elevation={2}>
              <Typography variant="h6">{booth.name}</Typography>
              <Typography>위치: {booth.where}</Typography>
              <Typography>
                시간: {new Date(booth.startAt).toLocaleString()} ~ {new Date(booth.endAt).toLocaleString()}
              </Typography>
              <Typography>
                세션 길이: {booth.slotInterval}분 / 수용량: {booth.capacity}명
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle1">⏳ 대기중</Typography>
              {pending.length === 0 && (
                <Typography color="text.secondary" mb={1}>
                  대기중인 신청이 없습니다.
                </Typography>
              )}
              {pending.map((app) => (
                <Box key={app.id} display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Box>
                    <Typography>
                      {app.user?.name || app.userId} (Slot {app.slotIndex})
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(app.createdAt).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => handleAccept(booth.id, app.id)}
                      sx={{ mr: 1 }}
                    >
                      수락
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => handleReject(booth.id, app.id)}
                    >
                      거절
                    </Button>
                  </Box>
                </Box>
              ))}

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle1">✔️ 수락됨</Typography>
              {accepted.length === 0 && <Typography color="text.secondary">수락된 신청이 없습니다.</Typography>}
              {accepted.map((app) => (
                <Box key={app.id} display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Box>
                    <Typography>
                      {app.user?.name || app.userId} (Slot {app.slotIndex})
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(app.createdAt).toLocaleString()}
                    </Typography>
                  </Box>
                  <Button size="small" color="error" onClick={() => handleReject(booth.id, app.id)}>
                    취소
                  </Button>
                </Box>
              ))}
            </Paper>
          );
        })
      )}
    </Box>
  );
}
