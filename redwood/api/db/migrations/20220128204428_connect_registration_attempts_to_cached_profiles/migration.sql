-- DropIndex
DROP INDEX "RegistrationAttempt_ethereumAddress_approved_idx";

-- AlterTable
ALTER TABLE "RegistrationAttempt" ADD COLUMN     "profileId" INTEGER;

-- CreateIndex
CREATE INDEX "RegistrationAttempt_profileId_approved_idx" ON "RegistrationAttempt"("profileId", "approved");

-- AddForeignKey
ALTER TABLE "RegistrationAttempt" ADD CONSTRAINT "RegistrationAttempt_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "CachedProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
