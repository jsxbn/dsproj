// components/TimelineViewer.tsx
"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";

export type TimelineItem = {
  id: string | number;
  title: string;
  where: string;
  start: Date;
  end: Date;
  color: string;
};

export interface TimelineViewerProps {
  items: TimelineItem[];
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
  /** now 라인/뱃지 갱신 주기(ms) */
  nowUpdateInterval?: number;
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
  markerLineColor = "#CCC",
  hideEdgeMarkers = true,
  showNowBadge = true,
  nowUpdateInterval = 6000, // 기본 1분
}) => {
  // 0) 실시간으로 바뀌는 now 시간
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setCurrentTime(Date.now()), nowUpdateInterval);
    return () => clearInterval(id);
  }, [nowUpdateInterval]);

  // 1) items 로부터 min/max 계산
  const [computedMin, computedMax] = useMemo(() => {
    if (items.length === 0) return [Date.now(), Date.now()] as const;
    const all = items.flatMap((it) => [it.start.getTime(), it.end.getTime()]);
    return [Math.min(...all), Math.max(...all)] as const;
  }, [items]);

  // 2) prop으로 고정된 range 가 있으면 사용
  const startMs = (rangeStart ?? new Date(computedMin)).getTime();
  const endMs = (rangeEnd ?? new Date(computedMax)).getTime();
  const totalRange = endMs - startMs;

  // 3) marker 계산
  const markers = useMemo(() => {
    if (!markerIntervalHours || markerIntervalHours <= 0) return [];
    const step = markerIntervalHours * 3600 * 1000;
    const arr: { time: number; label: string }[] = [];
    for (let t = startMs; t <= endMs; t += step) {
      const d = new Date(t);
      const label = d.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      arr.push({ time: t, label });
    }
    return arr;
  }, [startMs, endMs, markerIntervalHours]);

  // 4) 양 끝단 마커 제거
  const visibleMarkers = useMemo(() => {
    if (!hideEdgeMarkers) return markers;
    return markers.filter((m) => m.time > startMs && m.time < endMs);
  }, [markers, hideEdgeMarkers, startMs, endMs]);

  // 5) First-Fit lane 할당
  const { laneMap, lanesCount } = useMemo(() => {
    type Ev = { id: string | number; s: number; e: number };
    const evs: Ev[] = items
      .map((it) => ({
        id: it.id,
        s: it.start.getTime(),
        e: it.end.getTime(),
      }))
      .sort((a, b) => a.s - b.s);

    const lanesEnd: number[] = [];
    const laneMap: Record<string | number, number> = {};

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

  // 6) 렌더링
  const containerHeight = Math.max(markerLabelHeight + lanesCount * laneHeight, 150);
  const nowPct = ((currentTime - startMs) / totalRange) * 100;

  return (
    //wrapper
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: containerHeight,
        border: "1px solid #EEE",
        overflow: "hidden",
      }}
    >
      {/* 마커 라인 */}
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
              borderLeft: `1px dashed ${markerLineColor}`,
              zIndex: 1,
            }}
          />
        );
      })}

      {/* 마커 라벨 */}
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
            }}
          >
            {m.label}
          </Typography>
        );
      })}

      {/* 이벤트 바 */}
      {items.map((it) => {
        const sPct = ((it.start.getTime() - startMs) / totalRange) * 100;
        const ePct = ((it.end.getTime() - startMs) / totalRange) * 100;
        const wPct = ePct - sPct;
        const lane = laneMap[it.id];
        const top = markerLabelHeight + lane * laneHeight + barVerticalPadding;
        const height = laneHeight - barVerticalPadding * 2;

        return (
          <Box
            key={it.id}
            sx={{
              position: "absolute",
              top,
              left: `${sPct}%`,
              width: `${wPct}%`,
              height,
              bgcolor: it.color,
              borderRadius: 1,
              px: 0.5,
              display: "flex",
              alignItems: "center",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              zIndex: 3,
            }}
          >
            <Typography variant="caption" sx={{ color: "#fff", fontWeight: 600 }}>
              {it.title}
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
    </Box>
  );
};

export default TimelineViewer;
