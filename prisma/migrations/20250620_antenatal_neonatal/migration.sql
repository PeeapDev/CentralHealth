-- Create the new enums (except ReferralStatus which already exists)
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE "AntenatalStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'REFERRED', 'TRANSFERRED');
CREATE TYPE "CareLevel" AS ENUM ('NORMAL', 'INTENSIVE', 'CRITICAL');
CREATE TYPE "NeonatalStatus" AS ENUM ('ACTIVE', 'DISCHARGED', 'TRANSFERRED', 'DECEASED');
CREATE TYPE "DischargeStatus" AS ENUM ('READY', 'NOT_READY');

-- Create AntenatalRecord table
CREATE TABLE "AntenatalRecord" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "gestationalAge" INTEGER NOT NULL,
    "nextAppointment" TIMESTAMP(3),
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'LOW',
    "status" "AntenatalStatus" NOT NULL DEFAULT 'ACTIVE',
    "trimester" INTEGER NOT NULL DEFAULT 1,
    "lastVisitDate" TIMESTAMP(3),
    "expectedDueDate" TIMESTAMP(3) NOT NULL,
    "medicalNotes" TEXT,
    "ultrasoundReports" JSONB,
    "labResults" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "updatedByUserId" TEXT NOT NULL,

    CONSTRAINT "AntenatalRecord_pkey" PRIMARY KEY ("id")
);

-- Create NeonatalRecord table
CREATE TABLE "NeonatalRecord" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "birthWeight" DOUBLE PRECISION NOT NULL,
    "gestationalAgeAtBirth" INTEGER NOT NULL,
    "careLevel" "CareLevel" NOT NULL DEFAULT 'NORMAL',
    "status" "NeonatalStatus" NOT NULL DEFAULT 'ACTIVE',
    "dischargeStatus" "DischargeStatus",
    "apgarScore" INTEGER,
    "motherId" TEXT,
    "birthComplications" TEXT,
    "medicalNotes" TEXT,
    "feedingMethod" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "updatedByUserId" TEXT NOT NULL,

    CONSTRAINT "NeonatalRecord_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX "AntenatalRecord_patientId_idx" ON "AntenatalRecord"("patientId");
CREATE INDEX "AntenatalRecord_hospitalId_idx" ON "AntenatalRecord"("hospitalId");
CREATE INDEX "AntenatalRecord_status_idx" ON "AntenatalRecord"("status");
CREATE INDEX "AntenatalRecord_riskLevel_idx" ON "AntenatalRecord"("riskLevel");

CREATE INDEX "NeonatalRecord_patientId_idx" ON "NeonatalRecord"("patientId");
CREATE INDEX "NeonatalRecord_hospitalId_idx" ON "NeonatalRecord"("hospitalId");
CREATE INDEX "NeonatalRecord_status_idx" ON "NeonatalRecord"("status");
CREATE INDEX "NeonatalRecord_careLevel_idx" ON "NeonatalRecord"("careLevel");
CREATE INDEX "NeonatalRecord_motherId_idx" ON "NeonatalRecord"("motherId");

-- Add foreign key constraints
ALTER TABLE "AntenatalRecord" ADD CONSTRAINT "AntenatalRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AntenatalRecord" ADD CONSTRAINT "AntenatalRecord_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AntenatalRecord" ADD CONSTRAINT "AntenatalRecord_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AntenatalRecord" ADD CONSTRAINT "AntenatalRecord_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "NeonatalRecord" ADD CONSTRAINT "NeonatalRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "NeonatalRecord" ADD CONSTRAINT "NeonatalRecord_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "NeonatalRecord" ADD CONSTRAINT "NeonatalRecord_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "NeonatalRecord" ADD CONSTRAINT "NeonatalRecord_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "NeonatalRecord" ADD CONSTRAINT "NeonatalRecord_motherId_fkey" FOREIGN KEY ("motherId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
