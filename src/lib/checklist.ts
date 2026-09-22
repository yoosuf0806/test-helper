// The built-in QA checklist. Every new ImplementationTest is seeded with these
// scenario items so completeness never depends on the tester's memory. Each item
// becomes a TestCase row (result = NOT_RUN) that must be explicitly resolved
// (Pass / Fail / Blocked / N/A-with-reason) before the test can be marked Passed.

export type ChecklistItem = {
  type: "PROGRESSION" | "REGRESSION" | "NEGATIVE_BOUNDARY";
  category: string;
  scenario: string;
  expected?: string;
};

export const BUILTIN_CHECKLIST: ChecklistItem[] = [
  // --- Progression: the feature does what it should with valid input ---
  {
    type: "PROGRESSION",
    category: "Happy path",
    scenario: "Valid, typical input produces the expected result.",
  },
  {
    type: "PROGRESSION",
    category: "All required fields",
    scenario: "Every required field, filled with valid data, is accepted.",
  },
  {
    type: "PROGRESSION",
    category: "Persistence",
    scenario: "Result is saved/persisted correctly and survives a reload.",
  },
  {
    type: "PROGRESSION",
    category: "Inclusion rule",
    scenario:
      "Records that SHOULD be included by the rule are actually included.",
  },

  // --- Regression: nothing that used to work is now broken ---
  {
    type: "REGRESSION",
    category: "Adjacent feature",
    scenario: "A closely related existing feature still works unchanged.",
  },
  {
    type: "REGRESSION",
    category: "Downstream output",
    scenario:
      "Downstream reports / exports / integrations still show correct data.",
  },

  // --- Negative / Boundary: the edges where filter rules break ---
  {
    type: "NEGATIVE_BOUNDARY",
    category: "Empty / null",
    scenario: "Required field left empty / null is rejected with a clear error.",
  },
  {
    type: "NEGATIVE_BOUNDARY",
    category: "Minimum boundary",
    scenario: "Smallest allowed value is accepted.",
  },
  {
    type: "NEGATIVE_BOUNDARY",
    category: "Maximum boundary / length",
    scenario: "Largest allowed value / max length is accepted.",
  },
  {
    type: "NEGATIVE_BOUNDARY",
    category: "Just outside boundary",
    scenario: "min-1 and max+1 are rejected (off-by-one at the edges).",
  },
  {
    type: "NEGATIVE_BOUNDARY",
    category: "Invalid format / type",
    scenario: "Wrong format or data type is rejected.",
  },
  {
    type: "NEGATIVE_BOUNDARY",
    category: "Exclusion rule",
    scenario:
      "Records that SHOULD be excluded by the rule are actually excluded (e.g. right status but missing required linked value).",
  },
  {
    type: "NEGATIVE_BOUNDARY",
    category: "Duplicate",
    scenario: "Duplicate / repeated entry is handled per the rule.",
  },
  {
    type: "NEGATIVE_BOUNDARY",
    category: "Permissions / role",
    scenario: "Unauthorized user / wrong role cannot perform the action.",
  },
  {
    type: "NEGATIVE_BOUNDARY",
    category: "Special characters",
    scenario: "Special characters / injection-style input is handled safely.",
  },
  {
    type: "NEGATIVE_BOUNDARY",
    category: "Concurrency",
    scenario: "Concurrent edit / double-submit does not corrupt data.",
  },
];

// Rows to create for a brand-new test, in display order per type.
export function seedTestCases() {
  const perType: Record<string, number> = {};
  return BUILTIN_CHECKLIST.map((item) => {
    const sortOrder = perType[item.type] ?? 0;
    perType[item.type] = sortOrder + 1;
    return {
      type: item.type,
      category: item.category,
      source: "CHECKLIST" as const,
      scenario: item.scenario,
      expected: item.expected ?? "",
      sortOrder,
    };
  });
}
