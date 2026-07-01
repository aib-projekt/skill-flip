/**
 * Weighted-draw and bucket-transition logic for Learn Mode (Section 4 of the
 * feature spec).
 *
 * Draw algorithm (runs once per "Next"):
 *   1. Build a weighted pool: for each card, repeat its id in a flat array
 *      `BUCKET_WEIGHTS[bucket]` times (default bucket `unseen` if no
 *      progress recorded yet).
 *   2. Exclude the immediately-previous card from the pool for this draw
 *      only, unless it is the only card remaining (spec-audit Finding 6).
 *   3. Pick one entry uniformly at random from the (possibly-excluded) flat
 *      array — this naturally gives `dont_know` cards ~4x the draw chance
 *      of `know` cards.
 *
 * When every entry is in the `know` bucket, all weights are uniformly 1, so
 * the draw degrades gracefully to uniform-random across all entries with no
 * special-casing required.
 */

import { BUCKET_WEIGHTS, GRADUATION_THRESHOLD } from './config';
import type { Bucket, LearnProgressEntry, ProgressMap } from './storage';
import type { Glossary, GlossaryEntry } from '../types/glossary';

export type Mark = 'know' | 'dont_know';

function bucketOf(id: string, progress: ProgressMap): Bucket {
  return progress[id]?.bucket ?? 'unseen';
}

/**
 * Builds the weighted flat pool of entries (each entry repeated
 * `BUCKET_WEIGHTS[bucket]` times), excluding `excludeId` unless doing so
 * would empty the pool.
 */
function buildWeightedPool(
  entries: Glossary,
  progress: ProgressMap,
  excludeId: string | null
): GlossaryEntry[] {
  const candidates =
    excludeId !== null && entries.length > 1
      ? entries.filter((entry) => entry.id !== excludeId)
      : entries;

  const pool: GlossaryEntry[] = [];
  for (const entry of candidates) {
    const bucket = bucketOf(entry.id, progress);
    const weight = BUCKET_WEIGHTS[bucket];
    for (let i = 0; i < weight; i++) {
      pool.push(entry);
    }
  }

  return pool;
}

/**
 * Draws the next card to show in Learn Mode: a bucket-weighted random pick
 * from `entries`, excluding `previousId` unless it's the only card left.
 */
export function drawNextCard(
  entries: Glossary,
  progress: ProgressMap,
  previousId: string | null
): GlossaryEntry {
  if (entries.length === 0) {
    throw new Error('drawNextCard: cannot draw from an empty glossary');
  }

  const pool = buildWeightedPool(entries, progress, previousId);
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}

/**
 * Applies a "know"/"don't know" mark to a card's current progress entry,
 * returning the next entry (does not mutate the input).
 *
 * - "don't know" -> bucket = dont_know, consecutiveKnowCount reset to 0,
 *   immediately and regardless of prior state.
 * - "know" -> consecutiveKnowCount increments; once it reaches
 *   GRADUATION_THRESHOLD, bucket becomes `know` and the counter resets to 0.
 */
export function applyMark(current: LearnProgressEntry, mark: Mark): LearnProgressEntry {
  if (mark === 'dont_know') {
    return { bucket: 'dont_know', consecutiveKnowCount: 0 };
  }

  const consecutiveKnowCount = current.consecutiveKnowCount + 1;
  if (consecutiveKnowCount >= GRADUATION_THRESHOLD) {
    return { bucket: 'know', consecutiveKnowCount: 0 };
  }

  return { bucket: current.bucket, consecutiveKnowCount };
}
