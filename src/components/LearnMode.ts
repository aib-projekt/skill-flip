import { createCard } from './Card';
import type { CardInstance } from './Card';
import { createEmptyState } from './EmptyState';
import { drawNextCard, applyMark } from '../lib/learnAlgorithm';
import type { Mark } from '../lib/learnAlgorithm';
import { readProgress, writeProgress, resetProgress } from '../lib/storage';
import { renderProgressStats } from './progressStats';
import type { Category, Glossary, GlossaryEntry, Level } from '../types/glossary';

/**
 * Learn Mode view (spec Section 4 + spec-audit corrected AppShell boundary).
 *
 * Renders its OWN topbar (exit-to-browse icon + `.progress-stats` +
 * reset-progress icon) — AppShell owns only the bottom tab bar and outer
 * container width variant, per the spec-audit correction. Always-resumable:
 * a weighted-drawn card is shown as soon as this component mounts, with no
 * "start session" gate.
 *
 * Mounts a single `Card` (`variant: 'full'`) fed by `learnAlgorithm`'s
 * weighted draw. Prev/Next nav from Card re-draws a new weighted card
 * (Prev/Next don't step through prior history — Learn Mode has no queue,
 * only a live weighted draw excluding the immediately-previous card).
 * Marking "Know it"/"Don't know" (via the swipe gesture on Card, or the
 * `.mark-row` buttons rendered here once flipped) writes progress
 * immediately via `storage.ts`, then draws the next card.
 *
 * Filter-awareness (Group 5): AppShell mediates `BrowseFilterState` and
 * pushes the already-filtered subset + display-only filter summary down via
 * `updateFilter()`. LearnMode never re-derives or widens the subset itself —
 * every render (card draw, progress stats, empty state) is scoped to
 * whatever subset was last handed to it via construction or `updateFilter`.
 */

/** Display-only summary of Browse's active filter, used for the topbar chip label. */
export interface LearnModeFilterSummary {
  selectedCategories: Category[];
  selectedLevel: Level | 'All';
}

export interface CreateLearnModeOptions {
  entries: Glossary;
  /** Invoked when the user clicks the `.filter-chip`'s clear affordance or the empty-state's "Clear filter" button. LearnMode never clears the filter itself — AppShell owns that. */
  onClearFilter?: () => void;
  /** Seeds the initial `.filter-chip` visibility/label; defaults to no active filter when omitted. */
  filterState?: LearnModeFilterSummary;
}

function defaultFilterSummary(): LearnModeFilterSummary {
  return { selectedCategories: [], selectedLevel: 'All' };
}

/** Matches FilterBar.ts's own "≤2 joined, 3+ overflow" convention for chip/label text. */
function formatFilterLabel(filterState: LearnModeFilterSummary): string {
  const { selectedCategories, selectedLevel } = filterState;

  let categoryPart = '';
  if (selectedCategories.length > 0) {
    categoryPart =
      selectedCategories.length <= 2
        ? selectedCategories.join(', ')
        : `${selectedCategories[0]} +${selectedCategories.length - 1} more`;
  }

  const levelPart = selectedLevel !== 'All' ? selectedLevel : '';

  return [categoryPart, levelPart].filter(Boolean).join(' · ') + '  ✕';
}

function isFilterActive(filterState: LearnModeFilterSummary): boolean {
  return filterState.selectedCategories.length > 0 || filterState.selectedLevel !== 'All';
}

export interface LearnModeState {
  currentEntry: GlossaryEntry;
}

export interface LearnModeInstance {
  /** Root DOM node — append this into the page. */
  element: HTMLElement;
  /** Returns a shallow copy of the current LearnModeState. */
  getState: () => LearnModeState;
  /**
   * Swaps the active subset + filter summary and re-renders atomically:
   * card redrawn (or `EmptyState` swapped in when `newEntries` is empty),
   * `.filter-chip` visibility/label recomputed, progress stats rescoped.
   * Never falls back to a wider pool — an empty `newEntries` stays empty.
   */
  updateFilter: (newEntries: Glossary, filterState: LearnModeFilterSummary) => void;
  /** Tears down listeners owned by this instance (not by the nested Card). */
  destroy: () => void;
}

