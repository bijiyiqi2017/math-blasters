import type { Module } from "./types";

/**
 * Validate that labs only require concepts taught earlier in the same module.
 */
export function validateConcepts(index: Module[]): void {
  const taughtInOtherModule = new Map<string, string>();

  for (const module of index) {
    for (const lesson of module.lessons) {
      if (lesson.type === "tutorial") {
        for (const concept of lesson.teaches ?? []) {
          taughtInOtherModule.set(concept, module.slug);
        }
      }
    }
  }

  for (const module of index) {
    const taught = new Set<string>();
    const taughtLater = new Map<string, string>();

    for (const lesson of module.lessons) {
      if (lesson.type === "tutorial") {
        for (const concept of lesson.teaches ?? []) {
          taughtLater.set(concept, lesson.slug);
        }
      }
    }

    for (const lesson of module.lessons) {
      if (lesson.type === "tutorial") {
        for (const concept of lesson.teaches ?? []) {
          taught.add(concept);
        }
      }

      if (lesson.type === "lab") {
        for (const concept of lesson.requires ?? []) {
          if (!taught.has(concept)) {
            const tutorialSlug = taughtLater.get(concept);

            if (tutorialSlug !== undefined) {
              throw new Error(
                `${lesson.slug} requires ${concept}, which is taught later in ${tutorialSlug}`,
              );
            }

            if (taughtInOtherModule.get(concept) !== module.slug) {
              throw new Error(
                `${lesson.slug} requires ${concept}, which is taught in another module`,
              );
            }

            throw new Error(
              `${lesson.slug} requires ${concept}, which nothing before it teaches`,
            );
          }
        }
      }
    }
  }
}

export interface ConceptRequirement {
  concept: string;
  tutorialSlug: string;
  title: string;
}

/**
 * Return the tutorials that teach each concept required by a lab.
 *
 * Content validation guarantees that each required concept is taught
 * earlier in the same module.
 */
export function requirementsOf(
  index: Module[],
  labSlug: string,
): ConceptRequirement[] {
  for (const module of index) {
    const labIndex = module.lessons.findIndex(
      (lesson) => lesson.slug === labSlug && lesson.type === "lab",
    );

    if (labIndex === -1) continue;

    const lab = module.lessons[labIndex];
    const requirements = lab.requires ?? [];

    return requirements.map((concept) => {
      const tutorial = module.lessons
        .slice(0, labIndex)
        .find(
          (lesson) =>
            lesson.type === "tutorial" &&
            lesson.teaches?.includes(concept),
        );

      if (!tutorial) {
        throw new Error(
          `${labSlug} requires ${concept}, but no earlier tutorial teaches it`,
        );
      }

      return {
        concept,
        tutorialSlug: tutorial.slug,
        title: tutorial.title,
      };
    });
  }

  throw new Error(`Lab "${labSlug}" was not found`);
}

/**
 * Return the first tutorial required by a lab that the learner has not completed.
 * Returns null when every required tutorial has been completed.
 */
export function lockReason(
  index: Module[],
  labSlug: string,
  completedSlugs: string[],
): { tutorialSlug: string; title: string } | null {
  const completed = new Set(completedSlugs);

  const requirement = requirementsOf(index, labSlug).find(
    ({ tutorialSlug }) => !completed.has(tutorialSlug),
  );

  return requirement
    ? {
        tutorialSlug: requirement.tutorialSlug,
        title: requirement.title,
      }
    : null;
}
