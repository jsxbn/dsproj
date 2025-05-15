import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * 부스를 운영‑가능한 시간이
 *   startAt ≤ timestamp < endAt
 * 를 만족해야 하므로 실제 서비스 날짜/시간대로 맞추세요.
 */
async function main() {
  /* 1) 기존 데이터 정리 ─────────────────────────────── */
  // 관계가 있는 테이블은 자식 → 부모 순서로 지웁니다.
  // await prisma.application.deleteMany();
  // await prisma.booth.deleteMany();
  // await prisma.user.deleteMany();

  /* 2) 사용자 생성 ─────────────────────────────────── */
  const alice = await prisma.user.create({
    data: {
      studentNo: "24-086",
      name: "전수빈",
    },
  });

  const bob = await prisma.user.create({
    data: {
      studentNo: "24-101",
      name: "지수현",
    },
  });

  /* 3) 부스(Booth) 생성 ────────────────────────────── */
  const booth1 = await prisma.booth.create({
    data: {
      name: "KSA Tea", // 유니크 필드
      description: "음료 판매",
      where: "창조관 1층",
      startAt: new Date("2025-05-20T09:00:00+09:00"),
      endAt: new Date("2025-05-20T17:00:00+09:00"),
      slotInterval: 30, // 30분 단위
      capacity: 1, // 세션당 1팀
      operatorId: alice.id, // 운영자 FK
    },
  });

  const booth2 = await prisma.booth.create({
    data: {
      name: "VR Experience",
      description: "VR 체험 부스",
      where: "강당",
      startAt: new Date("2025-05-21T10:00:00+09:00"),
      endAt: new Date("2025-05-21T16:00:00+09:00"),
      slotInterval: 15,
      capacity: 4, // 세션당 4명
      operatorId: bob.id,
    },
  });

  /* 4) 신청(Application) 생성 ──────────────────────── */
  await prisma.application.createMany({
    data: [
      {
        boothId: booth1.id,
        userId: bob.id,
        slotIndex: 2, // Bubble Tea 부스 3번째 세션
        isAccepted: true,
      },
      {
        boothId: booth2.id,
        userId: alice.id,
        slotIndex: 0, // VR 부스 1번째 세션
        isAccepted: false,
      },
    ],
  });
}

main()
  .then(() => {
    console.log("🌱  Database seeding complete!");
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
