/**
 * Standalone content-pipeline schema validator for `data/glossary.json`.
 *
 * This module is intentionally decoupled from `src/`: it does not import
 * anything from `src/types/glossary.ts` (to keep `content-pipeline/` a
 * zero-dependency tool that isn't bundled into the Vite build), but it
 * mirrors that file's `GlossaryEntry`/`Category`/`Level` shapes by hand.
 * If the canonical types in `src/types/glossary.ts` change, update the
 * constants below to match.
 *
 * Usage:
 *   npm run validate-glossary
 *   node --experimental-strip-types content-pipeline/validate-glossary.ts [path/to/glossary.json]
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

/** Mirrors `Category` in `src/types/glossary.ts` (14-value taxonomy). */
export const VALID_CATEGORIES = [
  'Java',
  'Spring/JEE',
  'Data Storage',
  'DevOps',
  'Cloud Engineering',
  'Testing',
  'Soft Skills',
  'Management',
  'Mentoring',
  'Problem Solving',
  'API Development',
  'Software Engineering',
  'Software Architecture',
  'Microservices & Distributed Systems',
] as const;

/** Mirrors `Level` in `src/types/glossary.ts`. */
export const VALID_LEVELS = ['Junior', 'Regular', 'Senior'] as const;

const REQUIRED_STRING_FIELDS = [
  'id',
  'term',
  'description',
  'translationPl',
  'descriptionPl',
  'category',
  'level',
] as const;

/**
 * Validates an unknown value against the `GlossaryEntry[]` shape.
 *
 * Returns an array of human-readable error messages. An empty array means
 * the input is valid. Never throws on malformed input — malformation is
 * itself reported as an error message.
 */
export function validateGlossary(data: unknown): string[] {
  const errors: string[] = [];

  if (!Array.isArray(data)) {
    return ['glossary must be a JSON array of GlossaryEntry objects'];
  }

  if (data.length === 0) {
    errors.push('glossary array must not be empty');
  }

  const seenIds = new Map<string, number>();
  const seenTermCategoryPairs = new Map<string, number>();

  data.forEach((rawEntry, index) => {
    const entryLabel = `entry[${index}]`;

    if (typeof rawEntry !== 'object' || rawEntry === null || Array.isArray(rawEntry)) {
      errors.push(`${entryLabel}: must be an object`);
      return;
    }

    const entry = rawEntry as Record<string, unknown>;

    for (const field of REQUIRED_STRING_FIELDS) {
      const value = entry[field];
      if (typeof value !== 'string' || value.trim().length === 0) {
        errors.push(`${entryLabel} (id: ${String(entry.id ?? '?')}): missing or empty required field "${field}"`);
      }
    }

    const category = entry.category;
    if (typeof category === 'string' && !VALID_CATEGORIES.includes(category as (typeof VALID_CATEGORIES)[number])) {
      errors.push(
        `${entryLabel} (id: ${String(entry.id ?? '?')}): invalid category "${category}" — must be one of: ${VALID_CATEGORIES.join(', ')}`,
      );
    }

    const level = entry.level;
    if (typeof level === 'string' && !VALID_LEVELS.includes(level as (typeof VALID_LEVELS)[number])) {
      errors.push(
        `${entryLabel} (id: ${String(entry.id ?? '?')}): invalid level "${level}" — must be one of: ${VALID_LEVELS.join(', ')}`,
      );
    }

    if (typeof entry.id === 'string') {
      const priorIndex = seenIds.get(entry.id);
      if (priorIndex !== undefined) {
        errors.push(`duplicate id "${entry.id}" found at entry[${priorIndex}] and ${entryLabel}`);
      } else {
        seenIds.set(entry.id, index);
      }
    }

    if (typeof entry.term === 'string' && typeof entry.category === 'string') {
      const pairKey = `${entry.term}::${entry.category}`;
      const priorIndex = seenTermCategoryPairs.get(pairKey);
      if (priorIndex !== undefined) {
        errors.push(
          `duplicate (term, category) pair "${entry.term}" / "${entry.category}" found at entry[${priorIndex}] and ${entryLabel}`,
        );
      } else {
        seenTermCategoryPairs.set(pairKey, index);
      }
    }
  });

  return errors;
}

function main(): void {
  const targetPath = process.argv[2] ?? resolve(import.meta.dirname, '..', 'data', 'glossary.json');

  let raw: string;
  try {
    raw = readFileSync(targetPath, 'utf-8');
  } catch (error) {
    console.error(`validate-glossary: could not read "${targetPath}": ${(error as Error).message}`);
    process.exit(1);
  }

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (error) {
    console.error(`validate-glossary: "${targetPath}" is not valid JSON: ${(error as Error).message}`);
    process.exit(1);
  }

  const errors = validateGlossary(data);

  if (errors.length > 0) {
    console.error(`validate-glossary: ${errors.length} error(s) found in "${targetPath}":\n`);
    for (const error of errors) {
      console.error(`  - ${error}`);
    }
    process.exit(1);
  }

  const count = Array.isArray(data) ? data.length : 0;
  console.log(`validate-glossary: OK — ${count} entries validated with zero errors.`);
}

// Only run the CLI when this module is executed directly (not when imported
// by validate-glossary.test.ts). Compared as file URLs (not raw strings) so
// this is robust to spaces/special characters in the repo's absolute path.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
