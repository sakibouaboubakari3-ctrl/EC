/*
  Warnings:

  - Added the required column `mimeType` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `originalFilename` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `Document` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."DocumentType" AS ENUM ('ID', 'INCOME_PROOF', 'BANK_STATEMENT');

-- AlterTable
ALTER TABLE "public"."Document" ADD COLUMN     "mimeType" TEXT NOT NULL,
ADD COLUMN     "originalFilename" TEXT NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" "public"."DocumentType" NOT NULL;

-- CreateIndex
CREATE INDEX "Document_applicationId_idx" ON "public"."Document"("applicationId");
