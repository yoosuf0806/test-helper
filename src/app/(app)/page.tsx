import Link from "next/link";
import { Bug, ClipboardCheck } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [bugCount, testCount] = await Promise.all([
    prisma.bugTicket.count(),
    prisma.implementationTest.count(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Testing checklists</h1>
        <p className="text-muted-foreground">
          A new ticket never opens a blank form. It instantiates the full,
          pre-populated checklist, so skipping a step is always a deliberate
          &ldquo;N/A&rdquo; &mdash; never an accident.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/bugs">
          <Card className="h-full transition-colors hover:border-foreground/30">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Bug className="h-5 w-5" />
                <CardTitle>Bug Tickets</CardTitle>
              </div>
              <CardDescription>
                Root-cause elimination funnel with two mandatory gates.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {bugCount} ticket{bugCount === 1 ? "" : "s"}
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/tests">
          <Card className="h-full transition-colors hover:border-foreground/30">
            <CardHeader>
              <div className="flex items-center gap-3">
                <ClipboardCheck className="h-5 w-5" />
                <CardTitle>Implementation Tests</CardTitle>
              </div>
              <CardDescription>
                Progression, regression, and negative/boundary grids &mdash;
                seeded so edge testing is never forgotten.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {testCount} test{testCount === 1 ? "" : "s"}
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
