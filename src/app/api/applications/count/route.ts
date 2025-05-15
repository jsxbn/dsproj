// app/api/applications/count/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const boothId = searchParams.get("boothId");
  if (!boothId) {
    return NextResponse.json({ error: "boothId required" }, { status: 400 });
  }
  try {
    const groups = await prisma.application.groupBy({
      by: ["slotIndex"],
      where: { boothId, isAccepted: true },
      _count: { _all: true },
    });
    // [{ slotIndex: 0, _count: 3 }, ...]
    const counts = groups.map((g) => ({
      slotIndex: g.slotIndex,
      count: g._count._all,
    }));
    return NextResponse.json({ counts });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
