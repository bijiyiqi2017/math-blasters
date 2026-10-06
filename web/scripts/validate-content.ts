import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parse as parseYaml } from "yaml";
import { parseLesson } from "../src/content/parse";
import type { Module } from "../src/content/types";
import { validateConcepts } from "../src/content/concepts";

type LessonParser = typeof parseLesson;

const scriptDir = resolve(dirname(fileURLToPath(import.meta.url)));
/**
 * Validate every real lesson with the same parser used by the web app.
 * This keeps malformed content from reaching the browser bundle.
 */
export const DEFAULT_CONTENT_DIR = resolve(scriptDir, "../../content");

interface ModuleSource {
  module: Module;
  position: number;
}

function loadContentIndex(
  contentDir: string,
  parser: LessonParser,
): Module[] {
  return readdirSync(contentDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => readModule(contentDir, entry.name, parser))
    .sort(
      (a, b) =>
        a.position - b.position ||
        a.module.slug.localeCompare(b.module.slug),
    )
    .map(({ module }) => module);
}

function readModule(
  contentDir: string,
  name: string,
  parser: LessonParser,
): ModuleSource {
  const moduleDir = join(contentDir, name);
  const moduleYamlPath = join(moduleDir, "module.yaml");

  if (!existsSync(moduleYamlPath)) {
    throw new Error(`${moduleDir}: missing "module.yaml".`);
  }

  const data = parseYamlMapping(
    readFileSync(moduleYamlPath, "utf-8"),
    moduleYamlPath,
  );

  const slug = requireString(data, "slug", moduleYamlPath);
  const title = requireString(data, "title", moduleYamlPath);
  const position = requireNumber(data, "position", moduleYamlPath);

  if (slug !== name) {
    throw new Error(
      `${moduleYamlPath}: the "slug" field ("${slug}") must match the directory name ("${name}").`,
    );
  }

  const lessons = readdirSync(moduleDir)
    .filter((filename) => filename.endsWith(".md"))
    .sort()
    .map((filename) => {
      const path = join(moduleDir, filename);
      return parser(readFileSync(path, "utf-8"), path);
    });

  return {
    module: {
      slug,
      title,
      lessons,
    },
    position,
  };
}

function parseYamlMapping(
  source: string,
  path: string,
): Record<string, unknown> {
  let data: unknown;

  try {
    data = parseYaml(source);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`${path}: not valid YAML — ${reason}`);
  }

  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw new Error(`${path}: must be a YAML mapping of fields.`);
  }

  return data as Record<string, unknown>;
}

function requireString(
  data: Record<string, unknown>,
  field: string,
  path: string,
): string {
  const value = data[field];

  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(
      `${path}: the "${field}" field is required and must be a non-empty string.`,
    );
  }

  return value;
}

function requireNumber(
  data: Record<string, unknown>,
  field: string,
  path: string,
): number {
  const value = data[field];

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(
      `${path}: the "${field}" field is required and must be a number.`,
    );
  }

  return value;
}

export function validateContent(
  contentDir: string = DEFAULT_CONTENT_DIR,
  parser: LessonParser = parseLesson,
): void {
  const contentIndex = loadContentIndex(contentDir, parser);

  validateConcepts(contentIndex);

  console.log("All content lessons and concept requirements are valid.");
}

export function runCli(
  contentDir: string = process.argv[2] ?? DEFAULT_CONTENT_DIR,
): number {
  try {
    validateContent(contentDir);
    return 0;
  } catch (error) {
    console.error(error);
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = runCli();
}
