import { NextResponse } from "next/server";
import { prisma } from "@/../lib/prismadb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../utils/authOptions";

export async function DELETE( 
  _req: Request,
  { params }: { params: { applicationId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "로그인 필요" }, { status: 401 });
  }
  const userID = await prisma.user.findUnique({
    where: {studentNo: session.user!.email!.slice(0,6)},
    select: {id:true}
  })

  const application = await prisma.application.findUnique({
    where: { id: params.applicationId },
  });
  if (!application || application.userId !== userID) {
    return NextResponse.json({ error: "취소 권한 없음" }, { status: 403 });
  }

  await prisma.application.delete({ where: { id: params.applicationId } });
  return NextResponse.json({ success: true });
}

export async function PATCH(
  req: Request,
  { params }: { params: { applicationId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "로그인 필요" }, { status: 401 });
  }

  const { isAccepted } = await req.json();
  const updated = await prisma.application.update({
    where: { id: params.applicationId },
    data: { isAccepted },
  });
  return NextResponse.json(updated);
}
