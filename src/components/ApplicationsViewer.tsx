"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

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

export default function ApplicationsViewer() {
  const { data: session, status } = useSession();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      setLoading(true);
      fetch(`/api/users/${session.user.id}/applications`)
        .then((res) => res.json())
        .then((data) => {
          setApplications(data);
        })
        .finally(() => setLoading(false));
    }
  }, [status, session?.user?.id]);

  if (status === "loading") return <div>Loading session...</div>;
  if (status !== "authenticated") return <div>로그인이 필요합니다.</div>;

  if (loading) return <div>Loading applications...</div>;
  if (!applications.length) return <div>지원 내역이 없습니다.</div>;

  return (
    <div>
      <h2>내 지원 내역</h2>
      <ul>
        {applications.map((app) => (
          <li key={app.id}>
            <div>
              <strong>부스명:</strong> {app.booth.name}
              <br />
              <strong>상태:</strong> {app.status}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
