import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TEST_CASE_TYPES } from "@/lib/enums";

export const runtime = "nodejs";

// POST /api/tests -> create a parent and auto-seed the three tables
// (Progression, Regression, Negative/Boundary) with one empty starter row each.
// The negative row is seeded on purpose so edge testing is never forgotten.
export async function POST() {
  const test = await prisma.implementationTest.create({
    data: {
      testCases: {
        create: TEST_CASE_TYPES.map((type) => ({ type, sortOrder: 0 })),
      },
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
