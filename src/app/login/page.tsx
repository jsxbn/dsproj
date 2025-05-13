// app/login/page.tsx
"use client";

import { useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@mui/material";

export default function LoginPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useSearchParams();
  const error = params.get("error");

  // 이미 로그인된 상태면 메인으로 이동
  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [status, router]);

  // 에러(도메인 불일치) 표시
  useEffect(() => {
    if (error === "AccessDenied") {
      alert("⚠️ @ksa.hs.kr 구글 계정으로만 로그인할 수 있습니다.");
    }
  }, [error]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        gap: 10,
      }}
    >
      <h1 style={{ fontSize: 32, fontWeight: "bold" }}>SACHEDULE</h1>
      <Button
        variant="outlined"
        onClick={() =>
          signIn("google", {
            callbackUrl: "/",
          })
        }
        style={{
          padding: "10px 20px",
          fontSize: 16,
          cursor: "pointer",
        }}
      >
        Google(@ksa.hs.kr)로 로그인
      </Button>
    </div>
  );
}
