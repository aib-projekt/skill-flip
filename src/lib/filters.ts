/**
 * Pure filtering/search logic for Browse mode (Section 3 of the feature spec).
 *
 * `applyFilters` is synchronous and takes the already-current search string —
 * the 200ms debounce timer itself lives in `FilterBar.ts` (Group 4), not here.
 */

import type { Category, Glossary, Level } from '../types/glossary';

export interface BrowseFilterState {
  /** Raw, already-debounced search input. */
  searchQuery: string;
  /** Empty array = all categories shown. */
  selectedCategories: Category[];
  selectedLevel: Level | 'All';
}

/**
 * Narrows `entries` by category (multi-select), level (segmented value), and
 * a case-insensitive substring search across term, description,
 * translationPl, and descriptionPl (spec-audit correction: all 4 fields).
 * All three criteria combine with AND semantics.
 */
export function applyFilters(entries: Glossary, state: BrowseFilterState): Glossary {
  const query = state.searchQuery.trim().toLowerCase();

  return entries.filter((entry) => {
    const categoryMatch =
      state.selectedCategories.length === 0 || state.selectedCategories.includes(entry.category);

    const levelMatch = state.selectedLevel === 'All' || entry.level === state.selectedLevel;

    const searchMatch =
      query === '' ||
      entry.term.toLowerCase().includes(query) ||
      entry.description.toLowerCase().includes(query) ||
      entry.translationPl.toLowerCase().includes(query) ||
      entry.descriptionPl.toLowerCase().includes(query);

    return categoryMatch && levelMatch && searchMatch;
  });
}
