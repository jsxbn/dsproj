/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Booth` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Booth_name_key" ON "Booth"("name");
