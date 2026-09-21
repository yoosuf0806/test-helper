import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildBugTicketWorkbook } from "@/lib/export";

export const runtime = "nodejs";

function filename(name: string) {
  const base = (name || "bug-ticket").replace(/[^a-z0-9-_]+/gi, "_").slice(0, 50);
  return `${base || "bug-ticket"}.xlsx`;
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const bug = await prisma.bugTicket.findUnique({ where: { id: params.id } });
  if (!bug) {
    return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
  }
  const buffer = buildBugTicketWorkbook(bug);
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename(
        bug.ticketNumber || bug.title
      )}"`,
    },
  });
}
