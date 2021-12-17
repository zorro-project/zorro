-- CreateEnum
CREATE TYPE "StatusEnum" AS ENUM ('NOT_CHALLENGED', 'CHALLENGED', 'ADJUDICATION_ROUND_COMPLETED', 'APPEALED', 'APPEAL_OPPORTUNITY_EXPIRED', 'SUPER_ADJUDICATION_ROUND_COMPLETED', 'SETTLED');

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
    "CID" TEXT,
    "photoCID" TEXT,
    "videoCID" TEXT,
    "starknetAddress" TEXT NOT NULL,
    "ethereumAddress" TEXT NOT NULL,
    "submissionTimestamp" TIMESTAMP(3) NOT NULL,
    "notarized" BOOLEAN NOT NULL,
    "lastRecordedStatus" "StatusEnum" NOT NULL,
    "challengeTimestamp" TIMESTAMP(3),
    "challengerAddress" TEXT,
    "challengeEvidenceCID" TEXT,
    "ownerEvidenceCID" TEXT,
    "adjudicationTimestamp" TIMESTAMP(3),
    "adjudicatorEvidenceCID" TEXT,
    "didAdjudicatorVerifyProfile" BOOLEAN NOT NULL,
    "appealTimestamp" TIMESTAMP(3),
    "superAdjudicationTimestamp" TIMESTAMP(3),
    "didSuperAdjudicatorVerifyProfile" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CachedProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NotaryFeedback_unsubmittedProfileId_idx" ON "NotaryFeedback"("unsubmittedProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "UnsubmittedProfile_address_key" ON "UnsubmittedProfile"("address");

-- CreateIndex
CREATE UNIQUE INDEX "CachedProfile_starknetAddress_key" ON "CachedProfile"("starknetAddress");

-- CreateIndex
CREATE UNIQUE INDEX "CachedProfile_ethereumAddress_key" ON "CachedProfile"("ethereumAddress");

-- AddForeignKey
ALTER TABLE "NotaryFeedback" ADD CONSTRAINT "NotaryFeedback_unsubmittedProfileId_fkey" FOREIGN KEY ("unsubmittedProfileId") REFERENCES "UnsubmittedProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnsubmittedProfile" ADD CONSTRAINT "UnsubmittedProfile_unaddressedFeedbackId_fkey" FOREIGN KEY ("unaddressedFeedbackId") REFERENCES "NotaryFeedback"("id") ON DELETE SET NULL ON UPDATE CASCADE;
