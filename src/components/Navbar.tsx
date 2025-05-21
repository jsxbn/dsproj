// app/components/NavigationBar.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Typography } from "@mui/material";
import { Bell } from "lucide-react";

import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";

export default function NavigationBar() {
  const session = useSession();

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "0 16px",
      }}
    >
      <Link href="/" style={{ textDecoration: "none", color: "black" }}>
        <Typography variant="h4" style={{ marginTop: 20, fontWeight: 700 }}>
          SACHEDULE
        </Typography>
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: 20 }}>
        {session.data?.user && (
          <>
            <Typography style={{ fontWeight: 400, fontSize: 16 }}>{session.data.user.name}</Typography>
            <Link href="/mybooth">
              <Button>관리자 페이지로 이동</Button>
            </Link>
            <Button variant="ghost" onClick={() => signOut()}>
              로그아웃
            </Button>
            <NotificationBell />
          </>
        )}
      </div>
    </div>
  );
}

function NotificationBell() {
  const [notifications, setNotifications] = useState<
    { id: string; message: string; createdAt: string; isRead: boolean }[]
  >([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  // 알림 가져오기
  useEffect(() => {
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data) => {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      });
  }, []);

  // 모두 읽음 처리
  const markAllAsRead = async () => {
    await fetch("/api/notifications/read", { method: "PATCH" });
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {notifications.length === 0 && <DropdownMenuItem disabled>새 알림이 없습니다.</DropdownMenuItem>}

        {notifications.map((n) => (
          <DropdownMenuItem key={n.id} className="flex flex-col leading-tight">
            <span className={`text-sm ${n.isRead ? "text-gray-500" : "font-medium"}`}>{n.message}</span>
            <time className="text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</time>
          </DropdownMenuItem>
        ))}

        {unreadCount > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={markAllAsRead}>모두 읽음 처리</DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
