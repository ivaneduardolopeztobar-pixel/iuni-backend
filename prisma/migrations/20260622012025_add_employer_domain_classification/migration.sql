-- AlterTable
ALTER TABLE "Employer" ADD COLUMN     "emailDomainType" TEXT NOT NULL DEFAULT 'GENERIC',
ADD COLUMN     "website" TEXT;
