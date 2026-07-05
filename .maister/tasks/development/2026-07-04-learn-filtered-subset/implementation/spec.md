# Specification: Learn Mode Respects Browse's Filtered Subset

## TL;DR
Learn Mode will draw only from Browse's active category/level filter, persisted in `localStorage` (search text excluded). `AppShell` becomes the sole owner/mediator of `BrowseFilterState`; `BrowseGrid`/`FilterBar` gain hydration + upward propagation; `LearnMode` gains `updateFilter()`, a dismissible topbar filter chip, and empty-subset handling via a newly-extracted shared `EmptyState` component. This is a purely additive change (5 modified files + 1 new file) with zero breaking signatures — a fully-approved feature-spec from the product-design phase is the authoritative source for every type shape, storage key, and wiring detail below.

## Key Decisions
- Persisted schema is exactly `PersistedFilterState { selectedCategories: Category[]; selectedLevel: Level | 'All' }` under key `skillflip:browse-filter-state` — `searchQuery` is structurally absent from the type, not just excluded at runtime. (Source: feature-spec Section 1 — authoritative; overrides an earlier generic-convention inference from pattern-mining.)
- `AppShell` is the sole owner and mediator of `BrowseFilterState`; `BrowseGrid` and `LearnMode` stay mutually decoupled — no direct references pass between them, matching the codebase's existing parent-mediated-callback pattern. (feature-spec Section 2)
- `EmptyState` is extracted from `BrowseGrid.ts`'s existing `renderEmptyState()` into a shared `src/components/EmptyState.ts`, parameterized by heading/body/actionLabel/onAction, reused verbatim (zero visual/behavioral change) by Browse and newly adopted by Learn Mode. (feature-spec Section 4; confirmed pure refactor in requirements.md Q2)
- Progress-tracking persistence (`readProgress`/`writeProgress`/`resetProgress`) requires zero changes — only the mastered/shaky/new stats *display* becomes subset-scoped via existing, signature-unchanged `computeBucketCounts`/`applyFilters` call-site arguments. (feature-spec Section 5)
- `LearnMode.ts`'s `entries` binding (currently `const { entries } = options` at line 45) must become a mutable local (e.g. `let currentEntries = entries`) to support `updateFilter()` reassigning it, with all downstream references (draw-on-construct, `advanceToNextCard()`, stats, chip) updated to read the mutable binding. (gap-analysis technical note — no alternative resolution, flagged for implementer awareness, not a design decision.)

## Open Questions / Risks
- `FilterBar.ts` gains a new optional `initialState` field with no dedicated `FilterBar.test.ts` file — this is an accepted, spec-confirmed gap (FilterBar stays covered only via `BrowseGrid.test.ts` integration tests), not an oversight. No action needed.
- Learn Mode's empty-subset path is genuinely new interaction surface with no direct precedent inside `LearnMode.ts` itself (though `BrowseGrid.renderContent()`'s existing grid/empty-state swap is a close structural analog to copy from). Flagged so the implementation-planner sequences this last, after the lower-risk plumbing work.

## Goal
Learn Mode's card pool automatically reflects whatever category/level filter is active in Browse, and that filter persists across page reloads (search text is session-only), so a user can focus a study session on one topic without re-filtering every visit.

## User Stories
- As a returning user, I want the category/level filter I set in Browse to still be active next time I open the app, so I don't have to re-select it every session.
- As a user studying a specific topic, I want Learn Mode to only show cards from my active Browse filter, so my study session stays focused without an extra "start filtered session" step.
- As a user in Learn Mode, I want to see which filter is currently active (and clear it in place) without switching back to Browse, so I can course-correct without losing my spot.
- As a user whose filter matches nothing, I want a clear, actionable message in Learn Mode instead of a blank or broken screen, so I know exactly what to do next.

## Core Requirements

