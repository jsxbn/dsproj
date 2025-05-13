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
  const today = new Date("2025-11-01");
  today.setHours(9, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const [view, setView] = useState<string>("one");

  useEffect(() => {
    if (session.status === "unauthenticated") {
      router.replace("/login");
    }
  }, [session.status, router]);

  if (session.status !== "authenticated") {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>LOADING</div>
    );
  }

  const options: Option[] = [
    { value: "one", label: "전야제" },
    { value: "two", label: "1일차" },
    { value: "three", label: "2일차" },
    { value: "four", label: "3일차" },
  ];

  return (
    <Box px={2}>
      <div style={{}}>
        <h1>SAC_HEDULE</h1>
      </div>
      <h1 style={{ fontWeight: 200, color: "red", fontFamily: "times", fontSize: 40 }}>
        <strong>4</strong>일남았다 좆됐다!
      </h1>
      <Container sx={{ py: 4 }}>
        <SegmentedControl options={options} value={view} onChange={setView} />
        <TimeLineViewer
          items={items}
          // 하루 전체 00:00 ~ 24:00 고정
          rangeStart={today}
          rangeEnd={tomorrow}
          // 6시간마다 라인
          markerIntervalHours={3}
          // marker 라벨 영역 공간(px)
          markerLabelHeight={20}
          // 한 줄 높이(px)
          laneHeight={40}
          // bar 위아래 여백(px)
          barVerticalPadding={6}
          // Now 라인 색상
          nowLineColor="#E91E63"
          // marker 라인 색상
          markerLineColor="#CCC"
        />
      </Container>
      <Button>click here</Button>
    </Box>
  );
}
