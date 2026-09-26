-- AlterTable
ALTER TABLE "public"."LoanApplication" ADD COLUMN     "contractSignedAt" TIMESTAMP(3),
ADD COLUMN     "disbursementScheduledAt" TIMESTAMP(3);
