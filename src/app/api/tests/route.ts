import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { seedTestCases } from "@/lib/checklist";

export const runtime = "nodejs";

// POST /api/tests -> create a parent and auto-seed the full built-in QA
// checklist across the three tables (Progression, Regression, Negative/Boundary)
// so no scenario type is ever forgotten. Each seeded row starts as "Not run"
// and must be explicitly resolved before the test can pass.
export async function POST() {
  const test = await prisma.implementationTest.create({
    data: {
      testCases: { create: seedTestCases() },
    },
    include: { testCases: true },
  });
  return NextResponse.json(test, { status: 201 });
}

// GET /api/tests -> list, newest first.
export async function GET() {
  const tests = await prisma.implementationTest.findMany({
    orderBy: { createdAt: "desc" },
    include: { testCases: true },
  });
  return NextResponse.json(tests);
}
