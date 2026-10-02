import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { parseLesson } from "../src/content/parse";
import type { Module } from "../src/content/types";
import { validateConcepts } from "../src/content/concepts";

const scriptDir = resolve(dirname(fileURLToPath(import.meta.url)));
/**
 * Validate every real lesson with the same parser used by the web app.
 * This keeps malformed content from reaching the browser bundle.
 */
const CONTENT_DIR = resolve(scriptDir, "../../content");

interface ModuleSource {
  module: Module;
  position: number;
}

function loadContentIndex(): Module[] {
  return readdirSync(CONTENT_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => readModule(entry.name))
    .sort(
      (a, b) =>
        a.position - b.position ||
        a.module.slug.localeCompare(b.module.slug),
    )
    .map(({ module }) => module);
}

function readModule(name: string): ModuleSource {
  const moduleDir = join(CONTENT_DIR, name);
  const moduleYamlPath = join(moduleDir, "module.yaml");
  const data = parseYaml(readFileSync(moduleYamlPath, "utf-8")) as Record<
    string,
    unknown
  >;

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
      return parseLesson(readFileSync(path, "utf-8"), path);
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

function main(): void {
  const contentIndex = loadContentIndex();

  validateConcepts(contentIndex);

  console.log("All content lessons and concept requirements are valid.");
}

main();
