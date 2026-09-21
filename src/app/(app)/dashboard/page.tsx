import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BUG_STATUS_LABELS,
  ENVIRONMENT_LABELS,
  IMPL_STATUS_LABELS,
  ROOT_CAUSE_LABELS,
} from "@/lib/enums";

export const dynamic = "force-dynamic";

const CLOSED_STATUSES = ["FIXED", "CLOSED", "NOT_A_BUG"];

function BreakdownCard({
  title,
  counts,
  labels,
}: {
  title: string;
  counts: Record<string, number>;
  labels: Record<string, string>;
}) {
  const entries = Object.keys(labels)
    .map((key) => ({ key, label: labels[key], count: counts[key] ?? 0 }))
    .filter((e) => e.count > 0);
  const max = Math.max(1, ...entries.map((e) => e.count));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data yet.</p>
        ) : (
          entries.map((e) => (
            <div key={e.key} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{e.label}</span>
                <span className="tabular-nums text-muted-foreground">
                  {e.count}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{ width: `${(e.count / max) * 100}%` }}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function tally<T extends { [k: string]: unknown }>(
  rows: T[],
  key: keyof T
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rows) {
    const k = String(r[key]);
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

export default async function DashboardPage() {
  const [bugs, tests] = await Promise.all([
    prisma.bugTicket.findMany(),
    prisma.implementationTest.findMany(),
  ]);

  const closed = bugs.filter((b) => CLOSED_STATUSES.includes(b.status)).length;
  const open = bugs.length - closed;

  const byRootCause = tally(bugs, "rootCauseCategory");
  const byEnv = tally(bugs, "environment");
  const byBugStatus = tally(bugs, "status");
  const byTestStatus = tally(tests, "status");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">
          Where does your process actually leak?
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Open bugs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">{open}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Closed bugs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">{closed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Total bugs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">{bugs.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Impl. tests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">{tests.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <BreakdownCard
          title="Bugs by root cause"
          counts={byRootCause}
          labels={ROOT_CAUSE_LABELS}
        />
        <BreakdownCard
          title="Bugs by environment"
          counts={byEnv}
          labels={ENVIRONMENT_LABELS}
        />
        <BreakdownCard
          title="Bugs by status"
          counts={byBugStatus}
          labels={BUG_STATUS_LABELS}
        />
        <BreakdownCard
          title="Implementation tests by status"
          counts={byTestStatus}
          labels={IMPL_STATUS_LABELS}
        />
      </div>
    </div>
  );
}
