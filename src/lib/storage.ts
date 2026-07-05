/**
 * localStorage-backed persistence for Learn Mode progress.
 *
 * Progress is stored as a single JSON blob under `STORAGE_KEY`, keyed by
 * `GlossaryEntry.id`, per Section 4 of the feature spec:
 *   localStorage['skillflip:learn-progress'] -> Record<string, LearnProgressEntry>
 *
 * `computeBucketCounts` is the single shared function both Browse's and
 * Learn Mode's independent topbars call to render "N mastered · N shaky ·
 * N new" (spec-audit Finding 2/4 — progress-stats appears in both views'
 * topbars, so this counting logic must not be duplicated).
 */

import type { Category, Glossary, Level } from '../types/glossary';

export type Bucket = 'unseen' | 'know' | 'dont_know';

export interface LearnProgressEntry {
  bucket: Bucket;
  /** Resets to 0 on any "don't know"; increments on each "know". */
  consecutiveKnowCount: number;
}

export type ProgressMap = Record<string, LearnProgressEntry>;

export interface BucketCounts {
  mastered: number;
  shaky: number;
  new: number;
}

const STORAGE_KEY = 'skillflip:learn-progress';
const FILTER_STATE_KEY = 'skillflip:browse-filter-state';

/**
 * Strict 2-field subset of `BrowseFilterState` (excludes `searchQuery`).
 * Kept as its own type rather than derived from `BrowseFilterState` so the
 * exclusion is structural, not just a runtime convention.
 */
export interface PersistedFilterState {
  selectedCategories: Category[];
  selectedLevel: Level | 'All';
}

export function defaultPersistedFilterState(): PersistedFilterState {
  return { selectedCategories: [], selectedLevel: 'All' };
}

/** Reads the full progress map from localStorage. Returns {} if absent or malformed. */
export function readProgress(): ProgressMap {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object') {
      return parsed as ProgressMap;
    }
    return {};
  } catch {
    return {};
  }
}

/** Writes (or overwrites) a single entry's progress and persists the whole map. */
export function writeProgress(id: string, entry: LearnProgressEntry): void {
  const progress = readProgress();
  progress[id] = entry;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Quota exceeded or storage unavailable (e.g. private browsing) — degrade
    // gracefully by skipping persistence rather than crashing the UI.
  }
}

/** Clears all Learn Mode progress, returning every card to `unseen`. */
export function resetProgress(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/** Reads the persisted Browse filter state. Falls back to defaults if absent, malformed, or shape-mismatched. */
export function readFilterState(): PersistedFilterState {
  const raw = localStorage.getItem(FILTER_STATE_KEY);
  if (!raw) {
    return defaultPersistedFilterState();
  }

  try {
    const parsed = JSON.parse(raw) as Partial<PersistedFilterState> | null;
    if (
      parsed &&
      typeof parsed === 'object' &&
      Array.isArray(parsed.selectedCategories) &&
      typeof parsed.selectedLevel === 'string'
    ) {
      return { selectedCategories: parsed.selectedCategories, selectedLevel: parsed.selectedLevel as Level | 'All' };
    }
    return defaultPersistedFilterState();
  } catch {
    return defaultPersistedFilterState();
  }
}

/**
 * Persists the Browse filter state. Constructs the stored object literal
 * explicitly with only `selectedCategories`/`selectedLevel` so `searchQuery`
 * is never written, even if a caller mistakenly passes a superset object.
 */
export function writeFilterState(state: PersistedFilterState): void {
  try {
    localStorage.setItem(
      FILTER_STATE_KEY,
      JSON.stringify({
        selectedCategories: state.selectedCategories,
        selectedLevel: state.selectedLevel,
      })
    );
  } catch {
    // Quota exceeded or storage unavailable — degrade gracefully.
  }
}

/**
 * Computes live mastered/shaky/new counts across the given entries, reading
 * current bucket state from localStorage. Entries with no stored progress
 * default to `unseen` ("new"), matching the draw algorithm's default.
 */
export function computeBucketCounts(entries: Glossary): BucketCounts {
  const progress = readProgress();

  let mastered = 0;
  let shaky = 0;
  let fresh = 0;

  for (const entry of entries) {
    const bucket = progress[entry.id]?.bucket ?? 'unseen';
    if (bucket === 'know') {
      mastered++;
    } else if (bucket === 'dont_know') {
      shaky++;
    } else {
      fresh++;
    }
  }

  return { mastered, shaky, new: fresh };
}
