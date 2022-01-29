/*
  Warnings:

  - You are about to drop the `NotaryFeedback` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UnsubmittedProfile` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "NotaryFeedback" DROP CONSTRAINT "NotaryFeedback_unsubmittedProfileId_fkey";

-- DropForeignKey
ALTER TABLE "UnsubmittedProfile" DROP CONSTRAINT "UnsubmittedProfile_unaddressedFeedbackId_fkey";

-- DropTable
DROP TABLE "NotaryFeedback";

-- DropTable
DROP TABLE "UnsubmittedProfile";

-- CreateTable
CREATE TABLE "RegistrationAttempt" (
    "id" SERIAL NOT NULL,
    "ethereumAddress" TEXT NOT NULL,
    "photoCid" TEXT NOT NULL,
    "videoCid" TEXT NOT NULL,
    "notaryViewedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" INTEGER,
    "approved" BOOLEAN,
    "deniedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegistrationAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RegistrationAttempt_ethereumAddress_idx" ON "RegistrationAttempt"("ethereumAddress");

-- CreateIndex
CREATE INDEX "RegistrationAttempt_ethereumAddress_approved_idx" ON "RegistrationAttempt"("ethereumAddress", "approved");

-- AddForeignKey
ALTER TABLE "RegistrationAttempt" ADD CONSTRAINT "RegistrationAttempt_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
