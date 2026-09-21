import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// POST /api/bugs -> create a new ticket with the full checklist pre-populated
// (all fields exist at their disciplined defaults; no blank form).
export async function POST() {
  const bug = await prisma.bugTicket.create({ data: {} });
  return NextResponse.json(bug, { status: 201 });
}

// GET /api/bugs -> list, newest first.
export async function GET() {
  const bugs = await prisma.bugTicket.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(bugs);
}
