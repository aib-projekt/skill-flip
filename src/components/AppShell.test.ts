import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createAppShell } from './AppShell';
import { writeProgress, readProgress } from '../lib/storage';
import type { Glossary, Category, Level } from '../types/glossary';

function makeEntry(id: string, term = id, category: Category = 'Java', level: Level = 'Regular'): Glossary[number] {
  return {
    id,
    term,
    description: `${term} description`,
    translationPl: `${term} pl`,
    descriptionPl: `${term} opis`,
    category,
    level,
  };
}

const entries: Glossary = [makeEntry('a'), makeEntry('b'), makeEntry('c')];

function switchToTab(root: HTMLElement, label: 'Learn' | 'Browse'): void {
  const tab = Array.from(root.querySelectorAll<HTMLElement>('.tab-btn')).find((b) => b.textContent === label)!;
  tab.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

describe('AppShell', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to the Learn tab active on initial mount', () => {
    const shell = createAppShell({ entries });

    const learnTab = Array.from(shell.element.querySelectorAll<HTMLElement>('.tab-btn')).find(
      (b) => b.textContent === 'Learn'
    );
    const browseTab = Array.from(shell.element.querySelectorAll<HTMLElement>('.tab-btn')).find(
      (b) => b.textContent === 'Browse'
    );

    expect(learnTab?.classList.contains('active')).toBe(true);
    expect(browseTab?.classList.contains('active')).toBe(false);

    // Learn Mode content is visible; Browse content is not present/visible.
    expect(shell.element.querySelector('.learn-stage')).not.toBeNull();
    expect(shell.element.classList.contains('app-shell')).toBe(true);
    expect(shell.element.classList.contains('wide')).toBe(false);
  });

  it('clicking the Browse tab swaps visible content to BrowseGrid and applies the 900px wide container variant', () => {
    const shell = createAppShell({ entries });

    const browseTab = Array.from(shell.element.querySelectorAll<HTMLElement>('.tab-btn')).find(
      (b) => b.textContent === 'Browse'
    )!;
    browseTab.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(shell.element.classList.contains('wide')).toBe(true);
    expect(shell.element.querySelector('.browse-grid-root')).not.toBeNull();
    expect(shell.element.querySelector('.filter-bar')).not.toBeNull();

    const browseTabAfter = Array.from(shell.element.querySelectorAll<HTMLElement>('.tab-btn')).find(
      (b) => b.textContent === 'Browse'
    )!;
    const learnTabAfter = Array.from(shell.element.querySelectorAll<HTMLElement>('.tab-btn')).find(
      (b) => b.textContent === 'Learn'
    )!;
    expect(browseTabAfter.classList.contains('active')).toBe(true);
    expect(learnTabAfter.classList.contains('active')).toBe(false);
  });

  it('clicking the Learn tab swaps back to LearnMode and applies the 480px container variant', () => {
    const shell = createAppShell({ entries });

    const browseTab = Array.from(shell.element.querySelectorAll<HTMLElement>('.tab-btn')).find(
      (b) => b.textContent === 'Browse'
    )!;
    browseTab.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(shell.element.classList.contains('wide')).toBe(true);

    const learnTab = Array.from(shell.element.querySelectorAll<HTMLElement>('.tab-btn')).find(
      (b) => b.textContent === 'Learn'
    )!;
    learnTab.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(shell.element.classList.contains('wide')).toBe(false);
    expect(shell.element.querySelector('.learn-stage')).not.toBeNull();

    const learnTabAfter = Array.from(shell.element.querySelectorAll<HTMLElement>('.tab-btn')).find(
      (b) => b.textContent === 'Learn'
    )!;
    expect(learnTabAfter.classList.contains('active')).toBe(true);
  });

  it('switching tabs does not trigger a page reload or alter window.location', () => {
    const originalHref = window.location.href;
    const shell = createAppShell({ entries });

    const browseTab = Array.from(shell.element.querySelectorAll<HTMLElement>('.tab-btn')).find(
      (b) => b.textContent === 'Browse'
    )!;
    browseTab.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    const learnTab = Array.from(shell.element.querySelectorAll<HTMLElement>('.tab-btn')).find(
      (b) => b.textContent === 'Learn'
    )!;
    learnTab.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(window.location.href).toBe(originalHref);
    expect(window.location.hash).toBe('');
  });

  it('preserves Learn Mode progress written to localStorage after switching to Browse and back', () => {
    const shell = createAppShell({ entries });

    // Simulate a progress write that happened while Learn Mode was active.
    writeProgress('a', { bucket: 'know', consecutiveKnowCount: 1 });

    const browseTab = Array.from(shell.element.querySelectorAll<HTMLElement>('.tab-btn')).find(
      (b) => b.textContent === 'Browse'
    )!;
    browseTab.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    const learnTab = Array.from(shell.element.querySelectorAll<HTMLElement>('.tab-btn')).find(
      (b) => b.textContent === 'Learn'
    )!;
    learnTab.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(readProgress().a).toEqual({ bucket: 'know', consecutiveKnowCount: 1 });
  });

  it('hydrates BrowseGrid/FilterBar from a persisted filter state on construction', () => {
    localStorage.setItem(
      'skillflip:browse-filter-state',
      JSON.stringify({ selectedCategories: ['Java'], selectedLevel: 'Senior' })
    );

    const shell = createAppShell({ entries });
    switchToTab(shell.element, 'Browse');

    const javaChip = Array.from(shell.element.querySelectorAll<HTMLElement>('.chip')).find((c) =>
      c.textContent?.startsWith('Java')
    );
    const seniorBtn = Array.from(shell.element.querySelectorAll<HTMLElement>('.lvl')).find(
      (b) => b.textContent === 'Senior'
    );

    expect(javaChip?.classList.contains('active')).toBe(true);
    expect(seniorBtn?.classList.contains('active')).toBe(true);
  });

  it('persists only selectedCategories/selectedLevel to localStorage when FilterBar changes', () => {
    const shell = createAppShell({ entries });
    switchToTab(shell.element, 'Browse');

    const javaChip = Array.from(shell.element.querySelectorAll<HTMLElement>('.chip')).find((c) =>
      c.textContent?.startsWith('Java')
    )!;
    javaChip.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    const stored = JSON.parse(localStorage.getItem('skillflip:browse-filter-state') ?? '{}');
    expect(stored).toEqual({ selectedCategories: ['Java'], selectedLevel: 'All' });
  });

  it('propagates a FilterBar change to Learn Mode via updateFilter with the correct subset', () => {
    const mixedEntries: Glossary = [
      makeEntry('a', 'a', 'Java', 'Regular'),
      makeEntry('b', 'b', 'DevOps', 'Regular'),
    ];

    const shell = createAppShell({ entries: mixedEntries });
    switchToTab(shell.element, 'Browse');

    const devopsChip = Array.from(shell.element.querySelectorAll<HTMLElement>('.chip')).find((c) =>
      c.textContent?.startsWith('DevOps')
    )!;
    devopsChip.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    switchToTab(shell.element, 'Learn');

    const badge = shell.element.querySelector('.learn-stage .badge');
    expect(badge?.textContent).toBe('DevOps');
  });

  it('simulates a page reload: a second AppShell reading the same localStorage immediately shows the filtered subset with no re-interaction', () => {
    const mixedEntries: Glossary = [
      makeEntry('a', 'a', 'Java', 'Regular'),
      makeEntry('b', 'b', 'DevOps', 'Regular'),
    ];

    // First "session": set a filter via Browse.
    const firstShell = createAppShell({ entries: mixedEntries });
    switchToTab(firstShell.element, 'Browse');
    const devopsChip = Array.from(firstShell.element.querySelectorAll<HTMLElement>('.chip')).find((c) =>
      c.textContent?.startsWith('DevOps')
    )!;
    devopsChip.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    // Second "session" (simulated reload): a fresh AppShell instance reads
    // the same localStorage on construction, with no interaction at all.
    const secondShell = createAppShell({ entries: mixedEntries });

    const badge = secondShell.element.querySelector('.learn-stage .badge');
    expect(badge?.textContent).toBe('DevOps');
  });

  it('clearing filters via BrowseGrid\'s own empty-state "Clear filters" button also clears Learn Mode\'s subset (both entry points converge on handleFilterChange)', async () => {
    vi.useFakeTimers();
    try {
      const mixedEntries: Glossary = [
        makeEntry('a', 'a', 'Java', 'Regular'),
        makeEntry('b', 'b', 'DevOps', 'Regular'),
      ];

      const shell = createAppShell({ entries: mixedEntries });
      switchToTab(shell.element, 'Browse');

      // Activate a Java filter, then narrow the search to force zero matches
      // so BrowseGrid renders its own empty-state "Clear filters" button
      // (distinct from LearnMode's own `.filter-chip` clear affordance).
      const javaChip = Array.from(shell.element.querySelectorAll<HTMLElement>('.chip')).find((c) =>
        c.textContent?.startsWith('Java')
      )!;
      javaChip.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      const search = shell.element.querySelector<HTMLInputElement>('.search-input')!;
      search.value = 'no-such-term-anywhere';
      search.dispatchEvent(new Event('input', { bubbles: true }));
      vi.advanceTimersByTime(200);

      const clearBtn = shell.element.querySelector<HTMLElement>('.empty-state .clear-btn');
      expect(clearBtn).not.toBeNull();
      clearBtn!.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      switchToTab(shell.element, 'Learn');

      // Both entries are shown again — Learn Mode's subset was cleared back
      // to the full unfiltered set via the same handleFilterChange mediator
      // used by FilterBar chip/level toggles.
      expect(shell.element.querySelector('.learn-stage .filter-chip')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("clearing the filter via Learn Mode's own topbar chip also resets Browse's already-mounted FilterBar/grid, without a tab switch or reload (reverse convergence direction)", () => {
    const mixedEntries: Glossary = [
      makeEntry('a', 'a', 'Java', 'Regular'),
      makeEntry('b', 'b', 'DevOps', 'Regular'),
    ];

    const shell = createAppShell({ entries: mixedEntries });
    switchToTab(shell.element, 'Browse');

    const javaChip = Array.from(shell.element.querySelectorAll<HTMLElement>('.chip')).find((c) =>
      c.textContent?.startsWith('Java')
    )!;
    javaChip.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    // `renderChips()` rebuilds all chip elements on every toggle, so the
    // captured `javaChip` reference is now detached — re-query fresh.
    const javaChipActive = Array.from(shell.element.querySelectorAll<HTMLElement>('.chip')).find((c) =>
      c.textContent?.startsWith('Java')
    )!;
    expect(javaChipActive.classList.contains('active')).toBe(true);

    switchToTab(shell.element, 'Learn');
    const filterChip = shell.element.querySelector<HTMLElement>('.filter-chip')!;
    expect(filterChip).not.toBeNull();
    filterChip.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    // Browse's FilterBar is still mounted (just hidden behind the Learn tab)
    // and must reflect the clear immediately — no tab switch or reload needed.
    const javaChipAfter = Array.from(shell.element.querySelectorAll<HTMLElement>('.chip')).find((c) =>
      c.textContent?.startsWith('Java')
    )!;
    expect(javaChipAfter.classList.contains('active')).toBe(false);

    const allLevelBtn = Array.from(shell.element.querySelectorAll<HTMLElement>('.lvl')).find(
      (b) => b.textContent === 'All'
    )!;
    expect(allLevelBtn.classList.contains('active')).toBe(true);

    const stored = JSON.parse(localStorage.getItem('skillflip:browse-filter-state') ?? '{}');
    expect(stored).toEqual({ selectedCategories: [], selectedLevel: 'All' });
  });

  it('progress written while a filter is active remains visible in readProgress() for entries outside the filtered subset (global persistence, unaffected by scope)', () => {
    const mixedEntries: Glossary = [
      makeEntry('a', 'a', 'Java', 'Regular'),
      makeEntry('b', 'b', 'DevOps', 'Regular'),
    ];

    // 'b' (DevOps) already has progress recorded before any filter is applied.
    writeProgress('b', { bucket: 'know', consecutiveKnowCount: 3 });

    const shell = createAppShell({ entries: mixedEntries });
    switchToTab(shell.element, 'Browse');

    // Filter down to Java only — 'b' (DevOps) falls outside the active subset.
    const javaChip = Array.from(shell.element.querySelectorAll<HTMLElement>('.chip')).find((c) =>
      c.textContent?.startsWith('Java')
    )!;
    javaChip.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    // 'b' progress is untouched by the active filter — persistence is global,
    // not scoped to whatever subset Learn Mode currently draws from.
    expect(readProgress().b).toEqual({ bucket: 'know', consecutiveKnowCount: 3 });
  });

  it('resetProgress() clears ALL entries\' progress regardless of the currently active filter (Requirement 9 — unaffected scope)', () => {
    const mixedEntries: Glossary = [
      makeEntry('a', 'a', 'Java', 'Regular'),
      makeEntry('b', 'b', 'DevOps', 'Regular'),
    ];

    writeProgress('a', { bucket: 'know', consecutiveKnowCount: 1 });
    writeProgress('b', { bucket: 'dont_know', consecutiveKnowCount: 0 });

    const shell = createAppShell({ entries: mixedEntries });
    switchToTab(shell.element, 'Browse');

    // Activate a Java-only filter, then switch back to Learn to reset there.
    const javaChip = Array.from(shell.element.querySelectorAll<HTMLElement>('.chip')).find((c) =>
      c.textContent?.startsWith('Java')
    )!;
    javaChip.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    switchToTab(shell.element, 'Learn');

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const resetBtn = shell.element.querySelector<HTMLElement>('.icon-btn[aria-label="Reset progress"]')!;
    resetBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    confirmSpy.mockRestore();

    // Both 'a' (in-filter) and 'b' (out-of-filter) are cleared — reset is
    // never scoped to the active filter.
    expect(readProgress()).toEqual({});
  });
});
