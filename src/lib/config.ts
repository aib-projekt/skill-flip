/**
 * Tunable constants for the Learn Mode weighted-draw algorithm.
 *
 * `BUCKET_WEIGHTS` controls how often a card from each bucket is drawn
 * relative to the others (higher weight = drawn more often).
 * `GRADUATION_THRESHOLD` is the number of consecutive "know" marks needed
 * to graduate a card from `dont_know` to `know`.
 */

export const BUCKET_WEIGHTS = {
  dont_know: 4,
  unseen: 2,
  know: 1,
} as const;

export const GRADUATION_THRESHOLD = 2;
