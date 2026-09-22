import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { TEST_TYPE_VALUES, enumVal, str } from "@/lib/parse";

export const runtime = "nodejs";
export const maxDuration = 60;

type Params = { params: { id: string } };

type Suggestion = {
  type: string;
  category: string;
  scenario: string;
  testData: string;
  expected: string;
};

// POST /api/tests/[id]/suggest -> ask Claude for feature-specific scenarios
// beyond the built-in checklist. Returns suggestions only; the client lets the
// user pick which to add. Requires ANTHROPIC_API_KEY; degrades gracefully.
export async function POST(_req: Request, { params }: Params) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      {
        error:
          "AI suggestions are disabled. Set ANTHROPIC_API_KEY in your environment to enable them.",
      },
      { status: 400 }
    );
  }

  const test = await prisma.implementationTest.findUnique({
    where: { id: params.id },
    include: { testCases: true },
  });
  if (!test) {
    return NextResponse.json({ error: "Test not found." }, { status: 404 });
  }
  if (!test.featureDescription.trim()) {
    return NextResponse.json(
      { error: "Add a feature description first so the AI has something to work from." },
      { status: 400 }
    );
  }

  const existing = test.testCases
    .map((c) => `- [${c.type}] ${c.scenario}`)
    .join("\n");

  const model = process.env.ANTHROPIC_MODEL || "claude-opus-5";
  const client = new Anthropic();

  const system =
    "You are a meticulous QA test analyst. Given a feature to test, you propose " +
    "concrete, feature-specific test scenarios that a generic checklist would miss " +
    "- especially edge cases where filter/business rules break. " +
    "Each scenario must be a single, concrete, checkable case. " +
    "Reply with ONLY a JSON array (no prose, no code fences). Each element: " +
    '{"type": one of PROGRESSION|REGRESSION|NEGATIVE_BOUNDARY, "category": short label, ' +
    '"scenario": the case to test, "testData": example data or "", "expected": expected result or ""}. ' +
    "Favor NEGATIVE_BOUNDARY scenarios. Return 6-12 items. Do not repeat the existing scenarios.";

  const userPrompt =
    `Feature under test:\n${test.featureDescription}\n\n` +
    (test.module ? `Module: ${test.module}\n\n` : "") +
    `Scenarios already listed (do not duplicate):\n${existing || "(none)"}\n\n` +
    "Propose additional feature-specific scenarios as the JSON array described.";

  let raw = "";
  try {
    const res = await client.messages.create({
      model,
      max_tokens: 4000,
      system,
      messages: [{ role: "user", content: userPrompt }],
    });
    raw = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
  } catch (e) {
    const msg = e instanceof Error ? e.message : "AI request failed.";
    return NextResponse.json(
      { error: `AI request failed: ${msg}` },
      { status: 502 }
    );
  }

  const suggestions = parseSuggestions(raw);
  if (suggestions.length === 0) {
    return NextResponse.json(
      { error: "The AI returned no usable suggestions. Try again or refine the feature description." },
      { status: 502 }
    );
  }

  return NextResponse.json({ suggestions });
}

// Tolerant parse: strip code fences, find the JSON array, coerce each item.
function parseSuggestions(text: string): Suggestion[] {
  let body = text.trim();
  const fence = body.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) body = fence[1].trim();
  const start = body.indexOf("[");
  const end = body.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) return [];

  let arr: unknown;
  try {
    arr = JSON.parse(body.slice(start, end + 1));
  } catch {
    return [];
  }
  if (!Array.isArray(arr)) return [];

  return arr
    .map((item) => {
      const raw = (item ?? {}) as Record<string, unknown>;
      return {
        type: enumVal(raw.type, TEST_TYPE_VALUES, "NEGATIVE_BOUNDARY"),
        category: str(raw.category).slice(0, 80),
        scenario: str(raw.scenario),
        testData: str(raw.testData),
        expected: str(raw.expected),
      };
    })
    .filter((s) => s.scenario.trim().length > 0);
}
