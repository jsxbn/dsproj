"use client";
import { Box, Typography } from "@mui/material";
import { useState, useEffect } from "react";
import SegmentedControl from "@/components/SegmentedControl";
import { Option } from "@/components/SegmentedControl";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ApplicationsViewer from "@/components/ApplicationsViewer";
import { User, Booth, Application } from "./utils/schemaTypes";

// const viridis = ["#210F37", "#4F1C51", "#A55B4B", "#DCA06D"];

const TimeLineViewer = dynamic(() => import("../components/TimeLineViewer"), {
  ssr: false,
});

export default function MyApp() {
  const session = useSession();
  const router = useRouter();
  const [view, setView] = useState<string>("2024-11-01");
  const [loadingData, setLoadingData] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [booths, setBooths] = useState<Booth[]>([]);

  //TODO: deploy 시 이 부분 주석 해제
  // useEffect(() => {
  //   if (session.status === "unauthenticated") {
  //     router.replace("/login");
  //   }
  // }, [session.status, router]);
  useEffect(() => {
    if (session.status === "unauthenticated") {
      router.replace("/api/auth/signin");
    }
  }, [session.status, router]);

  useEffect(() => {
    if (session.status === "authenticated" && session?.data?.user?.id) {
      setLoadingData(true);
      fetch(`/api/users/${session.data.user.id}/applications`)
        .then((res) => res.json())
        .then((data) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const fixed = data.map((b: any) => ({
            ...b,
            createdAt: new Date(b.createdAt),
          }));
          setApplications(fixed);
          console.log("데이터데이터!!!", data);
        })
        .finally(() => setLoadingData(false));
      fetch(`/api/booths`)
        .then((res) => res.json())
        .then((data) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const fixed = data.map((b: any) => ({
            ...b,
            startAt: new Date(b.startAt),
            endAt: new Date(b.endAt),
            createdAt: new Date(b.createdAt),
          }));
          setBooths(fixed);
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
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        데이터 로딩중{" "}
      </div>
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
      {/* <ApplicationsViewer /> */}
      <Typography variant="h5" fontWeight={500} style={{ marginBottom: 10 }}>
        SAC 전체일정
      </Typography>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          border: "1px solid #EEE",
          px: 2,
          py: 2,
          borderRadius: 3,
        }}
      >
        <SegmentedControl options={options} value={view} onChange={setView} />
        <div style={{ height: 4 }} />
        <TimeLineViewer
          items={booths}
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
          // markerLineColor="#CCC"
          applications={applications}
        />
      </Box>
      <ApplicationsViewer applications={applications}></ApplicationsViewer>
    </Box>
  );
}
