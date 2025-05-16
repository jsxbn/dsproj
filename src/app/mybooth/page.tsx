"use client";

import React, { useEffect, useState, FormEvent } from "react";
import { useSession } from "next-auth/react";
import type { Booth } from "@/app/utils/schemaTypes";
import prisma from "@/lib/prisma";
import {
  Box,
  Typography,
  Button,
  Paper,
  Divider,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";

const ADMIN_PASSWORD = "sachedule";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [booths, setBooths] = useState<Booth[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal for booth creation
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [where, setWhere] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [slotInterval, setSlotInterval] = useState<number>(15);
  const [capacity, setCapacity] = useState<number>(1);
  const [password, setPassword] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Fetch booths once authenticated
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
  const myBooths = booths.filter((b) => b.operatorId === userId);

  // Handlers
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

  const handleCreateBooth = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== ADMIN_PASSWORD) {
      alert("비밀번호가 올바르지 않습니다.");
      return;
    }
    setIsCreating(true);
    try {
      const res = await fetch("/api/booths", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, where, startAt, endAt, slotInterval, capacity }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "생성 실패");
      const newBooth: Booth = await res.json();
      setBooths((prev) => [...prev, { ...newBooth, applications: [] }]);
      handleClose();
      setName("");
      setDescription("");
      setWhere("");
      setStartAt("");
      setEndAt("");
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
    <Box p={4}>
      <Typography variant="h4" gutterBottom>
        관리 페이지
      </Typography>
      <Button
        variant="contained"
        onClick={handleOpen}
        sx={{ backgroundColor: "black", color: "white", mb: 3, "&:hover": { backgroundColor: "#333" } }}
      >
        새 부스 생성
      </Button>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>신규 부스 생성</DialogTitle>
        <Box component="form" onSubmit={handleCreateBooth}>
          <DialogContent dividers>
            <TextField
              required
              fullWidth
              margin="dense"
              label="부스 이름"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <TextField
              fullWidth
              margin="dense"
              label="설명"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <TextField
              required
              fullWidth
              margin="dense"
              label="위치"
              value={where}
              onChange={(e) => setWhere(e.target.value)}
            />
            <TextField
              required
              fullWidth
              margin="dense"
              label="시작시간"
              type="datetime-local"
              InputLabelProps={{ shrink: true }}
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
            />
            <TextField
              required
              fullWidth
              margin="dense"
              label="종료시간"
              type="datetime-local"
              InputLabelProps={{ shrink: true }}
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
            />
            <TextField
              required
              fullWidth
              margin="dense"
              label="세션 길이(분)"
              type="number"
              value={slotInterval}
              onChange={(e) => setSlotInterval(Number(e.target.value))}
            />
            <TextField
              required
              fullWidth
              margin="dense"
              label="수용인원원"
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
            />
            <TextField
              required
              fullWidth
              margin="dense"
              label="관리 비밀번호"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button
              variant="outlined"
              onClick={handleClose}
              sx={{
                backgroundColor: "white",
                color: "black",
                border: "1px solid black",
                "&:hover": { backgroundColor: "#f0f0f0" },
              }}
            >
              취소
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isCreating}
              sx={{ backgroundColor: "black", color: "white", "&:hover": { backgroundColor: "#333" } }}
            >
              {isCreating ? <CircularProgress size={20} sx={{ color: "white" }} /> : "생성"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Divider sx={{ mb: 3 }} />

      {myBooths.map((booth) => {
        const start = new Date(booth.startAt).getTime();
        const intervalMs = booth.slotInterval * 60000;
        const totalSlots = Math.ceil((new Date(booth.endAt).getTime() - start) / intervalMs);
        const slots = Array.from({ length: totalSlots }, (_, i) => i);
        return (
          <Paper key={booth.id} sx={{ p: 2, mb: 3 }} elevation={2}>
            <Typography variant="h6">{booth.name}</Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>시간대</TableCell>
                    <TableCell>수락된 학생 번호</TableCell>
                    <TableCell>대기 중 학생 번호</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {slots.map((idx) => {
                    const slotStart = new Date(start + idx * intervalMs);
                    const slotEnd = new Date(slotStart.getTime() + intervalMs);
                    const twoDigit = (n: number) => String(n).padStart(2, "0");
                    const label = `${twoDigit(slotStart.getHours())}:${twoDigit(slotStart.getMinutes())} - ${twoDigit(
                      slotEnd.getHours()
                    )}:${twoDigit(slotEnd.getMinutes())}`;
                    const accepted = booth.applications?.filter((a) => a.slotIndex === idx && a.isAccepted) || [];
                    const pending = booth.applications?.filter((a) => a.slotIndex === idx && !a.isAccepted) || [];
                    return (
                      <TableRow key={idx}>
                        <TableCell>{label}</TableCell>
                        <TableCell>
                          {accepted.map((a) => (
                            <Box key={a.id} display="inline-flex" alignItems="center" mr={1}>
                              <Typography mr={0.5}>{a.user!.studentNo}</Typography>
                              <IconButton size="small" onClick={() => handleReject(booth.id, a.id)}>
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          ))}
                        </TableCell>
                        <TableCell>
                          {pending.map((a) => (
                            <Box key={a.id} display="inline-flex" alignItems="center" mr={1}>
                              <Typography mr={0.5}>{a.user!.studentNo}</Typography>
                              <IconButton size="small" onClick={() => handleAccept(booth.id, a.id)}>
                                <CheckIcon fontSize="small" />
                              </IconButton>
                              <IconButton size="small" onClick={() => handleReject(booth.id, a.id)}>
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          ))}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        );
      })}
    </Box>
  );
}
