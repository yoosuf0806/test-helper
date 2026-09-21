import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { NewButton } from "@/components/new-button";
import { Badge } from "@/components/ui/badge";
import { IMPL_STATUS_LABELS } from "@/lib/enums";

export const dynamic = "force-dynamic";

function statusVariant(status: string) {
  switch (status) {
    case "PASSED":
      return "success" as const;
    case "FAILED":
      return "destructive" as const;
    case "BLOCKED":
      return "warning" as const;
    case "IN_PROGRESS":
      return "secondary" as const;
    default:
      return "outline" as const;
  }
}

export default async function TestsPage() {
  const tests = await prisma.implementationTest.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { testCases: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Implementation Tests</h1>
          <p className="text-muted-foreground">
            Each test seeds Progression, Regression and Negative/Boundary grids.
          </p>
        </div>
        <NewButton endpoint="/api/tests" basePath="/tests" label="New test" />
      </div>

      {tests.length === 0 ? (
        <p className="text-muted-foreground">
          No tests yet. Create one to auto-seed the three test-case tables.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Feature</th>
                <th className="px-4 py-2 font-medium">Module</th>
                <th className="px-4 py-2 font-medium">Cases</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium text-right">Export</th>
              </tr>
            </thead>
            <tbody>
              {tests.map((t) => (
                <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-2">
                    <Link href={`/tests/${t.id}`} className="hover:underline">
                      {t.featureDescription
                        ? t.featureDescription.slice(0, 80)
                        : "(no description)"}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{t.module || "-"}</td>
                  <td className="px-4 py-2">{t._count.testCases}</td>
                  <td className="px-4 py-2">
                    <Badge variant={statusVariant(t.status)}>
                      {IMPL_STATUS_LABELS[t.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <a
                      href={`/api/export/test/${t.id}`}
                      className="text-muted-foreground hover:text-foreground hover:underline"
                    >
                      .xlsx
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
