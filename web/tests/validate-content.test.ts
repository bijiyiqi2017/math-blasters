import { execFile } from "node:child_process";
import { join } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

import { validateContent } from "../scripts/validate-content";

const execFileAsync = promisify(execFile);

const FIXTURE_CONTENT_DIR = join(__dirname, "fixtures", "content-validation");
const MALFORMED_CONTENT_DIR = join(__dirname, "fixtures", "content-validation-malformed");
const MISSING_MODULE_CONTENT_DIR = join(__dirname, "fixtures", "content-validation-missing-module");
const EMPTY_FIELD_CONTENT_DIR = join(__dirname, "fixtures", "content-validation-empty-field");
const EMPTY_MODULE_CONTENT_DIR = join(__dirname, "fixtures", "content-validation-empty-module");
const SLUG_MISMATCH_CONTENT_DIR = join(__dirname, "fixtures", "content-validation-slug-mismatch");
const CONCEPT_VIOLATION_CONTENT_DIR = join(__dirname, "fixtures", "content-validation-concept-violation");
const TSX_BIN = join(__dirname, "../node_modules/.bin/tsx");
const VALIDATOR_SCRIPT = join(__dirname, "../scripts/validate-content.ts");

async function runValidator(contentDir: string) {
  try {
    const result = await execFileAsync(TSX_BIN, [
      VALIDATOR_SCRIPT,
      contentDir,
    ]);

    return {
      code: 0,
      stdout: result.stdout,
      stderr: result.stderr,
    };
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof error.code === "number"
    ) {
      return {
        code: error.code,
        stdout:
          "stdout" in error && typeof error.stdout === "string"
            ? error.stdout
            : "",
        stderr:
          "stderr" in error && typeof error.stderr === "string"
            ? error.stderr
            : "",
      };
    }

    throw error;
  }
}

describe("validateContent", () => {
  it("validates clean fixture content", () => {
    expect(() => validateContent(FIXTURE_CONTENT_DIR)).not.toThrow();
  });

  it("exits successfully for clean content", async () => {
    const result = await runValidator(FIXTURE_CONTENT_DIR);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain(
      "All content lessons and concept requirements are valid",
    );
  }, 15000);

  it("rejects a malformed lesson", () => {
    expect(() => validateContent(MALFORMED_CONTENT_DIR)).toThrow(
      /01-intro\.md.*slug.*wrong-slug.*intro/,
    );
  });

  it("exits with failure and reports the malformed lesson", async () => {
    const result = await runValidator(MALFORMED_CONTENT_DIR);
    const malformedLessonPath = join(
      MALFORMED_CONTENT_DIR,
      "module-a",
      "01-intro.md",
    );

    expect(result.code).toBe(1);
    expect(result.stderr).toContain(malformedLessonPath);
    expect(result.stderr).toMatch(/slug.*wrong-slug.*intro/);
  }, 15000);

  it("rejects a module with missing module.yaml", () => {
    expect(() => validateContent(MISSING_MODULE_CONTENT_DIR)).toThrow(
      /module-a.*missing.*module\.yaml/,
    );
  });

  it("rejects an empty module field", () => {
    expect(() => validateContent(EMPTY_FIELD_CONTENT_DIR)).toThrow(
      /module\.yaml.*title.*required.*non-empty string/,
    );
  });

  it("rejects an empty module.yaml", () => {
    expect(() => validateContent(EMPTY_MODULE_CONTENT_DIR)).toThrow(
      /module\.yaml.*must be a YAML mapping/,
    );
  });

  it("rejects a module with a mismatched slug", () => {
    expect(() => validateContent(SLUG_MISMATCH_CONTENT_DIR)).toThrow(
      /module\.yaml.*slug.*different-module.*module-a/,
    );
  });

  it("rejects a lab that requires an untaught concept", () => {
    expect(() => validateContent(CONCEPT_VIOLATION_CONTENT_DIR)).toThrow(
      /practice.*requires.*subtraction.*nothing before it teaches/,
    );
  });

  it("uses the injected lesson parser", () => {
    let parserCalled = false;

    const fakeParser = () => {
      parserCalled = true;

      return {
        slug: "intro",
        title: "Introduction",
        type: "tutorial" as const,
        steps: [],
      };
    };

    expect(() => validateContent(FIXTURE_CONTENT_DIR, fakeParser)).not.toThrow();
    expect(parserCalled).toBe(true);
  });
});
