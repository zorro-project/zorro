/*
  Warnings:

  - You are about to drop the column `sessionAuthString` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `UserSession` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserSession" DROP CONSTRAINT "UserSession_userId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "sessionAuthString";

-- DropTable
DROP TABLE "UserSession";

-- AddForeignKey
ALTER TABLE "RegistrationAttempt" ADD CONSTRAINT "RegistrationAttempt_ethereumAddress_fkey" FOREIGN KEY ("ethereumAddress") REFERENCES "User"("ethereumAddress") ON DELETE RESTRICT ON UPDATE CASCADE;
