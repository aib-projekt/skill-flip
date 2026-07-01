import { describe, it, expect } from 'vitest';
import { drawNextCard, applyMark } from './learnAlgorithm';
import type { LearnProgressEntry } from './storage';
import type { Glossary } from '../types/glossary';

function makeEntry(id: string, term = id): Glossary[number] {
  return {
    id,
    term,
    description: `${term} description`,
    translationPl: `${term} pl`,
    descriptionPl: `${term} opis`,
    category: 'Java',
    level: 'Regular',
  };
}

describe('learnAlgorithm', () => {
  it('weighted draw demonstrably favors dont_know over many draws', () => {
    const entries: Glossary = [makeEntry('a'), makeEntry('b'), makeEntry('c')];
    const progress: Record<string, LearnProgressEntry> = {
      a: { bucket: 'dont_know', consecutiveKnowCount: 0 },
      b: { bucket: 'unseen', consecutiveKnowCount: 0 },
      c: { bucket: 'know', consecutiveKnowCount: 0 },
    };

    const counts: Record<string, number> = { a: 0, b: 0, c: 0 };
    const draws = 500;
    for (let i = 0; i < draws; i++) {
      const drawn = drawNextCard(entries, progress, null);
      counts[drawn.id]++;
    }

    // Uniform-among-3-cards share would be ~1/3 (~166 of 500).
    // dont_know (weight 4 of total weight 7) should draw far more often
    // than its 1-card-among-3 share.
    const uniformShare = draws / entries.length;
    expect(counts.a).toBeGreaterThan(uniformShare * 1.3);
    // and dont_know should clearly outdraw the know-bucket card
    expect(counts.a).toBeGreaterThan(counts.c);
  });

  it('graduates dont_know -> know after exactly 2 consecutive know marks, and demotes immediately on a single dont_know mark', () => {
    let entry: LearnProgressEntry = { bucket: 'dont_know', consecutiveKnowCount: 0 };

    entry = applyMark(entry, 'know');
    expect(entry).toEqual({ bucket: 'dont_know', consecutiveKnowCount: 1 });

    entry = applyMark(entry, 'know');
    expect(entry).toEqual({ bucket: 'know', consecutiveKnowCount: 0 });

    // A single "don't know" mark demotes immediately and resets the counter,
    // even from a fresh unseen/know state.
    const fromKnow = applyMark({ bucket: 'know', consecutiveKnowCount: 0 }, 'dont_know');
    expect(fromKnow).toEqual({ bucket: 'dont_know', consecutiveKnowCount: 0 });

    const midProgress = applyMark({ bucket: 'dont_know', consecutiveKnowCount: 1 }, 'dont_know');
    expect(midProgress).toEqual({ bucket: 'dont_know', consecutiveKnowCount: 0 });
  });

  it('excludes the immediately-previous card from the next draw unless it is the only card remaining', () => {
    const entries: Glossary = [makeEntry('a'), makeEntry('b')];
    const progress: Record<string, LearnProgressEntry> = {
      a: { bucket: 'unseen', consecutiveKnowCount: 0 },
      b: { bucket: 'unseen', consecutiveKnowCount: 0 },
    };

    for (let i = 0; i < 30; i++) {
      const drawn = drawNextCard(entries, progress, 'a');
      expect(drawn.id).toBe('b');
    }

    // Fallback: previous card is the only card in the pool.
    const singleEntryPool: Glossary = [makeEntry('a')];
    const singleProgress: Record<string, LearnProgressEntry> = {
      a: { bucket: 'unseen', consecutiveKnowCount: 0 },
    };
    const drawn = drawNextCard(singleEntryPool, singleProgress, 'a');
    expect(drawn.id).toBe('a');
  });

  it('degrades gracefully to uniform-random when every entry is in the know bucket', () => {
    const entries: Glossary = [makeEntry('a'), makeEntry('b'), makeEntry('c')];
    const progress: Record<string, LearnProgressEntry> = {
      a: { bucket: 'know', consecutiveKnowCount: 0 },
      b: { bucket: 'know', consecutiveKnowCount: 0 },
      c: { bucket: 'know', consecutiveKnowCount: 0 },
    };

    const counts: Record<string, number> = { a: 0, b: 0, c: 0 };
    const draws = 300;
    for (let i = 0; i < draws; i++) {
      // Exclude nothing to isolate the uniform-weight behavior across all 3.
      const drawn = drawNextCard(entries, progress, null);
      counts[drawn.id]++;
      expect(drawn).toBeDefined();
    }

    // Roughly uniform: no bucket should dominate when weights are equal.
    const expectedShare = draws / entries.length;
    for (const id of ['a', 'b', 'c']) {
      expect(counts[id]).toBeGreaterThan(expectedShare * 0.5);
      expect(counts[id]).toBeLessThan(expectedShare * 1.5);
    }
  });
});