export function createLearnMode(options: CreateLearnModeOptions): LearnModeInstance {
  // Mutable local binding (not `const { entries }`) — required to support
  // `updateFilter` re-pointing the active subset after construction. This is
  // a mechanical consequence of the feature, not a design choice.
  let currentEntries = options.entries;
  let filterSummary: LearnModeFilterSummary = options.filterState ?? defaultFilterSummary();

  let previousId: string | null = null;
  // `currentEntry` is only meaningful while `currentEntries` is non-empty;
  // seeded lazily by the initial `renderFromCurrentState()` call below.
  const state: LearnModeState = { currentEntry: null as unknown as GlossaryEntry };

  // --- Topbar (Learn Mode's own — distinct from Browse's brand+stats bar) --
  const topbar = document.createElement('header');
  topbar.className = 'topbar';

  const exitBtn = document.createElement('button');
  exitBtn.type = 'button';
  exitBtn.className = 'icon-btn';
  exitBtn.setAttribute('aria-label', 'Exit Learn Mode');
  exitBtn.textContent = '←';

  const progressStats = document.createElement('div');
  progressStats.className = 'progress-stats';

  const filterChip = document.createElement('button');
  filterChip.type = 'button';
  filterChip.className = 'filter-chip';
  filterChip.setAttribute('aria-label', 'Clear active filter');
  filterChip.addEventListener('click', () => options.onClearFilter?.());

  const resetBtn = document.createElement('button');
  resetBtn.type = 'button';
  resetBtn.className = 'icon-btn';
  resetBtn.setAttribute('aria-label', 'Reset progress');
  resetBtn.textContent = '↻';

  topbar.append(exitBtn, progressStats, filterChip, resetBtn);

  // --- Learn stage (single Card in 'full' variant, or EmptyState) ----------
  const learnStage = document.createElement('main');
  learnStage.className = 'learn-stage';

  let card: CardInstance | null = null;
  let markRow: HTMLElement | null = null;
  let emptyStateEl: HTMLElement | null = null;

  const root = document.createElement('div');
  root.append(topbar, learnStage);

  // --- Rendering -------------------------------------------------------------
  function renderFilterChip(): void {
    if (isFilterActive(filterSummary)) {
      filterChip.textContent = formatFilterLabel(filterSummary);
      if (!filterChip.isConnected) {
        resetBtn.before(filterChip);
      }
    } else {
      filterChip.textContent = '';
      filterChip.remove();
    }
  }

  function renderMarkRow(): void {
    // `.mark-row` is rendered ONLY when the current card is flipped —
    // absent/not interactive on the front face (spec-audit binding
    // acceptance criterion from the back-flipped mockup). It also never
    // renders while the filtered subset is empty (no card to flip/mark).
    if (currentEntries.length === 0 || !card) {
      if (markRow) {
        markRow.remove();
        markRow = null;
      }
      return;
    }

    const isFlipped = card.getState().isFlipped;

    if (isFlipped && !markRow) {
      markRow = document.createElement('div');
      markRow.className = 'mark-row';

      const dontKnowBtn = document.createElement('button');
      dontKnowBtn.type = 'button';
      dontKnowBtn.className = 'mark-btn dont-know';
      dontKnowBtn.textContent = "↓ Don't know";
      dontKnowBtn.addEventListener('click', () => mark('dont_know'));

      const knowBtn = document.createElement('button');
      knowBtn.type = 'button';
      knowBtn.className = 'mark-btn know';
      knowBtn.textContent = '↑ Know it';
      knowBtn.addEventListener('click', () => mark('know'));

      markRow.append(dontKnowBtn, knowBtn);
      learnStage.appendChild(markRow);
    } else if (!isFlipped && markRow) {
      markRow.remove();
      markRow = null;
    }
  }

  /** Wires the click/keydown listeners that re-derive `.mark-row` after a possible flip. */
  function wireCardFlipListeners(): void {
    if (!card) return;
    card.element.addEventListener('click', () => renderMarkRow());
    card.element.addEventListener('keydown', (e: Event) => {
      const key = (e as KeyboardEvent).key;
      if (key === ' ' || key === 'Spacebar') renderMarkRow();
    });
  }

  function showEmptyState(): void {
    if (card) {
      card.element.remove();
      card = null;
    }
    if (markRow) {
      markRow.remove();
      markRow = null;
    }
    if (!emptyStateEl) {
      emptyStateEl = createEmptyState({
        heading: 'No cards match your filter',
        body: 'Try clearing a filter to keep studying.',
        actionLabel: 'Clear filter',
        onAction: () => options.onClearFilter?.(),
      });
      learnStage.appendChild(emptyStateEl);
    }
  }

  function showCardForCurrentEntry(): void {
    if (emptyStateEl) {
      emptyStateEl.remove();
      emptyStateEl = null;
    }
    if (!card) {
      card = createCard({
        entry: state.currentEntry,
        variant: 'full',
        onNavigate: () => advanceToNextCard(),
        onSwipe: (detail) => mark(detail.direction),
      });
      learnStage.appendChild(card.element);
      wireCardFlipListeners();
    } else {
      card.setEntry(state.currentEntry);
    }
  }

  // --- Mark + advance logic --------------------------------------------------
  function mark(direction: Mark): void {
    const entry = state.currentEntry;
    const current = readProgress()[entry.id] ?? { bucket: 'unseen', consecutiveKnowCount: 0 };
    const next = applyMark(current, direction);

    // Write-on-every-mark (not just on exit), per Section 4/spec-audit.
    writeProgress(entry.id, next);

    advanceToNextCard();
  }

  function advanceToNextCard(): void {
    previousId = state.currentEntry.id;
    state.currentEntry = drawNextCard(currentEntries, readProgress(), previousId);

    showCardForCurrentEntry();
    renderMarkRow();
    renderProgressStats(progressStats, currentEntries);
  }

  function confirmReset(): void {
    // Native confirm() as the confirmation affordance (copy left to
    // implementation discretion per spec-audit Finding 7).
    const confirmed = window.confirm(
      'Reset all Learn Mode progress? This clears mastered/shaky status for every card.'
    );
    if (!confirmed) return;

    resetProgress();
    renderMarkRow();
    renderProgressStats(progressStats, currentEntries);
  }

  /**
   * Re-renders atomically from `currentEntries`/`filterSummary`: chip
   * visibility/label, card-or-empty-state swap, mark row, progress stats.
   * Shared by construction and `updateFilter` so both paths stay identical.
   */
  function renderFromCurrentState(): void {
    renderFilterChip();

    if (currentEntries.length === 0) {
      showEmptyState();
    } else {
      previousId = state.currentEntry?.id ?? null;
      state.currentEntry = drawNextCard(currentEntries, readProgress(), previousId);
      showCardForCurrentEntry();
    }

    renderMarkRow();
    renderProgressStats(progressStats, currentEntries);
  }

  exitBtn.addEventListener('click', () => {
    // Exit-to-browse is a navigation concern owned by AppShell (Group 6);
    // this component only needs to expose the affordance itself.
  });
  resetBtn.addEventListener('click', () => confirmReset());

  // Construction-time render — seeded from `options.filterState` (defaulting
  // to no active filter when omitted), sharing the exact same render path as
  // every subsequent `updateFilter` call.
  renderFromCurrentState();

  return {
    element: root,
    getState: () => ({ currentEntry: state.currentEntry }),
    updateFilter: (newEntries: Glossary, newFilterState: LearnModeFilterSummary) => {
      currentEntries = newEntries;
      filterSummary = newFilterState;
      renderFromCurrentState();
    },
    destroy: () => {
      card?.destroy();
    },
  };
}
