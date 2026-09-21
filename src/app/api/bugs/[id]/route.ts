import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateBugTicket } from "@/lib/validation";
import {
  BUG_STATUS_VALUES,
  ENV_VALUES,
  GATE_VALUES,
  REPRODUCIBLE_VALUES,
  ROOT_CAUSE_VALUES,
  enumVal,
  str,
} from "@/lib/parse";

export const runtime = "nodejs";

type Params = { params: { id: string } };

// PATCH /api/bugs/[id] -> update, enforcing Section 5 rule 1 server-side.
export async function PATCH(req: Request, { params }: Params) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const data = {
    ticketNumber: str(body.ticketNumber),
    title: str(body.title),
    environment: enumVal(body.environment, ENV_VALUES, "DEV"),
    issueDescription: str(body.issueDescription),
    expected: str(body.expected),
    actual: str(body.actual),
    stepsToReproduce: str(body.stepsToReproduce),
    reproducible: enumVal(body.reproducible, REPRODUCIBLE_VALUES, "INTERMITTENT"),
    checkUserParamStatus: enumVal(
      body.checkUserParamStatus,
      GATE_VALUES,
      "NOT_CHECKED"
    ),
    checkUserParamNote: str(body.checkUserParamNote),
    checkRdStatus: enumVal(body.checkRdStatus, GATE_VALUES, "NOT_CHECKED"),
    checkRdNote: str(body.checkRdNote),
    identifiedGap: str(body.identifiedGap),
    rootCauseCategory: enumVal(
      body.rootCauseCategory,
      ROOT_CAUSE_VALUES,
      "UNSET"
    ),
    resolution: str(body.resolution),
    status: enumVal(body.status, BUG_STATUS_VALUES, "OPEN"),
  };

  const errors = validateBugTicket(data);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  try {
    const bug = await prisma.bugTicket.update({
      where: { id: params.id },
      data,
    });
    return NextResponse.json(bug);
  } catch {
    return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
  }
}

// DELETE /api/bugs/[id]
export async function DELETE(_req: Request, { params }: Params) {
  try {
    await prisma.bugTicket.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
  }
}
