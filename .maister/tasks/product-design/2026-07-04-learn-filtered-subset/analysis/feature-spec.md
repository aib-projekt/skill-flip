# Feature Specification: Learn Mode Respects Browse's Filtered Subset

## TL;DR
Learn Mode draws only from Browse's active category/level filter. `AppShell` becomes the sole owner of `BrowseFilterState`, mediating all propagation between `FilterBar`/`BrowseGrid` and `LearnMode` (which stay mutually unaware of each other). Persistence is a flat, category/level-only object in `localStorage` via new `storage.ts` functions mirroring the existing progress convention exactly. Learn Mode gains a dismissible active-filter chip in its topbar, an `updateFilter()` method to react to live changes, and reuses a newly-extracted shared `EmptyState` component (also adopted by `BrowseGrid`) for the zero-match case. Progress-tracking persistence is unaffected; the mastered/shaky/new stats now scope to the active subset instead of the full glossary.

## Key Decisions
- `AppShell` is the sole owner and mediator of filter state — `BrowseGrid` and `LearnMode` remain mutually decoupled (Section 2).
- Persisted schema excludes `searchQuery` at the type level, not just at runtime (Section 1).
- Learn Mode's active-filter indicator is a dismissible topbar chip reusing existing icon-button/chip visual language (Section 3).
- Empty-subset handling extracts a shared `EmptyState` component reused by both `BrowseGrid` and `LearnMode`, rather than duplicating markup (Section 4).
- Progress stats (mastered/shaky/new) scope to the active filtered subset, not the full glossary, when a filter is active (Section 5) — a design decision made during specification, not carried over from earlier phases.
- Progress persistence itself is unaffected — still keyed by entry `id` against the full glossary (Section 5).

