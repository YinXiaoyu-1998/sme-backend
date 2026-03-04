/*
  Warnings:

  - Added the required column `userId` to the `DataFile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DataFile" ADD COLUMN     "userId" TEXT;

UPDATE "DataFile"
SET "userId" = 'testing-user'
WHERE "userId" IS NULL;

ALTER TABLE "DataFile" ALTER COLUMN "userId" SET NOT NULL;
