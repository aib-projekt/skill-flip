# Codebase Analysis Report

**Date**: 2026-07-04
**Task**: Learn Mode should draw only from the Browse-filtered subset of glossary entries, and that filter selection should persist across sessions
**Description**: Learn Mode should draw only from the subset of glossary entries currently filtered in Browse (category/level/search), and that filter selection should be remembered locally in the browser across sessions.
**Analyzer**: codebase-analyzer skill (2 Explore agents: Code Analysis, Context Discovery)

---

## TL;DR

Browse's filter state is currently component-local (lives inside `BrowseGrid.ts`, never persisted) and Learn Mode always draws from the full unfiltered glossary — the two views are intentionally decoupled today. This feature requires (1) lifting `BrowseFilterState` up to `AppShell` so both views can share it, (2) adding a new `localStorage` key to persist it, and (3) passing the `applyFilters()` output into `drawNextCard()` instead of the full entries array. All the pure-logic building blocks (`applyFilters`, `drawNextCard`) already have the right signatures — no core algorithm changes needed, just wiring and persistence. This reverses an explicit prior product decision (see Open Questions).

## Key Decisions

- Lift `BrowseFilterState` ownership from `BrowseGrid` to `AppShell` — AppShell already constructs and owns both `LearnMode` and `BrowseGrid` instances and is the only shared ancestor; it also already has precedent for reading persisted `localStorage` state (progress) during Browse's stat refresh.
- Persist filter state via a new `storage.ts` key/pair (e.g. `readFilterState()` / `writeFilterState()`, key `skillflip:browse-filter-state`), following the exact same pattern already used for `skillflip:learn-progress` (JSON-stringified object, defensive try/catch parse, safe empty-object fallback).
- Reuse `applyFilters(entries, filterState)` unmodified to compute the subset AppShell hands to `LearnMode` — the function is already pure and generic over any entries array; no signature change required.
- Keep `drawNextCard(entries, progress, previousId)` unmodified — pass the filtered subset as `entries`; progress keys remain full-glossary IDs so no data loss occurs when the filter changes.

## Open Questions / Risks

- **This feature explicitly reverses a documented prior decision.** `feature-spec.md` Section 3 states filter state is intentionally NOT persisted ("browsing is exploratory and low-stakes; there's no evidence a 'remember my last filter' feature is needed, and adding it would be unrequested scope"), and Section 4 describes Learn Mode as always drawing from the full glossary with no session/subset concept. The user/product owner should be aware this task consciously overturns that rationale — worth a one-line confirmation before implementation.
- **Empty-filter edge case**: if the active filter (category + level + search) matches zero entries, `drawNextCard()` has no defined behavior for an empty array — needs an explicit decision (e.g. show empty state / disable Learn Mode / fall back to full glossary) since this is a new scenario `learnAlgorithm.ts` was never designed for.
- **Progress semantics across filter changes**: a card's `know`/`dont_know` bucket persists by ID regardless of the active filter. A user could master a card while a broad filter is active, later narrow the filter, and Learn Mode would still treat that card as "known" — behavior is technically correct but may be worth a short help-text note.
- **`resetProgress()` scope**: must continue resetting progress for the entire glossary, not just the filtered subset, to avoid confusing partial resets.
- Low test coverage today for the exact scenarios this feature introduces (filter persistence across reload, Learn Mode + filtered subset interaction) — greenfield test-writing required, not just extension of existing suites.

---

## Summary

The codebase has two independently-evolved concerns — Browse's filter state (in-memory, component-local, never persisted) and Learn Mode's card-drawing algorithm (always full-glossary) — that this feature must couple together and persist. The underlying pure functions (`applyFilters`, `drawNextCard`) already compose cleanly for this purpose; the work is primarily state-lifting (moving `BrowseFilterState` ownership to `AppShell`), adding a new `localStorage`-backed read/write pair in `storage.ts` mirroring the existing progress-persistence pattern, and threading the shared state through both views' constructor options and callbacks.

---

## Files Identified

### Primary Files

**src/components/AppShell.ts** (127 lines)
- Owns tab-switching between Learn and Browse; currently holds only `activeTab` state (in-memory, unpersisted).
- Cleanest lift-up point for shared `BrowseFilterState`: already constructs both `LearnMode` and `BrowseGrid`, already has a precedent for one piece of cross-cutting state (tab), and is the only common ancestor of both views.
- Needs new logic: hold `filterState`, read/write it via new `storage.ts` functions, pass filtered entries (or raw entries + filterState) into `createLearnMode()`, and receive filter-change callbacks from `createBrowseGrid()`/`createFilterBar()`.

