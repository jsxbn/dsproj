import { NextResponse } from "next/server";
import { prisma } from "@/../lib/prismadb";

export async function GET(
  _req: Request,
  { params }: { params: { userId: string } }
) {
  const applications = await prisma.application.findMany({
    where: { userId: params.userId },
    include: { booth: true },
  });
  return NextResponse.json(applications);
}
