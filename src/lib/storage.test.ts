import { describe, it, expect, beforeEach } from 'vitest';
import { readProgress, writeProgress, resetProgress, computeBucketCounts } from './storage';
import type { Glossary } from '../types/glossary';

const STORAGE_KEY = 'skillflip:learn-progress';

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('write then read round-trips a LearnProgressEntry correctly under the expected key', () => {
    writeProgress('java-generics', { bucket: 'dont_know', consecutiveKnowCount: 0 });

    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw as string)).toEqual({
      'java-generics': { bucket: 'dont_know', consecutiveKnowCount: 0 },
    });

    const progress = readProgress();
    expect(progress['java-generics']).toEqual({ bucket: 'dont_know', consecutiveKnowCount: 0 });
  });

  it('reset clears the key entirely', () => {
    writeProgress('java-generics', { bucket: 'know', consecutiveKnowCount: 2 });
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();

    resetProgress();

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(readProgress()).toEqual({});
  });

  it('computeBucketCounts reports mastered/shaky/new against the progress and entry list', () => {
    const entries: Glossary = [
      {
        id: 'a',
        term: 'A',
        description: 'a',
        translationPl: 'a',
        descriptionPl: 'a',
        category: 'Java',
        level: 'Regular',
      },
      {
        id: 'b',
        term: 'B',
        description: 'b',
        translationPl: 'b',
        descriptionPl: 'b',
        category: 'Java',
        level: 'Regular',
      },
      {
        id: 'c',
        term: 'C',
        description: 'c',
        translationPl: 'c',
        descriptionPl: 'c',
        category: 'Java',
        level: 'Regular',
      },
    ];

    writeProgress('a', { bucket: 'know', consecutiveKnowCount: 0 });
    writeProgress('b', { bucket: 'dont_know', consecutiveKnowCount: 0 });
    // 'c' has no progress entry -> counts as new/unseen.

    const counts = computeBucketCounts(entries);
    expect(counts).toEqual({ mastered: 1, shaky: 1, new: 1 });
  });
});
