-- Create the new enums (with safety checks)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'risklevel') THEN
        CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'antenatalstatus') THEN
        CREATE TYPE "AntenatalStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'REFERRED', 'TRANSFERRED');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'carelevel') THEN
        CREATE TYPE "CareLevel" AS ENUM ('NORMAL', 'INTENSIVE', 'CRITICAL');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'neonatalstatus') THEN
        CREATE TYPE "NeonatalStatus" AS ENUM ('ACTIVE', 'DISCHARGED', 'TRANSFERRED', 'DECEASED');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dischargestatus') THEN
        CREATE TYPE "DischargeStatus" AS ENUM ('READY', 'NOT_READY');
    END IF;
END $$;

-- Create AntenatalRecord table with safety check
CREATE TABLE IF NOT EXISTS "AntenatalRecord" (
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

-- Create NeonatalRecord table with safety check
CREATE TABLE IF NOT EXISTS "NeonatalRecord" (
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

-- Create foreign key relationships if they don't exist
DO $$ 
BEGIN
    -- Add AntenatalRecord foreign keys
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'AntenatalRecord_patientId_fkey'
    ) THEN
        ALTER TABLE "AntenatalRecord" ADD CONSTRAINT "AntenatalRecord_patientId_fkey"
            FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'AntenatalRecord_hospitalId_fkey'
    ) THEN
        ALTER TABLE "AntenatalRecord" ADD CONSTRAINT "AntenatalRecord_hospitalId_fkey"
            FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'AntenatalRecord_createdByUserId_fkey'
    ) THEN
        ALTER TABLE "AntenatalRecord" ADD CONSTRAINT "AntenatalRecord_createdByUserId_fkey"
            FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'AntenatalRecord_updatedByUserId_fkey'
    ) THEN
        ALTER TABLE "AntenatalRecord" ADD CONSTRAINT "AntenatalRecord_updatedByUserId_fkey"
            FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    -- Add NeonatalRecord foreign keys
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'NeonatalRecord_patientId_fkey'
    ) THEN
        ALTER TABLE "NeonatalRecord" ADD CONSTRAINT "NeonatalRecord_patientId_fkey"
            FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'NeonatalRecord_hospitalId_fkey'
    ) THEN
        ALTER TABLE "NeonatalRecord" ADD CONSTRAINT "NeonatalRecord_hospitalId_fkey"
            FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'NeonatalRecord_createdByUserId_fkey'
    ) THEN
        ALTER TABLE "NeonatalRecord" ADD CONSTRAINT "NeonatalRecord_createdByUserId_fkey"
            FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'NeonatalRecord_updatedByUserId_fkey'
    ) THEN
        ALTER TABLE "NeonatalRecord" ADD CONSTRAINT "NeonatalRecord_updatedByUserId_fkey"
            FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'NeonatalRecord_motherId_fkey'
    ) THEN
        ALTER TABLE "NeonatalRecord" ADD CONSTRAINT "NeonatalRecord_motherId_fkey"
            FOREIGN KEY ("motherId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Create indexes for AntenatalRecord
CREATE INDEX IF NOT EXISTS "AntenatalRecord_patientId_idx" ON "AntenatalRecord"("patientId");
CREATE INDEX IF NOT EXISTS "AntenatalRecord_hospitalId_idx" ON "AntenatalRecord"("hospitalId");
CREATE INDEX IF NOT EXISTS "AntenatalRecord_status_idx" ON "AntenatalRecord"("status");
CREATE INDEX IF NOT EXISTS "AntenatalRecord_riskLevel_idx" ON "AntenatalRecord"("riskLevel");

-- Create indexes for NeonatalRecord
CREATE INDEX IF NOT EXISTS "NeonatalRecord_patientId_idx" ON "NeonatalRecord"("patientId");
CREATE INDEX IF NOT EXISTS "NeonatalRecord_hospitalId_idx" ON "NeonatalRecord"("hospitalId");
CREATE INDEX IF NOT EXISTS "NeonatalRecord_status_idx" ON "NeonatalRecord"("status");
CREATE INDEX IF NOT EXISTS "NeonatalRecord_careLevel_idx" ON "NeonatalRecord"("careLevel");
CREATE INDEX IF NOT EXISTS "NeonatalRecord_motherId_idx" ON "NeonatalRecord"("motherId");
