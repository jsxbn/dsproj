"use client";
import { Box, Button, Typography } from "@mui/material";
import { useState, useEffect } from "react";
import SegmentedControl from "@/components/SegmentedControl";
import { Option } from "@/components/SegmentedControl";
import items from "./sampleData";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ApplicationsViewer from "@/components/ApplicationsViewer";

// const viridis = ["#210F37", "#4F1C51", "#A55B4B", "#DCA06D"];

type Booth = {
  id: string;
  name: string;
  // 추가적으로 필요한 booth 모델의 필드들
};

type Application = {
  id: string;
  boothId: string;
  userId: string;
  status: string;
  booth: Booth;
  // application 모델에 맞게 필드 추가
};

const TimeLineViewer = dynamic(() => import("../components/TimeLineViewer"), {
  ssr: false,
});

export default function MyApp() {
  const session = useSession();
  const router = useRouter();
  const [view, setView] = useState<string>("2024-11-01");
  const [loadingData, setLoadingData] = useState(true);
  const [Applications, setApplications] = useState<Application[]>([]);

  useEffect(() => {
    if (session.status === "unauthenticated") {
      router.replace("/login");
    }
  }, [session.status, router]);

  useEffect(() => {
    if (session.status === "authenticated" && session?.data?.user?.id) {
      setLoadingData(true);
      fetch(`/api/users/${session.data.user.id}/applications`)
        .then((res) => res.json())
        .then((data) => {
          setApplications(data);
          console.log("데이터데이터!!!", data);
        })
        .finally(() => setLoadingData(false));
    }
  }, [session.status, session?.data?.user?.id]);

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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        사용자 인증 중
      </div>
    );
  }

  if (loadingData) {
    return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>북 </div>;
  }

  const options: Option[] = [
    { value: "2024-10-31", label: "전야제" },
    { value: "2024-11-01", label: "1일차" },
    { value: "2024-11-02", label: "2일차" },
    { value: "2024-11-03", label: "3일차" },
  ];

  return (
    <Box px={2} maxWidth={3000}>
      <ApplicationsViewer />
      <Typography variant="h5" fontWeight={700} style={{ marginBottom: 10 }}>
        SAC 전체일정
      </Typography>
      <Box
        sx={{
          py: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          border: "1px solid #EEE",
          padding: 1,
          borderRadius: 5,
        }}
      >
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
