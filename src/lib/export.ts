import * as XLSX from "xlsx";
import type {
  BugTicket,
  ImplementationTest,
  TestCase,
} from "@prisma/client";
import {
  BUG_STATUS_LABELS,
  ENVIRONMENT_LABELS,
  GATE_STATUS_LABELS,
  IMPL_STATUS_LABELS,
  REPRODUCIBLE_LABELS,
  ROOT_CAUSE_LABELS,
  TEST_CASE_RESULT_LABELS,
  TEST_CASE_TYPE_LABELS,
} from "./enums";

// Data-only exports. Fixed column mapping so output matches the user's existing
// test-data format. All builders return a Uint8Array (a valid Response body).

function toBuffer(wb: XLSX.WorkBook): Uint8Array<ArrayBuffer> {
  const raw = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as
    | ArrayBuffer
    | Uint8Array;
  const view = raw instanceof Uint8Array ? raw : new Uint8Array(raw);
  // Copy into a fresh, concretely-typed ArrayBuffer-backed array so the value
  // is a valid Response/Blob body under strict typed-array typings.
  const out = new Uint8Array(view.byteLength);
  out.set(view);
  return out;
}

// Excel sheet names are capped at 31 chars and cannot contain : \ / ? * [ ]
function safeSheetName(name: string): string {
  return name.replace(/[:\\/?*[\]]/g, " ").slice(0, 31) || "Sheet";
}

function fmtDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Single bug ticket -> one workbook, one sheet, field/value layout
// ---------------------------------------------------------------------------

export function buildBugTicketWorkbook(bug: BugTicket): Uint8Array<ArrayBuffer> {
  const rows: (string | number)[][] = [
    ["Field", "Value"],
    ["Ticket number", bug.ticketNumber],
    ["Title", bug.title],
    ["Environment", ENVIRONMENT_LABELS[bug.environment] ?? bug.environment],
    ["Issue description", bug.issueDescription],
    ["Expected", bug.expected],
    ["Actual", bug.actual],
    ["Steps to reproduce", bug.stepsToReproduce],
    ["Reproducible", REPRODUCIBLE_LABELS[bug.reproducible] ?? bug.reproducible],
    [
      "User Error / Parameter check",
      GATE_STATUS_LABELS[bug.checkUserParamStatus] ?? bug.checkUserParamStatus,
    ],
    ["  Note", bug.checkUserParamNote],
    ["RD check", GATE_STATUS_LABELS[bug.checkRdStatus] ?? bug.checkRdStatus],
    ["  Note", bug.checkRdNote],
    ["Identified gap", bug.identifiedGap],
    [
      "Root cause category",
      ROOT_CAUSE_LABELS[bug.rootCauseCategory] ?? bug.rootCauseCategory,
    ],
    ["Resolution", bug.resolution],
    ["Status", BUG_STATUS_LABELS[bug.status] ?? bug.status],
    ["Created", fmtDate(bug.createdAt)],
    ["Updated", fmtDate(bug.updatedAt)],
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [{ wch: 28 }, { wch: 80 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Bug Ticket");
  return toBuffer(wb);
}

// ---------------------------------------------------------------------------
// Single implementation test -> summary sheet + one sheet per test-case type
// ---------------------------------------------------------------------------

const TEST_CASE_HEADERS = [
  "Scenario",
  "Test data",
  "Expected",
  "Actual",
  "Result",
  "Comments",
];

function testCaseRows(cases: TestCase[]): (string | number)[][] {
  const sorted = [...cases].sort((a, b) => a.sortOrder - b.sortOrder);
  return [
    TEST_CASE_HEADERS,
    ...sorted.map((tc) => [
      tc.scenario,
      tc.testData,
      tc.expected,
      tc.actual,
      TEST_CASE_RESULT_LABELS[tc.result] ?? tc.result,
      tc.comments,
    ]),
  ];
}

const TEST_CASE_COLS = [
  { wch: 40 },
  { wch: 30 },
  { wch: 30 },
  { wch: 30 },
  { wch: 12 },
  { wch: 30 },
];

export type ImplementationTestWithCases = ImplementationTest & {
  testCases: TestCase[];
};

export function buildImplementationTestWorkbook(
  test: ImplementationTestWithCases
): Uint8Array<ArrayBuffer> {
  const wb = XLSX.utils.book_new();

  const summary = XLSX.utils.aoa_to_sheet([
    ["Field", "Value"],
    ["Feature description", test.featureDescription],
    ["Module", test.module],
    ["Status", IMPL_STATUS_LABELS[test.status] ?? test.status],
    ["Created", fmtDate(test.createdAt)],
    ["Updated", fmtDate(test.updatedAt)],
  ]);
  summary["!cols"] = [{ wch: 24 }, { wch: 80 }];
  XLSX.utils.book_append_sheet(wb, summary, "Summary");

  for (const [type, label] of Object.entries(TEST_CASE_TYPE_LABELS)) {
    const cases = test.testCases.filter((tc) => tc.type === type);
    const ws = XLSX.utils.aoa_to_sheet(testCaseRows(cases));
    ws["!cols"] = TEST_CASE_COLS;
    XLSX.utils.book_append_sheet(wb, ws, safeSheetName(label));
  }

  return toBuffer(wb);
}

// ---------------------------------------------------------------------------
// Bulk report -> Summary sheet (all bugs + all tests) + optional detail sheets
// ---------------------------------------------------------------------------

export function buildBulkReportWorkbook(
  bugs: BugTicket[],
  tests: ImplementationTestWithCases[]
): Uint8Array<ArrayBuffer> {
  const wb = XLSX.utils.book_new();

  const summaryRows: (string | number)[][] = [];
  summaryRows.push(["BUG TICKETS"]);
  summaryRows.push(["Number", "Title", "Environment", "Root cause", "Status"]);
  for (const b of bugs) {
    summaryRows.push([
      b.ticketNumber,
      b.title,
      ENVIRONMENT_LABELS[b.environment] ?? b.environment,
      ROOT_CAUSE_LABELS[b.rootCauseCategory] ?? b.rootCauseCategory,
      BUG_STATUS_LABELS[b.status] ?? b.status,
    ]);
  }
  summaryRows.push([]);
  summaryRows.push(["IMPLEMENTATION TESTS"]);
  summaryRows.push(["Feature", "Module", "Status"]);
  for (const t of tests) {
    summaryRows.push([
      t.featureDescription,
      t.module,
      IMPL_STATUS_LABELS[t.status] ?? t.status,
    ]);
  }

  const summary = XLSX.utils.aoa_to_sheet(summaryRows);
  summary["!cols"] = [{ wch: 40 }, { wch: 40 }, { wch: 16 }, { wch: 20 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, summary, "Summary");

  return toBuffer(wb);
}
