"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import type {
  ImplementationTest,
  TestCase,
  TestCaseType,
} from "@prisma/client";
import { Button } from "@/components/ui/button";
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
} from "@/lib/enums";

type FieldErrors = Record<string, string>;

type Row = {
  clientId: string;
  scenario: string;
  testData: string;
  expected: string;
  actual: string;
  result: string;
  comments: string;
};

type RowsByType = Record<TestCaseType, Row[]>;

let counter = 0;
function newId() {
  counter += 1;
  return `row-${Date.now()}-${counter}`;
}

function toRow(tc: TestCase): Row {
  return {
    clientId: tc.id,
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Implementation Test</h1>
          <p className="text-muted-foreground">
            Fill the three grids. A test can only pass with every case passing
            and at least one negative/boundary case.
          </p>
        </div>
        <div className="flex gap-2">
          <a href={`/api/export/test/${initial.id}`}>
            <Button variant="outline">Export .xlsx</Button>
          </a>
          <Button variant="destructive" onClick={remove}>
            Delete
          </Button>
        </div>
      </div>

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
              {errors.negativeBoundary && (
                <p className="text-sm text-destructive">
                  {errors.negativeBoundary}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

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
                        colSpan={7}
                        className="px-2 py-4 text-center text-muted-foreground"
                      >
                        No rows. Add one below.
                      </td>
                    </tr>
                  ) : (
                    rows[type].map((r, i) => (
                      <tr key={r.clientId} className="border-b last:border-0 align-top">
                        <td className="p-1">
                          <Textarea
                            className="min-h-[60px] w-40"
                            value={r.scenario}
                            onChange={(e) =>
                              updateRow(type, r.clientId, "scenario", e.target.value)
                            }
                          />
                        </td>
                        <td className="p-1">
                          <Textarea
                            className="min-h-[60px] w-36"
                            value={r.testData}
                            onChange={(e) =>
                              updateRow(type, r.clientId, "testData", e.target.value)
                            }
                          />
                        </td>
                        <td className="p-1">
                          <Textarea
                            className="min-h-[60px] w-36"
                            value={r.expected}
                            onChange={(e) =>
                              updateRow(type, r.clientId, "expected", e.target.value)
                            }
                          />
                        </td>
                        <td className="p-1">
                          <Textarea
                            className="min-h-[60px] w-36"
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
