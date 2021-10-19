-- CreateTable
CREATE TABLE "UnsubmittedProfile" (
    "id" SERIAL NOT NULL,
    "selfieCID" TEXT NOT NULL,
    "videoCID" TEXT NOT NULL,
    "ethAddress" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UnsubmittedProfile.ethAddress_unique" ON "UnsubmittedProfile"("ethAddress");
