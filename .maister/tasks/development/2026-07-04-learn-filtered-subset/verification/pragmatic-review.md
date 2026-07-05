# Pragmatic Code Review: Learn Mode Respects Browse's Filtered Subset

Reviewed: `src/components/EmptyState.ts` (new), `src/lib/storage.ts`, `src/components/FilterBar.ts`, `src/components/BrowseGrid.ts`, `src/components/AppShell.ts`, `src/components/LearnMode.ts`, `src/styles/theme.css`, plus their test files.

**Project scale**: Personal/portfolio MVP — Vite + vanilla TypeScript SPA, zero runtime dependencies, component-factory pattern, ~3 days old, no backend. Baseline for "normal" abstraction in this codebase is `FilterBar.ts`/`BrowseGrid.ts`: flat closures, one level of parent-mediated callbacks, no classes, no DI, no repositories/services/factories-of-factories.

## Executive Summary

**Status: Appropriate**, with one verified functional completeness gap that should be closed before calling this feature done.

This implementation is well-calibrated to the project's scale. It does not introduce any new abstraction layer, framework, dependency, or architectural pattern beyond what already existed in the codebase before this feature. Every new type/option/method traces to a concrete caller. The `AppShell`-as-mediator design is the same "parent owns state, children get plain callbacks" pattern the app already used for tab-switching — extended, not replaced with something heavier (no event bus, no pub/sub, no observable store, no DI container).

Findings: 0 Critical, 0 High, 2 Medium, 2 Low.

The two Medium findings are **not** over-engineering issues:
1. A verified functional gap — `BrowseGrid.ts`'s own progress-stats readout was never re-scoped to the filtered subset, despite spec Requirement 8 explicitly requiring it for both views, and despite `LearnMode.ts`'s side of the same requirement being correctly implemented and tested.
2. A small duplicated-type/literal nit (three names/spots for the same 2-field `{selectedCategories, selectedLevel}` shape).

No simplification work is recommended overall — the codebase is about as simple as this feature could reasonably be built. The action items are a completeness fix and a minor DRY cleanup, not complexity reduction.

## Complexity Assessment

**Complexity introduced by this feature**: Low, proportional to the problem.

- 1 new file (`EmptyState.ts`, 44 lines, single exported function, no internal state) — a clean, verbatim extraction of `BrowseGrid`'s prior inline `renderEmptyState()`, confirmed via `git diff` to be a faithful copy with zero markup/behavior change.
- 2 new pure functions in `storage.ts` (`readFilterState`/`writeFilterState`) structurally identical in shape to the existing `readProgress`/`writeProgress` — same try/catch-and-fallback pattern, same single-key read-modify-write shape. This is "match the existing baseline style," not a step up in sophistication.
- `AppShell` gained one field (`filterState`) and one method (`handleFilterChange`) — no new class hierarchy, no state machine library, no reducer/dispatch pattern. A single function with a single new closure variable, consistent with every other component in this codebase.
- `LearnMode` gained one new public method (`updateFilter`) and one small formatting helper (`formatFilterLabel`) — both directly used, both simple string/array logic with no abstraction.
- No new runtime dependencies, no new build configuration, no new environment variables, no new indirection layers (no repository/factory/strategy patterns introduced).
- 1 new CSS class (`.filter-chip`, 15 lines), derived directly from the existing `.chip.active` pill conventions.

Complexity is proportional to the actual problem (propagate one small piece of state between two sibling views and persist it) and matches the existing codebase's baseline (`FilterBar.ts`/`BrowseGrid.ts`).

## Over-Engineering Patterns

None found at any severity. Specifically checked for and did **not** find:

- **Infrastructure overkill**: N/A — still `localStorage` only, matching the existing `readProgress`/`writeProgress` template exactly. No Redis/queue/cache introduced for a 159-entry static JSON dataset.
- **Excessive abstraction layers**: `EmptyState.ts` returns a plain `HTMLElement` directly (not a `{ element, destroy }` instance wrapper like `Card`/`FilterBar`/`BrowseGrid`/`LearnMode`) — a deliberate, correctly-scoped simplification, not an added layer, since it has no internal state or listeners needing teardown beyond a click handler that's garbage-collected with the DOM node.
- **Enterprise patterns in simple code**: none — no factories-of-factories, no DI container, no event bus. `AppShell`'s mediator role is a plain function callback (`onFilterChange`/`onClearFilter`), consistent with the app's existing `FilterBar.onChange` convention.
- **Premature optimization**: none — no caching/memoization added for filter computation; `applyFilters` is simply re-run on every change, appropriate at this data scale (159 entries).
- **Speculative extensibility**: none. `LearnModeFilterSummary`/`updateFilter` are scoped exactly to category+level, matching what's actually needed — no generic "filter feature" abstraction, no plugin points, no `FilterType` enum for hypothetical future filter kinds. `EmptyState`'s options interface (`heading`, `body`, `actionLabel`, `onAction`) has exactly the 4 fields both current call sites need — no speculative `icon` option despite both call sites plausibly wanting one someday (the code comment explicitly notes this restraint).
- **Configuration complexity**: none — no new config files, env vars, or feature flags.

