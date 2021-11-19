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
    "nymId" SERIAL NOT NULL,
    "ethAddress" TEXT NOT NULL,
    "status" "ProfileStatus" NOT NULL,
    "createdTimestamp" TIMESTAMP(3) NOT NULL,
    "CID" TEXT NOT NULL,
    "photoCID" TEXT,
    "videoCID" TEXT,
    "address" TEXT,

    CONSTRAINT "CachedProfile_pkey" PRIMARY KEY ("nymId")
);

-- CreateIndex
CREATE INDEX "NotaryFeedback_unsubmittedProfileId_idx" ON "NotaryFeedback"("unsubmittedProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "UnsubmittedProfile_ethAddress_key" ON "UnsubmittedProfile"("ethAddress");

-- CreateIndex
CREATE UNIQUE INDEX "CachedProfile_ethAddress_key" ON "CachedProfile"("ethAddress");

-- AddForeignKey
ALTER TABLE "NotaryFeedback" ADD CONSTRAINT "NotaryFeedback_unsubmittedProfileId_fkey" FOREIGN KEY ("unsubmittedProfileId") REFERENCES "UnsubmittedProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnsubmittedProfile" ADD CONSTRAINT "UnsubmittedProfile_unaddressedFeedbackId_fkey" FOREIGN KEY ("unaddressedFeedbackId") REFERENCES "NotaryFeedback"("id") ON DELETE SET NULL ON UPDATE CASCADE;
