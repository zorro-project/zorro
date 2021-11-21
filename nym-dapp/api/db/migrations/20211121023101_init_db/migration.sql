-- CreateEnum
CREATE TYPE "ProfileStatus" AS ENUM ('submitted_via_notary', 'challenged', 'deemed_valid', 'deemed_invalid');

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
    "ethAddress" TEXT NOT NULL,
    "email" TEXT,
    "unaddressedFeedbackId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UnsubmittedProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CachedProfile" (
    "profileId" TEXT NOT NULL,
    "cid" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "submitter_address" TEXT NOT NULL,
    "submission_timestamp" TIMESTAMP(3) NOT NULL,
    "is_notarized" BOOLEAN NOT NULL,
    "photoCID" TEXT,
    "videoCID" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CachedProfile_pkey" PRIMARY KEY ("profileId")
);

-- CreateTable
CREATE TABLE "CachedChallenge" (
    "profileId" INTEGER NOT NULL,
    "last_recorded_status" TEXT NOT NULL,
    "challenge_timestamp" TEXT NOT NULL,
    "challenger_address" TEXT NOT NULL,
    "challenge_evidence_cid" TEXT NOT NULL,
    "profile_owner_evidence_cid" TEXT NOT NULL,
    "adjudication_timestamp" TEXT NOT NULL,
    "adjudicator_evidence_cid" TEXT NOT NULL,
    "did_adjudicator_confirm_profile" TEXT NOT NULL,
    "appeal_timestamp" TEXT NOT NULL,
    "super_adjudication_timestamp" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CachedChallenge_pkey" PRIMARY KEY ("profileId")
);

-- CreateIndex
CREATE INDEX "NotaryFeedback_unsubmittedProfileId_idx" ON "NotaryFeedback"("unsubmittedProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "UnsubmittedProfile_ethAddress_key" ON "UnsubmittedProfile"("ethAddress");

-- CreateIndex
CREATE UNIQUE INDEX "CachedProfile_address_key" ON "CachedProfile"("address");

-- AddForeignKey
ALTER TABLE "NotaryFeedback" ADD CONSTRAINT "NotaryFeedback_unsubmittedProfileId_fkey" FOREIGN KEY ("unsubmittedProfileId") REFERENCES "UnsubmittedProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnsubmittedProfile" ADD CONSTRAINT "UnsubmittedProfile_unaddressedFeedbackId_fkey" FOREIGN KEY ("unaddressedFeedbackId") REFERENCES "NotaryFeedback"("id") ON DELETE SET NULL ON UPDATE CASCADE;
