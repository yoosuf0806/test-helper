"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Play,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
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
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  IMPL_STATUS_OPTIONS,
  TEST_CASE_RESULT_OPTIONS,
  TEST_CASE_TYPES,
  TEST_CASE_TYPE_LABELS,
  isResolved,
} from "@/lib/enums";

type FieldErrors = Record<string, string>;

type Row = {
  clientId: string;
  category: string;
  source: string;
  scenario: string;
  testData: string;
  expected: string;
  actual: string;
  result: string;
  comments: string;
};

type RowsByType = Record<TestCaseType, Row[]>;

type Suggestion = {
  type: string;
  category: string;
  scenario: string;
  testData: string;
  expected: string;
};

let counter = 0;
function newId() {
  counter += 1;
  return `row-${Date.now()}-${counter}`;
}

function toRow(tc: TestCase): Row {
  return {
    clientId: tc.id,
    category: tc.category,
    source: tc.source,
    scenario: tc.scenario,
    testData: tc.testData,
    expected: tc.expected,
    actual: tc.actual,
    result: tc.result,
    comments: tc.comments,
  };
}

function emptyRow(): Row {
  return {
    clientId: newId(),
    category: "",
    source: "MANUAL",
    scenario: "",
    testData: "",
    expected: "",
    actual: "",
    result: "NOT_RUN",
    comments: "",
  };
}

const TYPE_DESCRIPTIONS: Record<TestCaseType, string> = {
  PROGRESSION: "New behaviour works as specified.",
  REGRESSION: "Existing behaviour still works.",
  NEGATIVE_BOUNDARY:
    "Edge cases that must be excluded / rejected. Required to pass.",
};

function sourceBadge(source: string) {
  if (source === "CHECKLIST")
    return <Badge variant="secondary">Checklist</Badge>;
  if (source === "AI") return <Badge variant="outline">AI</Badge>;
  return null;
}

