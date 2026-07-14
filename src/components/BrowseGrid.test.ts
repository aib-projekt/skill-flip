import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createBrowseGrid } from './BrowseGrid';
import type { Glossary } from '../types/glossary';

const fixture: Glossary = [
  {
    id: 'java-generics',
    term: 'Generics',
    description: 'Type parameters that allow classes and methods to operate on typed objects.',
    translationPl: 'Generyki',
    descriptionPl: 'Parametry typu pozwalające klasom i metodom operować na typowanych obiektach.',
    category: 'Java',
    level: 'Regular',
  },
  {
    id: 'java-jvm-memory-model',
    term: 'JVM Memory Model',
    description: 'How the JVM organizes heap, stack, and metaspace memory.',
    translationPl: 'Model pamięci JVM',
    descriptionPl: 'Sposób w jaki JVM organizuje pamięć sterty, stosu i metaspace.',
    category: 'Java',
    level: 'Senior',
  },
  {
    id: 'devops-ci-cd',
    term: 'CI/CD Pipeline',
    description: 'Automated build, test, and deployment workflow.',
    translationPl: 'Potok CI/CD',
    descriptionPl: 'Zautomatyzowany proces budowania, testowania i wdrażania.',
    category: 'DevOps',
    level: 'Regular',
  },
  {
    id: 'devops-containers',
    term: 'Containers',
    description: 'Lightweight, isolated units for packaging and running applications.',
    translationPl: 'Kontenery',
    descriptionPl: 'Lekkie, izolowane jednostki do pakowania i uruchamiania aplikacji.',
    category: 'DevOps',
    level: 'Junior',
  },
];

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('BrowseGrid / FilterBar integration', () => {
  it('debounces search input 200ms before applying the filter and re-rendering the grid', () => {
    const grid = createBrowseGrid({ entries: fixture });
    const search = grid.element.querySelector<HTMLInputElement>('.search-input');
    expect(search).not.toBeNull();

    search!.value = 'generics';
    search!.dispatchEvent(new Event('input', { bubbles: true }));

    // Not yet applied before the debounce window elapses.
    vi.advanceTimersByTime(199);
    expect(grid.element.querySelectorAll('.tile').length).toBe(4);

    // Applied once the debounce window elapses.
    vi.advanceTimersByTime(1);
    expect(grid.element.querySelectorAll('.tile').length).toBe(1);
    expect(grid.element.textContent).toContain('Generics');
  });

  it('toggling a category chip updates the multi-select filter state and re-renders the grid', () => {
    const grid = createBrowseGrid({ entries: fixture });
    const devopsChip = Array.from(grid.element.querySelectorAll<HTMLElement>('.chip')).find((c) =>
      c.textContent?.startsWith('DevOps')
    );
    expect(devopsChip).toBeTruthy();

    devopsChip!.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    // Chip toggling rebuilds the chip DOM, so re-query rather than reuse
    // the pre-click element reference.
    const devopsChipAfter = Array.from(grid.element.querySelectorAll<HTMLElement>('.chip')).find((c) =>
      c.textContent?.startsWith('DevOps')
    );
    expect(devopsChipAfter!.classList.contains('active')).toBe(true);
    expect(grid.element.querySelectorAll('.tile').length).toBe(2);
    expect(grid.element.textContent).toContain('CI/CD Pipeline');
    expect(grid.element.textContent).not.toContain('Generics');
  });

  it('level segmented control selection narrows results correctly', () => {
    const grid = createBrowseGrid({ entries: fixture });
    const juniorBtn = Array.from(grid.element.querySelectorAll<HTMLElement>('.lvl')).find(
      (b) => b.textContent === 'Junior'
    );
    expect(juniorBtn).toBeTruthy();

    juniorBtn!.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    // Level toggling rebuilds the segmented-control DOM, so re-query rather
    // than reuse the pre-click element reference.
    const juniorBtnAfter = Array.from(grid.element.querySelectorAll<HTMLElement>('.lvl')).find(
      (b) => b.textContent === 'Junior'
    );
    expect(juniorBtnAfter!.classList.contains('active')).toBe(true);
    expect(grid.element.querySelectorAll('.tile').length).toBe(1);
    expect(grid.element.textContent).toContain('Containers');
  });

  it('renders the result count as "N of {dataset.length} terms" using the actual loaded array length', () => {
    const grid = createBrowseGrid({ entries: fixture });
    const resultCount = grid.element.querySelector('.result-count');
    expect(resultCount?.textContent).toBe(`${fixture.length} of ${fixture.length} terms`);

    const juniorBtn = Array.from(grid.element.querySelectorAll<HTMLElement>('.lvl')).find(
      (b) => b.textContent === 'Junior'
    );
    juniorBtn!.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(grid.element.querySelector('.result-count')?.textContent).toBe(`1 of ${fixture.length} terms`);
  });

  it('renders the empty state when filters yield zero matches and removes it once a match exists again', () => {
    const grid = createBrowseGrid({ entries: fixture });
    const search = grid.element.querySelector<HTMLInputElement>('.search-input');

    search!.value = 'no-such-term-anywhere';
    search!.dispatchEvent(new Event('input', { bubbles: true }));
    vi.advanceTimersByTime(200);

    expect(grid.element.querySelector('.empty-state')).not.toBeNull();
    expect(grid.element.querySelector('.grid')).toBeNull();
    expect(grid.element.textContent).toContain('No terms match');

    search!.value = '';
    search!.dispatchEvent(new Event('input', { bubbles: true }));
    vi.advanceTimersByTime(200);

    expect(grid.element.querySelector('.empty-state')).toBeNull();
    expect(grid.element.querySelector('.grid')).not.toBeNull();
  });

  it('renders a 0-count chip for a category with zero entries in the loaded dataset (Group 9 gap)', () => {
    const grid = createBrowseGrid({ entries: fixture });

    // The starter fixture only has Java and DevOps entries; all other 12
    // taxonomy categories must still render as visible/overflow chips at
    // count 0 rather than being omitted entirely. "Cloud Engineering" is
    // within the first 7 (visible, non-overflow) categories.
    const cloudChip = Array.from(grid.element.querySelectorAll<HTMLElement>('.chip')).find((c) =>
      c.textContent?.startsWith('Cloud Engineering')
    );
    expect(cloudChip).toBeTruthy();
    expect(cloudChip?.textContent).toBe('Cloud Engineering (0)');

    // Categories beyond the visible-chip count collapse into a "+N more" overflow chip.
    const moreChip = grid.element.querySelector<HTMLElement>('.chip.more');
    expect(moreChip).not.toBeNull();
    expect(moreChip?.textContent).toMatch(/^\+\d+ more$/);
  });

  it('clicking the "+N more" overflow chip reveals the remaining category chips, wired into the same filter toggle', () => {
    const grid = createBrowseGrid({ entries: fixture });

    // "Microservices & Distributed Systems" is the 14th (last) taxonomy
    // category, beyond the first 7 visible chips, so it starts out
    // collapsed into "+N more".
    const microservicesChipBefore = Array.from(grid.element.querySelectorAll<HTMLElement>('.chip')).find((c) =>
      c.textContent?.startsWith('Microservices & Distributed Systems')
    );
    expect(microservicesChipBefore).toBeUndefined();

    const moreChip = grid.element.querySelector<HTMLElement>('.chip.more');
    expect(moreChip).not.toBeNull();
    moreChip!.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    // Expanding renders all 14 categories and relabels the trailing chip
    // (the same element, not removed) to "Show less".
    const moreChipAfterExpand = grid.element.querySelector<HTMLElement>('.chip.more');
    expect(moreChipAfterExpand).not.toBeNull();
    expect(moreChipAfterExpand?.textContent).toBe('Show less');
    const microservicesChipAfter = Array.from(grid.element.querySelectorAll<HTMLElement>('.chip')).find((c) =>
      c.textContent?.startsWith('Microservices & Distributed Systems')
    );
    expect(microservicesChipAfter).toBeTruthy();

    // The newly revealed chip must actually participate in filtering, not
    // just render inertly.
    microservicesChipAfter!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    const microservicesChipActive = Array.from(grid.element.querySelectorAll<HTMLElement>('.chip')).find((c) =>
      c.textContent?.startsWith('Microservices & Distributed Systems')
    );
    expect(microservicesChipActive?.classList.contains('active')).toBe(true);
    expect(grid.element.querySelector('.empty-state')).not.toBeNull();
  });

  it('collapsing via the relabeled "Show less" chip returns to the 7-visible state and preserves a selection made while expanded', () => {
    const grid = createBrowseGrid({ entries: fixture });

    // Expand to reveal categories beyond the first 7 visible chips.
    const moreChip = grid.element.querySelector<HTMLElement>('.chip.more');
    expect(moreChip).not.toBeNull();
    moreChip!.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    // Select a category that's only visible in the expanded state.
    const architectureChip = Array.from(grid.element.querySelectorAll<HTMLElement>('.chip')).find((c) =>
      c.textContent?.startsWith('Software Architecture')
    );
    expect(architectureChip).toBeTruthy();
    architectureChip!.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    // Collapse via the same trailing chip element, now labeled "Show less".
    const showLessChip = Array.from(grid.element.querySelectorAll<HTMLElement>('.chip')).find(
      (c) => c.textContent === 'Show less'
    );
    expect(showLessChip).toBeTruthy();
    showLessChip!.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    // Back to the original 7-visible + "+7 more" trailing chip state.
    const chipsAfterCollapse = grid.element.querySelectorAll<HTMLElement>('.chip');
    expect(chipsAfterCollapse.length).toBe(8); // 7 visible category chips + 1 trailing overflow chip
    const moreChipAfterCollapse = grid.element.querySelector<HTMLElement>('.chip.more');
    expect(moreChipAfterCollapse?.textContent).toBe('+7 more');
    const architectureChipCollapsed = Array.from(grid.element.querySelectorAll<HTMLElement>('.chip')).find((c) =>
      c.textContent?.startsWith('Software Architecture')
    );
    expect(architectureChipCollapsed).toBeUndefined();

    // Re-expand and confirm the selection made earlier survived the round trip.
    moreChipAfterCollapse!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    const architectureChipReExpanded = Array.from(grid.element.querySelectorAll<HTMLElement>('.chip')).find((c) =>
      c.textContent?.startsWith('Software Architecture')
    );
    expect(architectureChipReExpanded?.classList.contains('active')).toBe(true);
  });

  it("renders live mastered/shaky/new progress-stats in Browse's own topbar, shared computation with Learn Mode (Group 9 gap)", () => {
    const grid = createBrowseGrid({ entries: fixture });

    const statsBefore = grid.element.querySelector('.topbar .progress-stats');
    expect(statsBefore).not.toBeNull();
    expect(statsBefore?.textContent).toContain('0 mastered');
    expect(statsBefore?.textContent).toContain('0 shaky');
    expect(statsBefore?.textContent).toContain(`${fixture.length} new`);

    // refreshStats() re-reads localStorage (e.g. after a reset/mark elsewhere)
    // and updates Browse's own topbar without needing to remount the component.
    localStorage.setItem(
      'skillflip:learn-progress',
      JSON.stringify({ 'java-generics': { bucket: 'know', consecutiveKnowCount: 2 } })
    );
    grid.refreshStats();

    const statsAfter = grid.element.querySelector('.topbar .progress-stats');
    expect(statsAfter?.textContent).toContain('1 mastered');
    expect(statsAfter?.textContent).toContain(`${fixture.length - 1} new`);
  });

  it("scopes Browse's own topbar progress-stats to the active filtered subset, not the full glossary", () => {
    localStorage.setItem(
      'skillflip:learn-progress',
      JSON.stringify({
        'java-generics': { bucket: 'know', consecutiveKnowCount: 1 },
        'devops-ci-cd': { bucket: 'dont_know', consecutiveKnowCount: 0 },
      })
    );

    const grid = createBrowseGrid({ entries: fixture });

    const statsUnfiltered = grid.element.querySelector('.topbar .progress-stats');
    expect(statsUnfiltered?.textContent).toContain('1 mastered');
    expect(statsUnfiltered?.textContent).toContain('1 shaky');
    expect(statsUnfiltered?.textContent).toContain('2 new');

    // Filtering to "Java" only should immediately re-scope the stats to just
    // the 2 Java entries (1 mastered, 0 shaky, 1 new) rather than continuing
    // to reflect the full 4-entry fixture.
    const javaChip = Array.from(grid.element.querySelectorAll<HTMLElement>('.chip')).find((c) =>
      c.textContent?.startsWith('Java')
    );
    javaChip!.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    const statsFiltered = grid.element.querySelector('.topbar .progress-stats');
    expect(statsFiltered?.textContent).toContain('1 mastered');
    expect(statsFiltered?.textContent).toContain('0 shaky');
    expect(statsFiltered?.textContent).toContain('1 new');
  });

  it('"Clear filters" resets all filter state and restores the full unfiltered grid', () => {
    const grid = createBrowseGrid({ entries: fixture });
    const search = grid.element.querySelector<HTMLInputElement>('.search-input');

    search!.value = 'no-such-term-anywhere';
    search!.dispatchEvent(new Event('input', { bubbles: true }));
    vi.advanceTimersByTime(200);

    const clearBtn = grid.element.querySelector<HTMLElement>('.clear-btn');
    expect(clearBtn).not.toBeNull();
    clearBtn!.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(grid.element.querySelector('.empty-state')).toBeNull();
    expect(grid.element.querySelectorAll('.tile').length).toBe(fixture.length);
    expect(grid.element.querySelector<HTMLInputElement>('.search-input')?.value).toBe('');
    expect(grid.element.querySelector('.result-count')?.textContent).toBe(
      `${fixture.length} of ${fixture.length} terms`
    );
  });

  it('"Clear filters" also collapses an expanded chip list back to the compact 7-visible state', () => {
    const grid = createBrowseGrid({ entries: fixture });
    const search = grid.element.querySelector<HTMLInputElement>('.search-input');

    // Drive the grid into the empty state so the "Clear filters" action button renders.
    search!.value = 'no-such-term-anywhere';
    search!.dispatchEvent(new Event('input', { bubbles: true }));
    vi.advanceTimersByTime(200);
    expect(grid.element.querySelector('.empty-state')).not.toBeNull();

    // Expand to reveal categories beyond the first 7 visible chips.
    const moreChip = grid.element.querySelector<HTMLElement>('.chip.more');
    expect(moreChip).not.toBeNull();
    moreChip!.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    const moreChipAfterExpand = grid.element.querySelector<HTMLElement>('.chip.more');
    expect(moreChipAfterExpand?.textContent).toBe('Show less');

    const clearBtn = grid.element.querySelector<HTMLElement>('.clear-btn');
    expect(clearBtn).not.toBeNull();
    clearBtn!.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    // "Clear filters" rebuilds the chip DOM, so re-query rather than reuse
    // the pre-click element reference. This must return to the collapsed
    // 7-visible/"+7 more" state, not just clear the search/category state.
    const chipsAfterClear = grid.element.querySelectorAll<HTMLElement>('.chip');
    expect(chipsAfterClear.length).toBe(8); // 7 visible category chips + 1 trailing overflow chip
    const moreChipAfterClear = grid.element.querySelector<HTMLElement>('.chip.more');
    expect(moreChipAfterClear?.textContent).toBe('+7 more');
    const microservicesChipAfterClear = Array.from(grid.element.querySelectorAll<HTMLElement>('.chip')).find((c) =>
      c.textContent?.startsWith('Microservices & Distributed Systems')
    );
    expect(microservicesChipAfterClear).toBeUndefined();
  });

  it('hydrates from initialFilterState: pre-activates matching chip/level and pre-filters the grid with no interaction', () => {
    const grid = createBrowseGrid({
      entries: fixture,
      initialFilterState: { searchQuery: '', selectedCategories: ['DevOps'], selectedLevel: 'Junior' },
    });

    const devopsChip = Array.from(grid.element.querySelectorAll<HTMLElement>('.chip')).find((c) =>
      c.textContent?.startsWith('DevOps')
    );
    expect(devopsChip?.classList.contains('active')).toBe(true);

    const juniorBtn = Array.from(grid.element.querySelectorAll<HTMLElement>('.lvl')).find(
      (b) => b.textContent === 'Junior'
    );
    expect(juniorBtn?.classList.contains('active')).toBe(true);

    // Pre-filtered to the single DevOps + Junior entry, with no user interaction.
    expect(grid.element.querySelectorAll('.tile').length).toBe(1);
    expect(grid.element.textContent).toContain('Containers');
    expect(grid.element.querySelector('.result-count')?.textContent).toBe(`1 of ${fixture.length} terms`);
  });

  it('calls onFilterChange once with the updated BrowseFilterState when a category chip is toggled', () => {
    const onFilterChange = vi.fn();
    const grid = createBrowseGrid({ entries: fixture, onFilterChange });

    const devopsChip = Array.from(grid.element.querySelectorAll<HTMLElement>('.chip')).find((c) =>
      c.textContent?.startsWith('DevOps')
    );
    devopsChip!.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(onFilterChange).toHaveBeenCalledTimes(1);
    expect(onFilterChange).toHaveBeenCalledWith({
      searchQuery: '',
      selectedCategories: ['DevOps'],
      selectedLevel: 'All',
    });
  });
});
