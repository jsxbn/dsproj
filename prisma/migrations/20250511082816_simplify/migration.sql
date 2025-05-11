/*
  Warnings:

  - You are about to drop the column `appliedAt` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `groupId` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `respondedAt` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `sessionId` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `allowGroup` on the `Booth` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Booth` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `GroupApplication` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Session` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[boothId,slotIndex,userId]` on the table `Application` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `boothId` to the `Application` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slotIndex` to the `Application` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endAt` to the `Booth` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startAt` to the `Booth` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Application" DROP CONSTRAINT "Application_groupId_fkey";

-- DropForeignKey
ALTER TABLE "Application" DROP CONSTRAINT "Application_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "GroupApplication" DROP CONSTRAINT "GroupApplication_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "GroupApplication" DROP CONSTRAINT "GroupApplication_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_boothId_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_creatorId_fkey";

-- DropIndex
DROP INDEX "Application_sessionId_userId_key";

-- AlterTable
ALTER TABLE "Application" DROP COLUMN "appliedAt",
DROP COLUMN "groupId",
DROP COLUMN "respondedAt",
DROP COLUMN "sessionId",
DROP COLUMN "status",
ADD COLUMN     "boothId" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isAccepted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "slotIndex" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Booth" DROP COLUMN "allowGroup",
DROP COLUMN "updatedAt",
ADD COLUMN     "endAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "startAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "updatedAt";

-- DropTable
DROP TABLE "GroupApplication";

-- DropTable
DROP TABLE "Session";

-- DropEnum
DROP TYPE "Status";

-- CreateIndex
CREATE UNIQUE INDEX "Application_boothId_slotIndex_userId_key" ON "Application"("boothId", "slotIndex", "userId");

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_boothId_fkey" FOREIGN KEY ("boothId") REFERENCES "Booth"("id") ON DELETE CASCADE ON UPDATE CASCADE;
