"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { BugTicket } from "@prisma/client";
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
  BUG_STATUS_OPTIONS,
  ENVIRONMENT_OPTIONS,
  GATE_STATUS_OPTIONS,
  REPRODUCIBLE_OPTIONS,
  ROOT_CAUSE_OPTIONS,
} from "@/lib/enums";

type FieldErrors = Record<string, string>;

function ErrorText({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-sm text-destructive">{msg}</p>;
}

export function BugForm({ initial }: { initial: BugTicket }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function set<K extends keyof BugTicket>(key: K, value: BugTicket[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    setErrors({});
    setSaved(false);
    try {
      const res = await fetch(`/api/bugs/${initial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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
    if (!confirm("Delete this ticket? This cannot be undone.")) return;
    const res = await fetch(`/api/bugs/${initial.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/bugs");
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {form.ticketNumber || "New bug ticket"}
          </h1>
          <p className="text-muted-foreground">
            Every field is present. Skipping a step is a deliberate
            &ldquo;N/A&rdquo; &mdash; never an accident.
          </p>
        </div>
        <div className="flex gap-2">
          <a href={`/api/export/bug/${initial.id}`}>
            <Button variant="outline">Export .xlsx</Button>
          </a>
          <Button variant="destructive" onClick={remove}>
            Delete
          </Button>
        </div>
      </div>

      {/* Header fields */}
      <Card>
        <CardHeader>
          <CardTitle>Ticket</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Ticket number</Label>
            <Input
              value={form.ticketNumber}
              placeholder="e.g. JIRA-1234 / OTRS number"
              onChange={(e) => set("ticketNumber", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Environment</Label>
            <Select
              options={ENVIRONMENT_OPTIONS}
              value={form.environment}
              onChange={(e) =>
                set("environment", e.target.value as BugTicket["environment"])
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Reproducible</Label>
            <Select
              options={REPRODUCIBLE_OPTIONS}
              value={form.reproducible}
              onChange={(e) =>
                set("reproducible", e.target.value as BugTicket["reproducible"])
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* 1. Explain the issue */}
      <Card>
        <CardHeader>
          <CardTitle>1. Explain the issue</CardTitle>
          <CardDescription>Split what should happen vs. what did.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Issue description</Label>
            <Textarea
              value={form.issueDescription}
              onChange={(e) => set("issueDescription", e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Expected</Label>
              <Textarea
                value={form.expected}
                onChange={(e) => set("expected", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Actual</Label>
              <Textarea
                value={form.actual}
                onChange={(e) => set("actual", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Steps to reproduce</Label>
            <Textarea
              value={form.stepsToReproduce}
              onChange={(e) => set("stepsToReproduce", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* 2. User Error / Check Parameter gate */}
      <Card>
        <CardHeader>
          <CardTitle>2. User Error / Check Parameter</CardTitle>
          <CardDescription>
            Gate: must be resolved (not &ldquo;Not checked&rdquo;) before close.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 sm:max-w-xs">
            <Label>Verdict</Label>
            <Select
              options={GATE_STATUS_OPTIONS}
              value={form.checkUserParamStatus}
              onChange={(e) =>
                set(
                  "checkUserParamStatus",
                  e.target.value as BugTicket["checkUserParamStatus"]
                )
              }
            />
            <ErrorText msg={errors.checkUserParamStatus} />
          </div>
          <div className="space-y-2">
            <Label>Note</Label>
            <Textarea
              value={form.checkUserParamNote}
              onChange={(e) => set("checkUserParamNote", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* 3. Check the RD gate */}
      <Card>
        <CardHeader>
          <CardTitle>3. Check the RD (requirement document)</CardTitle>
          <CardDescription>
            Gate: must be resolved (not &ldquo;Not checked&rdquo;) before close.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 sm:max-w-xs">
            <Label>Verdict</Label>
            <Select
              options={GATE_STATUS_OPTIONS}
              value={form.checkRdStatus}
              onChange={(e) =>
                set(
                  "checkRdStatus",
                  e.target.value as BugTicket["checkRdStatus"]
                )
              }
            />
            <ErrorText msg={errors.checkRdStatus} />
          </div>
          <div className="space-y-2">
            <Label>Note</Label>
            <Textarea
              value={form.checkRdNote}
              onChange={(e) => set("checkRdNote", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* 4. Identified gap */}
      <Card>
        <CardHeader>
          <CardTitle>4. Identified gap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>The gap you predict you found</Label>
            <Textarea
              value={form.identifiedGap}
              onChange={(e) => set("identifiedGap", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* 5. Action */}
      <Card>
        <CardHeader>
          <CardTitle>5. Action</CardTitle>
          <CardDescription>
            Root cause + status. A ticket can only be Fixed/Closed once both
            gates are resolved and a root cause is set.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Resolution</Label>
            <Textarea
              value={form.resolution}
              onChange={(e) => set("resolution", e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Root cause category</Label>
              <Select
                options={ROOT_CAUSE_OPTIONS}
                value={form.rootCauseCategory}
                onChange={(e) =>
                  set(
                    "rootCauseCategory",
                    e.target.value as BugTicket["rootCauseCategory"]
                  )
                }
              />
              <ErrorText msg={errors.rootCauseCategory} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                options={BUG_STATUS_OPTIONS}
                value={form.status}
                onChange={(e) =>
                  set("status", e.target.value as BugTicket["status"])
                }
              />
              <ErrorText msg={errors.status} />
            </div>
          </div>
        </CardContent>
      </Card>

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