Every new option (`initialFilterState`, `onFilterChange`, `initialState`, `updateFilter`, `onClearFilter`, `filterState`) has exactly one caller, confirmed by reading each file end to end.

## Key Issues Found

### Medium — Requirement 8 (subset-scoped progress stats) is only half-implemented

**Evidence**: `src/components/BrowseGrid.ts:175,180`:
```ts
renderProgressStats(progressStats, entries);          // construction — full glossary
...
refreshStats: () => renderProgressStats(progressStats, entries),   // full glossary
```
Verified directly (not just via grep): `renderProgressStats` is called with `entries` (the full, unfiltered dataset closed over at the top of `createBrowseGrid`) at **both** its call sites in `BrowseGrid.ts`, and there is **no** call to it inside `renderContent()` at all — so Browse's own topbar stats never update on any filter/search change, and never reflect the active subset.

Contrast with `LearnMode.ts`, which does this correctly at all three of its call sites (`:262`, `:275`, `:295` — all pass `currentEntries`, the live filtered subset).

**Spec requirement** (`implementation/spec.md`, Core Requirement 8): "Both `LearnMode`'s **and** `BrowseGrid`'s topbar stat readouts (`renderProgressStats` → `computeBucketCounts`) call with the currently active filtered subset instead of the full glossary, whenever a card is marked... or the filter changes."

**Why this was missed**: The implementation-completeness checker's verification table only cites `LearnMode.ts` line numbers for "subset-scoped stats" (`implementation-completeness.md:22,69`) and never checked `BrowseGrid.ts`'s two call sites against the same requirement — an asymmetric verification gap, not a documented, accepted deviation. No work-log entry or spec-audit note flags this as a deliberate omission.

**Impact**: User-visible functional gap. A user who filters Browse to "Java only" and looks at Browse's own topbar still sees mastered/shaky/new counts for the entire 159-entry glossary, not the filtered subset — directly contradicting the feature's stated goal for the Browse side, even though Learn Mode's side works correctly.

**Recommendation**: Mirror what `LearnMode.ts` already does correctly:
```ts
// BrowseGrid.ts
function renderContent(): void {
  const filtered = applyFilters(entries, filterState);
  resultCount.textContent = `${filtered.length} of ${entries.length} terms`;
  renderProgressStats(progressStats, filtered);   // add this line
  ...
}
```
And change the two existing call sites (construction line 175, `refreshStats` line 180) to compute/reuse the same filtered subset rather than `entries`. This is a same-shape fix to what's already proven working in `LearnMode.ts` — not a redesign.

