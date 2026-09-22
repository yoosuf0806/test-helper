// Helpers to coerce untrusted request bodies into safe, typed field maps.
// Unknown enum values fall back to a provided default rather than throwing.

export function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export function intVal(value: unknown, fallback = 0): number {
  const n =
    typeof value === "number" ? value : parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) ? n : fallback;
}

export function enumVal<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T
): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export const ENV_VALUES = ["DEV", "TEST", "UAT", "PROD"] as const;
export const REPRODUCIBLE_VALUES = ["YES", "NO", "INTERMITTENT"] as const;
export const GATE_VALUES = [
  "NOT_CHECKED",
  "CHECKED",
  "NA",
  "FINDING",
] as const;
export const ROOT_CAUSE_VALUES = [
  "CONFIG",
  "DATA",
  "CODE",
  "USER_ERROR",
  "WORKING_AS_DESIGNED",
  "RD_GAP",
  "UNSET",
] as const;
export const BUG_STATUS_VALUES = [
  "OPEN",
  "AWAITING_INFO",
  "NOT_A_BUG",
  "FIXED",
  "CLOSED",
] as const;
export const IMPL_STATUS_VALUES = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "PASSED",
  "FAILED",
  "BLOCKED",
] as const;
export const TEST_TYPE_VALUES = [
  "PROGRESSION",
  "REGRESSION",
  "NEGATIVE_BOUNDARY",
] as const;
export const TEST_RESULT_VALUES = [
  "NOT_RUN",
  "PASS",
  "FAIL",
  "BLOCKED",
  "NA",
] as const;
export const TEST_SOURCE_VALUES = ["CHECKLIST", "MANUAL", "AI"] as const;
