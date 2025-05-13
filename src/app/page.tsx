"use client";
import { Box, Button, Typography, Container, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { useState, useEffect } from "react";
import SegmentedControl from "@/components/SegmentedControl";
import { Option } from "@/components/SegmentedControl";
import items from "./sampleData";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

// const viridis = ["#210F37", "#4F1C51", "#A55B4B", "#DCA06D"];

const TimeLineViewer = dynamic(() => import("../components/TimeLineViewer"), {
  ssr: false,
});

export default function MyApp() {
  const session = useSession();
  const router = useRouter();
  const [view, setView] = useState<string>("2024-11-01");

  useEffect(() => {
    if (session.status === "unauthenticated") {
      router.replace("/login");
    }
  }, [session.status, router]);

  function getSelectedDay(dateString: string) {
    const d = new Date(dateString);
    d.setHours(9, 0, 0, 0);
    return d;
  }
  function getTomorrow(dateString: string) {
    const d = new Date(dateString);
    d.setDate(d.getDate() + 1);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  if (session.status !== "authenticated") {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>LOADING</div>
    );
  }

  const options: Option[] = [
    { value: "2024-10-31", label: "전야제" },
    { value: "2024-11-01", label: "1일차" },
    { value: "2024-11-02", label: "2일차" },
    { value: "2024-11-03", label: "3일차" },
  ];

  return (
    <Box px={2} maxWidth={3000}>
      <h1 style={{ fontWeight: 200, color: "red", fontFamily: "times", fontSize: 40 }}>
        <strong></strong>하석준바보
      </h1>
      <Box sx={{ py: 4 }}>
        <SegmentedControl options={options} value={view} onChange={setView} />
        <TimeLineViewer
          items={items}
          // 하루 전체 00:00 ~ 24:00 고정
          rangeStart={getSelectedDay(view)}
          rangeEnd={getTomorrow(view)}
          // 6시간마다 라인
          markerIntervalHours={3}
          // marker 라벨 영역 공간(px)
          markerLabelHeight={30}
          // 한 줄 높이(px)
          laneHeight={45}
          // bar 위아래 여백(px)
          barVerticalPadding={6}
          // Now 라인 색상
          nowLineColor="#E91E63"
          // marker 라인 색상
          markerLineColor="#CCC"
        />
      </Box>
      <Button>click here</Button>
    </Box>
  );
}
