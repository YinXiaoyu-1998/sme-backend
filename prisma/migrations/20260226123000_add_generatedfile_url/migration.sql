/*
  Warnings:

  - Added the required column `url` to the `GeneratedFile` table without a default value. This is not possible if the table is not empty.
*/
-- AlterTable
ALTER TABLE "GeneratedFile" ADD COLUMN     "url" TEXT;

UPDATE "GeneratedFile"
SET "url" = '/generated/' || "filename"
WHERE "url" IS NULL;

ALTER TABLE "GeneratedFile" ALTER COLUMN "url" SET NOT NULL;