1. **Persist category/level filter across sessions.** `storage.ts` gains `readFilterState()`/`writeFilterState()` (and an internal `defaultPersistedFilterState()`), storing only `{ selectedCategories, selectedLevel }` under `localStorage` key `skillflip:browse-filter-state`. `searchQuery` is never written or read back — it stays session-only, owned entirely by `FilterBar`'s in-memory state.
2. **`AppShell` owns and mediates filter state.** On construction, `AppShell` hydrates `BrowseFilterState` via `{ ...readFilterState(), searchQuery: '' }`, passes it down to `BrowseGrid`/`FilterBar` (`initialFilterState`) and to `LearnMode` (as an already-filtered `applyFilters(entries, filterState)` result). A new `handleFilterChange(newState)` method: updates its own state, calls `writeFilterState()` with only the two persisted fields, and calls `learnMode.updateFilter(applyFilters(entries, newState))`.
3. **Filter changes propagate upward from Browse.** `FilterBar` gains an optional `initialState` field (hydration only, no other behavior change). `BrowseGrid` gains `initialFilterState`/`onFilterChange` options; its existing `FilterBar` `onChange` handler additionally calls `options.onFilterChange?.(state)` to bubble the change to `AppShell`.
4. **Learn Mode redraws from the active subset on every filter change.** `LearnMode` gains `updateFilter(newEntries: Glossary): void` on its returned instance, which replaces the internal entries reference and immediately draws + renders a new card from the updated subset — no stale card is ever shown after a filter change.
5. **Active-filter chip in Learn Mode's topbar.** A dismissible `.filter-chip` button renders between `progressStats` and `resetBtn`, visible only when the filter is non-default (`selectedCategories.length > 0 || selectedLevel !== 'All'`). Label format: categories joined with `, ` (≤2 selected) or truncated to `Category +N more` (3+, matching `FilterBar`'s existing overflow convention); level appended after ` · ` when not `'All'`. Clicking it invokes a new `onClearFilter` callback (passed in by `AppShell`), which routes through the exact same `handleFilterChange` path with a fully-cleared state — not a separate clear code path.
6. **Empty-subset handling in Learn Mode.** When `updateFilter([])` is called (zero-match filter), `LearnMode` renders the shared `EmptyState` component in place of `Card` inside `learnStage`, with Learn Mode-specific copy ("No cards match your filter" / "Try clearing a filter to keep studying." / "Clear filter"), and never calls `drawNextCard()` — no fallback to a wider pool under any circumstance. The `.mark-row` controls stay hidden while the empty state is shown (there is no card to mark).
7. **Shared `EmptyState` component.** Extract `BrowseGrid.ts`'s existing `renderEmptyState()` (lines 64-88) verbatim into `src/components/EmptyState.ts` as `createEmptyState(options: { heading, body, actionLabel, onAction }): HTMLElement`. `BrowseGrid.ts` is refactored to call it with its existing copy/action (`"No terms match"` / `"Try clearing a filter or search a different term."` / `"Clear filters"` / `filterBar.reset`) — zero visual or behavioral change for Browse.
8. **Progress stats scope to the active filtered subset.** Both `LearnMode`'s and `BrowseGrid`'s topbar stat readouts (`renderProgressStats` → `computeBucketCounts`) call with the currently active filtered subset instead of the full glossary, whenever a card is marked (existing trigger, unchanged) or the filter changes (new trigger, via the same `updateFilter()`/`onFilterChange` wiring). Underlying progress persistence (keyed by entry `id` against the full glossary) is unaffected — a card marked "know" stays known if the filter later excludes it.
9. **`resetProgress()` scope is unaffected.** The existing "Reset progress" button in Learn Mode continues to clear all entries' progress globally, not just the filtered subset. No "reset just this subset" affordance is introduced — explicitly out of scope.

## Visual Design

Two approved mockups in `analysis/design-context/mockups/` are the binding visual reference for this feature (already reviewed and accepted during product design — do not redesign):

