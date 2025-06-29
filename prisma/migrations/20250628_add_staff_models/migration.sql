-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('DOCTOR', 'NURSE', 'ADMIN', 'RECEPTIONIST', 'PHARMACIST', 'LAB_TECHNICIAN', 'RADIOLOGIST', 'ACCOUNTANT', 'HR_MANAGER', 'STAFF', 'SUPERADMIN');

-- CreateTable
CREATE TABLE "Staff" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "StaffRole" NOT NULL DEFAULT 'STAFF',
    "hospitalId" TEXT,
    "specialties" TEXT[],
    "isHospitalAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLogin" TIMESTAMP(3),
    "profilePicture" TEXT,
    "gender" TEXT,
    "shift" TEXT,
    "department" TEXT,
    "walletBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "telemedicineEnabled" BOOLEAN NOT NULL DEFAULT false,
    "onlineBookingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "taxRate" DOUBLE PRECISION,
    "salary" DOUBLE PRECISION,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffSession" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "StaffSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffTransaction" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" "TransactionType" NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'COMPLETED',
    "description" TEXT,
    "reference" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Staff_email_key" ON "Staff"("email");

-- CreateIndex
CREATE INDEX "Staff_email_idx" ON "Staff"("email");

-- CreateIndex
CREATE INDEX "Staff_hospitalId_idx" ON "Staff"("hospitalId");

-- CreateIndex
CREATE INDEX "Staff_role_idx" ON "Staff"("role");

-- CreateIndex
CREATE INDEX "Staff_isHospitalAdmin_idx" ON "Staff"("isHospitalAdmin");

-- CreateIndex
CREATE INDEX "Staff_isSuperAdmin_idx" ON "Staff"("isSuperAdmin");

-- CreateIndex
CREATE UNIQUE INDEX "StaffSession_token_key" ON "StaffSession"("token");

-- CreateIndex
CREATE INDEX "StaffSession_staffId_idx" ON "StaffSession"("staffId");

-- CreateIndex
CREATE INDEX "StaffSession_token_idx" ON "StaffSession"("token");

-- CreateIndex
CREATE INDEX "StaffSession_expiresAt_idx" ON "StaffSession"("expiresAt");

-- CreateIndex
CREATE INDEX "StaffTransaction_staffId_idx" ON "StaffTransaction"("staffId");

-- CreateIndex
CREATE INDEX "StaffTransaction_type_idx" ON "StaffTransaction"("type");

-- CreateIndex
CREATE INDEX "StaffTransaction_status_idx" ON "StaffTransaction"("status");

-- CreateIndex
CREATE INDEX "StaffTransaction_createdAt_idx" ON "StaffTransaction"("createdAt");

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffSession" ADD CONSTRAINT "StaffSession_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffTransaction" ADD CONSTRAINT "StaffTransaction_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
