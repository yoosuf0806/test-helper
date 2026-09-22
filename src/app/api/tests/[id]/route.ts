import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateImplementationTest } from "@/lib/validation";
import {
  IMPL_STATUS_VALUES,
  TEST_RESULT_VALUES,
  TEST_SOURCE_VALUES,
  TEST_TYPE_VALUES,
  enumVal,
  str,
} from "@/lib/parse";

export const runtime = "nodejs";

type Params = { params: { id: string } };

// PATCH /api/tests/[id] -> update the parent and replace all child test cases,
// enforcing Section 5 rules 2 and 3 server-side.
export async function PATCH(req: Request, { params }: Params) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const status = enumVal(body.status, IMPL_STATUS_VALUES, "NOT_STARTED");
  const rawCases = Array.isArray(body.testCases) ? body.testCases : [];

  // Assign sortOrder per type in submitted order.
  const perTypeCounter: Record<string, number> = {};
  const testCases = rawCases.map((c) => {
    const raw = c as Record<string, unknown>;
    const type = enumVal(raw.type, TEST_TYPE_VALUES, "PROGRESSION");
    const sortOrder = perTypeCounter[type] ?? 0;
    perTypeCounter[type] = sortOrder + 1;
    return {
      type,
      category: str(raw.category),
      source: enumVal(raw.source, TEST_SOURCE_VALUES, "MANUAL"),
      scenario: str(raw.scenario),
      testData: str(raw.testData),
      expected: str(raw.expected),
      actual: str(raw.actual),
      result: enumVal(raw.result, TEST_RESULT_VALUES, "NOT_RUN"),
      comments: str(raw.comments),
      sortOrder,
    };
  });

  const errors = validateImplementationTest({ status, testCases });
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  const exists = await prisma.implementationTest.findUnique({
    where: { id: params.id },
    select: { id: true },
  });
  if (!exists) {
    return NextResponse.json({ error: "Test not found." }, { status: 404 });
  }

  // Replace-all children in a transaction (single user; simplest correct path).
  const [, , test] = await prisma.$transaction([
    prisma.testCase.deleteMany({ where: { implementationTestId: params.id } }),
    prisma.implementationTest.update({
      where: { id: params.id },
      data: {
        featureDescription: str(body.featureDescription),
        module: str(body.module),
        status,
        testCases: { create: testCases },
      },
    }),
    prisma.implementationTest.findUnique({
      where: { id: params.id },
      include: { testCases: true },
    }),
  ]);

  return NextResponse.json(test);
}

// DELETE /api/tests/[id] (cascades to test cases)
export async function DELETE(_req: Request, { params }: Params) {
  try {
    await prisma.implementationTest.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Test not found." }, { status: 404 });
  }
}
