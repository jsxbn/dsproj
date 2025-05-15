// src/components/BoothModal.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Portal from "./Portal";
import styles from "./BoothModal.module.css";
import { FormControl, InputLabel, Select, MenuItem, Button, CircularProgress, Typography } from "@mui/material";
import type { Booth, Application } from "@/app/utils/schemaTypes";

interface BoothModalProps {
  booth: Booth | null;
  // 부모가 넘겨주는, 이미 수락된 나의 Application[]
  userApplications: Application[];
  onClose: () => void;
}

export default function BoothModal({ booth, userApplications, onClose }: BoothModalProps) {
  // ─── 1) 슬롯별 수락된 신청 count ─────────────────
  const [slotCounts, setSlotCounts] = useState<Record<number, number>>({});
  useEffect(() => {
    if (!booth) {
      setSlotCounts({});
      return;
    }
    fetch(`/api/applications/count?boothId=${booth.id}`)
      .then((res) => res.json())
      .then((data) => {
        const m: Record<number, number> = {};
        data.counts.forEach((c: { slotIndex: number; count: number }) => (m[c.slotIndex] = c.count));
        setSlotCounts(m);
      })
      .catch(() => setSlotCounts({}));
  }, [booth]);

  // ─── 2) 이미 이 부스에 수락된 내 신청이 있는지 ──────────
  const hasAppliedToThisBooth = useMemo(() => {
    if (!booth) return false;
    return userApplications.some((app) => app.boothId === booth.id);
  }, [userApplications, booth]);

  // ─── 3) 이 부스의 세션(슬롯) 리스트 생성 ────────────
  const slots = useMemo(() => {
    if (!booth) return [];
    const out: { slotIndex: number; start: Date; end: Date }[] = [];
    const startMs = new Date(booth.startAt).getTime();
    const endMs = new Date(booth.endAt).getTime();
    const intervalMs = booth.slotInterval * 60 * 1000;
    let idx = 0;
    for (let t = startMs; t + intervalMs <= endMs; t += intervalMs, idx++) {
      out.push({
        slotIndex: idx,
        start: new Date(t),
        end: new Date(t + intervalMs),
      });
    }
    return out;
  }, [booth]);

  // ─── 4) 내 다른 승인된 application 일정 (겹침 체크용) ───
  const myAcceptedWindows = useMemo(() => {
    return userApplications
      .filter((app) => app.isAccepted && app.booth)
      .map((app) => {
        const base = new Date(app.booth!.startAt).getTime();
        const s = base + app.slotIndex * app.booth!.slotInterval * 60 * 1000;
        const e = s + app.booth!.slotInterval * 60 * 1000;
        return { start: s, end: e };
      });
  }, [userApplications]);

  // ─── 5) 드롭다운 선택값·신청중 플래그 ────────────────
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [isApplying, setIsApplying] = useState(false);

  // ─── 6) ESC 키로 모달 닫기 ──────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // booth 가 없으면 렌더링 스킵
  if (!booth) return null;

  // 시간 포맷터
  const fmtTime = (d: Date) =>
    d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  // 신청 핸들러
  const handleApply = async () => {
    if (!selectedSlot) {
      alert("세션을 선택해주세요.");
      return;
    }
    setIsApplying(true);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boothId: booth.id,
          slotIndex: parseInt(selectedSlot, 10),
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "신청 실패");
      alert("신청이 완료되었습니다!");
      onClose();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Portal>
      <div className={styles.backdrop} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          {/* 헤더 */}
          <div className={styles.header}>{booth.name}</div>

          {/* 본문 */}
          <div className={styles.content}>
            {/* 부스 상세 정보 */}
            <Typography gutterBottom>
              <strong>장소:</strong> {booth.where}
            </Typography>
            <Typography gutterBottom>
              <strong>설명:</strong> {booth.description ?? "-"}
            </Typography>
            <Typography gutterBottom>
              <strong>시작:</strong>{" "}
              {new Date(booth.startAt).toLocaleString([], {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Typography>
            <Typography gutterBottom>
              <strong>종료:</strong>{" "}
              {new Date(booth.endAt).toLocaleString([], {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Typography>
            <Typography gutterBottom>
              <strong>수용량:</strong> {booth.capacity}명
            </Typography>

            {/* 이미 이 부스에 예약된 경우 */}
            {hasAppliedToThisBooth && (
              <Typography color="error" gutterBottom>
                이미 이 부스에 신청했습니다.
              </Typography>
            )}

            {/* 세션 드롭다운 */}
            <FormControl fullWidth margin="normal" disabled={hasAppliedToThisBooth}>
              <InputLabel id="slot-select-label">세션 선택</InputLabel>
              <Select
                labelId="slot-select-label"
                label="세션 선택"
                value={selectedSlot}
                onChange={(e) => setSelectedSlot(e.target.value)}
              >
                {slots.map((slot) => {
                  const used = slotCounts[slot.slotIndex] ?? 0;
                  const full = used >= booth.capacity;
                  const overlap = myAcceptedWindows.some(
                    ({ start, end }) => Math.max(start, slot.start.getTime()) < Math.min(end, slot.end.getTime())
                  );
                  return (
                    <MenuItem key={slot.slotIndex} value={slot.slotIndex.toString()} disabled={full || overlap}>
                      {`${fmtTime(slot.start)} - ${fmtTime(slot.end)}`} ({used}/{booth.capacity}){" "}
                      {overlap && "(시간 겹침)"}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </div>

          {/* 푸터 */}
          <div className={styles.footer}>
            <Button style={{ marginRight: 5 }} onClick={onClose} variant="outlined" disabled={isApplying}>
              닫기
            </Button>
            <Button
              onClick={handleApply}
              variant="contained"
              disabled={isApplying || hasAppliedToThisBooth || selectedSlot === ""}
            >
              {isApplying ? (
                <CircularProgress size={20} color="inherit" />
              ) : hasAppliedToThisBooth ? (
                "이미 예약됨"
              ) : (
                "신청"
              )}
            </Button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
