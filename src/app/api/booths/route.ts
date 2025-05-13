import { NextResponse } from "next/server";
import { prisma } from "@/../lib/prismadb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../utils/authOptions";


export async function GET() {
  const booths = await prisma.booth.findMany();
  return NextResponse.json(booths);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "로그인 필요" }, { status: 401 });
  }

  const {
    name,
    description,
    where,
    startAt,
    endAt,
    slotInterval,
    capacity,
  } = await req.json();
  
  const userID = await prisma.user.findUnique({
    where: {studentNo: session.user!.email!.slice(0,6)},
    select: {id:true}
  })

  const booth = await prisma.booth.create({
    data: {
      name,
      description,
      where,
      startAt: new Date(startAt),
      endAt: new Date(endAt),
      slotInterval,
      capacity,
      operatorId: userID,
    },
  });

  return NextResponse.json(booth, { status: 201 });
}
