import { create, isConstantNode, isOperatorNode, parseDependencies, simplifyDependencies } from "mathjs";
import type { MathNode } from "mathjs";
import { normalizeSubmission } from "./check";
import type { CriterionResult, EquivalentCriterion } from "./types";

// Scoped instance: only parse and simplify, built once.
const math = create({ parseDependencies, simplifyDependencies });

const MAX_EXPRESSION_LENGTH = 500;
// simplify cost grows steeply with tree size; 20 nodes per side stays well under a second.
const MAX_NODES = 20;
// Float noise allowance once exact fractions are off, e.g. 0.1 + 0.2 vs 0.3.
const ZERO_TOLERANCE = Number.EPSILON * 4;

// Numeric value of a constant or negated constant, else null.
function constantValue(node: MathNode): number | null {
  if (isConstantNode(node)) {
    return typeof node.value === "number" ? node.value : null;
  }
  if (isOperatorNode(node) && node.fn === "unaryMinus" && node.args.length === 1) {
    const inner = constantValue(node.args[0]);
    return inner === null ? null : -inner;
  }
  return null;
}

function countNodes(node: MathNode): number {
  let count = 0;
  node.traverse(() => {
    count++;
  });
  return count;
}

export function checkEquivalent(
  criterion: EquivalentCriterion,
  submission: unknown,
): CriterionResult {
  const reason_code = criterion.reason_code;

  if (typeof criterion.expected !== "string") {
    return {
      passed: false,
      reason_code,
      error: "Expected value is not a string",
    };
  }

  const expectedValue = normalizeSubmission(criterion.expected);
  const submissionValue = normalizeSubmission(submission);

  if (expectedValue === "") {
    return {
      passed: false,
      reason_code,
      error: "Expected value is empty",
    };
  }

  if (submissionValue === "") {
    return {
      passed: false,
      reason_code,
      error: "Submission value is empty",
    };
  }

  if (submissionValue.length > MAX_EXPRESSION_LENGTH || expectedValue.length > MAX_EXPRESSION_LENGTH) {
    return {
      passed: false,
      reason_code,
      error: "Expression is too long",
    };
  }

  try {
    const expected = math.parse(expectedValue);
    const submitted = math.parse(submissionValue);

    if (countNodes(expected) > MAX_NODES || countNodes(submitted) > MAX_NODES) {
      return {
        passed: false,
        reason_code,
        error: "Expression is too complex",
      };
    }

    // Exact fractions off: BigInt powers like 9^9^9 would otherwise hang the tab.
    const difference = math.simplify(
      `${expected} - (${submitted})`,
      {},
      { exactFractions: false },
    );

    const value = constantValue(difference);

    if (value !== null && Math.abs(value) <= ZERO_TOLERANCE) {
      return {
        passed: true,
      };
    }

    return {
      passed: false,
      reason_code,
    };
  } catch {
    return {
      passed: false,
      reason_code,
      error: "Invalid expression",
    };
  }
}
