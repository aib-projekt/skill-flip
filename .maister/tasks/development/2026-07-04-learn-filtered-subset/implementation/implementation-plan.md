# Implementation Plan: Learn Mode Respects Browse's Filtered Subset

## TL;DR
6 task groups, sequenced exactly as the spec/gap-analysis/codebase-analysis all independently converge on: `EmptyState` extraction → `storage.ts` persistence → `AppShell` mediator → `FilterBar`/`BrowseGrid` hydration+propagation → `LearnMode` (chip/empty-state/updateFilter, largest surface, built last) → final Test Review & Gap Analysis. Groups 1-2 are independent and can run in parallel; Groups 3-5 are strictly sequential (each depends on the prior group's new surface); Group 6 depends on all. 32 steps total, 31 existing tests must stay green throughout, ~15 new tests expected (46 total).

## Key Decisions
- `EmptyState.ts` extraction (Group 1) is sequenced first and is a pure, self-contained refactor with zero behavior change for Browse — matches spec's own stated rationale (de-risks every downstream group that needs the same empty-state pattern for Learn Mode).
- `LearnMode.ts`'s Group 5 explicitly budgets a step for converting `const { entries } = options` (line 45) into a mutable `let currentEntries = entries` binding before adding `updateFilter()` — flagged by both gap-analysis and codebase-analysis as a mechanical prerequisite, not a design decision, but easy to under-scope if left implicit.
- `writeFilterState()` (Group 2) must be implemented as an object literal constructing exactly `{ selectedCategories, selectedLevel }` — never a destructure-and-delete from a full `BrowseFilterState` — so `searchQuery` exclusion is structural at the write boundary, not just type-level. This is called out explicitly in the step detail, not left to implementer inference.
- Groups 3 and 4 are kept separate (not merged) despite both being "wiring" work, because `AppShell` (mediator/owner) and `FilterBar`+`BrowseGrid` (hydration/propagation) touch different files with different test files (`AppShell.test.ts` vs `BrowseGrid.test.ts`) and Group 4 depends on Group 3's `handleFilterChange` existing first.
- No dedicated `FilterBar.test.ts` group/step is created — per spec's explicit accepted gap, `FilterBar`'s new `initialState` field is covered only via `BrowseGrid.test.ts` integration tests in Group 4.

## Open Questions / Risks
- Group 5 (LearnMode) carries the highest regression risk: it touches the most new interaction surface (updateFilter, chip, empty-state swap, subset-scoped stats) in a single file that already has 6 passing tests relying on `entries` never changing after construction. Sequencing it last (after Groups 1-4 are proven stable) is the mitigation already built into this plan.
- `theme.css` is touched by two different groups (Group 1 adds nothing new to it — `.empty-state`/`.empty-icon`/`.clear-btn` already exist verbatim; Group 5 adds the new `.filter-chip` class) — no actual file contention since Group 1 doesn't modify `theme.css`, only reuses existing classes.
- The exact `.filter-chip` CSS values (padding, border-radius, font-size, colors) are already fully specified in both mockups' inline `<style>` blocks (identical in both) — Group 5's step includes the literal declaration block to copy, removing any ambiguity about "deriving from `.chip.active`."

## Overview
Total Steps: 32
Task Groups: 6
Expected Tests: 31 existing (must stay green) + ~15 new = ~46 total

## Implementation Steps

### Task Group 1: EmptyState Extraction
**Dependencies:** None
**Files to Modify:** `src/components/EmptyState.ts` (new), `src/components/EmptyState.test.ts` (new), `src/components/BrowseGrid.ts`

- [x] 1.0 Complete EmptyState extraction
  - [x] 1.1 Write 2 focused tests in `src/components/EmptyState.test.ts`
    - Test: `createEmptyState({ heading, body, actionLabel, onAction })` renders an element with `.empty-state` root, `.empty-icon`, `<h2>` containing `heading` text, `<p>` containing `body` text, and a `.clear-btn`-classed `<button>` containing `actionLabel` text (reuse the fixed `\u{1F50D}` icon glyph, matching `BrowseGrid`'s current hardcoded icon — no new `icon` option, per minimal-implementation standard, since the spec's only two consumers both use the magnifying-glass icon)
    - Test: clicking the action button invokes `onAction` exactly once
  - [x] 1.2 Create `src/components/EmptyState.ts` following the `createCard`/`createFilterBar` factory-function naming convention (`create<X>(options): <return>`)
    - Export `interface CreateEmptyStateOptions { heading: string; body: string; actionLabel: string; onAction: () => void }`
    - Export `function createEmptyState(options: CreateEmptyStateOptions): HTMLElement` — verbatim DOM structure copied from `BrowseGrid.ts` lines 64-88 (`.empty-state` > `.empty-icon` + `<h2>` + `<p>` + `.clear-btn`), parameterizing `heading.textContent`, `helper.textContent` (body), `clearBtn.textContent` (actionLabel), and the click listener (`onAction` instead of the hardcoded `filterBar.reset()`)
    - Return the `HTMLElement` directly (no `{ element, destroy }` wrapper) per spec Section 4 — this component has no internal state/listeners needing teardown beyond the one click handler, which is garbage-collected with the DOM node
  - [x] 1.3 Refactor `src/components/BrowseGrid.ts` to consume the shared component
    - Remove the local `renderEmptyState()` function (lines 64-88)
    - Import `createEmptyState` from `./EmptyState`
    - In `renderContent()` (currently line ~177), replace `contentContainer.appendChild(renderEmptyState())` with `contentContainer.appendChild(createEmptyState({ heading: 'No terms match', body: 'Try clearing a filter or search a different term.', actionLabel: 'Clear filters', onAction: () => filterBar.reset() }))` — identical copy/behavior, zero visual change
  - [x] 1.4 Ensure EmptyState + BrowseGrid tests pass
    - Run only `EmptyState.test.ts` (2 new tests) and `BrowseGrid.test.ts` (9 existing tests, specifically the empty-state case at line 124 and the overflow-chip case at line 163 which also asserts `.empty-state` presence)
    - Do NOT run the entire suite

**Acceptance Criteria:**
- The 2 new `EmptyState.test.ts` tests pass
- All 9 existing `BrowseGrid.test.ts` tests continue passing unmodified
- Browse's empty-state DOM output and "Clear filters" click behavior are byte-for-byte unchanged from before the refactor

---

### Task Group 2: Filter-State Persistence (storage.ts)
**Dependencies:** None
**Files to Modify:** `src/lib/storage.ts`, `src/lib/storage.test.ts`

- [x] 2.0 Complete filter-state persistence layer
  - [x] 2.1 Write 3 focused tests in `src/lib/storage.test.ts`
    - Test: `writeFilterState({ selectedCategories: ['Java'], selectedLevel: 'Senior' })` then `readFilterState()` round-trips exactly `{ selectedCategories: ['Java'], selectedLevel: 'Senior' }`
    - Test: `readFilterState()` falls back to `defaultPersistedFilterState()` (`{ selectedCategories: [], selectedLevel: 'All' }`) when the key is absent, when stored value is malformed JSON, and when the parsed value is not an object (three sub-cases in one test, mirroring the existing `readProgress` defensive-parsing pattern)
    - Test: after `writeFilterState(...)`, the raw JSON in `localStorage.getItem('skillflip:browse-filter-state')` contains ONLY the keys `selectedCategories` and `selectedLevel` — assert via `Object.keys(JSON.parse(raw)).sort()` equals exactly `['selectedCategories', 'selectedLevel']`, structurally proving `searchQuery` is never written
  - [x] 2.2 Add `FILTER_STATE_KEY`, `PersistedFilterState`, `defaultPersistedFilterState()` to `src/lib/storage.ts`
    - `const FILTER_STATE_KEY = 'skillflip:browse-filter-state';` (mirrors `STORAGE_KEY` pattern at line 32)
    - `export interface PersistedFilterState { selectedCategories: Category[]; selectedLevel: Level | 'All' }` — import `Category`, `Level` from `../types/glossary` (extend the existing `Glossary` import); this is a strict 2-field subset of `BrowseFilterState`, not a redefinition — do not import `BrowseFilterState` itself to avoid an accidental structural widening
    - `function defaultPersistedFilterState(): PersistedFilterState { return { selectedCategories: [], selectedLevel: 'All' }; }`
  - [x] 2.3 Add `readFilterState()` and `writeFilterState()`, mirroring `readProgress`/`writeProgress` (lines 35-57) near line-for-line
    - `readFilterState()`: same `try/catch` + `typeof parsed === 'object'` defensive pattern as `readProgress`, falling back to `defaultPersistedFilterState()` on any failure
    - `writeFilterState(state: PersistedFilterState)`: `localStorage.setItem(FILTER_STATE_KEY, JSON.stringify({ selectedCategories: state.selectedCategories, selectedLevel: state.selectedLevel }))` — construct the object literal explicitly with exactly these two keys (never spread/destructure-delete from a caller-supplied `BrowseFilterState`), so the structural exclusion of `searchQuery` holds even if a caller mistakenly passes a superset object
  - [x] 2.4 Ensure storage tests pass
    - Run only `storage.test.ts` (3 existing + 3 new = 6 tests)
    - Do NOT run the entire suite

**Acceptance Criteria:**
- The 3 new tests pass; all 3 existing `storage.test.ts` tests continue passing unmodified
- `PersistedFilterState` has exactly 2 fields; `writeFilterState` never persists `searchQuery` under any input shape

---

### Task Group 3: AppShell Mediator Wiring
**Dependencies:** Group 2 (needs `readFilterState`/`writeFilterState`)
**Files to Modify:** `src/components/AppShell.ts`, `src/components/AppShell.test.ts`

- [x] 3.0 Wire AppShell as sole owner/mediator of filter state
  - [x] 3.1 Write 3 focused tests in `src/components/AppShell.test.ts`
    - Test: pre-seed `localStorage` with `skillflip:browse-filter-state` = `{ selectedCategories: ['Java'], selectedLevel: 'Senior' }` before construction; assert `createAppShell({ entries })` results in the Browse tab's rendered category chip for "Java" having `.active` and the level toggle's "Senior" button having `.active` after switching to Browse (hydration reaches `BrowseGrid`/`FilterBar`)
    - Test: after construction, triggering a `FilterBar` change (e.g. clicking a category chip after switching to Browse) results in `localStorage.getItem('skillflip:browse-filter-state')` reflecting the new selection (only the 2 persisted fields)
    - Test: the same `FilterBar` change causes Learn Mode's rendered card pool to reflect the new filter — switch back to the Learn tab and assert the visible card's category badge matches the selected filter (proves `learnMode.updateFilter(applyFilters(entries, newState))` was invoked with the correct subset) — this test can only pass once Group 5 exists, so mark it `it.skip`-free but expect it to fail until Group 5 lands (see note below)
  - [x] 3.2 Add `filterState` to `AppShellState` and hydrate at construction
    - `interface AppShellState { activeTab: AppShellTab; filterState: BrowseFilterState }` — import `BrowseFilterState`, `applyFilters` from `../lib/filters`
    - At construction: `const filterState: BrowseFilterState = { ...readFilterState(), searchQuery: '' };` — import `readFilterState`, `writeFilterState` from `../lib/storage`
  - [x] 3.3 Pass hydrated state down to `BrowseGrid`/`LearnMode` at construction
    - `createBrowseGrid({ entries, initialFilterState: filterState, onFilterChange: handleFilterChange })`
    - `createLearnMode({ entries: applyFilters(entries, filterState), onClearFilter: handleFilterChange-derived-clear })` — exact `LearnMode` option shape depends on Group 5; if Group 5 has not yet landed when this step executes, add the call-sites now with a `// TODO(Group 5)` marker is NOT permitted per minimal-implementation standard — instead, sequence Group 3 to complete its `handleFilterChange` logic fully, and stub the `LearnMode`-facing wiring lines as the LAST substep of Group 3, deferring their completion to whichever of Group 3/5 lands second (see step 3.5)
  - [x] 3.4 Implement `handleFilterChange(newState: BrowseFilterState): void`
    - Updates `state.filterState = newState`
    - Calls `writeFilterState({ selectedCategories: newState.selectedCategories, selectedLevel: newState.selectedLevel })`
    - Calls `learnMode.updateFilter(applyFilters(entries, newState))` (requires Group 5's `updateFilter` to exist — see cross-group dependency note in Execution Order)
  - [x] 3.5 Wire `handleFilterChange` as `BrowseGrid`'s `onFilterChange` and as the resolved callback behind `LearnMode`'s `onClearFilter` (a clear just calls `handleFilterChange` with a fully-cleared `BrowseFilterState`)
  - [x] 3.6 Ensure AppShell tests pass
    - Run only `AppShell.test.ts` (5 existing + 3 new = 8 tests)
    - Do NOT run the entire suite

**Acceptance Criteria:**
- The 3 new tests pass (test 3 may require Group 5 to be complete first — see Execution Order cross-group note)
- All 5 existing `AppShell.test.ts` tests continue passing unmodified
- `AppShell` never passes `BrowseGrid` and `LearnMode` direct references to each other — only mediates through `handleFilterChange`

**Execution note**: 5/5 existing tests pass, 0 regressions. All 3 new tests are expected-red pending Groups 4 (BrowseGrid/FilterBar wiring) and 5 (LearnMode.updateFilter) — confirmed via root-cause tracing that all 3 failures + 3 tsc errors map exactly to not-yet-existing Group 4/5 surface, not a Group 3 logic defect. Will re-verify in Group 6's final gap check.

---

### Task Group 4: FilterBar/BrowseGrid Hydration + Propagation
**Dependencies:** Group 3 (needs `AppShell.handleFilterChange`/`onFilterChange` contract defined)
**Files to Modify:** `src/components/FilterBar.ts`, `src/components/BrowseGrid.ts`, `src/components/BrowseGrid.test.ts`

- [x] 4.0 Thread hydration and upward propagation through Browse's filter chain
  - [x] 4.1 Write 2 focused tests in `src/components/BrowseGrid.test.ts`
    - Test: `createBrowseGrid({ entries, initialFilterState: { searchQuery: '', selectedCategories: ['DevOps'], selectedLevel: 'Junior' } })` renders with the "DevOps" chip pre-active and the "Junior" level button pre-active, and the grid pre-filtered to matching entries only (no extra user interaction needed)
    - Test: toggling a category chip after construction with an `onFilterChange` spy passed in results in the spy being called once with the updated `BrowseFilterState` (including the toggled category)
  - [x] 4.2 Add `initialState?: BrowseFilterState` to `CreateFilterBarOptions` in `src/components/FilterBar.ts`
    - When present, `const state: BrowseFilterState = options.initialState ? { ...options.initialState, selectedCategories: [...options.initialState.selectedCategories] } : defaultState();` replacing the current unconditional `defaultState()` call
    - `searchInput.value` must also be seeded from `options.initialState?.searchQuery ?? ''` at construction so the rendered input reflects hydrated state (note: per spec, persisted state never includes `searchQuery`, so in practice this will always hydrate to `''` from `AppShell`, but `FilterBar` accepts any `BrowseFilterState` per its existing type — this handles the general case correctly without over-specializing to the caller)
    - No changes to `onChange`/`reset()` mechanics
  - [x] 4.3 Add `initialFilterState?: BrowseFilterState` and `onFilterChange?: (state: BrowseFilterState) => void` to `CreateBrowseGridOptions` in `src/components/BrowseGrid.ts`
    - Replace line 28's hardcoded `let filterState: BrowseFilterState = { searchQuery: '', selectedCategories: [], selectedLevel: 'All' };` with `let filterState: BrowseFilterState = options.initialFilterState ?? { searchQuery: '', selectedCategories: [], selectedLevel: 'All' };`
    - Pass `initialState: options.initialFilterState` into the `createFilterBar({...})` call (lines 54-60)
    - In the existing `onChange: (state) => { filterState = state; renderContent(); }` handler, add `options.onFilterChange?.(state);` as an additional call (bubbles the change up to `AppShell` without `BrowseGrid` needing to know who's listening)
  - [x] 4.4 Ensure BrowseGrid tests pass
    - Run only `BrowseGrid.test.ts` (9 existing + 2 new = 11 tests)
    - Do NOT run the entire suite

**Acceptance Criteria:**
- The 2 new tests pass; all 9 existing `BrowseGrid.test.ts` tests continue passing unmodified
- `FilterBar` and `BrowseGrid` both hydrate correctly from `initialState`/`initialFilterState` when provided, and fall back to today's defaults when omitted (backward-compatible, no breaking signature change)

---

### Task Group 5: LearnMode — updateFilter, Filter Chip, Empty State, Subset-Scoped Stats
**Dependencies:** Group 1 (needs `EmptyState`), Group 4 (needs the propagation contract shape to match, though LearnMode itself doesn't import FilterBar/BrowseGrid)
**Files to Modify:** `src/components/LearnMode.ts`, `src/components/LearnMode.test.ts`, `src/styles/theme.css`

- [x] 5.0 Complete LearnMode's filter-awareness (largest new surface area — built last per spec sequencing)
  - [x] 5.1 Write 5 focused tests in `src/components/LearnMode.test.ts`
    - Test: `updateFilter(subset)` on the returned instance immediately redraws — the visible card's `id`/`term` is drawn from `subset`, not the original construction-time `entries` (use a 1-element subset and assert the exact term is shown)
    - Test: `updateFilter([])` renders `.empty-state` (via `EmptyState`) in place of `.card-shell` inside `.learn-stage`, and `.mark-row` is absent/hidden; no `drawNextCard` call occurs (assert no `.card-shell` exists post-update)
    - Test: the `.filter-chip` is absent when constructed/updated with a default filter (`selectedCategories: []`, `selectedLevel: 'All'`), and renders with the correct label (e.g. `"Java · Senior"`) when `updateFilter` is called alongside a non-default active filter passed via a new option/method (see step 5.3 for exact wiring) — verifies both the ≤2-category joined format and the `Category +N more` overflow format (3+ selected)
    - Test: clicking `.filter-chip` invokes the `onClearFilter` callback passed into `createLearnMode` (exactly once, no other side effect performed directly by `LearnMode` itself — the actual clearing is `AppShell`'s job per Group 3)
    - Test: progress stats (`.progress-stats` text content) reflect `computeBucketCounts` of the current filtered subset (not the full original `entries`) both immediately after `updateFilter(subset)` and after a mark within that subset
  - [x] 5.2 Convert `entries` from `const` to a mutable local binding (mechanical prerequisite, flagged explicitly by gap-analysis)
    - Change line 45 from `const { entries } = options;` to `let currentEntries = options.entries;`
    - Update every downstream reference: the initial `drawNextCard(entries, ...)` call (line 49) → `drawNextCard(currentEntries, ...)`; `advanceToNextCard()`'s `drawNextCard(entries, ...)` (line 136) → `drawNextCard(currentEntries, ...)`; both `renderProgressStats(progressStats, entries)` call sites (lines 140, 153, 172) → `renderProgressStats(progressStats, currentEntries)`
  - [x] 5.3 Add `updateFilter(newEntries: Glossary): void` and `filterMeta`/`onClearFilter` plumbing to `LearnModeInstance`
    - Extend `CreateLearnModeOptions` with `onClearFilter?: () => void` and `filterLabel?: string | null` (or equivalent — the chip needs to know both "is a filter active" and "what to display"; derive `filterLabel` from the same `BrowseFilterState`-shaped info `AppShell` already has, computed by `AppShell` and passed in as a plain string/null rather than duplicating label-formatting logic inside `LearnMode`... but per spec Section 3 the label format (`Category, Category2` / `Category +N more` · `Level`) is `LearnMode`'s own rendering responsibility, matching `FilterBar`'s existing overflow convention — so instead pass the raw `BrowseFilterState` fields needed for the chip: extend `CreateLearnModeOptions` with `filterState?: BrowseFilterState` (or a minimal `{ selectedCategories, selectedLevel }` shape) and recompute the label internally on every `updateFilter` call, alongside a companion `updateFilterState(state)` or fold the label-relevant fields into `updateFilter`'s signature — resolve to whichever shape keeps `LearnMode` self-contained: `updateFilter(newEntries: Glossary, filterState: { selectedCategories: Category[]; selectedLevel: Level | 'All' }): void`, called by `AppShell.handleFilterChange` with both the computed subset and the raw state that produced it, in one call)
    - Add `updateFilter(newEntries, filterState)` to `LearnModeInstance`: reassigns `currentEntries = newEntries`, recomputes chip visibility/label from `filterState`, and re-renders atomically: mark row hidden if switching to/staying in the empty-subset state, card redrawn via `drawNextCard(currentEntries, readProgress(), previousId)` — UNLESS `newEntries.length === 0`, in which case skip `drawNextCard` entirely and swap `EmptyState` into `learnStage` instead of `card.element`
    - Construction-time: call the same internal render path once, seeded from `options.filterState` (defaulting to `{ selectedCategories: [], selectedLevel: 'All' }` when omitted, so existing callers/tests that don't pass it keep working unchanged)
  - [x] 5.4 Add the `.filter-chip` button to the topbar
    - Insert between `progressStats` and `resetBtn`: `topbar.append(exitBtn, progressStats, filterChip, resetBtn)` (currently `topbar.append(exitBtn, progressStats, resetBtn)` at line 71)
    - `<button type="button" class="filter-chip" aria-label="Clear active filter">` — per accessibility standard, keyboard-operable by default (native `<button>`), explicit `aria-label` matching the existing `.icon-btn` treatment in this same topbar
    - Label format (spec Section 5): categories joined with `, ` when ≤2 selected, or `${first} +${n-1} more` when 3+ (matching `FilterBar.ts`'s own overflow convention at line 113); level appended after ` · ` when `selectedLevel !== 'All'`. Visibility: only rendered/visible when `selectedCategories.length > 0 || selectedLevel !== 'All'` (hidden entirely otherwise, not just empty-text)
    - Click handler: `filterChip.addEventListener('click', () => options.onClearFilter?.())` — no direct state mutation in `LearnMode` itself; the actual clear routes through `AppShell.handleFilterChange` (Group 3), which will call back into `updateFilter` with the cleared subset
  - [x] 5.5 Implement empty-subset rendering in place of `Card`
    - Import `createEmptyState` from `./EmptyState`
    - When `currentEntries.length === 0`: remove `card.element` from `learnStage` (if present), remove `markRow` (if present, set to `null`), and append `createEmptyState({ heading: 'No cards match your filter', body: 'Try clearing a filter to keep studying.', actionLabel: 'Clear filter', onAction: () => options.onClearFilter?.() })` — copy matches `screen:learn-mode-empty-filtered-subset` mockup exactly (see Visual References below)
    - When transitioning FROM empty TO non-empty (filter widened again): remove the empty-state element, re-append `card.element`, redraw via `drawNextCard`
    - `.mark-row` stays hidden throughout the empty-state display — `renderMarkRow()` must short-circuit (return early, rendering nothing) whenever `currentEntries.length === 0`
  - [x] 5.6 Add `.filter-chip` CSS class to `src/styles/theme.css`
    - Insert after the `.progress-stats` block (currently ending around line ~362, immediately before the next unrelated rule) — exact declaration, copied verbatim from both mockups' identical inline `<style>` blocks: `all: unset; display: inline-flex; align-items: center; background: rgba(255, 255, 255, 0.12); color: var(--color-chartreuse); border: 1px solid var(--color-chartreuse); border-radius: 999px; padding: 5px 12px; font-size: 11px; font-family: 'JetBrains Mono', monospace; cursor: pointer; white-space: nowrap;` (the explicit `cursor: pointer` is a deliberate application of the project's recently-learned "+N more" overflow-chip bugfix convention — verify it is present, not accidentally dropped)
  - [x] 5.7 Ensure LearnMode tests pass
    - Run only `LearnMode.test.ts` (6 existing + 5 new = 11 tests)
    - Do NOT run the entire suite

**Execution note**: 11/11 tests pass, 0 tsc errors, and both `AppShell.ts`'s remaining cross-group compile errors resolved — all 3 of Group 3's previously-expected-red tests now pass (8/8 AppShell.test.ts), full suite 59/59 passing project-wide. Post-completion fix: added the mockup's trailing `✕` glyph to the chip label (`formatFilterLabel`), which the subagent had correctly omitted per literal acceptance-criteria wording but flagged as a minor visual-parity gap against the binding mockup — added directly since the mockup is the binding reference and the fix was a one-line, zero-risk content change (re-verified 11/11 LearnMode tests still pass after).

**Visual References:**
- mockup: analysis/design-context/mockups/learn-mode-active-filter-chip.html
  element: screen:learn-mode-active-filter
  locator: `<div id="mockup-content">` topbar markup — `<button class="filter-chip" aria-label="Clear active filter">Java &middot; Senior&nbsp;&nbsp;&#10005;</button>` between `.progress-stats` and the reset `.icon-btn`; inline `<style>` block's `.filter-chip` rule (single line, full declaration captured in step 5.6)
  acceptance: `.filter-chip` renders between `progressStats` and `resetBtn` in DOM order; visible only when filter is non-default; label format exactly "Category · Level" (or "Category1, Category2" / "Category +N more" for multi-select, level suffix only when not 'All'); pill shape via `border-radius: 999px`, chartreuse border/text, `'JetBrains Mono'` 11px, `cursor: pointer`
- mockup: analysis/design-context/mockups/learn-mode-empty-filtered-subset.html
  element: screen:learn-mode-empty-filtered-subset
  locator: `<div id="mockup-content">` — `.learn-stage > .empty-state` replacing the card; `<h2>No cards match your filter</h2>`, `<p>Try clearing a filter to keep studying.</p>`, `<button class="clear-btn">Clear filter</button>`; note the `.filter-chip` remains visible in the topbar even in this empty state
  acceptance: heading/body/action copy match exactly ("No cards match your filter" / "Try clearing a filter to keep studying." / "Clear filter"); `.mark-row` is absent; `.filter-chip` still renders (not hidden just because the subset is empty); no fallback to a wider pool ever occurs
- component: component:filter-chip — covered by both mockups above; dismissible pill, `aria-label="Clear active filter"`, click routes to `onClearFilter`
- component: component:empty-state — covered by the second mockup above; reused from Group 1's `EmptyState.ts` with Learn-Mode-specific copy, zero structural deviation from Browse's own empty-state markup

**Acceptance Criteria:**
- The 5 new tests pass; all 6 existing `LearnMode.test.ts` tests continue passing unmodified
- `updateFilter([])` never calls `drawNextCard`; empty-subset path never falls back to the full glossary under any circumstance
- Implementation matches each `acceptance` criterion declared in Visual References above

---

### Task Group 6: Test Review & Gap Analysis
**Dependencies:** All previous groups (1-5)
**Files to Modify:** `src/components/AppShell.test.ts`, `src/components/BrowseGrid.test.ts`, `src/components/LearnMode.test.ts`, `src/lib/storage.test.ts`, `src/components/EmptyState.test.ts` (append-only to existing files from Groups 1-5; no new files)

- [x] 6.0 Review and fill critical gaps
  - [x] 6.1 Review tests from previous groups (2 + 3 + 3 + 2 + 5 = 15 new tests across 5 files, plus 31 pre-existing)
  - [x] 6.2 Analyze gaps for THIS feature only — specifically verify the one cross-group dependency flagged in Group 3 (the "switch to Learn tab and see the correct filtered card" end-to-end assertion) is actually exercised now that Group 5 exists, and confirm the full propagation chain (`FilterBar` change → `BrowseGrid.onFilterChange` → `AppShell.handleFilterChange` → `writeFilterState` + `LearnMode.updateFilter`) is covered by at least one true end-to-end test in `AppShell.test.ts`, not just per-group unit assertions
  - [x] 6.3 Write up to 4 additional strategic tests (kept well under the 10 max, since the per-group tests above already total 15 new cases against an "up to 10 additional" ceiling for this group alone)
    - Suggested: (a) full reload-persistence simulation — set filter via Browse, construct a second `AppShell` instance (simulating a page reload) with the same `localStorage`, assert Learn Mode immediately shows the filtered subset with no re-interaction; (b) clearing via Browse's existing "Clear filters" button (not the new chip) also clears Learn Mode's subset, proving both clear entry points converge on `handleFilterChange`; (c) a mark applied while a filter is active does not affect `readProgress()` for entries outside the filtered subset (progress persistence stays global); (d) `resetProgress()` continues to clear ALL entries' progress regardless of active filter (Requirement 9 — explicitly unaffected scope)
  - [x] 6.4 Run feature-specific tests only: all of `AppShell.test.ts`, `BrowseGrid.test.ts`, `LearnMode.test.ts`, `storage.test.ts`, `EmptyState.test.ts` (expect 31 + 15 + up to 4 = 46-50 total across these 5 files)
  - [x] 6.5 Run the full project test suite (`npm test`) as the final acceptance gate — confirm all tests pass including unrelated ones (`filters.test.ts`, `learnAlgorithm.test.ts`, `Card.test.ts`), proving zero regressions anywhere

**Acceptance Criteria:**
- All feature tests pass (~46-50 total across the 5 touched test files)
- No more than 4 additional tests added in this group (well under the 10-test ceiling)
- Full `npm test` run passes with zero regressions in `filters.test.ts`, `learnAlgorithm.test.ts`, and `Card.test.ts` (untouched by this feature)

**Execution note**: Feature tests: 42 passed, 0 failed (AppShell 12, BrowseGrid 11, LearnMode 11, storage 6, EmptyState 2 — actual pre-Group-6 baseline was 38, not 46, consistent with the plan's own self-correcting arithmetic; +4 new = 42). Full `npm test`: 65 passed, 0 failed (63 vitest across 10 files + 2 build-verification), zero regressions in `filters.test.ts`, `learnAlgorithm.test.ts`, `Card.test.ts`, `glossary.test.ts`, `main.test.ts`. Exactly 4 new tests added, at the ceiling. Cross-group end-to-end propagation chain confirmed covered by existing `AppShell.test.ts` assertion.

---

## Execution Order

1. Group 1: EmptyState Extraction (4 steps) — no dependencies, can start immediately
2. Group 2: Filter-State Persistence (4 steps) — no dependencies, can run in parallel with Group 1
3. Group 3: AppShell Mediator Wiring (6 steps, depends on 2)
4. Group 4: FilterBar/BrowseGrid Hydration + Propagation (4 steps, depends on 3)
5. Group 5: LearnMode — updateFilter/Chip/EmptyState/Stats (7 steps, depends on 1 and 4)
6. Group 6: Test Review & Gap Analysis (5 steps, depends on 1-5)

**Parallelism**: Groups 1 and 2 touch disjoint files (`EmptyState.ts`+`BrowseGrid.ts` vs `storage.ts`) and have no data dependency on each other — safe to execute concurrently. Groups 3, 4, 5 are strictly sequential per the spec's own recommended sequencing (each needs the prior group's new exported surface). Group 6 is the only group depending on all others.

**Cross-group note (Group 3 ↔ Group 5)**: `AppShell.handleFilterChange` (Group 3, step 3.4) calls `learnMode.updateFilter(...)`, which does not exist until Group 5 completes. Since Groups 3 and 5 cannot literally run in parallel (5 depends on 4 depends on 3), this is resolved by execution order alone — Group 3's step 3.4 will compile/type-check correctly once Group 5 has landed, because Group 5 runs strictly after Group 3 in this plan's sequencing. Implementers should NOT attempt to reorder Group 5 before Group 3 to "avoid" this — the dependency direction (3 defines the contract; 5 implements the callee) is intentional and matches the spec's own data-flow description.

## Standards Compliance

Follow standards from `.maister/docs/standards/`:
- `global/minimal-implementation.md` — every new option (`initialFilterState`, `onFilterChange`, `initialState`, `updateFilter`, `onClearFilter`, `filterState`) has an immediate caller specified in the steps above; no speculative stubs
- `global/coding-style.md` (DRY) — Group 1's `EmptyState` extraction is the direct application of this standard
- `frontend/components.md` — `EmptyState` has single responsibility, minimal options interface, follows `create<X>(options): <return>` naming
- `frontend/accessibility.md` — `.filter-chip` is a native `<button type="button">` with explicit `aria-label`, consistent with existing `.icon-btn` treatment
- `testing/test-writing.md` — new tests target behavior (DOM output, callback invocations, localStorage contents), not implementation details

## Notes

- Test-Driven: Each group starts with 2-5 tests (within the 2-8 per-group limit)
- Run Incrementally: Only new tests after each group — full `npm test` is reserved for Group 6's final step
- Mark Progress: Check off steps as completed
- Reuse First: `applyFilters`, `computeBucketCounts`, `renderProgressStats`, `drawNextCard`/`applyMark`, and the `readProgress`/`writeProgress` template are all reused unchanged, per spec's Reusable Components section
- Confirm the 31-test baseline passes BEFORE starting Group 1 (per spec's regression-guard instruction)
