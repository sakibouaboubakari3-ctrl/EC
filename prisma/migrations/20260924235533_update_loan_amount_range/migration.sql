-- Update loan amount bounds from 2 000-20 000 to 20 000-500 000
ALTER TABLE "LoanApplication" DROP CONSTRAINT "loan_amount_range";
ALTER TABLE "LoanApplication" ADD CONSTRAINT "loan_amount_range" CHECK ("amount" >= 20000 AND "amount" <= 500000);