- `screen:learn-mode-active-filter` (`mockups/learn-mode-active-filter-chip.html`) — Learn Mode card view with the new `.filter-chip` in the topbar (e.g. "Java · Senior ✕") between `.progress-stats` and the reset icon-button, plus subset-scoped stats. Confirms `.filter-chip` styling: pill shape (`border-radius: 999px`), `--color-chartreuse`-toned border/text against the navy topbar background, `'JetBrains Mono'` monospace at 11px, `cursor: pointer`.
- `screen:learn-mode-empty-filtered-subset` (`mockups/learn-mode-empty-filtered-subset.html`) — Learn Mode's empty state for a zero-match filter, reusing Browse's existing `.empty-state`/`.empty-icon`/`.clear-btn` visual pattern with Learn Mode-specific copy and a "Clear filter" action.

Fidelity level: high — both mockups reuse the app's already-shipped CSS classes/tokens (`.chip`-family visual language, `.empty-state` markup), so implementation should match them closely rather than approximately. New CSS: a `.filter-chip` class in `theme.css`, sized for the topbar context, deriving from the existing `.chip.active` pill shape and `--bg-topbar`-adjacent palette, with explicit `cursor: pointer` (a recently-fixed "+N more" overflow-chip bug in this codebase was traced to a missing pointer cursor on an interactive chip — apply that learned convention here). Mockups in `analysis/design-context/` are binding inputs — the implementation-planner will attach `Visual References` to the UI-facing task groups (Learn Mode chip, Learn Mode empty state).

## Reusable Components

### Existing Code to Leverage

- **`src/lib/filters.ts`** — `BrowseFilterState` type and `applyFilters(entries, state): Glossary` reused as-is (no changes). `PersistedFilterState` is defined as a strict 2-field subset of `BrowseFilterState`, not a redefinition.
- **`src/lib/storage.ts`** — existing `STORAGE_KEY`/`readProgress`/`writeProgress`/`resetProgress` pattern (lines 32-62) is the direct template mirrored near line-for-line for the new `FILTER_STATE_KEY`/`readFilterState`/`writeFilterState`. `computeBucketCounts(entries)` (lines 69-88) needs no signature change — subset-scoping is achieved purely via call-site argument changes.
- **`src/lib/learnAlgorithm.ts`** — `drawNextCard`/`applyMark` unchanged; only their input array (now the filtered subset instead of the full glossary) changes at the `LearnMode.ts` call site.
- **`src/components/progressStats.ts`** — `renderProgressStats(container, entries)` already accepts any entries array; reused unchanged, called with filtered-subset arguments at both call sites.
- **`src/components/Card.ts`** — not modified; serves as the canonical `create<X>(options): <X>Instance` factory template that `EmptyState.ts` follows for naming/construction conventions.
- **`BrowseGrid.ts`'s existing `renderEmptyState()`** (lines 64-88) — the direct, verbatim extraction source for the new shared `EmptyState.ts`; confirmed by requirements gathering (Q2) to require zero visual/behavioral change for Browse.
- **`FilterBar.ts`'s existing `onChange`/`reset()` mechanics** — `reset()` (used by Browse's "Clear filters" button) needs no changes; it already naturally propagates through the existing `onChange` chain, so it automatically clears Learn Mode's subset too once the propagation chain (Requirement 3) is wired — no special-case clear logic needed for Browse's own clear button.

### New Components Required

- **`src/components/EmptyState.ts`** (new file) — needed because the empty-state markup currently lives inline and untestable-in-isolation inside `BrowseGrid.ts`; Learn Mode needs the identical visual pattern with different copy/action, and duplicating ~25 lines of DOM-construction code would violate this project's DRY/minimal-implementation standards. Parameterizing it as a small shared factory is the only way to reuse it without duplication, per the already-approved feature-spec Section 4 design.
- **New optional fields/methods on existing components** (`AppShell.filterState` + `handleFilterChange`, `BrowseGrid.initialFilterState`/`onFilterChange`, `FilterBar.initialState`, `LearnMode.updateFilter`/`onClearFilter`) — all new because no equivalent state-lifting or cross-component filter propagation exists anywhere in the codebase today; this is the first feature requiring `AppShell` to mediate state between its two children rather than just switching which one is visible.
- **New `.filter-chip` CSS class** in `theme.css` — new because no existing class matches a dismissible pill sized for a dark topbar context; `.chip.active` is close but is Browse-only and lives in a light-background filter bar, not Learn Mode's navy topbar.

