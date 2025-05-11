import { TimelineItem } from "@/components/TimeLineViewer";

const viridis = [
  "#e41a1c", // red
  "#377eb8", // blue
  "#4daf4a", // green
  "#984ea3", // purple
  "#ff7f00", // orange
  "#f0d930", // yellow
];
// 2025-11-01 (corrected)
const items: TimelineItem[] = [
  {
    id: 4,
    title: "개막식 (대강당)",
    start: new Date("2025-11-01T09:00:00"),
    end: new Date("2025-11-01T10:00:00"),
    color: viridis[0],
  },
  {
    id: 5,
    title: "인문학 겨루기 대회 (대강당)",
    start: new Date("2025-11-01T10:00:00"),
    end: new Date("2025-11-01T11:00:00"),
    color: viridis[1],
  },
  {
    id: 6,
    title: "크사랑 문방구 (본관 1층)",
    start: new Date("2025-11-01T11:00:00"),
    end: new Date("2025-11-01T13:00:00"),
    color: viridis[2],
  },
  {
    id: 7,
    title: "체크메이트 (3303)",
    start: new Date("2025-11-01T11:00:00"),
    end: new Date("2025-11-01T12:00:00"),
    color: viridis[3],
  },
  {
    id: 8,
    title: "IDEV (3404)",
    start: new Date("2025-11-01T11:00:00"),
    end: new Date("2025-11-01T12:00:00"),
    color: viridis[4],
  },
  {
    id: 9,
    title: "인간 대기계 – 키알 (본관 1층)",
    start: new Date("2025-11-01T12:00:00"),
    end: new Date("2025-11-01T13:00:00"),
    color: viridis[5],
  },
  {
    id: 10,
    title: "43외통 (3305)",
    start: new Date("2025-11-01T12:00:00"),
    end: new Date("2025-11-01T13:00:00"),
    color: viridis[0],
  },
  {
    id: 11,
    title: "낭발바닥 (탐2~형1)",
    start: new Date("2025-11-01T13:00:00"),
    end: new Date("2025-11-01T14:00:00"),
    color: viridis[1],
  },
  {
    id: 12,
    title: "케미파일 (형4 EOZ)",
    start: new Date("2025-11-01T16:00:00"),
    end: new Date("2025-11-01T17:00:00"),
    color: viridis[2],
  },
  {
    id: 13,
    title: "빅프로젝트 (세실 A,B)",
    start: new Date("2025-11-01T17:00:00"),
    end: new Date("2025-11-01T18:00:00"),
    color: viridis[3],
  },
  {
    id: 14,
    title: "루비콘 (3302~3)",
    start: new Date("2025-11-01T18:00:00"),
    end: new Date("2025-11-01T19:00:00"),
    color: viridis[4],
  },
  {
    id: 15,
    title: "클럽대항전 (대강당)",
    start: new Date("2025-11-01T19:00:00"),
    end: new Date("2025-11-01T20:00:00"),
    color: viridis[5],
  },
  {
    id: 16,
    title: "비나리 (3402)",
    start: new Date("2025-11-01T19:00:00"),
    end: new Date("2025-11-01T20:00:00"),
    color: viridis[0],
  },
  {
    id: 17,
    title: "공포체험 (형3, 탐4)",
    start: new Date("2025-11-01T21:00:00"),
    end: new Date("2025-11-01T22:00:00"),
    color: viridis[1],
  },
];

export default items;
