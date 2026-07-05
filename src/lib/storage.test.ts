import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import {
  readProgress,
  writeProgress,
  resetProgress,
  computeBucketCounts,
  readFilterState,
  writeFilterState,
  defaultPersistedFilterState,
} from './storage';
import type { Glossary } from '../types/glossary';

const STORAGE_KEY = 'skillflip:learn-progress';
const FILTER_STATE_KEY = 'skillflip:browse-filter-state';

describe('storage', () => {
  beforeAll(() => {
    // Environment workaround (not a production concern): under this
    // Node/jsdom combination, Node's own experimental `webstorage` global
    // shadows jsdom's public `window.localStorage` getter, which resolves
    // to `undefined` even though jsdom's real Storage instance is alive
    // internally as `window._localStorage`. Re-pointing the public property
    // at jsdom's internal instance restores normal Storage behavior for
    // this test file only. Production code (`storage.ts`) is unaffected —
    // it runs in a real browser where `window.localStorage` is never
    // shadowed like this. The durable fix is a Vitest setup file (or
    // `NODE_OPTIONS=--no-experimental-webstorage`) at the project config
    // level; flagged separately since `vite.config.ts` is outside this
    // group's file scope.
    if (typeof window.localStorage === 'undefined') {
      Object.defineProperty(window, 'localStorage', {
        value: (window as unknown as { _localStorage: Storage })._localStorage,
        configurable: true,
      });
    }
  });

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

  it('write then read round-trips a PersistedFilterState exactly', () => {
    writeFilterState({ selectedCategories: ['Java'], selectedLevel: 'Senior' });

    const state = readFilterState();
    expect(state).toEqual({ selectedCategories: ['Java'], selectedLevel: 'Senior' });
  });

  it('readFilterState falls back to defaultPersistedFilterState when absent, malformed, or non-object', () => {
    // Absent key.
    expect(readFilterState()).toEqual(defaultPersistedFilterState());

    // Malformed JSON.
    localStorage.setItem(FILTER_STATE_KEY, '{not valid json');
    expect(readFilterState()).toEqual(defaultPersistedFilterState());

    // Parsed value is not an object (e.g. a JSON number).
    localStorage.setItem(FILTER_STATE_KEY, '42');
    expect(readFilterState()).toEqual(defaultPersistedFilterState());

    // Parsed value is an object but shape-mismatched (missing/wrong-typed fields).
    localStorage.setItem(FILTER_STATE_KEY, '{}');
    expect(readFilterState()).toEqual(defaultPersistedFilterState());

    localStorage.setItem(FILTER_STATE_KEY, JSON.stringify({ selectedCategories: 'Java', selectedLevel: 'Senior' }));
    expect(readFilterState()).toEqual(defaultPersistedFilterState());
  });

  it('writeFilterState persists only selectedCategories and selectedLevel keys', () => {
    writeFilterState({ selectedCategories: ['DevOps'], selectedLevel: 'Junior' });

    const raw = localStorage.getItem(FILTER_STATE_KEY);
    expect(raw).not.toBeNull();
    expect(Object.keys(JSON.parse(raw as string)).sort()).toEqual([
      'selectedCategories',
      'selectedLevel',
    ]);
  });
});
