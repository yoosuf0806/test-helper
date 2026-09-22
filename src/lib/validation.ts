// Section 5 discipline rules. Enforced server-side; the API returns these as
// field-level errors so the UI can surface them inline.

export type FieldErrors = Record<string, string>;

export type BugTicketInput = {
  checkUserParamStatus: string;
  checkRdStatus: string;
  rootCauseCategory: string;
  status: string;
};

/**
 * Rule 1: A BugTicket cannot be saved as FIXED or CLOSED unless BOTH gate
 * statuses are resolved (not NOT_CHECKED) AND rootCauseCategory is not UNSET.
 */
export function validateBugTicket(input: BugTicketInput): FieldErrors {
  const errors: FieldErrors = {};
  const closing = input.status === "FIXED" || input.status === "CLOSED";

  if (closing) {
    if (input.checkUserParamStatus === "NOT_CHECKED") {
      errors.checkUserParamStatus =
        "Resolve the User Error / Parameter check before marking this ticket FIXED or CLOSED.";
    }
    if (input.checkRdStatus === "NOT_CHECKED") {
      errors.checkRdStatus =
        "Resolve the RD (requirement document) check before marking this ticket FIXED or CLOSED.";
    }
    if (input.rootCauseCategory === "UNSET") {
      errors.rootCauseCategory =
        "Set a root cause category before marking this ticket FIXED or CLOSED.";
    }
  }

  return errors;
}

export type TestCaseLike = {
  type: string;
  result: string;
  comments?: string;
};

export type ImplementationTestInput = {
  status: string;
  testCases: TestCaseLike[];
};

/**
 * Rule 2: An ImplementationTest cannot be PASSED if any TestCase result is
 *         FAIL or NOT_RUN.
 * Rule 3: An ImplementationTest cannot be PASSED unless it has at least one
 *         NEGATIVE_BOUNDARY test case row.
 * Rule 4 (completeness): every scenario must carry an explicit verdict, and any
 *         scenario marked N/A must record a reason (so skipping is deliberate).
 */
export function validateImplementationTest(
  input: ImplementationTestInput
): FieldErrors {
  const errors: FieldErrors = {};

  if (input.status === "PASSED") {
    // Rule 4a: no unresolved (Not run) scenarios.
    const notRun = input.testCases.filter((tc) => tc.result === "NOT_RUN");
    if (notRun.length > 0) {
      errors.status =
        `Cannot mark PASSED: ${notRun.length} scenario(s) are still "Not run". ` +
        `Give every scenario a verdict (Pass / Fail / Blocked / N/A).`;
    }

    // Rule 2: no failures.
    const failed = input.testCases.filter((tc) => tc.result === "FAIL");
    if (failed.length > 0) {
      errors.status =
        `Cannot mark PASSED: ${failed.length} scenario(s) are marked Fail. ` +
        `Resolve the defects or change the status.`;
    }

    // Rule 4b: N/A must have a reason.
    const naNoReason = input.testCases.filter(
      (tc) => tc.result === "NA" && !(tc.comments && tc.comments.trim())
    );
    if (naNoReason.length > 0) {
      errors.naReason =
        `Cannot mark PASSED: ${naNoReason.length} scenario(s) are marked N/A ` +
        `without a reason. Add a comment explaining why each is not applicable.`;
    }

    // Rule 3: at least one negative/boundary scenario.
    const hasNegative = input.testCases.some(
      (tc) => tc.type === "NEGATIVE_BOUNDARY"
    );
    if (!hasNegative) {
      errors.negativeBoundary =
        "Cannot mark PASSED: add at least one Negative / Boundary scenario. Edge testing is required.";
    }
  }

  return errors;
}