**src/components/BrowseGrid.ts** (193 lines)
- Currently owns `filterState: BrowseFilterState` as a local variable (line ~28); never persisted, never exposed outside the component.
- Wires `FilterBar`'s `onChange` callback to update local state and re-run `applyFilters(entries, filterState)` on every change.
- Must be refactored to accept initial filter state from `AppShell` and propagate changes upward (new callback option) rather than fully owning the state itself.

**src/components/FilterBar.ts** (181 lines)
- Owns in-memory `BrowseFilterState` (`{ searchQuery, selectedCategories, selectedLevel }`) inside its closure; provides `getState()` but no way for a parent to pre-populate/hydrate it from persisted state.
- Needs a new option to accept an initial `BrowseFilterState` (for hydration from `localStorage` on load) in addition to its existing `onChange` callback.

**src/components/LearnMode.ts** (182 lines)
- Line ~49: `drawNextCard(entries, readProgress(), previousId)` — always called with the full unfiltered `entries` array passed in at construction (`createLearnMode({ entries })`).
- Needs to receive the filtered subset (either directly as `entries`, or by receiving `filterState` + full entries and applying `applyFilters` itself) so `drawNextCard` operates on the Browse-restricted set.
- No coupling today to `FilterBar`, `BrowseGrid`, or `filters.ts` — this is the direct integration point for the new behavior.

**src/lib/filters.ts** (42 lines)
- `applyFilters(entries: Glossary, state: BrowseFilterState): Glossary` — pure, stateless, generic over any entries array. AND semantics across category (empty = all), level (`'All'` = all), and case-insensitive substring search across 4 fields (`term`, `description`, `translationPl`, `descriptionPl`).
- Requires no changes; reusable as-is to compute the subset feeding Learn Mode.

**src/lib/learnAlgorithm.ts** (95 lines)
- `drawNextCard(entries: Glossary, progress: ProgressMap, previousId: string | null): GlossaryEntry` — builds a weighted pool (bucket weights: `dont_know: 4`, `unseen: 2`, `know: 1`; graduation after 2 consecutive "know" marks) and excludes only `previousId`.
- Signature is already subset-friendly; no change needed, just pass a filtered array as `entries`. No defined behavior for an empty array today — this is a new edge case introduced by this feature (see Open Questions).

**src/lib/storage.ts** (88 lines)
- Existing pattern to follow: key `skillflip:learn-progress`, JSON-stringified value, defensive `try/catch` parse with safe `{}` fallback on failure, no versioning/migration logic.
- Needs new functions mirroring this pattern for filter state: proposed `FILTER_STATE_KEY = 'skillflip:browse-filter-state'`, `readFilterState(): BrowseFilterState`, `writeFilterState(state: BrowseFilterState): void`.

### Related Files

**src/components/Card.ts**
- Renders a single entry in both Learn (flip-card) and Browse (tile) variants; receives one `GlossaryEntry` at a time from whichever source (weighted draw vs. filtered grid). Not modified by this feature directly, but consumes the entries this feature reshapes upstream.

**src/main.ts**
- `bootstrap()` fetches `data/glossary.json`, validates it, and constructs `createAppShell({ entries: glossary })`, which in turn constructs both views. No direct changes expected, but this is the top of the data-flow chain being modified.

**src/lib/config.ts**
- Defines `BUCKET_WEIGHTS` and `GRADUATION_THRESHOLD` consumed by `learnAlgorithm.ts`. Unaffected by this feature but relevant context for understanding the draw algorithm untouched by the change.

**.maister/tasks/product-design/2026-07-01-lexicon-engineering-terms/analysis/feature-spec.md**
- Section 3 and Section 4 contain the explicit prior rationale for keeping filter state unpersisted and Learn Mode unfiltered — directly contradicted by this new task (see Open Questions / Risks).

**.maister/tasks/product-design/2026-07-01-lexicon-engineering-terms/analysis/design-decisions.md** and **alternatives.md**
- Document the intentional split between "Browse is exploratory" and "Learn Mode is focused review" personas/journeys — useful context for why the two views were built decoupled, but not a blocker for this task.

---

## Current Functionality

### Key Components/Functions

