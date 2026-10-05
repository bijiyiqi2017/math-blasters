import { describe, expect, it } from "vitest";
import { join } from "node:path";

import { validateContent } from "../scripts/validate-content";

const FIXTURE_CONTENT_DIR = join(__dirname, "fixtures", "content-validation");
const MALFORMED_CONTENT_DIR = join(__dirname, "fixtures", "content-validation-malformed");
const MISSING_MODULE_CONTENT_DIR = join(__dirname, "fixtures", "content-validation-missing-module");
const EMPTY_FIELD_CONTENT_DIR = join(__dirname, "fixtures", "content-validation-empty-field");
const SLUG_MISMATCH_CONTENT_DIR = join(__dirname, "fixtures", "content-validation-slug-mismatch");

describe("validateContent", () => {
  it("validates clean fixture content", () => {
    expect(() => validateContent(FIXTURE_CONTENT_DIR)).not.toThrow();
  });

  it("rejects a malformed lesson", () => {
    expect(() => validateContent(MALFORMED_CONTENT_DIR)).toThrow(
      /01-intro\.md.*slug.*wrong-slug.*intro/,
    );
  });

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

  it("rejects a module with a mismatched slug", () => {
    expect(() => validateContent(SLUG_MISMATCH_CONTENT_DIR)).toThrow(
      /module\.yaml.*slug.*different-module.*module-a/,
    );
  });
});
