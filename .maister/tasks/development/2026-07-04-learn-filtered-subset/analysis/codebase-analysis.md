# Codebase Analysis Report

**Date**: 2026-07-04
**Task**: Learn Mode respects Browse's filtered subset (category/level, persisted)
**Description**: Implement the product-design brief — Learn Mode should draw only from Browse's active category/level filter, with that filter persisted in localStorage across sessions (search text excluded). Add localStorage-persisted filter state lifted to AppShell, propagated to FilterBar/BrowseGrid/LearnMode via callbacks; new storage.ts functions (readFilterState/writeFilterState); new LearnMode.updateFilter() method; new dismissible active-filter chip in Learn Mode's topbar; new shared EmptyState component (extracted from BrowseGrid's existing renderEmptyState, reused by both BrowseGrid and LearnMode); progress stats scoped to the active filtered subset.
**Analyzer**: codebase-analyzer skill (2 Explore agents: Code Analysis, Pattern Mining)

---

## TL;DR
An approved product-design feature-spec already exists for this task at `.maister/tasks/product-design/2026-07-04-learn-filtered-subset/analysis/feature-spec.md` and is authoritative — it resolves a schema/key-name discrepancy the two Explore agents disagreed on. All six touched files (`AppShell.ts`, `BrowseGrid.ts`, `FilterBar.ts`, `LearnMode.ts`, `storage.ts`, new `EmptyState.ts`) are small (≤193 lines), already share the `BrowseFilterState` type, and the change is purely additive (new optional options/methods, no signature breaks). Complexity is moderate, risk is low-medium: the only material risk is regression in the 31 existing passing tests if propagation wiring is done incorrectly.

## Key Decisions
- Defer to `feature-spec.md` Section 1 for the persisted schema: `PersistedFilterState { selectedCategories, selectedLevel }` under key `skillflip:browse-filter-state` — NOT the Pattern Mining agent's generically-inferred `skillflip:filter-state` / possible 3-field shape. The feature-spec was already reviewed and approved by the user; treat it as the single source of truth over any convention inferred from repo patterns alone.
- `AppShell` becomes the sole owner/mediator of `BrowseFilterState`; `BrowseGrid` and `LearnMode` remain mutually decoupled (no direct references between them) — matches the codebase's existing "no sibling coupling, parent-mediated callbacks" pattern already used for `FilterBar` → `BrowseGrid`.
- `EmptyState` extraction targets `src/components/EmptyState.ts`, following the `Card.ts`/`FilterBar.ts` factory-function template (`createEmptyState(options): { element, destroy }` — spec uses `HTMLElement` return directly per Section 4, simpler than other factories since it has no internal state to expose via `getState()`).
- Progress-tracking persistence (`readProgress`/`writeProgress`/`resetProgress`) requires zero changes — only the stats *display* (`computeBucketCounts` call-site inputs) becomes subset-scoped, confirmed as intentional in feature-spec Section 5.

## Open Questions / Risks
- `LearnMode.test.ts` currently has 6 tests, not the 5 the Code Analysis agent estimated (verified directly against the live file). Total existing test count across the 6 test files is confirmed at 31, matching the feature-spec's stated regression-guard baseline — use 31 as the authoritative pre-change count for `npm test` verification.
- `FilterBar.ts` and the new `EmptyState.ts` have no dedicated test files yet (FilterBar is tested only via `BrowseGrid.test.ts` integration); feature-spec Section 6 adds a new `EmptyState.test.ts` but does not add a dedicated `FilterBar.test.ts` — confirm this is intentional scope before implementation, since `FilterBar` is also gaining a new optional `initialState` field.

---

## Summary

The codebase is a small, dependency-free component-factory SPA (~2,000 lines across components/lib) with an established, consistent architecture: DOM-owning "components" that communicate only through parent-mediated callbacks, and pure "lib" functions with no side effects (except `storage.ts`, deliberately isolated). The requested feature — coupling Learn Mode's draw pool to Browse's category/level filter, with persistence — fits this architecture cleanly as an additive change: lift `BrowseFilterState` ownership to `AppShell`, thread it down via new optional constructor options and callbacks, and add two new pure-shaped `storage.ts` functions mirroring the existing `readProgress`/`writeProgress` pair almost line-for-line. A prior product-design phase already produced a fully worked, line-level feature-spec that should be treated as authoritative for exact type shapes, storage keys, and component wiring.

---

## Files Identified

### Primary Files

**`/Users/bartek/Documents/Projects/AiB/rekrutacje/Skill Flip/src/components/AppShell.ts`** (127 lines)
- Tab-switching orchestrator; currently owns only `activeTab` state and passes the full, identical `entries: Glossary` array to both `createLearnMode()` and `createBrowseGrid()`.
- Becomes the sole owner of `BrowseFilterState` per feature-spec Section 2: adds `filterState` to its internal state, hydrates it from `readFilterState()` at construction, and defines `handleFilterChange()` to fan out writes (`writeFilterState`) and propagate (`learnMode.updateFilter(applyFilters(entries, newState))`).

**`/Users/bartek/Documents/Projects/AiB/rekrutacje/Skill Flip/src/components/BrowseGrid.ts`** (193 lines)
- Line 28: `let filterState: BrowseFilterState = { searchQuery: '', selectedCategories: [], selectedLevel: 'All' }` — currently local, unpersisted, reset to defaults every reload.
- Lines 54-60: `createFilterBar({ entries, onChange: (state) => { filterState = state; renderContent(); } })` — the exact callback site that must additionally call a new `options.onFilterChange?.(state)` to bubble up to `AppShell`.
- Lines 64-88: `renderEmptyState()` — the exact function to extract into `src/components/EmptyState.ts` (full source captured below in Current Functionality).
- Lines 170-181: `renderContent()` — applies filters and swaps grid/empty-state; will call the new shared `createEmptyState(...)` instead of the local `renderEmptyState()`.
- `CreateBrowseGridOptions` (lines 15-17) currently has only `entries: Glossary`; gains `initialFilterState?` and `onFilterChange?` per feature-spec Section 2.

**`/Users/bartek/Documents/Projects/AiB/rekrutacje/Skill Flip/src/components/FilterBar.ts`** (181 lines)
- Maintains its own `state` object, fires `onChange` on every mutation (search debounced 200ms; category/level toggles immediate).
- `CreateFilterBarOptions` currently takes `entries` + `onChange`; gains one new optional field, `initialState?: BrowseFilterState`, so `BrowseGrid` can hydrate it from persisted state. `reset()` needs no changes — it already naturally propagates through the existing `onChange` chain.
- No dedicated test file; only exercised indirectly via `BrowseGrid.test.ts`.

**`/Users/bartek/Documents/Projects/AiB/rekrutacje/Skill Flip/src/components/LearnMode.ts`** (182 lines)
- Line 45: `const { entries } = options` — the full, unfiltered glossary today.
- Line 49: `drawNextCard(entries, readProgress(), previousId)` at construction, and line 136 inside `advanceToNextCard()` — both currently draw from the full array; this is the crux of the current gap (Learn Mode is completely decoupled from Browse's filter).
- Lines 52-71: existing topbar structure — `exitBtn` (56-60), `progressStats` div (62-63), `resetBtn` (65-69), assembled via `topbar.append(exitBtn, progressStats, resetBtn)` at line 71. The new `.filter-chip` button is inserted here, between `progressStats` and `resetBtn`, per feature-spec Section 3.
- `LearnModeInstance` (lines 35-42) currently exposes `element`, `getState`, `destroy`; gains `updateFilter: (newEntries: Glossary) => void` per feature-spec Section 2 — replaces the internal `entries` reference and immediately redraws, matching the existing `advanceToNextCard()` mechanics.
- Empty-subset handling (feature-spec Section 4) is new: when `updateFilter([])` is called, render the shared `EmptyState` in place of `Card` inside `learnStage`, and skip calling `drawNextCard()` — never fall back to a wider pool.

**`/Users/bartek/Documents/Projects/AiB/rekrutacje/Skill Flip/src/lib/storage.ts`** (88 lines)
- Existing `STORAGE_KEY = 'skillflip:learn-progress'` (line 32) and `readProgress()`/`writeProgress()`/`resetProgress()` (lines 35-62) establish the exact template to mirror.
- New additions per feature-spec Section 1: `FILTER_STATE_KEY = 'skillflip:browse-filter-state'`, `PersistedFilterState { selectedCategories: Category[]; selectedLevel: Level | 'All' }` (deliberately excludes `searchQuery` at the type level), `defaultPersistedFilterState()`, `readFilterState()`, `writeFilterState()` — full implementations already specified verbatim in the feature-spec.
- `computeBucketCounts(entries: Glossary): BucketCounts` (lines 69-88) needs **no signature change** — it already accepts any array, so subset-scoping is achieved purely by changing call-site arguments (`computeBucketCounts(applyFilters(entries, filterState))`).

### Related Files

**`/Users/bartek/Documents/Projects/AiB/rekrutacje/Skill Flip/src/lib/filters.ts`** (42 lines)
- Pure logic, no side effects. Defines `BrowseFilterState { searchQuery, selectedCategories[], selectedLevel }` and `applyFilters(entries, state): Glossary`. Both are reused as-is (spec explicitly keeps `PersistedFilterState` as a strict subset of this type, not a redefinition). 4 existing tests.

**`/Users/bartek/Documents/Projects/AiB/rekrutacje/Skill Flip/src/lib/learnAlgorithm.ts`** (95 lines)
- `drawNextCard(entries, progress, previousId)` and `applyMark()`. No changes needed — the algorithm is filter-agnostic; only its input pool changes at the call site in `LearnMode.ts`. 4 existing tests.

**`/Users/bartek/Documents/Projects/AiB/rekrutacje/Skill Flip/src/components/Card.ts`** (300 lines)
- Not modified, but serves as the canonical component-factory template (`createCard(options): CardInstance`) that `EmptyState.ts` should follow for factory-naming and DOM-construction conventions.

**`/Users/bartek/Documents/Projects/AiB/rekrutacje/Skill Flip/src/components/progressStats.ts`** (36 lines)
- `renderProgressStats(container, entries)` already accepts any entries array; directly reusable for subset-scoped stats with no signature change, matching `computeBucketCounts`.

**`/Users/bartek/Documents/Projects/AiB/rekrutacje/Skill Flip/src/main.ts`** (54 lines)
- Bootstrap; fetches `glossary.json`, mounts `AppShell` once. No changes expected — filter-state hydration happens inside `AppShell`, not here.

**`/Users/bartek/Documents/Projects/AiB/rekrutacje/Skill Flip/src/styles/theme.css`** (691 lines)
- Tier-1 raw palette + Tier-2 semantic aliases already established. Relevant existing rules: `.chip`/`.chip.active`/`.chip.more` (~lines 469-489), `.icon-btn` (~lines 340-352), `.empty-state`/`.empty-icon`/`.clear-btn` (~lines 575-615). New `.filter-chip` class should derive from `.chip.active`'s pill shape and `--bg-topbar`-derived palette, sized for the topbar, with explicit `cursor: pointer` (learned convention from a recent "+N more" overflow-chip bugfix in this repo).

---

## Current Functionality

Today, `AppShell` mounts `BrowseGrid` and `LearnMode` side by side, both fed the identical, full `entries: Glossary` array, with zero coupling between them. `BrowseGrid` owns a local `filterState` (never persisted — resets to defaults on every reload) that flows only to its own `renderContent()` via `applyFilters()`. `LearnMode` draws cards via `drawNextCard(entries, readProgress(), previousId)` against the full array, with no visibility into Browse's filter state at all. This is the exact gap the feature targets.

The current `renderEmptyState()` (`BrowseGrid.ts` lines 64-88), captured verbatim:

```typescript
function renderEmptyState(): HTMLElement {
  const emptyState = document.createElement('div');
  emptyState.className = 'empty-state';

  const icon = document.createElement('div');
  icon.className = 'empty-icon';
  icon.textContent = '\u{1F50D}';

  const heading = document.createElement('h2');
  heading.textContent = 'No terms match';

  const helper = document.createElement('p');
  helper.textContent = 'Try clearing a filter or search a different term.';

  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'clear-btn';
  clearBtn.textContent = 'Clear filters';
  clearBtn.addEventListener('click', () => {
    filterBar.reset();
  });

  emptyState.append(icon, heading, helper, clearBtn);
  return emptyState;
}
```

This is the direct extraction target for `src/components/EmptyState.ts`, parameterized per feature-spec Section 4 as `createEmptyState({ heading, body, actionLabel, onAction }): HTMLElement`.

### Key Components/Functions

- **`createAppShell`** (`AppShell.ts`): tab-switching orchestrator; becomes filter-state owner/mediator.
- **`createBrowseGrid`** (`BrowseGrid.ts`): filter bar + grid/empty-state + own topbar stats; gains hydration + upward propagation.
- **`createFilterBar`** (`FilterBar.ts`): search/category/level controls; gains `initialState` hydration only.
- **`createLearnMode`** (`LearnMode.ts`): single-card weighted draw; gains `updateFilter()`, filter chip, empty-state handling, subset-scoped stats.
- **`readProgress`/`writeProgress`/`resetProgress`/`computeBucketCounts`** (`storage.ts`): existing progress persistence, untouched; template for new `readFilterState`/`writeFilterState`.
- **`applyFilters`** (`filters.ts`): pure filter application, reused unchanged as the mechanism that produces LearnMode's new subset.
- **`drawNextCard`/`applyMark`** (`learnAlgorithm.ts`): weighted draw, unchanged; only its input array changes.

### Data Flow

Current: `main.ts` fetches glossary → `createAppShell({ entries })` → mounts both `createLearnMode({ entries: FULL })` and `createBrowseGrid({ entries: FULL })` → `BrowseGrid` manages local `filterState` independently, never reaching `LearnMode`.

Target (per feature-spec): `AppShell` hydrates `filterState` from `readFilterState()` at construction → passes `initialFilterState` to `BrowseGrid`/`FilterBar` and `applyFilters(entries, filterState)` to `LearnMode` → on every `FilterBar` change, `BrowseGrid` bubbles `onFilterChange(state)` to `AppShell` → `AppShell.handleFilterChange()` updates its own state, calls `writeFilterState()` (2-field subset only), and calls `learnMode.updateFilter(applyFilters(entries, newState))` → `LearnMode` redraws its card and re-renders its filter chip and stats atomically from the new subset.

---

## Dependencies

### Imports (What This Depends On)

- `filters.ts` `applyFilters`/`BrowseFilterState`: used by `BrowseGrid` today; will be used by `AppShell` and `LearnMode` too.
- `storage.ts` `readProgress`/`writeProgress`/`resetProgress`/`computeBucketCounts`: used by `LearnMode`; gains `readFilterState`/`writeFilterState`, to be used by `AppShell`.
- `learnAlgorithm.ts` `drawNextCard`/`applyMark`: used by `LearnMode`, unchanged.
- `Card.ts` `createCard`: used by both `BrowseGrid` (tile variant) and `LearnMode` (full variant), unchanged.
- `progressStats.ts` `renderProgressStats`: used by both `BrowseGrid` and `LearnMode`, call-site arguments change to pass filtered subsets.

### Consumers (What Depends On This)

- **`main.ts`**: instantiates `AppShell` once; unaffected by internal filter-state changes.
- **`AppShell.ts`**: newly becomes a consumer of `storage.ts`'s new functions and `filters.ts`'s `applyFilters`.
- **`BrowseGrid.ts`**: consumer of `FilterBar`'s new `initialState` option and emitter of the new `onFilterChange` callback to `AppShell`.
- **`LearnMode.ts`**: consumer of `AppShell`'s new `updateFilter()` calls and `onClearFilter` callback.

**Consumer Count**: 4 component files directly touched (`AppShell`, `BrowseGrid`, `FilterBar`, `LearnMode`) + 1 new file (`EmptyState.ts`) + 1 lib file (`storage.ts`).
**Impact Scope**: Medium — every top-level component in the app is touched, but changes are additive (new optional fields/methods), not breaking. No changes required to `Card.ts`, `progressStats.ts`, `filters.ts`, `learnAlgorithm.ts`, or `main.ts`.

---

## Test Coverage

### Test Files (current, verified against live files)

- **`AppShell.test.ts`**: 5 tests — tab switching, no URL routing. Gains 3 new cases (hydration from localStorage, `writeFilterState` call on change, `LearnMode.updateFilter` call with correct subset).
- **`BrowseGrid.test.ts`**: 9 tests — filter integration, empty state, grid rendering, stats refresh, overflow-chip expansion. Gains 2 new cases (`initialFilterState` hydration, `onFilterChange` propagation).
- **`LearnMode.test.ts`**: 6 tests (verified — corrects the Code Analysis agent's estimate of 5) — draw, mark, progress persistence, reset. Gains 5 new cases per feature-spec Section 6 (updateFilter redraw, empty-subset EmptyState + hidden mark-row, chip label/visibility, chip-click clear path, subset-scoped stats).
- **`storage.test.ts`**: 3 tests — read/write/reset progress, bucket counts. Gains 3 new cases (round-trip, fallback defaults, searchQuery structurally absent from stored JSON).
- **`filters.test.ts`**: 4 tests — unchanged, no modifications needed.
- **`learnAlgorithm.test.ts`**: 4 tests — unchanged, no modifications needed.
- **No `FilterBar.test.ts`**: FilterBar is tested only via `BrowseGrid.test.ts` integration; feature-spec does not add a dedicated file despite adding the `initialState` option.
- **New `EmptyState.test.ts`**: 2 new cases (renders heading/body/action-label; action button calls `onAction`).

### Coverage Assessment

- **Current total**: 31 tests across 6 files (confirmed via direct grep of live test files — matches feature-spec's stated regression baseline).
- **Gaps closed by this feature**: no existing coverage for filter-state persistence or Learn Mode/Browse-filter coupling — this is explicitly called out in the feature-spec (Section 6) as the gap this task's tests are designed to close.
- **Regression guard**: all 31 existing tests must continue passing unmodified — `npm test` is the acceptance gate per feature-spec.

---

## Coding Patterns

### Naming Conventions

- **Components**: `create<ComponentName>(options: Create<ComponentName>Options): <ComponentName>Instance`, e.g. `createCard`, `createFilterBar`, `createEmptyState`.
- **Functions**: verb-first, descriptive — `readProgress`, `writeProgress`, `applyFilters`, `drawNextCard`, `computeBucketCounts`.
- **Files**: PascalCase for components (`AppShell.ts`, `BrowseGrid.ts`), camelCase for lib (`storage.ts`, `filters.ts`, `learnAlgorithm.ts`).
- **CSS classes**: kebab-case; state classes follow `.active`, `.is-visible`, `.is-flipped` conventions.

### Architecture Patterns

- **Style**: functional component-factory, no classes anywhere in the codebase.
- **State Management**: closure-local `state` object per component instance; no global store/singleton; parent-mediated callbacks only (no direct sibling coupling) — `AppShell` is the designated mediator for this feature, consistent with existing conventions.
- **DOM construction**: exclusively `document.createElement()` + `.append()`/`.appendChild()`; no innerHTML/template strings/JSX (one narrow exception: `BrowseGrid.ts`'s `createTile()` uses `tile.innerHTML = ''` to clear before re-render, not to inject markup).
- **Persistence**: `storage.ts` is the single, intentional exception to the "lib has no side effects" rule — localStorage access isolated there with defensive `try/catch` + type validation on every read.
- **Lifecycle**: every component instance exposes `destroy()` for cleanup of non-DOM-scoped listeners.

---

## Complexity Assessment

| Factor | Value | Level |
|--------|-------|-------|
| File count touched | 5 modified + 1 new | Medium |
| Dependencies | `filters.ts`, `storage.ts`, `learnAlgorithm.ts`, `progressStats.ts`, `Card.ts` (all existing, no new deps) | Low |
| Consumers | `AppShell` (mediator), `BrowseGrid`, `FilterBar`, `LearnMode` (4 components) | Medium |
| Test coverage | 31 existing tests, ~15 new cases specified | Good (spec pre-defines exact new cases) |

### Overall: Moderate

No new external dependencies, no breaking signature changes, and no changes to `Card.ts`, `progressStats.ts`, `filters.ts`, or `learnAlgorithm.ts` internals. The moderate rating comes from touching every top-level component simultaneously (threading one piece of state through 4 files) and adding a genuinely new cross-view behavior (Learn Mode empty-subset handling) rather than from any single file being complex in isolation.

---

## Key Findings

### Strengths
- `BrowseFilterState` already exists as a shared type (`filters.ts`) used consistently; no new type design needed for the in-memory shape, only a persisted subset type.
- `storage.ts`'s existing `readProgress`/`writeProgress` pair is an almost exact template for the new `readFilterState`/`writeFilterState` — the feature-spec's proposed implementation mirrors it near line-for-line.
- `computeBucketCounts` and `renderProgressStats` already accept arbitrary entry arrays — subset-scoping requires zero signature changes, only call-site argument changes.
- A full, approved feature-spec already exists with concrete code snippets for every changed file, removing most design ambiguity before implementation starts.

### Concerns
- Two Explore agents disagreed on the storage key name and persisted schema shape (`skillflip:filter-state` + possible 3-field vs. `skillflip:browse-filter-state` + strict 2-field). The feature-spec resolves this authoritatively — implementation must follow the feature-spec's exact naming, not either agent's inferred convention.
- `FilterBar.ts` has no dedicated test file today and is gaining a new option (`initialState`) without a corresponding new dedicated test file per the current spec — verify this is an accepted gap before finalizing test planning.
- Learn Mode's empty-subset behavior is entirely new interaction surface (no card, no mark-row, shared `EmptyState` swapped in) — the one place in this feature with no precedent elsewhere in the codebase to copy from directly (aside from `BrowseGrid`'s existing empty-state swap in `renderContent()`).

### Opportunities
- The `EmptyState` extraction is a clean, low-risk DRY win independent of the rest of the feature — it could be implemented and tested first as a foundation step.
- Because `AppShell` becomes the single mediator, this is a good structural checkpoint to confirm no future feature accidentally introduces direct `BrowseGrid`↔`LearnMode` coupling.

---

## Impact Assessment

- **Primary changes**: `src/lib/storage.ts` (new functions), `src/components/AppShell.ts` (state ownership + mediation), `src/components/BrowseGrid.ts` (hydration + upward propagation + EmptyState swap), `src/components/FilterBar.ts` (initialState hydration), `src/components/LearnMode.ts` (updateFilter, filter chip, empty-state handling, subset-scoped stats), new `src/components/EmptyState.ts`.
- **Related changes**: `src/styles/theme.css` (new `.filter-chip` class).
- **Test updates**: `storage.test.ts`, `AppShell.test.ts`, `BrowseGrid.test.ts`, `LearnMode.test.ts` all gain new cases; new `EmptyState.test.ts` file created. `filters.test.ts` and `learnAlgorithm.test.ts` require no changes.

### Risk Level: Low-Medium

No breaking API changes, no new dependencies, and a fully worked feature-spec already exists with concrete type/function signatures. Risk is concentrated in correctly wiring the propagation chain across 4 components without reintroducing direct sibling coupling, and in ensuring the empty-subset UX (a genuinely new interaction) behaves correctly (no card shown, mark controls hidden, never falls back to the full glossary).

---

## Recommendations

This is a **modifying-existing-code** task with a pre-approved design (not a from-scratch architecture decision). Recommended implementation strategy:

1. **Follow `feature-spec.md` verbatim for type shapes, storage key, and function signatures** — it is the authoritative resolution of the schema/key-name discrepancy the two Explore agents surfaced. Do not re-derive these from "generic convention inference."
2. **Sequence**: extract `EmptyState.ts` first (self-contained, testable in isolation, immediately de-risks the rest) → add `storage.ts` functions (mirrors existing pattern, easy to unit test standalone) → wire `AppShell` as mediator → thread `FilterBar`/`BrowseGrid` hydration + propagation → add `LearnMode.updateFilter()` + filter chip + empty-state + subset-scoped stats last (most new surface area).
3. **Backward compatibility**: all new component options must be optional with sensible defaults (`initialFilterState?`, `onFilterChange?`, `initialState?`) so existing call sites and tests that don't pass them keep working unchanged — matches the feature-spec's explicit design.
4. **Testing requirements**: implement the ~15 new test cases enumerated in feature-spec Section 6 across `storage.test.ts`, `AppShell.test.ts`, `BrowseGrid.test.ts`, `LearnMode.test.ts`, and new `EmptyState.test.ts`. Use `npm test` with a 31-passing baseline confirmed before starting, and 31 + new-cases passing as the completion gate.
5. **Verify at the write boundary, not just the type boundary**: the feature-spec explicitly calls for `searchQuery` exclusion to be structural (missing from `PersistedFilterState` entirely) — when implementing `writeFilterState`, pass an object literal with only `selectedCategories`/`selectedLevel`, don't destructure-and-delete from a full `BrowseFilterState`.

---

## Next Steps

Proceed to gap analysis (or directly to specification/planning, since a full feature-spec already exists) using this report plus `.maister/tasks/product-design/2026-07-04-learn-filtered-subset/analysis/feature-spec.md` as the primary specification input. Given the feature-spec's completeness, the gap-analysis phase should focus on confirming no drift between the spec's assumptions and the current live codebase state (verified clean in this report) rather than re-deriving requirements.
