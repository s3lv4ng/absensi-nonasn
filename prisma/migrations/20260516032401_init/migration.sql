-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "buktiDukung" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedBy" TEXT,
ADD COLUMN     "editReason" TEXT,
ADD COLUMN     "editedAt" TIMESTAMP(3),
ADD COLUMN     "editedBy" TEXT,
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "OfficeSetting" ADD COLUMN     "pwaIcon192Path" TEXT,
ADD COLUMN     "pwaIcon512Path" TEXT;

-- CreateIndex
CREATE INDEX "Attendance_isDeleted_idx" ON "Attendance"("isDeleted");