## Open Questions / Risks
- None outstanding — all risks flagged during Phases 1, 2, and 5 (documented decision reversal, empty-subset behavior, LearnMode's new "update in place" surface, reuse mechanics for the empty state) were resolved during section drafting above.

---

## Section 1: Data Model & Persistence Schema

**Persisted shape** (new, in `storage.ts`):
```typescript
interface PersistedFilterState {
  selectedCategories: Category[];
  selectedLevel: Level | 'All';
}
```
This is a strict subset of the existing `BrowseFilterState` (from `filters.ts`) — `searchQuery` is intentionally absent from the type, not merely omitted at runtime, so there is no field to accidentally serialize.

**Storage key**: `FILTER_STATE_KEY = 'skillflip:browse-filter-state'` — sibling constant to the existing `STORAGE_KEY = 'skillflip:learn-progress'`.

**New functions in `storage.ts`** (mirroring `readProgress`/`writeProgress` exactly):
```typescript
function defaultPersistedFilterState(): PersistedFilterState {
  return { selectedCategories: [], selectedLevel: 'All' };
}

export function readFilterState(): PersistedFilterState {
  try {
    const raw = localStorage.getItem(FILTER_STATE_KEY);
    if (!raw) return defaultPersistedFilterState();
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return defaultPersistedFilterState();
    return {
      selectedCategories: Array.isArray(parsed.selectedCategories) ? parsed.selectedCategories : [],
      selectedLevel: typeof parsed.selectedLevel === 'string' ? parsed.selectedLevel : 'All',
    };
  } catch {
    return defaultPersistedFilterState();
  }
}

export function writeFilterState(state: PersistedFilterState): void {
  localStorage.setItem(FILTER_STATE_KEY, JSON.stringify(state));
}
```

**Hydration into `BrowseFilterState`**: `AppShell` reconstructs the full in-memory type at construction by merging the persisted fields with a fresh `searchQuery: ''`:
```typescript
const initialFilterState: BrowseFilterState = { ...readFilterState(), searchQuery: '' };
```

**Write path**: on every `onFilterChange` event (Section 2), `AppShell` writes only the two persisted fields — `writeFilterState({ selectedCategories: state.selectedCategories, selectedLevel: state.selectedLevel })` — never the full `BrowseFilterState`, so `searchQuery` is structurally excluded at the write boundary, not filtered afterward.

## Section 2: State Ownership & Component Wiring

**Principle**: `AppShell` mediates all filter-state flow. `BrowseGrid` and `LearnMode` remain mutually unaware of each other — no direct references pass between them (preserving the existing decoupling; only `AppShell` sits between).

**`AppShell.ts` changes**:
```typescript
interface AppShellState {
  activeTab: 'learn' | 'browse';
  filterState: BrowseFilterState;   // NEW — sole owner
}
```
- On construction: `const filterState: BrowseFilterState = { ...readFilterState(), searchQuery: '' };`
- Passes `initialFilterState: filterState` to both `createBrowseGrid()` and the initial `applyFilters(entries, filterState)` result to `createLearnMode()`.
- Defines `handleFilterChange(newState: BrowseFilterState)`:
  1. `state.filterState = newState`
  2. `writeFilterState({ selectedCategories: newState.selectedCategories, selectedLevel: newState.selectedLevel })`
  3. `learnMode.updateFilter(applyFilters(entries, newState))`

**`BrowseGrid.ts` changes** — `CreateBrowseGridOptions` gains two new optional fields:
```typescript
interface CreateBrowseGridOptions {
  entries: Glossary;
  initialFilterState?: BrowseFilterState;   // NEW, defaults to defaultState()
  onFilterChange?: (state: BrowseFilterState) => void;   // NEW
}
```
- Internal `filterState` initializes from `options.initialFilterState` instead of always calling `defaultState()`.
- Passes `initialFilterState` through to `createFilterBar()`.
- `FilterBar`'s existing `onChange` handler (already used to update local `filterState` and re-render) additionally calls `options.onFilterChange?.(newState)` to bubble the change up to `AppShell`.

**`FilterBar.ts` changes** — `CreateFilterBarOptions` gains one new optional field:
```typescript
interface CreateFilterBarOptions {
  entries: Glossary;
  initialState?: BrowseFilterState;   // NEW, defaults to defaultState()
  onChange: (state: BrowseFilterState) => void;
}
```
- `state` initializes from `options.initialState ?? defaultState()`. No other changes — `reset()` (used by Browse's "Clear filters" button) is untouched and naturally propagates through the same chain, so clearing filters in Browse also clears Learn Mode's subset with no special-case code.

**`LearnMode.ts` changes** — `LearnModeInstance` gains one new method:
```typescript
interface LearnModeInstance {
  element: HTMLElement;
  updateFilter: (newEntries: Glossary) => void;   // NEW
  destroy: () => void;
}
```
- `updateFilter()` replaces the internal `entries` reference and immediately draws a new card from the updated subset (same mechanics as advancing) — so what's on screen always matches the active filter chip the instant it changes, with no stale-card ambiguity.
- `createLearnMode({ entries })`'s `entries` option now receives the **already-filtered** subset (via `applyFilters`), not the full glossary — no signature change needed at construction, only the caller's input changes.

## Section 3: Active-Filter Indicator UI

**Visibility rule**: the chip renders only when the filter is non-default — i.e. `selectedCategories.length > 0 || selectedLevel !== 'All'`. When default, nothing renders (no empty chip placeholder).

**Label format**:
- Categories: joined with `, ` if ≤2 selected (e.g. `Java, Spring/JEE`); if 3+, truncate to `Java +2 more` (same "+N more" convention `FilterBar` already uses for its own chip row).
- Level: appended after a separator if not `'All'` (e.g. `Java · Senior`).
- Category-only: `Java`. Level-only: `Senior`. Both: `Java · Senior`.

**DOM structure** (new element in `LearnMode.ts`'s existing topbar, between `progressStats` and `resetBtn`):
```typescript
const filterChip = document.createElement('button');
filterChip.type = 'button';
filterChip.className = 'filter-chip';
filterChip.setAttribute('aria-label', 'Clear active filter');
// textContent set by renderFilterChip(), e.g. "Java · Senior  ✕"
topbar.insertBefore(filterChip, resetBtn); // only appended when visible
```

**Clear behavior**: clicking the chip calls a new `onClearFilter` callback (passed into `createLearnMode()` options by `AppShell`), which invokes the same `handleFilterChange` path from Section 2 with `{ selectedCategories: [], selectedLevel: 'All', searchQuery: '' }` — reusing the exact propagation path, not a separate code path.

**Styling**: new `.filter-chip` CSS class in `theme.css`, visually consistent with `FilterBar`'s existing `.chip.active` style (same pill shape, `--bg-topbar`-derived palette) but sized for the topbar context; `cursor: pointer` (learned from the recent "+N more" bugfix — interactive chips must signal it visually).

**Update trigger**: `LearnMode.updateFilter()` (Section 2) re-renders the chip's visibility/label alongside redrawing the card, so the chip and the card pool always change together atomically.

## Section 4: Empty-Subset Handling in Learn Mode

**Trigger condition**: `LearnMode.updateFilter(newEntries)` (Section 2) receives an empty array.

**Reuse mechanics** (resolving the open question from Phase 5): extract `BrowseGrid.ts`'s existing `renderEmptyState()` into a small shared component, `src/components/EmptyState.ts`, parameterized by heading/body/button-label/onAction — rather than duplicating the ~25 lines with different copy. This follows the DRY principle already established in this project's standards and keeps both call sites (`BrowseGrid`, `LearnMode`) trivially in sync if the visual design changes later.

```typescript
// src/components/EmptyState.ts
export interface CreateEmptyStateOptions {
  heading: string;
  body: string;
  actionLabel: string;
  onAction: () => void;
}
export function createEmptyState(options: CreateEmptyStateOptions): HTMLElement { /* icon + heading + body + button, same markup BrowseGrid uses today */ }
```

**`BrowseGrid.ts`** is refactored to call `createEmptyState({ heading: "No terms match", body: "Try clearing a filter", actionLabel: "Clear filters", onAction: filterBar.reset })` instead of its inline `renderEmptyState()`. No behavior change for Browse.

**`LearnMode.ts`** renders the same component in place of `Card` inside `learnStage` when the filtered subset is empty:
```typescript
createEmptyState({
  heading: "No cards match your filter",
  body: "Try clearing a filter to keep studying.",
  actionLabel: "Clear filter",
  onAction: () => options.onClearFilter(),  // same path as the topbar chip (Section 3)
})
```

**Never a silent fallback**: `drawNextCard()` is simply not called when `newEntries.length === 0` — Learn Mode shows the empty state and waits; it does not draw from a wider pool or the full glossary under any circumstance, per the constraint.

**Mark controls** (`Know it` / `Don't know`) are hidden while the empty state is shown, consistent with there being no card to mark.

## Section 5: Progress Tracking & Stats Scoping

**Progress persistence — unaffected**: `readProgress()`/`writeProgress()`/`resetProgress()` in `storage.ts` require **no changes**. Progress remains keyed by entry `id` against the full glossary, regardless of which subset is currently active. A card marked "know" under one filter stays "known" if the filter changes later — this is confirmed intended behavior (Phase 2), not a side effect to guard against.

**Stats scoping — new behavior**: the `progressStats` component's existing `computeBucketCounts(entries: Glossary): BucketCounts` function already accepts any array as input — no signature change needed. Both `LearnMode` and `BrowseGrid`'s topbar stat readouts now call it with the **currently active filtered subset** (via `applyFilters`) instead of the full glossary, so `"X mastered · Y shaky · Z new"` reflects only the cards currently in scope.

**Recompute triggers**: stats recompute whenever (a) a card is marked (existing behavior, unchanged) and (b) the active filter changes (new — wired through the same `updateFilter()`/`onFilterChange` paths from Sections 2-3, so stats update atomically alongside the card pool and the filter chip).

**`resetProgress()` scope — unaffected**: the existing "Reset progress" button clears **all** entries' progress globally, not just the filtered subset's — this is unchanged from today's behavior and is a deliberate non-goal (no "reset just this subset" affordance is being added, keeping this feature scoped to filtering + persistence, not progress-management UX).

## Section 6: Testing Requirements

New/updated test coverage across the existing 5 test files, plus a new component test file — closing the exact gaps identified in `analysis/codebase-analysis.md` (no existing coverage for filter persistence or Learn Mode/filter coupling).

**`storage.test.ts`** (new cases):
- `writeFilterState`/`readFilterState` round-trip preserves `selectedCategories`/`selectedLevel`.
- `readFilterState()` falls back to defaults on missing key, malformed JSON, and non-object parsed values (mirrors existing `readProgress()` test pattern).
- Stored JSON contains only `selectedCategories`/`selectedLevel` keys — never `searchQuery` — verified by inspecting the raw stringified value.

**`AppShell.test.ts`** (new cases):
- Filter state hydrates from `localStorage` at construction (pre-seed the key, verify `BrowseGrid`/`LearnMode` receive it).
- A `FilterBar` change event results in `writeFilterState` being called with the updated category/level.
- A `FilterBar` change event calls `LearnMode.updateFilter()` with the correctly `applyFilters`-computed subset.

**`BrowseGrid.test.ts`** (new cases):
- `initialFilterState` option hydrates the rendered chips/level-toggle to the expected active state on mount.
- `onFilterChange` callback fires with the new state on every chip/level/search change (existing internal-render tests stay green; this adds the upward-propagation assertion).

**`LearnMode.test.ts`** (new cases):
- `updateFilter(subset)` immediately redraws a new card from the given subset.
- `updateFilter([])` renders the shared `EmptyState` component and hides the mark-row controls.
- Filter chip renders with correct label text when a filter is active, and is absent when default.
- Clicking the filter chip triggers the same clear path as Browse's "Clear filters" (verified via the `onClearFilter` callback).
- Progress stats readout reflects `computeBucketCounts` of the filtered subset, not the full glossary.

**New `EmptyState.test.ts`**:
- Renders heading/body/action-label text from options.
- Clicking the action button calls `onAction`.

**Regression guard**: all 31 existing tests must continue passing unmodified in assertions (only new options/parameters are additive) — `npm test` is the acceptance gate.
