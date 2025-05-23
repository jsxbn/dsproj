//app/api/booth/route.ts
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../utils/authOptions";

export async function GET() {
  const booths = await prisma.booth.findMany({
    include: {
      applications: {
        include: {
          user: { select: { studentNo: true, id: true } },
        },
      },
    },
  });
  return NextResponse.json(booths);
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "로그인 필요" }, { status: 401 });
    }

    const { name, description, where, startAt, endAt, slotInterval, capacity } = await req.json();

    const userID = session.user?.id;

    const booth = await prisma.booth.create({
      data: {
        name,
        description,
        where,
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        slotInterval,
        capacity,
        operatorId: userID!,
      },
    });

    return NextResponse.json(booth, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "서버 오류" }, { status: 500 });
  }
}
