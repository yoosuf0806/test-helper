import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildBulkReportWorkbook } from "@/lib/export";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const [bugs, tests] = await Promise.all([
    prisma.bugTicket.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.implementationTest.findMany({
      orderBy: { createdAt: "desc" },
      include: { testCases: true },
    }),
  ]);

  const buffer = buildBulkReportWorkbook(bugs, tests);
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="testing-report-${date}.xlsx"`,
    },
  });
}
