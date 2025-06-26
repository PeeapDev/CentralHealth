-- CreateTable
CREATE TABLE "profile_pictures" (
    "id" TEXT NOT NULL,
    "patientId" TEXT,
    "userId" TEXT,
    "imageUrl" TEXT NOT NULL,
    "imageData" BYTEA,
    "mimeType" TEXT NOT NULL,
    "filename" TEXT,
    "size" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "uploadedBy" TEXT,
    "ownerType" TEXT NOT NULL,

    CONSTRAINT "profile_pictures_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profile_pictures_patientId_key" ON "profile_pictures"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "profile_pictures_userId_key" ON "profile_pictures"("userId");

-- CreateIndex
CREATE INDEX "profile_pictures_patientId_idx" ON "profile_pictures"("patientId");

-- CreateIndex
CREATE INDEX "profile_pictures_userId_idx" ON "profile_pictures"("userId");

-- AddForeignKey
ALTER TABLE "profile_pictures" ADD CONSTRAINT "profile_pictures_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_pictures" ADD CONSTRAINT "profile_pictures_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
