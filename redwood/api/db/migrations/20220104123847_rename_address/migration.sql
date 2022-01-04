ALTER TABLE "UnsubmittedProfile" RENAME COLUMN "address" TO "ethereumAddress";
ALTER INDEX "UnsubmittedProfile_address_key" RENAME TO "UnsubmittedProfile_ethereumAddress_key";
