import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { NewButton } from "@/components/new-button";
import { Badge } from "@/components/ui/badge";
import {
  BUG_STATUS_LABELS,
  ENVIRONMENT_LABELS,
  ROOT_CAUSE_LABELS,
} from "@/lib/enums";

export const dynamic = "force-dynamic";

function statusVariant(status: string) {
  switch (status) {
    case "FIXED":
    case "CLOSED":
      return "success" as const;
    case "NOT_A_BUG":
      return "secondary" as const;
    case "AWAITING_INFO":
      return "warning" as const;
    default:
      return "outline" as const;
  }
}

export default async function BugsPage() {
  const bugs = await prisma.bugTicket.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Bug Tickets</h1>
          <p className="text-muted-foreground">
            Root-cause elimination funnel. Both gates must be resolved before a
            ticket can close.
          </p>
        </div>
        <NewButton endpoint="/api/bugs" basePath="/bugs" label="New ticket" />
      </div>

      {bugs.length === 0 ? (
        <p className="text-muted-foreground">
          No tickets yet. Create one to open the full pre-populated checklist.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Number</th>
                <th className="px-4 py-2 font-medium">Title</th>
                <th className="px-4 py-2 font-medium">Env</th>
                <th className="px-4 py-2 font-medium">Root cause</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium text-right">Export</th>
              </tr>
            </thead>
            <tbody>
              {bugs.map((b) => (
                <tr key={b.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-2">
                    <Link href={`/bugs/${b.id}`} className="hover:underline">
                      {b.ticketNumber || "(untitled)"}
                    </Link>
                  </td>
                  <td className="px-4 py-2">
                    <Link href={`/bugs/${b.id}`} className="hover:underline">
                      {b.title || "(no title)"}
                    </Link>
                  </td>
                  <td className="px-4 py-2">
                    {ENVIRONMENT_LABELS[b.environment]}
                  </td>
                  <td className="px-4 py-2">
                    {ROOT_CAUSE_LABELS[b.rootCauseCategory]}
                  </td>
                  <td className="px-4 py-2">
                    <Badge variant={statusVariant(b.status)}>
                      {BUG_STATUS_LABELS[b.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <a
                      href={`/api/export/bug/${b.id}`}
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
