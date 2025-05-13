import { NextResponse } from "next/server";
import { prisma } from "@/../lib/prismadb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/utils/authOptions";
// import getStudentID from "@/app/api/methods/getStudentID";

function getStudentID(email:string){
    return email.slice(0,6);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "로그인 필요" }, { status: 401 });
  }

  const { boothId, slotIndex } = await req.json();
  try {
    const userID = await prisma.user.findUnique({
      where : {studentNo: getStudentID(session.user!.email!)},
      select: {id:true}
    })
    const boothID = await prisma.booth.findUnique({
      where: {name: boothId},
      select: {id:true}
    })
    const booth = await prisma.booth.findUnique({ where: { id: boothID.id } });
    if (!booth) {
      return NextResponse.json({ error: "부스를 찾을 수 없습니다." }, { status: 404 });
    }
  
    const application = await prisma.application.create({
      data: {
        boothId: boothID.id,
        userId: userID.id,
        slotIndex,
        // isAccepted는 기본값(false)이므로 생략 가능
      },
    });
  
    return NextResponse.json(application, { status: 201 });

  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json(
        { error: "이미 신청된 부스입니다." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
