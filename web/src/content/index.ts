import type {
  Lesson,
  Module,
  PageLesson,
  PageModule,
} from "./types";
import { parse as parseYaml } from "yaml";
import { parseLesson } from "./parse";

const moduleSources = import.meta.glob<string>("@content/**/module.yaml", {
  eager: true,
  query: "?raw",
  import: "default",
});
const moduleEntries = Object.entries(moduleSources);
type ModuleMetadata = { slug: string; title: string; description: string; position: number; modulePath: string; };
const modules: ModuleMetadata[] = [];


for (const [path, source] of moduleEntries) {
  const data = parseYaml(source);

  modules.push({
    slug: data.slug,
    title: data.title,
    description: data.summary,
    modulePath: path.slice(0, path.lastIndexOf("/")),
    position: data.position,
  });
}

const lessonSources = import.meta.glob<string>("@content/**/*.md", { eager: true, query: "?raw", import: "default", });
const lessonEntries = Object.entries(lessonSources);
const lessonsByModule = new Map<string, Lesson[]>();
for (let index = 0; index < lessonEntries.length; index++) {
  const [path, source]: [string, string] = lessonEntries[index];
  const modulePath = path.slice(0, path.lastIndexOf("/"));
  
  const lesson = parseLesson(source, path);
  const moduleLessons = lessonsByModule.get(modulePath) ?? [];
  moduleLessons.push(lesson);
  lessonsByModule.set(modulePath, moduleLessons);
}

const contentModules: Module[] = modules.map(({ modulePath, position, ...metadata }) => ({
  ...metadata,
  lessons: lessonsByModule.get(modulePath) ?? [],
}));

export { parseLesson } from "./parse";
// Re-export all types & fixtures
export * from "./types";
export * from "./fixtures";

/**
 * Content index containing all registered modules.
 * For now, this is populated with fixture data. It will be swapped for the
 * build-time glob / loader in a subsequent phase without changing the public contract.
 */
export const contentIndex: Module[] = contentModules;

// ---------------------------------------------------------------------------
// Accessor Stubs (operating synchronously against contentIndex)
// ---------------------------------------------------------------------------

/**
 * Retrieve all available modules.
 */
export function getModules(): PageModule[] {
  return contentIndex.map(toPageModule);
}

/**
 * Retrieve a module by its slug.
 */
export function getModule(slug: string): PageModule | undefined {
  const module = contentIndex.find((module) => module.slug === slug);

  return module ? toPageModule(module) : undefined;
}

/**
 * Retrieve a lesson by its slug across all modules.
 */
export function getLesson(slug: string): PageLesson | undefined {
  for (const module of contentIndex) {
    const lesson = module.lessons.find((lesson) => lesson.slug === slug);

    if (lesson) {
      return toPageLesson(lesson);
    }
  }

  return undefined;
}

/** Retrieve the slug of the module a lesson belongs to, so a lesson-only route (/lessons/:slug carries no module slug) can still link back to it. */
export function getModuleForLesson(lessonSlug: string): string | undefined {
  const module = contentIndex.find((module) =>
    module.lessons.some((lesson) => lesson.slug === lessonSlug),
  );

  return module?.slug;
}

function toPageLesson(lesson: Lesson): PageLesson {
  const steps = lesson.steps.map((step) => {
    if (step.type === "answer") {
      const { prompt, type } = step;

      return {prompt, type};
    }

    return step;
  });

  return {
    ...lesson,
    steps,
  };
}

function toPageModule(module: Module): PageModule {
  return {
    ...module,
    lessons: module.lessons.map(toPageLesson),
  };
}

// ---------------------------------------------------------------------------
// Evaluation Exports
// ---------------------------------------------------------------------------

export { checkStep, checkCriterion, normalizeSubmission } from "./check";

// ---------------------------------------------------------------------------
// Signature-only Stubs (throw "not implemented")
// ---------------------------------------------------------------------------

/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * Validate a Lesson domain object against schema rules.
 */
export function validateLesson(_lesson: Lesson, _path?: string): void {
  throw new Error("not implemented");
}

/* eslint-enable @typescript-eslint/no-unused-vars */
