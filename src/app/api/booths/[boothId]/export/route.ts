// app/api/booths/[boothId]/export/route.ts
import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/utils/authOptions";

export async function GET(_req: Request, context: { params: Promise<{ boothId: string }> }) {
  const params = await context.params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const booth = await prisma.booth.findUnique({
    where: { id: params.boothId },
    include: {
      applications: {
        where: { isAccepted: true },
        include: { user: { select: { name: true } } },
      },
    },
  });
  if (!booth || booth.operatorId !== session?.user?.id) {
    return NextResponse.json({ error: "권한 없음" }, { status: 403 });
  }

  // Calculate slots
  const startMs = booth.startAt.getTime();
  const slotMs = booth.slotInterval * 60_000;
  const totalSlots = Math.ceil((booth.endAt.getTime() - startMs) / slotMs);

  // Prepare rows: each slot with its approved applicants
  const rows = Array.from({ length: totalSlots }, (_, idx) => {
    const s = new Date(startMs + idx * slotMs);
    const e = new Date(s.getTime() + slotMs);
    const startStr = s.toLocaleTimeString("ko-KR", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Seoul",
    });
    const endStr = e.toLocaleTimeString("ko-KR", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Seoul",
    });
    const label = `${startStr} - ${endStr}`;
    const names = booth.applications.filter((a) => a.slotIndex === idx).map((a) => a.user.name);
    return { label, names };
  });

  // Determine max number of applicants in any slot
  const maxCount = Math.max(...rows.map((r) => r.names.length), 0);
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("참가자 명단");

  // Define columns: first for slot label, then unnamed applicant columns
  sheet.columns = [
    { header: "시간대", key: "slot", width: 20 },
    ...Array.from({ length: maxCount }, () => ({ header: "", key: `app`, width: 20 })),
  ];

  // Add data rows without padding empty cells
  rows.forEach((r) => {
    sheet.addRow([r.label, ...r.names]);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  // Filename uses booth name and UTF-8 encoding only via filename*
  const filename = `${booth.name} 지원자 명단.xlsx`;
  const encoded = encodeURIComponent(filename);

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${encoded}`,
    },
  });
}
