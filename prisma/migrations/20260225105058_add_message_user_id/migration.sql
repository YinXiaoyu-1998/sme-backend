/*
  Warnings:

  - Added the required column `userId` to the `Message` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "userId" TEXT;

UPDATE "Message"
SET "userId" = 'testing-user'
WHERE "userId" IS NULL;

ALTER TABLE "Message" ALTER COLUMN "userId" SET NOT NULL;
