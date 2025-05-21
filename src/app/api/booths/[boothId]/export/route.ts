// app/api/booths/[boothId]/export/route.ts
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/utils/authOptions";

export async function GET(_req: Request, { params }: { params: { boothId: string } }) {
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
  if (!booth || booth.operatorId !== session.user!.id) {
    return NextResponse.json({ error: "권한 없음" }, { status: 403 });
  }

  const startMs = booth.startAt.getTime();
  const slotMs = booth.slotInterval * 60_000;
  const totalSlots = Math.ceil((booth.endAt.getTime() - startMs) / slotMs);

  const rows = Array.from({ length: totalSlots }, (_, idx) => {
    const s = new Date(startMs + idx * slotMs);
    const e = new Date(s.getTime() + slotMs);
    const two = (n: number) => String(n).padStart(2, "0");
    const label = `${two(s.getHours())}:${two(s.getMinutes())} - ${two(e.getHours())}:${two(e.getMinutes())}`;
    const names = booth.applications.filter((a) => a.slotIndex === idx).map((a) => a.user.name);
    return { label, names };
  });

  const maxCount = Math.max(...rows.map((r) => r.names.length), 0);
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("참가자 명단");

  sheet.columns = [
    { header: "시간대", key: "slot", width: 20 },
    ...Array.from({ length: maxCount }, (_, i) => ({ header: "", key: `app${i + 1}`, width: 20 })),
  ];

  rows.forEach((r) => {
    sheet.addRow([r.label, ...r.names]);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `${booth.name} 지원자 명단.xlsx`;
  const encoded = encodeURIComponent(filename);

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      // Non-ASCII characters removed from raw filename; use RFC5987 encoding
      "Content-Disposition": `attachment; filename*=UTF-8''${encoded}`,
    },
  });
}
