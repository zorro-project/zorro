-- CreateEnum
CREATE TYPE "ProfileStatus" AS ENUM ('submitted_via_notary', 'challenged', 'deemed_valid', 'deemed_invalid');

-- CreateTable
CREATE TABLE "NotaryFeedback" (
    "id" SERIAL NOT NULL,
    "unsubmittedProfileId" INTEGER NOT NULL,
    "feedback" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnsubmittedProfile" (
    "id" SERIAL NOT NULL,
    "selfieCID" TEXT NOT NULL,
    "videoCID" TEXT NOT NULL,
    "ethAddress" TEXT NOT NULL,
    "email" TEXT,
    "unaddressedFeedbackId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfilesCache" (
    "nymId" SERIAL NOT NULL,
    "ethAddress" TEXT NOT NULL,
    "status" "ProfileStatus" NOT NULL,
    "CID" TEXT NOT NULL,
    "photoCID" TEXT,
    "videoCID" TEXT,
    "address" TEXT,
    "createdTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("nymId")
);

-- CreateIndex
CREATE INDEX "NotaryFeedback.unsubmittedProfileId_index" ON "NotaryFeedback"("unsubmittedProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "UnsubmittedProfile.ethAddress_unique" ON "UnsubmittedProfile"("ethAddress");

-- CreateIndex
CREATE UNIQUE INDEX "ProfilesCache.ethAddress_unique" ON "ProfilesCache"("ethAddress");

-- AddForeignKey
ALTER TABLE "NotaryFeedback" ADD FOREIGN KEY ("unsubmittedProfileId") REFERENCES "UnsubmittedProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnsubmittedProfile" ADD FOREIGN KEY ("unaddressedFeedbackId") REFERENCES "NotaryFeedback"("id") ON DELETE SET NULL ON UPDATE CASCADE;
