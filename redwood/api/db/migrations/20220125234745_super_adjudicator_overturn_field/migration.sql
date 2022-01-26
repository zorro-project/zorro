/*
  Warnings:

  - You are about to drop the column `didSuperAdjudicatorVerifyProfile` on the `CachedProfile` table. All the data in the column will be lost.
  - Added the required column `didSuperAdjudicatorOverturnAdjudicator` to the `CachedProfile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CachedProfile" RENAME "didSuperAdjudicatorVerifyProfile" TO "didSuperAdjudicatorOverturnAdjudicator";
