-- CreateEnum
CREATE TYPE "ProfileStatus" AS ENUM ('submitted_via_notary', 'challenged', 'deemed_valid', 'deemed_invalid');

-- CreateEnum
CREATE TYPE "ChallengeStatus" AS ENUM ('not_challenged', 'challenged', 'adjudicated', 'adjudication_opportunity_expired', 'appealed', 'appeal_opportunity_expired', 'super_adjudicated', 'super_adjudication_opportunity_expired', 'settled');

-- CreateTable
CREATE TABLE "NotaryFeedback" (
    "id" SERIAL NOT NULL,
    "unsubmittedProfileId" INTEGER NOT NULL,
    "feedback" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotaryFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnsubmittedProfile" (
    "id" SERIAL NOT NULL,
    "photoCID" TEXT NOT NULL,
    "videoCID" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "email" TEXT,
    "unaddressedFeedbackId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UnsubmittedProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CachedProfile" (
    "id" INTEGER NOT NULL,
    "cache" JSONB NOT NULL,
    "notarized" BOOLEAN NOT NULL,
    "address" TEXT NOT NULL,
    "submissionTimestamp" TIMESTAMP(3) NOT NULL,
    "CID" TEXT,
    "photoCID" TEXT,
    "videoCID" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CachedProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CachedChallenge" (
    "profileId" INTEGER NOT NULL,
    "cache" JSONB NOT NULL,
    "lastRecordedStatus" "ChallengeStatus" NOT NULL,
    "challengeTimestamp" TIMESTAMP(3),
    "adjudicationTimestamp" TIMESTAMP(3),
    "superAdjudicationTimestamp" TIMESTAMP(3),
    "challengeEvidence" TEXT,
    "profileOwnerEvidence" TEXT,
    "adjudicatorEvidence" TEXT,
    "didAdjudicatorConfirmProfile" BOOLEAN NOT NULL,
    "appealTimestamp" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CachedChallenge_pkey" PRIMARY KEY ("profileId")
);

-- CreateIndex
CREATE INDEX "NotaryFeedback_unsubmittedProfileId_idx" ON "NotaryFeedback"("unsubmittedProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "UnsubmittedProfile_address_key" ON "UnsubmittedProfile"("address");

-- CreateIndex
CREATE UNIQUE INDEX "CachedProfile_address_key" ON "CachedProfile"("address");

-- AddForeignKey
ALTER TABLE "NotaryFeedback" ADD CONSTRAINT "NotaryFeedback_unsubmittedProfileId_fkey" FOREIGN KEY ("unsubmittedProfileId") REFERENCES "UnsubmittedProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnsubmittedProfile" ADD CONSTRAINT "UnsubmittedProfile_unaddressedFeedbackId_fkey" FOREIGN KEY ("unaddressedFeedbackId") REFERENCES "NotaryFeedback"("id") ON DELETE SET NULL ON UPDATE CASCADE;