- **`FilterBar`** (`createFilterBar({ entries, onChange })`): owns `BrowseFilterState` in a closure; exposes `getState()`, `reset()`, `setSearchValue()`, `destroy()`. Debounces search input by 200ms. Computes category chip counts from the full unfiltered entries.
- **`BrowseGrid`** (`createBrowseGrid({ entries })`): holds `filterState` locally; on `FilterBar.onChange`, updates state and re-renders via `applyFilters(entries, filterState)`. Exposes `{ element, refreshStats, destroy }` — no getter for filter state.
- **`LearnMode`** (`createLearnMode({ entries })`): calls `drawNextCard(entries, readProgress(), previousId)` on every card draw, always against the full glossary. Tracks `previousId` to avoid immediate repeats.
- **`applyFilters(entries, state)`**: pure function, AND-combines category/level/search filters, returns a subset `Glossary` array.
- **`drawNextCard(entries, progress, previousId)`**: pure function, weighted-random draw excluding `previousId`, favors `dont_know` (weight 4) over `unseen` (2) over `know` (1).
- **`storage.ts`**: `readProgress()`, `writeProgress(id, entry)`, `resetProgress()`, `computeBucketCounts(entries)` — all operate on `localStorage` key `skillflip:learn-progress`.

### Data Flow

`main.ts:bootstrap()` fetches `data/glossary.json` → `createAppShell({ entries })` constructs both `createLearnMode({ entries })` (full array, unfiltered) and `createBrowseGrid({ entries })` (which internally creates `createFilterBar({ entries })` and calls `applyFilters(entries, filterState)` on every filter change, feeding only the Browse grid render). **There is currently zero coupling between `FilterBar` state and `LearnMode`'s draw algorithm.** AppShell only toggles visibility (`display: none`/`''`) between the two fully mounted views; no state flows between them today except via the shared `entries` reference passed at construction.

---

## Dependencies

### Imports (What This Depends On)

- `LearnMode.ts` → `Card`, `learnAlgorithm` (`drawNextCard`, `applyMark`), `storage` (`readProgress`, `writeProgress`, `resetProgress`), `progressStats`, `types/glossary`. Does **not** import `FilterBar`, `BrowseGrid`, or `filters.ts` today.
- `BrowseGrid.ts` → `Card`, `FilterBar`, `filters` (`applyFilters`), `progressStats`, `types/glossary`. Does **not** import `learnAlgorithm` or `LearnMode`.
- `FilterBar.ts` → `filters` (`BrowseFilterState` type), `types/glossary`, inline debounce logic. Does **not** import `LearnMode`, `learnAlgorithm`, `storage`, or `Card`.
- `filters.ts` → `types/glossary` only (pure utility).
- `learnAlgorithm.ts` → `config` (`BUCKET_WEIGHTS`, `GRADUATION_THRESHOLD`), `storage` (types only), `types/glossary` (pure utility, no filter-state awareness).
- `storage.ts` → `types/glossary` (used only by `computeBucketCounts`); direct `localStorage` access, no component dependencies.

### Consumers (What Depends On This)

- **`AppShell.ts`**: owns and switches between `LearnMode` and `BrowseGrid` instances; doesn't currently touch filter or learn state directly, but is the intended new owner.
- **`BrowseGrid.ts`**: consumes `FilterBar`'s `onChange` state to drive `applyFilters`.
- **`progressStats` component**: consumed by both `LearnMode` and `BrowseGrid` to render mastered/shaky/new counts from `localStorage` progress — unaffected by this feature but a shared consumer of `storage.ts`.

**Consumer Count**: 4 components directly touched (`AppShell`, `BrowseGrid`, `FilterBar`, `LearnMode`) + 3 pure-lib touchpoints (`filters.ts` reused as-is, `learnAlgorithm.ts` reused as-is, `storage.ts` extended).
**Impact Scope**: Medium — the change is concentrated in a well-understood, decoupled component tree (no framework, explicit factory pattern, clear ownership boundaries), but it does touch 4 of the app's ~9 source files and changes a cross-component data-flow that was previously absent by design.

---

## Test Coverage

### Test Files

- **`src/lib/filters.test.ts`** (5 scenarios): category filter alone, level filter alone, search across all 4 fields, combined AND semantics. No persistence or Learn Mode integration tests.
- **`src/lib/learnAlgorithm.test.ts`** (4 scenarios): weighted draw favors `dont_know`, graduation/demotion, previous-card exclusion, graceful degradation to uniform-random. No subset-filtering tests.
- **`src/lib/storage.test.ts`** (3 scenarios): write/read round-trip, reset clears entirely, bucket counting. No filter-state-key tests.
- **`src/components/BrowseGrid.test.ts`** (14 scenarios): debounced search, category/level filtering, result counts, empty state, chip overflow, progress stats display. No filter-persistence or Learn Mode coupling tests.
- **`src/components/LearnMode.test.ts`** (5 scenarios): mount, flip/mark visibility, know/don't-know marking and persistence, reset-progress flow, progress stats re-render. No filtered-subset drawing tests.
- **`vitest.setup.ts`**: patches a jsdom/Node 26 `localStorage` shadowing bug so tests use real jsdom `localStorage` — correctly positioned for testing new persistence behavior without additional mocking work.