## Technical Approach

**Data flow (target state):** `main.ts` fetches glossary → `createAppShell({ entries })` hydrates `filterState` from `readFilterState()` (merged with a fresh `searchQuery: ''`) → passes `initialFilterState` to `BrowseGrid`/`FilterBar` and `applyFilters(entries, filterState)` to `LearnMode` → on every `FilterBar` change, `BrowseGrid` bubbles `onFilterChange(state)` to `AppShell` → `AppShell.handleFilterChange()` updates its own state, calls `writeFilterState()` (2-field subset only, constructed as an object literal — never destructure-and-delete from the full `BrowseFilterState`, so `searchQuery` exclusion is structural at the write boundary), and calls `learnMode.updateFilter(applyFilters(entries, newState))` → `LearnMode` redraws its card and re-renders its filter chip and stats atomically from the new subset.

**Sequencing** (lowest-risk, most-foundational first, per codebase-analysis and gap-analysis recommendations):
1. Extract `EmptyState.ts` from `BrowseGrid.ts`'s `renderEmptyState()` — self-contained, independently testable, de-risks everything downstream.
2. Add `storage.ts` functions (`FILTER_STATE_KEY`, `PersistedFilterState`, `defaultPersistedFilterState`, `readFilterState`, `writeFilterState`) — mirrors an existing pattern, easy to unit-test standalone.
3. Wire `AppShell` as mediator (`filterState` ownership, hydration, `handleFilterChange`).
4. Thread `FilterBar`/`BrowseGrid` hydration (`initialState`/`initialFilterState`) and upward propagation (`onFilterChange`).
5. Add `LearnMode.updateFilter()`, the filter chip, empty-state handling, and subset-scoped stats last — the most new surface area, built once everything it depends on is in place.

**Implementation note (mutable binding):** `LearnMode.ts` line 45 currently does `const { entries } = options`. Supporting `updateFilter(newEntries)` requires converting this to a mutable local (e.g. `let currentEntries = entries`) and updating every downstream read (initial `drawNextCard()` call, `advanceToNextCard()`, stats render calls, chip visibility/label computation) to reference the mutable binding instead of the original `const`. This is a mechanical consequence of the feature, not a design choice — flagged so the implementation-planner scopes it explicitly rather than treating `LearnMode.ts` as a one-line change.

**No changes required** to `main.ts`, `Card.ts`, `learnAlgorithm.ts`, `filters.ts` (aside from being imported one more place), or the shape of `computeBucketCounts`/`renderProgressStats`. No new runtime dependencies.

## Implementation Guidance

### Testing Approach
- 2-8 focused tests per implementation step group; test verification runs only new/affected tests, not the entire suite, at each step — full-suite `npm test` is the final acceptance gate.
- New test coverage (per feature-spec Section 6, closing gaps confirmed empty in codebase-analysis):
  - **`storage.test.ts`**: round-trip preserves `selectedCategories`/`selectedLevel`; fallback to defaults on missing key/malformed JSON/non-object parsed value; stored JSON structurally contains only the two persisted keys, never `searchQuery`.
  - **`AppShell.test.ts`**: hydrates filter state from `localStorage` at construction (pre-seeded key reaches `BrowseGrid`/`LearnMode`); a `FilterBar` change results in `writeFilterState` being called with the updated fields; a `FilterBar` change calls `LearnMode.updateFilter()` with the correctly `applyFilters`-computed subset.
  - **`BrowseGrid.test.ts`**: `initialFilterState` hydrates rendered chips/level-toggle on mount; `onFilterChange` fires with new state on chip/level/search changes (existing internal-render assertions stay green).
  - **`LearnMode.test.ts`**: `updateFilter(subset)` immediately redraws from the given subset; `updateFilter([])` renders `EmptyState` and hides `.mark-row`; filter chip renders correct label when active and is absent when default; clicking the chip triggers the same clear path as Browse's reset (via `onClearFilter`); progress stats reflect `computeBucketCounts` of the filtered subset, not the full glossary.
  - **New `EmptyState.test.ts`**: renders heading/body/action-label text from options; clicking the action button calls `onAction`.
