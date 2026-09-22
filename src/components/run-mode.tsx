"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, ListChecks } from "lucide-react";
import type {
  ImplementationTest,
  TestCase,
  TestCaseType,
} from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  TEST_CASE_TYPE_LABELS,
  isResolved,
} from "@/lib/enums";

const TYPE_ORDER: TestCaseType[] = [
  "PROGRESSION",
  "REGRESSION",
  "NEGATIVE_BOUNDARY",
];

type RunCase = {
  id: string;
  type: string;
  category: string;
  scenario: string;
  testData: string;
  expected: string;
  actual: string;
  result: string;
  comments: string;
};

const VERDICTS: { value: string; label: string; className: string }[] = [
  { value: "PASS", label: "Pass", className: "bg-green-600 text-white hover:bg-green-600/90" },
  { value: "FAIL", label: "Fail", className: "bg-destructive text-destructive-foreground hover:bg-destructive/90" },
  { value: "BLOCKED", label: "Blocked", className: "bg-amber-500 text-white hover:bg-amber-500/90" },
  { value: "NA", label: "N/A", className: "bg-secondary text-secondary-foreground hover:bg-secondary/80" },
];

export function RunMode({
  test,
}: {
  test: ImplementationTest & { testCases: TestCase[] };
}) {
  const ordered = useMemo(() => {
    return [...test.testCases]
      .sort((a, b) => {
        const t = TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type);
        return t !== 0 ? t : a.sortOrder - b.sortOrder;
      })
      .map(
        (c): RunCase => ({
          id: c.id,
          type: c.type,
          category: c.category,
          scenario: c.scenario,
          testData: c.testData,
          expected: c.expected,
          actual: c.actual,
          result: c.result,
          comments: c.comments,
        })
      );
  }, [test.testCases]);

  const [cases, setCases] = useState<RunCase[]>(ordered);
  const [index, setIndex] = useState(0);
  const [savingId, setSavingId] = useState<string | null>(null);

  const total = cases.length;
  const resolvedCount = cases.filter((c) => isResolved(c.result)).length;
  const pct = total === 0 ? 0 : Math.round((resolvedCount / total) * 100);
  const current = cases[index];

  async function patchCase(id: string, patch: Partial<RunCase>) {
    setSavingId(id);
    try {
      await fetch(`/api/cases/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
    } finally {
      setSavingId(null);
    }
  }

  function setLocal(id: string, patch: Partial<RunCase>) {
    setCases((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function setVerdict(value: string) {
    if (!current) return;
    setLocal(current.id, { result: value });
    void patchCase(current.id, { result: value });
  }

  function goto(i: number) {
    if (i >= 0 && i < total) setIndex(i);
  }

  function nextUnresolved() {
    const from = index + 1;
    const after = cases.findIndex((c, i) => i >= from && !isResolved(c.result));
    if (after !== -1) {
      setIndex(after);
      return;
    }
    const any = cases.findIndex((c) => !isResolved(c.result));
    if (any !== -1) setIndex(any);
  }

  const allResolved = resolvedCount === total && total > 0;
  const failCount = cases.filter((c) => c.result === "FAIL").length;
  const naCount = cases.filter((c) => c.result === "NA").length;
  const naMissingReason = cases.filter(
    (c) => c.result === "NA" && !c.comments.trim()
  ).length;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Test run</h1>
          <p className="text-sm text-muted-foreground">
            {test.featureDescription
              ? test.featureDescription.slice(0, 120)
              : "(no feature description)"}
          </p>
        </div>
        <Link href={`/tests/${test.id}`}>
          <Button variant="outline">
            <ListChecks className="h-4 w-4" />
            Grid view
          </Button>
        </Link>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            {resolvedCount} of {total} resolved
          </span>
          <span className="text-muted-foreground">
            Scenario {total === 0 ? 0 : index + 1} of {total}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted">
          <div
            className={
              "h-2 rounded-full " + (pct === 100 ? "bg-green-600" : "bg-primary")
            }
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {allResolved && (
        <Card className="border-green-600/40">
          <CardContent className="space-y-1 pt-6">
            <div className="flex items-center gap-2 font-medium text-green-700">
              <Check className="h-5 w-5" /> All scenarios resolved
            </div>
            <p className="text-sm text-muted-foreground">
              {failCount > 0
                ? `${failCount} failed — the test can't be marked Passed until those are resolved.`
                : "No failures."}
              {naCount > 0 &&
                ` ${naCount} marked N/A${
                  naMissingReason > 0
                    ? ` (${naMissingReason} still need a reason)`
                    : ""
                }.`}
            </p>
            <div className="pt-2">
              <Link href={`/tests/${test.id}`}>
                <Button>Back to test to set status</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {current && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {TEST_CASE_TYPE_LABELS[current.type] ?? current.type}
              </Badge>
              {current.category && (
                <span className="text-sm font-medium text-muted-foreground">
                  {current.category}
                </span>
              )}
              {isResolved(current.result) && (
                <Badge variant="secondary">Resolved</Badge>
              )}
            </div>
            <CardTitle className="pt-2 text-lg leading-snug">
              {current.scenario || "(no scenario text)"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(current.testData || current.expected) && (
              <div className="grid gap-3 sm:grid-cols-2">
                {current.testData && (
                  <div className="rounded-md bg-muted/50 p-3 text-sm">
                    <div className="font-medium">Test data</div>
                    <div className="text-muted-foreground">{current.testData}</div>
                  </div>
                )}
                {current.expected && (
                  <div className="rounded-md bg-muted/50 p-3 text-sm">
                    <div className="font-medium">Expected</div>
                    <div className="text-muted-foreground">{current.expected}</div>
                  </div>
                )}
              </div>
            )}

            {/* Verdict buttons */}
            <div className="space-y-2">
              <div className="text-sm font-medium">Verdict</div>
              <div className="flex flex-wrap gap-2">
                {VERDICTS.map((v) => (
                  <button
                    key={v.value}
                    type="button"
                    onClick={() => setVerdict(v.value)}
                    className={
                      "rounded-md px-4 py-2 text-sm font-medium transition-colors " +
                      (current.result === v.value
                        ? v.className
                        : "border border-input bg-background hover:bg-accent")
                    }
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Actual */}
            <div className="space-y-1">
              <div className="text-sm font-medium">Actual result</div>
              <Textarea
                value={current.actual}
                placeholder="What actually happened"
                onChange={(e) => setLocal(current.id, { actual: e.target.value })}
                onBlur={(e) => patchCase(current.id, { actual: e.target.value })}
              />
            </div>

            {/* Comments / reason */}
            <div className="space-y-1">
              <div className="text-sm font-medium">
                Notes{" "}
                {current.result === "NA" && (
                  <span className="text-destructive">(reason required for N/A)</span>
                )}
              </div>
              <Textarea
                value={current.comments}
                placeholder={
                  current.result === "NA"
                    ? "Why is this scenario not applicable?"
                    : "Optional notes"
                }
                onChange={(e) =>
                  setLocal(current.id, { comments: e.target.value })
                }
                onBlur={(e) => patchCase(current.id, { comments: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => goto(index - 1)}
                disabled={index === 0}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                {savingId === current.id ? "Saving…" : "Saved automatically"}
              </span>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={nextUnresolved}>
                  Next unresolved
                </Button>
                <Button
                  type="button"
                  onClick={() => goto(index + 1)}
                  disabled={index >= total - 1}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {total === 0 && (
        <p className="text-muted-foreground">
          This test has no scenarios yet. Add some in the{" "}
          <Link href={`/tests/${test.id}`} className="underline">
            grid view
          </Link>
          .
        </p>
      )}
    </div>
  );
}