### Coverage Assessment

- **Test count**: 31 existing scenarios across the 5 files above, all passing today, none covering the new cross-view/persistence behavior.
- **Gaps** (need new tests for this feature): filter state persists across a simulated reload; Learn Mode draws only from entries matching the active filter; switching Learn → Browse → Learn preserves the filter selection; empty-filter-result edge case in `drawNextCard`; `resetProgress()` continues to reset the full glossary regardless of active filter; existing `BrowseGrid.test.ts` and `LearnMode.test.ts` assertions will need updates wherever they assume default/full-glossary state.

---

## Coding Patterns

### Naming Conventions

- **Components**: `PascalCase` filenames matching factory function names, e.g. `FilterBar.ts` → `createFilterBar()`.
- **Functions**: `camelCase`, verb-first (`applyFilters`, `drawNextCard`, `readProgress`, `writeProgress`).
- **Storage keys**: colon-namespaced strings, e.g. `'skillflip:learn-progress'`; new key should follow `'skillflip:browse-filter-state'` or similar.
- **Files**: one component/module per file; `.test.ts` suffix co-located with source.

### Architecture Patterns

- **Style**: no framework; hand-written factory-function-returns-instance pattern (`createX(options) => { element, ...methods }`), closures for private state, no classes.
- **State Management**: fully local/closure-based per component; no global store; cross-component communication via constructor-injected callbacks (`onChange`) and DOM queries used sparingly for wiring (e.g., AppShell's exit-to-Browse button).
- **Immutability convention**: internal state is mutable within a closure, but always exported via `getState()` as a shallow copy (defensive copy on export) — this convention should be preserved in whatever new shared-state mechanism is introduced.
- **Pure library layer**: `src/lib/` holds stateless, side-effect-free functions (`applyFilters`, `drawNextCard`, `applyMark`, `computeBucketCounts`) cleanly separated from the stateful `src/components/` layer — this feature should preserve that separation (no filter logic creeping into components, no component-specific logic creeping into `lib/`).

---

## Complexity Assessment

| Factor | Value | Level |
|--------|-------|-------|
| File count (primary) | 6 files touched (`AppShell`, `BrowseGrid`, `FilterBar`, `LearnMode`, `filters.ts` reused, `storage.ts` extended) | Medium |
| Dependencies | Existing signatures (`applyFilters`, `drawNextCard`) unchanged; new callback wiring across 3 components | Medium |
| Consumers | 4 components directly touched; `progressStats` and `Card` unaffected pass-through consumers | Medium |
| Test coverage | 31 existing tests, 0 covering new behavior; ~15-20 new tests estimated needed | Medium (gap, not absence) |

### Overall: Moderate

No circular dependencies, no async complexity, no third-party library changes, and the two core pure functions (`applyFilters`, `drawNextCard`) already have subset-friendly signatures requiring zero modification. The moderate rating comes from the state-lift-up refactor (moving filter-state ownership from `FilterBar`/`BrowseGrid` to `AppShell`) touching 4 components' constructor options and callback chains, plus the need for a full new test surface for persistence and cross-view integration that doesn't exist today.

---

## Key Findings

### Strengths
- Clean separation between pure logic (`src/lib/`) and stateful components (`src/components/`) makes this a wiring change, not an algorithm change — `applyFilters` and `drawNextCard` need no signature changes.
- Established, working `localStorage` persistence pattern already exists in `storage.ts` (key naming, JSON serialize/parse, defensive fallback) to copy for the new filter-state key.
- `AppShell` is an unambiguous, uncontested lift-up point — it already owns both views and one piece of shared state (active tab), and both views already receive `entries` from it at construction.
- Component factory pattern with callback-driven communication is consistent throughout the codebase, giving a clear template (`onChange: (state: T) => void`) for wiring the new shared filter state.

### Concerns
- This task explicitly reverses a documented, deliberate product decision (`feature-spec.md` Sections 3–4) to keep Browse and Learn Mode decoupled and filter state unpersisted. This isn't a gap being filled — it's a scope change from a prior spec, worth flagging back to the requester.
- `drawNextCard` and the broader Learn Mode UI have no defined behavior for "filtered subset is empty" — a new edge case this feature introduces that isn't addressed by the current design.
- Zero existing test coverage for anything resembling cross-view state sharing or filter persistence — this is greenfield test-writing, not test-extension.

### Opportunities
- Because the pure-function layer needs no changes, the implementation can be scoped tightly to state-plumbing plus persistence, keeping the diff small and easy to review despite touching 4 files.
- The existing `readProgress`/`writeProgress` pattern in `storage.ts` can be mirrored almost mechanically for filter-state persistence, reducing design risk on that portion of the work.

---

## Impact Assessment

- **Primary changes**: `src/components/AppShell.ts` (new shared filter state + persistence orchestration), `src/components/BrowseGrid.ts` (accept/emit filter state instead of owning it), `src/components/FilterBar.ts` (accept initial state for hydration), `src/components/LearnMode.ts` (draw from filtered subset instead of full entries), `src/lib/storage.ts` (new `readFilterState`/`writeFilterState` functions and key).
- **Related changes**: `src/main.ts` likely unaffected (still constructs `createAppShell({ entries })`), but worth a quick check that no assumptions about full-glossary Learn Mode leak in there.
- **Test updates**: updates required to `BrowseGrid.test.ts` and `LearnMode.test.ts` wherever they assume unfiltered/default state; new test files or new describe-blocks needed for filter persistence across reload and Learn+Browse filter-state coupling; `learnAlgorithm.test.ts` may need a new case for empty-array input if that edge case is handled at the algorithm level rather than upstream.

### Risk Level: Medium

Risk is moderate rather than low or high: the codebase's architecture (pure functions + factory components + closures) is well-suited to this change and requires no algorithmic rework, but the feature touches shared-state ownership across 4 components simultaneously, introduces a new untested edge case (empty filtered result), and consciously reverses a previously-documented product decision — any of which could surface disagreement or rework if not confirmed with the requester before implementation.

---

## Recommendations

**Implementation strategy (modifying existing code, not greenfield):**

1. Add `FILTER_STATE_KEY` and `readFilterState()` / `writeFilterState()` to `src/lib/storage.ts`, mirroring the existing `readProgress`/`writeProgress` pattern exactly (JSON stringify/parse, try/catch, safe fallback to a default `BrowseFilterState`).
2. Lift filter-state ownership into `AppShell.ts`: read persisted state on construction (fallback to defaults if absent/malformed), hold it as the source of truth, and write to `localStorage` on every change.
3. Change `FilterBar`'s `CreateFilterBarOptions` to accept an `initialState?: BrowseFilterState` so it can be hydrated from `AppShell` rather than always starting from hardcoded defaults; keep its `onChange` callback as the upward signal.
4. Change `BrowseGrid` to accept `filterState` (or the initial state) as a constructor option and to forward `FilterBar`'s `onChange` events up to `AppShell` (new callback option) instead of only updating its own local variable.
5. Change `LearnMode`'s `CreateLearnModeOptions` to receive either the pre-filtered entries array or the shared `filterState` (recompute via `applyFilters` internally) — recommend passing the already-filtered array from `AppShell` to keep `LearnMode` decoupled from `filters.ts` and preserve the existing dependency graph (no new import needed in `LearnMode.ts`).
6. Explicitly decide and implement the empty-filtered-subset behavior in Learn Mode (e.g., an empty-state message reusing Browse's existing empty-state pattern) before wiring `drawNextCard` to a potentially-empty array.
7. Confirm `resetProgress()` continues to operate on the full glossary regardless of the active filter (no code change expected, but verify no accidental subset-scoping is introduced).

**Testing requirements:**
- New/updated unit tests in `storage.test.ts` for `readFilterState`/`writeFilterState` round-trip and malformed-data fallback.
- New tests in `LearnMode.test.ts` (or a new integration test) verifying `drawNextCard` receives only entries matching a given filter.
- New test verifying filter selection survives a simulated reload (re-instantiate `AppShell` against the same `localStorage`).
- New test verifying switching Learn → Browse → Learn preserves the active filter.
- New test for the empty-filtered-result UI/behavior decision made in step 6 above.
- Review and update existing `BrowseGrid.test.ts`/`LearnMode.test.ts` assertions that implicitly assume full-glossary/default-filter state.

**Backward compatibility**: No schema migration needed for existing `skillflip:learn-progress` data (untouched key/shape). The new filter-state key is additive; absence of the key (first run, or upgrading from a prior version) must default gracefully to "no filter" (all entries, all levels, empty search) exactly as today's in-memory default does.

---

## Next Steps

Proceed to gap analysis (`maister:gap-analyzer`) to enumerate the precise current-vs-desired state deltas (e.g., exact callback signatures, exact `AppShell` state shape, empty-subset UX decision) before specification and implementation planning.