export function TestForm({
  initial,
}: {
  initial: ImplementationTest & { testCases: TestCase[] };
}) {
  const router = useRouter();
  const [featureDescription, setFeatureDescription] = useState(
    initial.featureDescription
  );
  const [module, setModule] = useState(initial.module);
  const [status, setStatus] = useState<string>(initial.status);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // AI suggestions state.
  const [suggesting, setSuggesting] = useState(false);
  const [suggestError, setSuggestError] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [picked, setPicked] = useState<Set<number>>(new Set());

  const [rows, setRows] = useState<RowsByType>(() => {
    const base: RowsByType = {
      PROGRESSION: [],
      REGRESSION: [],
      NEGATIVE_BOUNDARY: [],
    };
    for (const tc of [...initial.testCases].sort(
      (a, b) => a.sortOrder - b.sortOrder
    )) {
      base[tc.type].push(toRow(tc));
    }
    return base;
  });

  const allRows = useMemo(
    () => TEST_CASE_TYPES.flatMap((t) => rows[t]),
    [rows]
  );
  const total = allRows.length;
  const resolved = allRows.filter((r) => isResolved(r.result)).length;
  const pct = total === 0 ? 0 : Math.round((resolved / total) * 100);

  function dirty() {
    setSaved(false);
  }

  function updateRow(
    type: TestCaseType,
    clientId: string,
    key: keyof Row,
    value: string
  ) {
    setRows((prev) => ({
      ...prev,
      [type]: prev[type].map((r) =>
        r.clientId === clientId ? { ...r, [key]: value } : r
      ),
    }));
    dirty();
  }

  function addRow(type: TestCaseType) {
    setRows((prev) => ({ ...prev, [type]: [...prev[type], emptyRow()] }));
    dirty();
  }

  function deleteRow(type: TestCaseType, clientId: string) {
    setRows((prev) => ({
      ...prev,
      [type]: prev[type].filter((r) => r.clientId !== clientId),
    }));
    dirty();
  }

  function move(type: TestCaseType, index: number, dir: -1 | 1) {
    setRows((prev) => {
      const list = [...prev[type]];
      const target = index + dir;
      if (target < 0 || target >= list.length) return prev;
      [list[index], list[target]] = [list[target], list[index]];
      return { ...prev, [type]: list };
    });
    dirty();
  }

  async function save() {
    setSaving(true);
    setErrors({});
    setSaved(false);
    try {
      const testCases = TEST_CASE_TYPES.flatMap((type) =>
        rows[type].map((r) => ({
          type,
          category: r.category,
          source: r.source,
          scenario: r.scenario,
          testData: r.testData,
          expected: r.expected,
          actual: r.actual,
          result: r.result,
          comments: r.comments,
        }))
      );
      const res = await fetch(`/api/tests/${initial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featureDescription, module, status, testCases }),
      });
      if (res.status === 422) {
        const data = await res.json();
        setErrors(data.errors || {});
        return;
      }
      if (!res.ok) {
        setErrors({ _: "Save failed. Try again." });
        return;
      }
      setSaved(true);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm("Delete this test and all its cases? This cannot be undone."))
      return;
    const res = await fetch(`/api/tests/${initial.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/tests");
      router.refresh();
    }
  }

  async function suggest() {
    setSuggesting(true);
    setSuggestError("");
    setSuggestions(null);
    setPicked(new Set());
    try {
      const res = await fetch(`/api/tests/${initial.id}/suggest`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setSuggestError(data.error || "Could not get suggestions.");
        return;
      }
      setSuggestions(data.suggestions as Suggestion[]);
      // Pre-select all by default.
      setPicked(new Set((data.suggestions as Suggestion[]).map((_, i) => i)));
    } catch {
      setSuggestError("Network error while requesting suggestions.");
    } finally {
      setSuggesting(false);
    }
  }

  function togglePick(i: number) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  function addPicked() {
    if (!suggestions) return;
    setRows((prev) => {
      const next: RowsByType = {
        PROGRESSION: [...prev.PROGRESSION],
        REGRESSION: [...prev.REGRESSION],
        NEGATIVE_BOUNDARY: [...prev.NEGATIVE_BOUNDARY],
      };
      suggestions.forEach((s, i) => {
        if (!picked.has(i)) return;
        const type = (s.type as TestCaseType) in next ? (s.type as TestCaseType) : "NEGATIVE_BOUNDARY";
        next[type].push({
          ...emptyRow(),
          source: "AI",
          category: s.category,
          scenario: s.scenario,
          testData: s.testData,
          expected: s.expected,
        });
      });
      return next;
    });
    setSuggestions(null);
    setPicked(new Set());
    dirty();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Implementation Test</h1>
          <p className="text-muted-foreground">
            Every scenario must get an explicit verdict. A test can only pass
            when all are resolved and at least one negative/boundary case exists.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/tests/${initial.id}/run`}>
            <Button>
              <Play className="h-4 w-4" />
              Start run
            </Button>
          </Link>
          <a href={`/api/export/test/${initial.id}`}>
            <Button variant="outline">Export .xlsx</Button>
          </a>
          <Button variant="destructive" onClick={remove}>
            Delete
          </Button>
        </div>
      </div>

      {/* Completeness meter */}
      <Card>
        <CardContent className="space-y-2 pt-6">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Checklist completeness</span>
            <span className="tabular-nums text-muted-foreground">
              {resolved} of {total} scenarios resolved
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted">
            <div
              className={
                "h-2 rounded-full " +
                (pct === 100 ? "bg-green-600" : "bg-primary")
              }
              style={{ width: `${pct}%` }}
            />
          </div>
          {total > resolved && (
            <p className="text-xs text-muted-foreground">
              {total - resolved} scenario(s) still &ldquo;Not run&rdquo;. Use{" "}
              <span className="font-medium">Start run</span> to step through them.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Feature</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Feature description</Label>
            <Textarea
              value={featureDescription}
              placeholder="e.g. Standard invoice should only include POs with 'Closed for Receiving' or 'Open' statuses WITH a GRN number."
              onChange={(e) => {
                setFeatureDescription(e.target.value);
                dirty();
              }}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Module</Label>
              <Input
                value={module}
                placeholder="e.g. AP, PO"
                onChange={(e) => {
                  setModule(e.target.value);
                  dirty();
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                options={IMPL_STATUS_OPTIONS}
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  dirty();
                }}
              />
              {errors.status && (
                <p className="text-sm text-destructive">{errors.status}</p>
              )}
              {errors.naReason && (
                <p className="text-sm text-destructive">{errors.naReason}</p>
              )}
              {errors.negativeBoundary && (
                <p className="text-sm text-destructive">
                  {errors.negativeBoundary}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={suggest}
              disabled={suggesting}
            >
              <Sparkles className="h-4 w-4" />
              {suggesting ? "Thinking..." : "Suggest scenarios (AI)"}
            </Button>
            <span className="text-xs text-muted-foreground">
              Reads the feature description and proposes extra edge cases to add.
            </span>
          </div>
          {suggestError && (
            <p className="text-sm text-destructive">{suggestError}</p>
          )}
        </CardContent>
      </Card>

      {/* AI suggestion picker */}
      {suggestions && (
        <Card>
          <CardHeader>
            <CardTitle>Suggested scenarios</CardTitle>
            <CardDescription>
              Pick the ones worth adding. They&rsquo;ll be inserted as new rows
              (marked AI) that you can edit before saving.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {suggestions.length === 0 && (
              <p className="text-sm text-muted-foreground">No suggestions.</p>
            )}
            <ul className="space-y-2">
              {suggestions.map((s, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 rounded-md border p-3"
                >
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={picked.has(i)}
                    onChange={() => togglePick(i)}
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {TEST_CASE_TYPE_LABELS[s.type] ?? s.type}
                      </Badge>
                      {s.category && (
                        <span className="text-xs font-medium text-muted-foreground">
                          {s.category}
                        </span>
                      )}
                    </div>
                    <p className="text-sm">{s.scenario}</p>
                    {(s.testData || s.expected) && (
                      <p className="text-xs text-muted-foreground">
                        {s.testData && <>Data: {s.testData}. </>}
                        {s.expected && <>Expected: {s.expected}.</>}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-3">
              <Button type="button" onClick={addPicked} disabled={picked.size === 0}>
                Add {picked.size} selected
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setSuggestions(null);
                  setPicked(new Set());
                }}
              >
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {TEST_CASE_TYPES.map((type) => (
        <Card key={type}>
          <CardHeader>
            <CardTitle>{TEST_CASE_TYPE_LABELS[type]}</CardTitle>
            <CardDescription>{TYPE_DESCRIPTIONS[type]}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50 text-left">
                  <tr>
                    <th className="px-2 py-2 font-medium">Category</th>
                    <th className="px-2 py-2 font-medium">Scenario</th>
                    <th className="px-2 py-2 font-medium">Test data</th>
                    <th className="px-2 py-2 font-medium">Expected</th>
                    <th className="px-2 py-2 font-medium">Actual</th>
                    <th className="px-2 py-2 font-medium">Result</th>
                    <th className="px-2 py-2 font-medium">Comments</th>
                    <th className="px-2 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {rows[type].length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-2 py-4 text-center text-muted-foreground"
                      >
                        No rows. Add one below.
                      </td>
                    </tr>
                  ) : (
                    rows[type].map((r, i) => (
                      <tr
                        key={r.clientId}
                        className="border-b last:border-0 align-top"
                      >
                        <td className="p-1">
                          <div className="flex flex-col gap-1">
                            <Input
                              className="w-32"
                              value={r.category}
                              placeholder="category"
                              onChange={(e) =>
                                updateRow(type, r.clientId, "category", e.target.value)
                              }
                            />
                            {sourceBadge(r.source)}
                          </div>
                        </td>
                        <td className="p-1">
                          <Textarea
                            className="min-h-[60px] w-44"
                            value={r.scenario}
                            onChange={(e) =>
                              updateRow(type, r.clientId, "scenario", e.target.value)
                            }
                          />
                        </td>
                        <td className="p-1">
                          <Textarea
                            className="min-h-[60px] w-32"
                            value={r.testData}
                            onChange={(e) =>
                              updateRow(type, r.clientId, "testData", e.target.value)
                            }
                          />
                        </td>
                        <td className="p-1">
                          <Textarea
                            className="min-h-[60px] w-32"
                            value={r.expected}
                            onChange={(e) =>
                              updateRow(type, r.clientId, "expected", e.target.value)
                            }
                          />
                        </td>
                        <td className="p-1">
                          <Textarea
                            className="min-h-[60px] w-32"
                            value={r.actual}
                            onChange={(e) =>
                              updateRow(type, r.clientId, "actual", e.target.value)
                            }
                          />
                        </td>
                        <td className="p-1">
                          <Select
                            className="w-28"
                            options={TEST_CASE_RESULT_OPTIONS}
                            value={r.result}
                            onChange={(e) =>
                              updateRow(type, r.clientId, "result", e.target.value)
                            }
                          />
                        </td>
                        <td className="p-1">
                          <Textarea
                            className="min-h-[60px] w-36"
                            value={r.comments}
                            placeholder={r.result === "NA" ? "Reason required" : ""}
                            onChange={(e) =>
                              updateRow(type, r.clientId, "comments", e.target.value)
                            }
                          />
                        </td>
                        <td className="p-1">
                          <div className="flex flex-col gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => move(type, i, -1)}
                              disabled={i === 0}
                              aria-label="Move up"
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => move(type, i, 1)}
                              disabled={i === rows[type].length - 1}
                              aria-label="Move down"
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteRow(type, r.clientId)}
                              aria-label="Delete row"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addRow(type)}
            >
              <Plus className="h-4 w-4" />
              Add row
            </Button>
          </CardContent>
        </Card>
      ))}

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
        {saved && <span className="text-sm text-green-600">Saved</span>}
        {errors._ && <span className="text-sm text-destructive">{errors._}</span>}
      </div>
    </div>
  );
}
