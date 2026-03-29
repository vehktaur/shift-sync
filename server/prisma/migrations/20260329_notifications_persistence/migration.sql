-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'manager', 'staff');

-- CreateEnum
CREATE TYPE "AccessScope" AS ENUM ('all_locations');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');

-- CreateEnum
CREATE TYPE "ShiftState" AS ENUM ('scheduled', 'open', 'warning', 'blocked', 'pending');

-- CreateEnum
CREATE TYPE "CoverageRequestType" AS ENUM ('swap', 'drop');

-- CreateEnum
CREATE TYPE "CoverageRequestStatus" AS ENUM ('pending_counterparty', 'pending_manager', 'open', 'rejected', 'approved', 'cancelled', 'expired');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('shift_assigned', 'shift_changed', 'schedule_published', 'coverage_request', 'coverage_resolved', 'overtime_warning', 'availability_changed');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "accessScope" "AccessScope",
    "desiredHours" INTEGER,
    "demoPassword" TEXT,
    "staffSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "timeZone" TEXT NOT NULL,
    "timeZoneLabel" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "addressLine" TEXT NOT NULL,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManagerLocation" (
    "userId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,

    CONSTRAINT "ManagerLocation_pkey" PRIMARY KEY ("userId","locationId")
);

-- CreateTable
CREATE TABLE "StaffLocationCertification" (
    "userId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "certifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffLocationCertification_pkey" PRIMARY KEY ("userId","locationId")
);

-- CreateTable
CREATE TABLE "RecurringAvailability" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,

    CONSTRAINT "RecurringAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvailabilityException" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "isAvailable" BOOLEAN NOT NULL,

    CONSTRAINT "AvailabilityException_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvailabilityExceptionWindow" (
    "id" TEXT NOT NULL,
    "exceptionId" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,

    CONSTRAINT "AvailabilityExceptionWindow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shift" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "startsAtUtc" TIMESTAMPTZ(6) NOT NULL,
    "endsAtUtc" TIMESTAMPTZ(6) NOT NULL,
    "requiredSkill" TEXT NOT NULL,
    "headcount" INTEGER NOT NULL,
    "published" BOOLEAN NOT NULL,
    "premium" BOOLEAN NOT NULL,
    "cutoffHours" INTEGER NOT NULL,
    "forceCutoffPassed" BOOLEAN NOT NULL DEFAULT false,
    "createdByUserId" TEXT NOT NULL,
    "updatedByUserId" TEXT NOT NULL,
    "updatedAtUtc" TIMESTAMPTZ(6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftAssignment" (
    "shiftId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShiftAssignment_pkey" PRIMARY KEY ("shiftId","userId")
);

-- CreateTable
CREATE TABLE "ShiftAudit" (
    "id" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "atUtc" TIMESTAMPTZ(6) NOT NULL,
    "before" JSONB,
    "after" JSONB,

    CONSTRAINT "ShiftAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoverageRequest" (
    "id" TEXT NOT NULL,
    "type" "CoverageRequestType" NOT NULL,
    "shiftId" TEXT NOT NULL,
    "requestedByUserId" TEXT NOT NULL,
    "counterpartUserId" TEXT,
    "claimantUserId" TEXT,
    "status" "CoverageRequestStatus" NOT NULL,
    "createdAtUtc" TIMESTAMPTZ(6) NOT NULL,
    "updatedAtUtc" TIMESTAMPTZ(6) NOT NULL,
    "expiresAtUtc" TIMESTAMPTZ(6) NOT NULL,
    "note" TEXT NOT NULL,
    "cancellationReason" TEXT,

    CONSTRAINT "CoverageRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "userId" TEXT NOT NULL,
    "scheduleUpdates" BOOLEAN NOT NULL DEFAULT true,
    "coverageUpdates" BOOLEAN NOT NULL DEFAULT true,
    "overtimeWarnings" BOOLEAN NOT NULL DEFAULT true,
    "availabilityUpdates" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "readAtUtc" TIMESTAMPTZ(6),
    "createdAtUtc" TIMESTAMPTZ(6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Location_code_key" ON "Location"("code");

-- CreateIndex
CREATE INDEX "RecurringAvailability_userId_dayOfWeek_idx" ON "RecurringAvailability"("userId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "AvailabilityException_userId_date_idx" ON "AvailabilityException"("userId", "date");

-- CreateIndex
CREATE INDEX "Shift_locationId_startsAtUtc_idx" ON "Shift"("locationId", "startsAtUtc");

-- CreateIndex
CREATE INDEX "ShiftAssignment_userId_idx" ON "ShiftAssignment"("userId");

-- CreateIndex
CREATE INDEX "ShiftAudit_shiftId_atUtc_idx" ON "ShiftAudit"("shiftId", "atUtc");

-- CreateIndex
CREATE INDEX "CoverageRequest_shiftId_status_idx" ON "CoverageRequest"("shiftId", "status");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAtUtc_idx" ON "Notification"("userId", "createdAtUtc");

-- CreateIndex
CREATE INDEX "Notification_userId_readAtUtc_idx" ON "Notification"("userId", "readAtUtc");

-- AddForeignKey
ALTER TABLE "ManagerLocation" ADD CONSTRAINT "ManagerLocation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManagerLocation" ADD CONSTRAINT "ManagerLocation_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffLocationCertification" ADD CONSTRAINT "StaffLocationCertification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffLocationCertification" ADD CONSTRAINT "StaffLocationCertification_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringAvailability" ADD CONSTRAINT "RecurringAvailability_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityException" ADD CONSTRAINT "AvailabilityException_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityExceptionWindow" ADD CONSTRAINT "AvailabilityExceptionWindow_exceptionId_fkey" FOREIGN KEY ("exceptionId") REFERENCES "AvailabilityException"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftAssignment" ADD CONSTRAINT "ShiftAssignment_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftAssignment" ADD CONSTRAINT "ShiftAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftAudit" ADD CONSTRAINT "ShiftAudit_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftAudit" ADD CONSTRAINT "ShiftAudit_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoverageRequest" ADD CONSTRAINT "CoverageRequest_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoverageRequest" ADD CONSTRAINT "CoverageRequest_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoverageRequest" ADD CONSTRAINT "CoverageRequest_counterpartUserId_fkey" FOREIGN KEY ("counterpartUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoverageRequest" ADD CONSTRAINT "CoverageRequest_claimantUserId_fkey" FOREIGN KEY ("claimantUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
