"use client";
import { Typography } from "@mui/material";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "./ui/button";

export default function NavigationBar() {
  const session = useSession();
  return (
    <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", padding: "0 0 0 16px" }}>
      <Link href="/" style={{ textDecoration: "none", color: "black" }}>
        <Typography variant="h4" style={{ marginTop: 20, fontWeight: 700 }}>
          SACHEDULE
        </Typography>
      </Link>
      {session.data && session.data.user && (
        <div
          style={{
            margin: 20,
            display: "flex",
            alignItems: "center",
            // backgroundColor: "lightgray",
            borderRadius: 10,
            gap: 10,
          }}
        >
          <Typography style={{ fontWeight: 400, fontSize: 16 }}>{session.data.user.name}</Typography>
          <Link href="/mybooth">
            <Button>관리자 페이지로 이동</Button>
          </Link>
          <Button variant="ghost" onClick={() => signOut({})}>
            로그아웃
          </Button>
        </div>
      )}
    </div>
  );
}
