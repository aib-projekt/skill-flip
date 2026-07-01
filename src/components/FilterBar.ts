import type { BrowseFilterState } from '../lib/filters';
import type { Category, Glossary, Level } from '../types/glossary';

/**
 * Sticky search/category/level filter bar for Browse (spec Section 3).
 *
 * Owns only its own DOM + `BrowseFilterState` in-memory; `applyFilters`
 * itself lives in `../lib/filters.ts` (Group 3) and is invoked by the parent
 * (`BrowseGrid.ts`) via `onChange`, not by this component directly.
 */

/** Full 12-value category taxonomy — all chips always render, even at count 0. */
const ALL_CATEGORIES: Category[] = [
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
];

const ALL_LEVELS: Array<Level | 'All'> = ['All', 'Junior', 'Regular', 'Senior'];

/** Category chips beyond this count collapse into the "+N more" overflow chip. */
const VISIBLE_CATEGORY_CHIP_COUNT = 5;

const SEARCH_DEBOUNCE_MS = 200;

export interface CreateFilterBarOptions {
  /** Full (unfiltered) dataset — used to compute live per-category counts. */
  entries: Glossary;
  /** Fired whenever filter state changes (search is debounced; chip/level toggles are immediate). */
  onChange: (state: BrowseFilterState) => void;
}

export interface FilterBarInstance {
  element: HTMLElement;
  getState: () => BrowseFilterState;
  /** Resets search + category + level state to defaults and fires onChange. */
  reset: () => void;
  /** Overwrites the search input's displayed value (used by "Clear filters"). */
  setSearchValue: (value: string) => void;
  destroy: () => void;
}

function defaultState(): BrowseFilterState {
  return { searchQuery: '', selectedCategories: [], selectedLevel: 'All' };
}

export function createFilterBar(options: CreateFilterBarOptions): FilterBarInstance {
  const state: BrowseFilterState = defaultState();

  const root = document.createElement('div');
  root.className = 'filter-bar';

  // --- Search input --------------------------------------------------------
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.className = 'search-input';
  searchInput.placeholder = 'Search terms, definitions, PL translation...';

  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  searchInput.addEventListener('input', () => {
    const value = searchInput.value;
    if (debounceTimer !== undefined) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
      state.searchQuery = value;
      options.onChange({ ...state });
    }, SEARCH_DEBOUNCE_MS);
  });

  // --- Category chips --------------------------------------------------------
  const catChips = document.createElement('div');
  catChips.className = 'cat-chips';

  function categoryCounts(): Map<Category, number> {
    const counts = new Map<Category, number>(ALL_CATEGORIES.map((c) => [c, 0]));
    for (const entry of options.entries) {
      counts.set(entry.category, (counts.get(entry.category) ?? 0) + 1);
    }
    return counts;
  }

  function renderChips(): void {
    catChips.innerHTML = '';
    const counts = categoryCounts();
    const visible = ALL_CATEGORIES.slice(0, VISIBLE_CATEGORY_CHIP_COUNT);
    const overflow = ALL_CATEGORIES.slice(VISIBLE_CATEGORY_CHIP_COUNT);

    for (const category of visible) {
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.classList.toggle('active', state.selectedCategories.includes(category));
      chip.textContent = `${category} (${counts.get(category) ?? 0})`;
      chip.addEventListener('click', () => toggleCategory(category));
      catChips.appendChild(chip);
    }

    if (overflow.length > 0) {
      const moreChip = document.createElement('span');
      moreChip.className = 'chip more';
      moreChip.textContent = `+${overflow.length} more`;
      catChips.appendChild(moreChip);
    }
  }

  function toggleCategory(category: Category): void {
    const idx = state.selectedCategories.indexOf(category);
    if (idx === -1) {
      state.selectedCategories = [...state.selectedCategories, category];
    } else {
      state.selectedCategories = state.selectedCategories.filter((c) => c !== category);
    }
    renderChips();
    options.onChange({ ...state });
  }

  // --- Level segmented control --------------------------------------------------------
  const levelToggle = document.createElement('div');
  levelToggle.className = 'level-toggle';

  function renderLevelToggle(): void {
    levelToggle.innerHTML = '';
    for (const level of ALL_LEVELS) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'lvl';
      btn.classList.toggle('active', state.selectedLevel === level);
      btn.textContent = level;
      btn.addEventListener('click', () => {
        state.selectedLevel = level;
        renderLevelToggle();
        options.onChange({ ...state });
      });
      levelToggle.appendChild(btn);
    }
  }

  root.append(searchInput, catChips, levelToggle);
  renderChips();
  renderLevelToggle();

  return {
    element: root,
    getState: () => ({ ...state, selectedCategories: [...state.selectedCategories] }),
    reset: () => {
      if (debounceTimer !== undefined) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
      }
      Object.assign(state, defaultState());
      searchInput.value = '';
      renderChips();
      renderLevelToggle();
      options.onChange({ ...state });
    },
    setSearchValue: (value: string) => {
      searchInput.value = value;
    },
    destroy: () => {
      if (debounceTimer !== undefined) {
        clearTimeout(debounceTimer);
      }
    },
  };
}
