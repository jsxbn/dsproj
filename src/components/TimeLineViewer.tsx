// components/TimelineViewer.tsx
"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Box, Tooltip, Typography } from "@mui/material";
// ▶️ 실제 프로젝트 경로에 맞게 import 경로를 조정하세요.
import { Application, Booth } from "@/app/utils/schemaTypes";
import BoothModal from "./BoothModal";

export interface TimelineViewerProps {
  items: Booth[]; // ⬅️ TimelineItem[] → Booth[]
  laneHeight?: number;
  barVerticalPadding?: number;
  nowLineColor?: string;
  rangeStart?: Date;
  rangeEnd?: Date;
  markerIntervalHours?: number;
  markerLabelHeight?: number;
  markerLineColor?: string;
  hideEdgeMarkers?: boolean;
  showNowBadge?: boolean;
  nowUpdateInterval?: number;
  itemColor?: string;
  itemHoverColor?: string;
  applications: Application[];
}

const TimelineViewer: React.FC<TimelineViewerProps> = ({
  items,
  laneHeight = 36,
  barVerticalPadding = 4,
  nowLineColor = "#E91E63",
  rangeStart,
  rangeEnd,
  markerIntervalHours = 6,
  markerLabelHeight = 24,
  markerLineColor = "#EEE",
  hideEdgeMarkers = true,
  showNowBadge = true,
  nowUpdateInterval = 60000,
  itemColor = "#edf5fb",
  itemHoverColor = "#E1EAF9",
  applications,
}) => {
  // 0) “Now” 라인용 현재 시각 갱신
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setCurrentTime(Date.now()), nowUpdateInterval);
    return () => clearInterval(id);
  }, [nowUpdateInterval]);

  // 1) items 로부터 전체 min/max 계산
  const [computedMin, computedMax] = useMemo(() => {
    if (items.length === 0) {
      const now = Date.now();
      return [now, now] as const;
    }
    const all = items.flatMap((it) => [it.startAt.getTime(), it.endAt.getTime()]);
    return [Math.min(...all), Math.max(...all)] as const;
  }, [items]);

  // 2) 실제 타임라인 범위 결정
  const startMs = (rangeStart ?? new Date(computedMin)).getTime();
  const endMs = (rangeEnd ?? new Date(computedMax)).getTime();
  const totalRange = endMs - startMs;

  // 3) 시간 마커 생성
  const markers = useMemo(() => {
    if (!markerIntervalHours || markerIntervalHours <= 0) return [];
    const step = markerIntervalHours * 3600 * 1000;
    const out: { time: number; label: string }[] = [];
    for (let t = startMs; t <= endMs; t += step) {
      const d = new Date(t);
      out.push({
        time: t,
        label: d.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
    }
    return out;
  }, [startMs, endMs, markerIntervalHours]);

  // 4) 양 끝 마커 숨기기 옵션
  const visibleMarkers = useMemo(() => {
    if (!hideEdgeMarkers) return markers;
    return markers.filter((m) => m.time > startMs && m.time < endMs);
  }, [markers, hideEdgeMarkers, startMs, endMs]);

  // 5) First-Fit 레인 할당
  const { laneMap, lanesCount } = useMemo(() => {
    type Ev = { id: string; s: number; e: number };
    const evs: Ev[] = items
      .map((it) => ({
        id: it.id,
        s: it.startAt.getTime(),
        e: it.endAt.getTime(),
      }))
      .sort((a, b) => a.s - b.s);

    const lanesEnd: number[] = [];
    const laneMap: Record<string, number> = {};

    evs.forEach((ev) => {
      let idx = lanesEnd.findIndex((end) => end <= ev.s);
      if (idx === -1) {
        idx = lanesEnd.length;
        lanesEnd.push(ev.e);
      } else {
        lanesEnd[idx] = ev.e;
      }
      laneMap[ev.id] = idx;
    });

    return { laneMap, lanesCount: lanesEnd.length };
  }, [items]);

  const containerHeight = Math.max(markerLabelHeight + lanesCount * laneHeight, 250);
  const nowPct = ((currentTime - startMs) / totalRange) * 100;

  // 6) mounted: **한 번만** false→true 토글 (초기 expand 애니메이션)
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(id);
  }, []);

  // 7) 모달용 selectedItem
  const [selectedItem, setSelectedItem] = useState<Booth | null>(null);

  return (
    <>
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: containerHeight,
          overflow: "hidden",
        }}
      >
        {/* 시간 마커 라인 */}
        {visibleMarkers.map((m) => {
          const left = ((m.time - startMs) / totalRange) * 100;
          return (
            <Box
              key={"line_" + m.time}
              sx={{
                position: "absolute",
                top: markerLabelHeight,
                bottom: 0,
                left: `${left}%`,
                borderLeft: `2px solid ${markerLineColor}`,
                zIndex: 1,
              }}
            />
          );
        })}

        {/* 시간 마커 레이블 */}
        {visibleMarkers.map((m) => {
          const left = ((m.time - startMs) / totalRange) * 100;
          return (
            <Typography
              key={"lbl_" + m.time}
              variant="caption"
              sx={{
                position: "absolute",
                top: 0,
                left: `${left}%`,
                transform: "translateX(-50%)",
                zIndex: 2,
                userSelect: "none",
                fontWeight: 500,
              }}
            >
              {m.label}
            </Typography>
          );
        })}

        {/* 이벤트 바 */}
        {items.map((it) => {
          const sPct = ((it.startAt.getTime() - startMs) / totalRange) * 100;
          const ePct = ((it.endAt.getTime() - startMs) / totalRange) * 100;
          const wPct = ePct - sPct;
          const lane = laneMap[it.id];
          const top = markerLabelHeight + lane * laneHeight + barVerticalPadding;
          const height = laneHeight - barVerticalPadding * 2;

          return (
            <Box
              key={it.id}
              onClick={() => setSelectedItem(it)}
              sx={{
                position: "absolute",
                top,
                left: `${sPct}%`,
                width: mounted ? `${wPct}%` : "0%",
                height,
                boxSizing: "border-box",
                bgcolor: itemColor,
                borderRadius: 2,
                px: 1,
                display: "flex",
                alignItems: "center",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                cursor: "pointer",
                zIndex: 3,
                transition: "left 0.8s ease, width 0.8s ease, background-color 0.5s",
                "&:hover": { bgcolor: itemHoverColor },
              }}
            >
              <Typography variant="caption" sx={{ color: "#17171B", fontWeight: 600 }}>
                {it.name}
              </Typography>
            </Box>
          );
        })}

        {/* “Now” 라인 */}
        <Box
          sx={{
            position: "absolute",
            top: markerLabelHeight,
            bottom: 0,
            left: `${nowPct}%`,
            borderLeft: `2px solid ${nowLineColor}`,
            pointerEvents: "none",
            zIndex: 4,
          }}
        />

        {/* “Now” 뱃지 */}
        {showNowBadge && (
          <Box
            sx={{
              position: "absolute",
              top: markerLabelHeight / 2,
              left: `${nowPct}%`,
              transform: "translate(-50%, -50%)",
              bgcolor: nowLineColor,
              color: "#fff",
              px: 1,
              py: 0.25,
              borderRadius: 1,
              fontSize: "0.75rem",
              fontWeight: 600,
              zIndex: 5,
              pointerEvents: "none",
              userSelect: "none",
            }}
          >
            {new Date(currentTime).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Box>
        )}

        {/* 상세 모달 */}
      </Box>
      <BoothModal userApplications={applications} booth={selectedItem} onClose={() => setSelectedItem(null)} />
    </>
  );
};

export default TimelineViewer;
