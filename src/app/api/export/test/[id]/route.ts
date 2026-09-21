import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildImplementationTestWorkbook } from "@/lib/export";

export const runtime = "nodejs";

function filename(name: string) {
  const base = (name || "implementation-test")
    .replace(/[^a-z0-9-_]+/gi, "_")
    .slice(0, 50);
  return `${base || "implementation-test"}.xlsx`;
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const test = await prisma.implementationTest.findUnique({
    where: { id: params.id },
    include: { testCases: true },
  });
  if (!test) {
    return NextResponse.json({ error: "Test not found." }, { status: 404 });
  }
  const buffer = buildImplementationTestWorkbook(test);
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename(
        test.module || test.featureDescription
      )}"`,
    },
  });
}
