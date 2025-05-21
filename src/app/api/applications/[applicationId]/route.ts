//api/applications/[applicationId]
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../utils/authOptions";

export async function DELETE(_req: Request, context: { params: Promise<{ applicationId: string }> }) {
  const params = await context.params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "로그인 필요" }, { status: 401 });
  }
  // const userID = await prisma.user.findUnique({
  //   where: { studentNo: session.user!.email!.slice(0, 6) },
  //   select: { id: true },
  // });

  // const application = await prisma.application.findUnique({
  //   where: { id: params.applicationId },
  // });
  // if (!application || application.userId !== userID!.id) {
  //   return NextResponse.json({ error: "취소 권한 없음" }, { status: 403 });
  // }

  const application = await prisma.application.findUnique({
    where: { id: params.applicationId },
    include: { booth: true, user: true },
  });
  if (!application) {
    return NextResponse.json({ error: "신청 내역을 찾을 수 없습니다." }, { status: 404 });
  }

  // Delete the application
  await prisma.application.delete({ where: { id: params.applicationId } });

  // Create a notification for the user
  const message = `${application.booth.name} 부스 신청이 거절되었습니다.`;
  await prisma.notification.create({
    data: {
      userId: application.userId,
      message,
    },
  });

  return NextResponse.json({ success: true });
}

export async function PATCH(req: Request, context: { params: Promise<{ applicationId: string }> }) {
  const params = await context.params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "로그인 필요" }, { status: 401 });
  }

  const { isAccepted } = await req.json();
  const app = await prisma.application.findUnique({
    where: { id: params.applicationId },
  });
  if (!app) {
    return NextResponse.json({ error: "신청을 찾을 수 없습니다." }, { status: 404 });
  }

  // isAccepted=true (승인 전환)인 경우에만 capacity 검사
  if (isAccepted) {
    const booth = await prisma.booth.findUnique({ where: { id: app.boothId } });
    if (!booth) {
      return NextResponse.json({ error: "부스를 찾을 수 없습니다." }, { status: 404 });
    }

    // 이미 승인된 신청 수만 세기
    const approvedCount = await prisma.application.count({
      where: {
        boothId: app.boothId,
        slotIndex: app.slotIndex,
        isAccepted: true,
      },
    });
    if (approvedCount >= booth.capacity) {
      return NextResponse.json({ error: "이미 최대 인원이 승인되었습니다." }, { status: 409 });
    }
  }

  // 승인/거절 상태 업데이트
  const updated = await prisma.application.update({
    where: { id: params.applicationId },
    data: { isAccepted },
  });

  return NextResponse.json(updated);
}
