-- CreateEnum
CREATE TYPE "TestCaseSource" AS ENUM ('CHECKLIST', 'MANUAL', 'AI');

-- AlterEnum
ALTER TYPE "TestCaseResult" ADD VALUE 'NA';

-- AlterTable
ALTER TABLE "TestCase" ADD COLUMN     "category" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "source" "TestCaseSource" NOT NULL DEFAULT 'MANUAL';
