// lib/api.ts
import type { Booth, Application } from "@/generated/prisma";

export async function fetchBooths() {
    const res = await fetch("/api/booths");
    if (!res.ok) throw new Error("부스 목록 조회 실패");
    return res.json() as Promise<Booth[]>;
  }
  
  export async function createBooth(data: {
    name: string;
    description?: string;
    where: string;
    startAt: string;
    endAt: string;
    slotInterval: number;
    capacity: number;
  }) {

    const res = await fetch("/api/booths", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "부스 생성 실패");
    }
    return res.json() as Promise<Booth>;
  }
  
  export async function applyForBooth(
    boothId: string,
    slotIndex: number
  ) {
    const res = await fetch("/api/applications", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ boothId, slotIndex }),
    });
    if (res.status === 409) throw new Error("이미 가득 찼거나 중복 신청입니다.");
    if (!res.ok) throw new Error("신청 실패");
    return res.json() as Promise<Application>;
  }
  
  export async function cancelApplication(appId: string) {
    const res = await fetch(`/api/applications/${appId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) throw new Error("취소 실패");
    return true;
  }
  
  export async function updateApplicationStatus(
    appId: string,
    isAccepted: boolean
  ) {
    const res = await fetch(`/api/applications/${appId}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAccepted }),
    });
    if (res.status === 409) throw new Error("이미 정원이 찼습니다.");
    if (!res.ok) throw new Error("승인 처리 실패");
    return res.json() as Promise<Application>;
  }
  
  export async function fetchPendingApplications(userId: string) {
    const res = await fetch(`/api/users/${userId}/applications/pending`);
    if (!res.ok) throw new Error("대기 신청 조회 실패");
    return res.json() as Promise<Application[]>;
  }
  
  export async function fetchApprovedBooths(userId: string) {
    const res = await fetch(`/api/users/${userId}/booths`);
    if (!res.ok) throw new Error("승인된 부스 조회 실패");
    return res.json() as Promise<Booth[]>;
  }
  