**Estimated effort**: ~10-15 minutes plus one `BrowseGrid.test.ts` assertion (e.g. filter to a category, assert `.progress-stats` text reflects only that subset's counts).

---

### Medium — Triplicated `{selectedCategories, selectedLevel}` shape, plus a same-function double-construction

**Evidence**:
- `src/lib/storage.ts:40-43` — `PersistedFilterState { selectedCategories: Category[]; selectedLevel: Level | 'All' }`
- `src/components/LearnMode.ts:35-38` — `LearnModeFilterSummary { selectedCategories: Category[]; selectedLevel: Level | 'All' }` — byte-for-byte the same shape, different name, declared independently rather than imported/aliased.
- `src/components/AppShell.ts:68-80` — `handleFilterChange` builds the same object literal twice in seven lines:
  ```ts
  function handleFilterChange(newState: BrowseFilterState): void {
    state.filterState = newState;
    writeFilterState({
      selectedCategories: newState.selectedCategories,
      selectedLevel: newState.selectedLevel,
    });
    learnMode.updateFilter(applyFilters(entries, newState), {
      selectedCategories: newState.selectedCategories,
      selectedLevel: newState.selectedLevel,
    });
  }
  ```
- `src/components/AppShell.ts:84-85` — the same 2-field literal appears a third time at construction, for `onClearFilter` and the initial `filterState` passed to `createLearnMode`.

**Problem**: The type was correctly designed once (spec.md Key Decisions: "kept as its own type rather than derived... so the exclusion is structural"), but re-declared under a second name in `LearnMode.ts` instead of imported, and inlined a third/fourth time in `AppShell.ts`. There's a legitimate rationale for `LearnMode.ts` not importing a `src/lib/storage.ts` (persistence-layer) type into a `src/components/` (display-layer) file for an unrelated concern — matching this app's existing `lib` vs `components` separation — so this is a naming/duplication nit, not a layering violation.

**Impact**: Low risk today (TypeScript's structural typing means nothing breaks), but a future third field added to the persisted shape requires updating two interfaces and two-plus inline literals in lockstep, with nothing enforcing that. Also makes `AppShell.handleFilterChange` marginally harder to read than necessary.

**Recommendation**: Either `export type LearnModeFilterSummary = PersistedFilterState;` (re-export/alias instead of re-declare) if `LearnMode.ts` importing from `storage.ts` is acceptable, or leave the two-interface split (for layering reasons) but extract the literal once inside `handleFilterChange`:
```ts
function handleFilterChange(newState: BrowseFilterState): void {
  state.filterState = newState;
  const persisted: PersistedFilterState = {
    selectedCategories: newState.selectedCategories,
    selectedLevel: newState.selectedLevel,
  };
  writeFilterState(persisted);
  learnMode.updateFilter(applyFilters(entries, newState), persisted);
}
```

**Estimated effort**: ~10 minutes, zero behavior change, no test changes needed (existing tests assert behavior, not which type declaration was used).

---

### Low — `formatFilterLabel`'s trailing "✕" glyph is baked into the label string, not markup

**Evidence**: `src/components/LearnMode.ts:66` — `return [categoryPart, levelPart].filter(Boolean).join(' · ') + '  ✕';`

**Problem**: The dismiss glyph is part of the button's `textContent` rather than a separate child element. Per the work-log, this was a same-day, post-hoc fix added after Group 5 was already marked complete, to match the mockup's visual reference. It works and is tested, but the button already carries `aria-label="Clear active filter"` (`LearnMode.ts:121`), so a screen reader will announce both the label and the redundant "✕" character in the text content.

**Impact**: Cosmetic/accessibility polish only, not a functional bug.

**Recommendation**: Optional — wrap the glyph in `<span aria-hidden="true">✕</span>` appended as a child rather than concatenated into `textContent`, consistent with how the codebase's icon-only buttons (`.icon-btn`) rely on `aria-label` rather than announced glyph text. Not worth blocking on.

**Estimated effort**: ~5 minutes.

---

### Low — Pre-existing DOM-selector coupling in `AppShell.ts`'s exit-button wiring (not introduced by this feature, noted for contrast)

**Evidence**: `src/components/AppShell.ts:146-147`:
```ts
const exitBtn = learnMode.element.querySelector<HTMLElement>('.icon-btn[aria-label="Exit Learn Mode"]');
exitBtn?.addEventListener('click', () => switchTo('browse'));
```

**Problem**: Confirmed via `git show`/prior commits that this predates the current feature. Reaching through a child's rendered DOM via attribute selector, instead of an exposed callback (e.g. an `onExit` option on `createLearnMode`, mirroring the `onClearFilter` pattern this feature just added), is more brittle than the callback convention `AppShell.ts` now uses twice over for the new filter wiring. Not a regression, but the new `onClearFilter`/`onFilterChange` props make the inconsistency more visible by contrast within the same file.

**Impact**: None introduced by this change; an observation for future consistency, not an action item for this review.

**Recommendation**: Out of scope for this feature. If `LearnMode`/`AppShell` are touched again, converting to an `onExit` callback would match the two callback props just added.

**Estimated effort**: N/A — not part of this feature.

## Developer Experience

The filter-state flow is easy to trace end-to-end:

`FilterBar` (fires `onChange`) → `BrowseGrid` (`onChange` handler updates local `filterState`, re-renders, and additionally calls `options.onFilterChange?.(state)`) → `AppShell.handleFilterChange` (updates `state.filterState`, persists via `writeFilterState`, calls `learnMode.updateFilter(...)`) → `LearnMode.updateFilter` (reassigns `currentEntries`/`filterSummary`, calls the single shared `renderFromCurrentState()`).

This is a linear, single-directional callback chain with no hidden global state, no shared mutable module-level singletons, and no magic (no decorators, no proxies, no DI). `AppShell` never hands `BrowseGrid` and `LearnMode` references to each other — the only cross-reference is `handleFilterChange` closing over both instances, the same pattern already used for `browseGrid.refreshStats()` on tab switch. A new developer can read `AppShell.ts` top to bottom and understand the entire data flow without jumping through indirection.

One readability plus: `LearnMode.ts`'s `renderFromCurrentState()` is called identically from both construction and `updateFilter()`, so there is exactly one render path to reason about instead of two subtly-different ones (a common source of bugs in ad hoc state syncing) — good practice, not incidental.

Build/test feedback loop is unaffected: `tsc --noEmit` clean, `npx vitest run` reports 63/63 passing (independently re-run during this review).

## Requirements Alignment

Compared against `implementation/spec.md` (9 core requirements):

- Requirements 1–7, 9 (persistence schema, `AppShell` mediation, upward propagation, `updateFilter`, filter chip, empty-state, `resetProgress` scope unaffected) are implemented as specified, with no scope additions.
- **Requirement 8 is only half-implemented** — see the Medium finding above. `LearnMode.ts` correctly scopes its stats to the filtered subset at all 3 call sites; `BrowseGrid.ts` never does, at either of its 2 call sites.
- No out-of-scope items were touched: no cross-device sync, no per-subset progress views, no chip-to-Browse navigation, no saved presets, no `resetProgress()` scope change, no `FilterBar.test.ts` file — matching the spec's explicit Out of Scope list exactly.
- No requirement inflation, no mismatched technology choices, no speculative "future-proofing" found anywhere in the diff.

## Context Consistency

- No dead code from the `EmptyState` extraction: `BrowseGrid.ts`'s old inline `renderEmptyState()` was fully removed (confirmed via `git diff` — zero remaining references), not left as an unused fallback alongside the new shared component.
- `tsc --noEmit` (strict mode, `noUnusedLocals`/`noUnusedParameters` already enabled project-wide) passes cleanly — rules out unused params/locals as a class of issue here.
- Full test suite passes: 63/63 (`npx vitest run`, independently verified), consistent with the work-log's own final tally.
- The `LearnModeFilterSummary`/`PersistedFilterState` duplication (Medium finding above) is the one structural inconsistency found; not a bug, but a fair "will these two ever diverge?" question for a future reader.
- The `exitBtn`'s empty no-op click listener inside `LearnMode.ts` (lines 298-301) and `AppShell.ts`'s subsequent `querySelector` rewiring predate this feature — not introduced or touched by this change.

## Recommended Simplifications (Priority Order)

No simplification work is needed — the codebase is already about as simple as this feature could reasonably be built. Priority order below is by impact, mixing the one completeness fix with the minor cleanups:

1. **(Medium, do first)** Finish Requirement 8 for `BrowseGrid.ts`'s own stats — re-scope both `renderProgressStats` call sites (and add one inside `renderContent()`) to the filtered subset, mirroring `LearnMode.ts`'s already-correct pattern. ~10-15 min + 1 test.
2. **(Medium, quick)** Collapse the triple-declared filter-shape — alias or import `PersistedFilterState` in `LearnMode.ts` instead of re-declaring `LearnModeFilterSummary`, and de-duplicate the double-literal in `AppShell.handleFilterChange`. ~10 min, zero behavior change.
3. **(Low, optional)** Move the "✕" glyph into an `aria-hidden` span for cleaner screen-reader output. ~5 min.

## Summary Statistics

| Metric | Value |
|---|---|
| New files | 1 (`EmptyState.ts`, 44 lines) |
| New runtime dependencies | 0 |
| New abstraction layers | 0 |
| New public options/methods, all with confirmed single caller | 6 (`initialFilterState`, `onFilterChange`, `initialState`, `updateFilter`, `onClearFilter`, `filterState`) |
| Tests passing | 63/63 (independently re-verified) |
| Type-check | clean (`tsc --noEmit`, strict mode) |
| Dead code found | none |
| Functional gaps found | 1 (Browse's own stats not subset-scoped — Requirement 8 partial) |
| Duplicated type/literal shapes | 1 (`{selectedCategories, selectedLevel}` — 3 spots) |

## Conclusion

This is a well-scoped feature that matches the project's size: it reuses existing patterns (`readProgress`/`writeProgress` → `readFilterState`/`writeFilterState`), extends the existing mediator pattern rather than introducing new machinery, and keeps every new surface minimal and immediately-used. No action is needed to *reduce* complexity anywhere in this diff.

Two action items remain before considering this fully done:
1. Finish Requirement 8 by re-scoping `BrowseGrid.ts`'s two `renderProgressStats` call sites (and adding the missing call inside `renderContent()`) to the filtered subset — a small, already-specified, verified functional gap, not a design change.
2. Collapse the triplicated `{selectedCategories, selectedLevel}` shape into one source of truth.

Estimated total effort for both: well under an hour, including test updates. Neither is a blocker for the feature's overall design being sound — both are finishing touches, not signs of over-engineering or under-engineering.
