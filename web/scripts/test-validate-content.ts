import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const scriptDir = fileURLToPath(new URL(".", import.meta.url));
const fixtureDir = join(scriptDir, "../tests/fixtures");

const TSX_BIN = join(scriptDir, "../node_modules/.bin/tsx");
const VALIDATOR_SCRIPT = join(scriptDir, "validate-content.ts");
const CLEAN_CONTENT_DIR = join(fixtureDir, "content-validation");
const MALFORMED_CONTENT_DIR = join(
  fixtureDir,
  "content-validation-malformed",
);

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

const clean = await runValidator(CLEAN_CONTENT_DIR);

if (
  clean.code !== 0 ||
  !clean.stdout.includes(
    "All content lessons and concept requirements are valid",
  )
) {
  throw new Error(
    `Expected clean content to exit 0, got ${clean.code}: ${clean.stderr}`,
  );
}

const malformed = await runValidator(MALFORMED_CONTENT_DIR);

if (
  malformed.code !== 1 ||
  !malformed.stderr.includes("wrong-slug") ||
  !malformed.stderr.includes("intro")
) {
  throw new Error(
    `Expected malformed content to exit 1 with the lesson error, got ${malformed.code}: ${malformed.stderr}`,
  );
}

console.log("Content validator CLI tests passed.");
