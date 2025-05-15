import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(_req: Request, context: { params: Promise<{ userId: string }> }) {
  const params = await context.params;
  const applications = await prisma.application.findMany({
    where: { userId: params.userId },
    include: { booth: true },
  });
  return NextResponse.json(applications);
}
