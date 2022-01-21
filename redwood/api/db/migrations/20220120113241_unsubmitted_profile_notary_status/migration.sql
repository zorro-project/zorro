-- AlterTable
ALTER TABLE "UnsubmittedProfile" ADD COLUMN     "lastSubmittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "notaryApprovedAt" TIMESTAMP(3),
ADD COLUMN     "notaryViewedAt" TIMESTAMP(3);
