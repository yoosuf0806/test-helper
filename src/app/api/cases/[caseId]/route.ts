import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TEST_RESULT_VALUES, enumVal, str } from "@/lib/parse";

export const runtime = "nodejs";

type Params = { params: { caseId: string } };

// PATCH /api/cases/[caseId] -> update a single scenario's verdict/notes.
// Used by the guided "run" mode for incremental saves. Only the fields a tester
// changes while running are accepted; structural edits happen via the grid.
// No parent-status validation runs here (verdicts are recorded freely; the
// PASSED gate is enforced when the test status is changed on the grid).
export async function PATCH(req: Request, { params }: Params) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if ("result" in body) {
    data.result = enumVal(body.result, TEST_RESULT_VALUES, "NOT_RUN");
  }
  if ("comments" in body) data.comments = str(body.comments);
  if ("actual" in body) data.actual = str(body.actual);
  if ("scenario" in body) data.scenario = str(body.scenario);
  if ("testData" in body) data.testData = str(body.testData);
  if ("expected" in body) data.expected = str(body.expected);

  try {
    const updated = await prisma.testCase.update({
      where: { id: params.caseId },
      data,
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Scenario not found." }, { status: 404 });
  }
}