- **Regression guard**: all 31 existing tests (5 `AppShell.test.ts` + 9 `BrowseGrid.test.ts` + 6 `LearnMode.test.ts` + 3 `storage.test.ts` + 4 `filters.test.ts` + 4 `learnAlgorithm.test.ts`) must continue passing unmodified — confirm 31-passing baseline before starting, 31 + new-cases passing as the completion gate. `Card.test.ts` (7 tests) is unaffected and out of scope for this baseline.
- No dedicated `FilterBar.test.ts` is added despite `FilterBar` gaining `initialState` — accepted gap, confirmed intentional (FilterBar stays covered via `BrowseGrid.test.ts` integration).

### Standards Compliance
- **`standards/global/minimal-implementation.md`** — every new option/method (`initialFilterState`, `onFilterChange`, `initialState`, `updateFilter`, `onClearFilter`) has an immediate caller specified above; no speculative stubs or future-proofing hooks are introduced.
- **`standards/global/coding-style.md`** (DRY) — the `EmptyState` extraction is the direct application of this standard: eliminates the alternative of duplicating ~25 lines of empty-state markup between `BrowseGrid` and `LearnMode`.
- **`standards/frontend/components.md`** — new component (`EmptyState`) has a single responsibility (render an empty-state message + action), a clear/minimal options interface, and follows the existing `create<X>(options): <return>` naming convention; state is lifted to `AppShell` only because two siblings need to share it (not lifted further than necessary).
- **`standards/frontend/accessibility.md`** — the new filter chip is a `<button type="button">` (keyboard-operable by default) with an explicit `aria-label="Clear active filter"`, consistent with the existing `.icon-btn` elements' accessibility treatment in the same topbar.
- **`standards/testing/test-writing.md`** — new tests target behavior (DOM output, callback invocations, localStorage contents) not implementation details, matching the existing test files' style throughout this codebase.

## Out of Scope

Per the approved feature-spec's explicit deferred-ideas list (no scope expansion):
- Cross-device filter sync (localStorage is inherently per-browser; no backend exists to sync across devices).
- Per-subset progress views (progress stays globally keyed by entry `id`; no "progress within this filter" breakdown).
- Chip-to-Browse navigation (clicking the Learn Mode filter chip clears the filter in place; it does not navigate to the Browse tab).
- Saved filter presets (only one "current" filter state is persisted; no naming/saving multiple presets).
- Any changes to `resetProgress()`'s scope (it remains a global reset, not subset-scoped).
- Any changes to `main.ts`, `Card.ts`, `learnAlgorithm.ts`'s internals, or `applyFilters`'s signature.
- A dedicated `FilterBar.test.ts` file (accepted gap; FilterBar stays covered via `BrowseGrid.test.ts` integration tests only).

## Success Criteria

- Filtering to a topic subset in Browse and switching to Learn Mode shows only cards from that subset (verified via `AppShell`/`LearnMode` tests asserting `updateFilter` receives the correctly `applyFilters`-computed subset).
- Reloading the app preserves the category/level filter; search text does not carry over (verified via `storage.test.ts`'s structural-absence assertion for `searchQuery` in the stored JSON).
- A zero-match filter produces a clear, actionable empty state in Learn Mode, never a blank screen or silent fallback to the full glossary (verified via `LearnMode.test.ts`'s `updateFilter([])` case).
- Existing bucket-weighted progress tracking is unaffected — progress persists across filter changes by design (verified: no changes to `readProgress`/`writeProgress`/`resetProgress`, only display call-site arguments change).
- All 31 existing tests continue passing with zero regressions, plus all new test cases enumerated above pass; `npm test` is the acceptance gate.
- E2E scope (per requirements.md): filter in Browse → switch to Learn Mode → see the filter chip → clear it → trigger the empty state with a zero-match filter → reload → confirm persistence — all steps behave as specified above.
