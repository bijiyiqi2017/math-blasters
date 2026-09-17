import { parse } from "yaml";
import type { Criterion } from "./types";

export function parseCriteria(yamlSource: string, path: string, stepNumber: number): Criterion[] {
    const validChecks = [
  "equals",
  "approx",
  "in_range",
  "equals_any",
  "set_equals",
  "equivalent",
];
    const parsed = parse(yamlSource);
    if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error(`Expected an array of criteria in ${path} at step ${stepNumber}, but got: ${typeof parsed}`);
    }

    parsed.forEach((criterion, index) => {
    if (
      !(
        typeof criterion === "object" &&
        criterion !== null &&
        "check" in criterion &&
        validChecks.includes(criterion.check)
      )
    ) {
      throw new Error(
        `Invalid criterion at ${path} step ${stepNumber} index ${index}: ${JSON.stringify(criterion)}`,
      );
    }
    if (criterion.check === "equals_any" && !Array.isArray(criterion.expected)) {
      throw new Error(
        `Invalid expected value for equals_any criterion at ${path} step ${stepNumber} index ${index}: expected an array, but got: ${typeof criterion.expected}`,
      );
    }
    if (criterion.check === "approx" && (typeof criterion.expected !== "object" || criterion.expected === null || !("value" in criterion.expected) || !("epsilon" in criterion.expected))) {
      throw new Error(
        `Invalid expected value for approx criterion at ${path} step ${stepNumber} index ${index}: expected an object with "value" and "epsilon" properties, but got: ${JSON.stringify(criterion.expected)}`,
      );
    }
    if (criterion.check === "in_range" && (typeof criterion.expected !== "object" || criterion.expected === null || !("min" in criterion.expected) || !("max" in criterion.expected))) {
      throw new Error(
        `Invalid expected value for in_range criterion at ${path} step ${stepNumber} index ${index}: expected an object with "min" and "max" properties, but got: ${JSON.stringify(criterion.expected)}`,
      );
    }
    if (criterion.check === "set_equals" && !Array.isArray(criterion.expected)) {
      throw new Error(
        `Invalid expected value for set_equals criterion at ${path} step ${stepNumber} index ${index}: expected an array, but got: ${typeof criterion.expected}`,
      );
    }
    if (criterion.check === "equivalent" && typeof criterion.expected !== "string") {
      throw new Error(
        `Invalid expected value for equivalent criterion at ${path} step ${stepNumber} index ${index}: expected a string, but got: ${typeof criterion.expected}`,
      );
    }
    if (criterion.check === "equals" && (typeof criterion.expected !== "number" && typeof criterion.expected !== "string")) {
      throw new Error(
        `Invalid expected value for equals criterion at ${path} step ${stepNumber} index ${index}: expected a number or string, but got: ${typeof criterion.expected}`,
      );
    }
    if (criterion.reason_code === undefined || typeof criterion.reason_code !== "string" || criterion.reason_code.trim() === "") {
      throw new Error(
        `Invalid reason_code for criterion at ${path} step ${stepNumber} index ${index}: expected a non empty string, but got: ${typeof criterion.reason_code}`,
      );
    }
  });

  return parsed as Criterion[];
}
