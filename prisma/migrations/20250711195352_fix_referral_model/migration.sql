/*
  Warnings:

  - You are about to drop the column `fromHospitalId` on the `Referral` table. All the data in the column will be lost.
  - You are about to drop the column `toHospitalId` on the `Referral` table. All the data in the column will be lost.
  - You are about to drop the `Staff` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StaffSession` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StaffTransaction` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `receivingHospitalId` to the `Referral` table without a default value. This is not possible if the table is not empty.
  - Added the required column `referringHospitalId` to the `Referral` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Referral" DROP CONSTRAINT "Referral_fromHospitalId_fkey";

-- DropForeignKey
ALTER TABLE "Referral" DROP CONSTRAINT "Referral_toHospitalId_fkey";

-- DropForeignKey
ALTER TABLE "Staff" DROP CONSTRAINT "Staff_hospitalId_fkey";

-- DropForeignKey
ALTER TABLE "StaffSession" DROP CONSTRAINT "StaffSession_staffId_fkey";

-- DropForeignKey
ALTER TABLE "StaffTransaction" DROP CONSTRAINT "StaffTransaction_staffId_fkey";

-- DropIndex
DROP INDEX "Referral_fromHospitalId_idx";

-- DropIndex
DROP INDEX "Referral_toHospitalId_idx";

-- AlterTable
ALTER TABLE "Referral" DROP COLUMN "fromHospitalId",
DROP COLUMN "toHospitalId",
ADD COLUMN     "ambulanceDispatchId" TEXT,
ADD COLUMN     "receivingHospitalId" TEXT NOT NULL,
ADD COLUMN     "referringHospitalId" TEXT NOT NULL,
ADD COLUMN     "requiresAmbulance" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "Staff";

-- DropTable
DROP TABLE "StaffSession";

-- DropTable
DROP TABLE "StaffTransaction";

-- DropEnum
DROP TYPE "StaffRole";

-- CreateIndex
CREATE INDEX "Referral_referringHospitalId_idx" ON "Referral"("referringHospitalId");

-- CreateIndex
CREATE INDEX "Referral_receivingHospitalId_idx" ON "Referral"("receivingHospitalId");

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referringHospitalId_fkey" FOREIGN KEY ("referringHospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_receivingHospitalId_fkey" FOREIGN KEY ("receivingHospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_ambulanceDispatchId_fkey" FOREIGN KEY ("ambulanceDispatchId") REFERENCES "AmbulanceDispatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
