/*
  Warnings:

  - You are about to drop the column `email` on the `UnsubmittedProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UnsubmittedProfile" DROP COLUMN "email";

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "ethereumAddress" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_ethereumAddress_key" ON "User"("ethereumAddress");
