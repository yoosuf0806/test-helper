-- CreateEnum
CREATE TYPE "Environment" AS ENUM ('DEV', 'TEST', 'UAT', 'PROD');

-- CreateEnum
CREATE TYPE "Reproducible" AS ENUM ('YES', 'NO', 'INTERMITTENT');

-- CreateEnum
CREATE TYPE "GateStatus" AS ENUM ('NOT_CHECKED', 'CHECKED', 'NA', 'FINDING');

-- CreateEnum
CREATE TYPE "RootCauseCategory" AS ENUM ('CONFIG', 'DATA', 'CODE', 'USER_ERROR', 'WORKING_AS_DESIGNED', 'RD_GAP', 'UNSET');

-- CreateEnum
CREATE TYPE "BugStatus" AS ENUM ('OPEN', 'AWAITING_INFO', 'NOT_A_BUG', 'FIXED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ImplementationTestStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'PASSED', 'FAILED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "TestCaseType" AS ENUM ('PROGRESSION', 'REGRESSION', 'NEGATIVE_BOUNDARY');

-- CreateEnum
CREATE TYPE "TestCaseResult" AS ENUM ('NOT_RUN', 'PASS', 'FAIL', 'BLOCKED');

-- CreateTable
CREATE TABLE "BugTicket" (
    "id" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL DEFAULT '',
    "title" TEXT NOT NULL DEFAULT '',
    "environment" "Environment" NOT NULL DEFAULT 'DEV',
    "issueDescription" TEXT NOT NULL DEFAULT '',
    "expected" TEXT NOT NULL DEFAULT '',
    "actual" TEXT NOT NULL DEFAULT '',
    "stepsToReproduce" TEXT NOT NULL DEFAULT '',
    "reproducible" "Reproducible" NOT NULL DEFAULT 'INTERMITTENT',
    "checkUserParamStatus" "GateStatus" NOT NULL DEFAULT 'NOT_CHECKED',
    "checkUserParamNote" TEXT NOT NULL DEFAULT '',
    "checkRdStatus" "GateStatus" NOT NULL DEFAULT 'NOT_CHECKED',
    "checkRdNote" TEXT NOT NULL DEFAULT '',
    "identifiedGap" TEXT NOT NULL DEFAULT '',
    "rootCauseCategory" "RootCauseCategory" NOT NULL DEFAULT 'UNSET',
    "resolution" TEXT NOT NULL DEFAULT '',
    "status" "BugStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BugTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImplementationTest" (
    "id" TEXT NOT NULL,
    "featureDescription" TEXT NOT NULL DEFAULT '',
    "module" TEXT NOT NULL DEFAULT '',
    "status" "ImplementationTestStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImplementationTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestCase" (
    "id" TEXT NOT NULL,
    "implementationTestId" TEXT NOT NULL,
    "type" "TestCaseType" NOT NULL,
    "scenario" TEXT NOT NULL DEFAULT '',
    "testData" TEXT NOT NULL DEFAULT '',
    "expected" TEXT NOT NULL DEFAULT '',
    "actual" TEXT NOT NULL DEFAULT '',
    "result" "TestCaseResult" NOT NULL DEFAULT 'NOT_RUN',
    "comments" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TestCase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TestCase_implementationTestId_idx" ON "TestCase"("implementationTestId");

-- AddForeignKey
ALTER TABLE "TestCase" ADD CONSTRAINT "TestCase_implementationTestId_fkey" FOREIGN KEY ("implementationTestId") REFERENCES "ImplementationTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

