// Central enum option lists + human labels, shared by forms, tables and exports.

export type Option = { value: string; label: string };

function opts(map: Record<string, string>): Option[] {
  return Object.entries(map).map(([value, label]) => ({ value, label }));
}

export const ENVIRONMENT_LABELS: Record<string, string> = {
  DEV: "Dev",
  TEST: "Test",
  UAT: "UAT",
  PROD: "Prod",
};

export const REPRODUCIBLE_LABELS: Record<string, string> = {
  YES: "Yes",
  NO: "No",
  INTERMITTENT: "Intermittent",
};

export const GATE_STATUS_LABELS: Record<string, string> = {
  NOT_CHECKED: "Not checked",
  CHECKED: "Checked",
  NA: "N/A",
  FINDING: "Finding",
};

export const ROOT_CAUSE_LABELS: Record<string, string> = {
  CONFIG: "Config",
  DATA: "Data",
  CODE: "Code",
  USER_ERROR: "User error",
  WORKING_AS_DESIGNED: "Working as designed",
  RD_GAP: "RD gap",
  UNSET: "Unset",
};

export const BUG_STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  AWAITING_INFO: "Awaiting info",
  NOT_A_BUG: "Not a bug",
  FIXED: "Fixed",
  CLOSED: "Closed",
};

export const IMPL_STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  PASSED: "Passed",
  FAILED: "Failed",
  BLOCKED: "Blocked",
};

export const TEST_CASE_TYPE_LABELS: Record<string, string> = {
  PROGRESSION: "Progression",
  REGRESSION: "Regression",
  NEGATIVE_BOUNDARY: "Negative / Boundary",
};

export const TEST_CASE_RESULT_LABELS: Record<string, string> = {
  NOT_RUN: "Not run",
  PASS: "Pass",
  FAIL: "Fail",
  BLOCKED: "Blocked",
  NA: "N/A",
};

export const TEST_CASE_SOURCE_LABELS: Record<string, string> = {
  CHECKLIST: "Checklist",
  MANUAL: "Manual",
  AI: "AI",
};

export const ENVIRONMENT_OPTIONS = opts(ENVIRONMENT_LABELS);
export const REPRODUCIBLE_OPTIONS = opts(REPRODUCIBLE_LABELS);
export const GATE_STATUS_OPTIONS = opts(GATE_STATUS_LABELS);
export const ROOT_CAUSE_OPTIONS = opts(ROOT_CAUSE_LABELS);
export const BUG_STATUS_OPTIONS = opts(BUG_STATUS_LABELS);
export const IMPL_STATUS_OPTIONS = opts(IMPL_STATUS_LABELS);
export const TEST_CASE_TYPE_OPTIONS = opts(TEST_CASE_TYPE_LABELS);
export const TEST_CASE_RESULT_OPTIONS = opts(TEST_CASE_RESULT_LABELS);
export const TEST_CASE_SOURCE_OPTIONS = opts(TEST_CASE_SOURCE_LABELS);

// A case is "resolved" once it carries an explicit verdict (anything but Not run).
export const RESOLVED_RESULTS = ["PASS", "FAIL", "BLOCKED", "NA"] as const;
export function isResolved(result: string): boolean {
  return result !== "NOT_RUN";
}

export const TEST_CASE_TYPES = [
  "PROGRESSION",
  "REGRESSION",
  "NEGATIVE_BOUNDARY",
] as const;
