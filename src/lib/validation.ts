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

export type TestCaseLike = { type: string; result: string };

export type ImplementationTestInput = {
  status: string;
  testCases: TestCaseLike[];
};

/**
 * Rule 2: An ImplementationTest cannot be PASSED if any TestCase result is
 *         FAIL or NOT_RUN.
 * Rule 3: An ImplementationTest cannot be PASSED unless it has at least one
 *         NEGATIVE_BOUNDARY test case row.
 */
export function validateImplementationTest(
  input: ImplementationTestInput
): FieldErrors {
  const errors: FieldErrors = {};

  if (input.status === "PASSED") {
    const blocking = input.testCases.filter(
      (tc) => tc.result === "FAIL" || tc.result === "NOT_RUN"
    );
    if (blocking.length > 0) {
      errors.status =
        `Cannot mark PASSED: ${blocking.length} test case(s) still have a ` +
        `result of Fail or Not run. Every case must Pass, be Blocked, or be removed.`;
    }

    const hasNegative = input.testCases.some(
      (tc) => tc.type === "NEGATIVE_BOUNDARY"
    );
    if (!hasNegative) {
      errors.negativeBoundary =
        "Cannot mark PASSED: add at least one Negative / Boundary test case. Edge testing is required.";
    }
  }

  return errors;
}
