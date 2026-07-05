# Reality Check: Learn Mode Respects Browse's Filtered Subset

Task: `.maister/tasks/development/2026-07-04-learn-filtered-subset`
Mode: standalone reality assessment, full test suite executed directly (not skipped).

## Status: READY (GO)

## TL;DR

The implementation is real, not checkbox theater. I read all five touched source files in full, traced the propagation chain by hand (FilterBar → BrowseGrid → AppShell → storage.ts + LearnMode), ran `npx tsc --noEmit` (clean) and `npm test` myself from a cold shell. Result: **63 vitest tests + 2 build-verification tests = 65 passed, 0 failed**, matching the work-log's claimed numbers exactly. The `searchQuery` exclusion is enforced structurally at two independent points (the `PersistedFilterState` type shape and an explicit object-literal construction in `writeFilterState`), not just by convention. The empty-subset path, the dismissible chip, and subset-scoped stats are all wired for real, with tests that exercise DOM output and localStorage contents rather than mocked internals. I found no gap between what work-log.md/implementation-plan.md claim and what the code does.

## Test Suite — Actual Execution (not trusted from reports)

```
npm test
 ✓ src/lib/storage.test.ts (6 tests)
 ✓ src/lib/learnAlgorithm.test.ts (4 tests)
 ✓ src/lib/filters.test.ts (4 tests)
 ✓ src/components/Card.test.ts (7 tests)
 ✓ src/components/LearnMode.test.ts (11 tests)
 ✓ src/components/BrowseGrid.test.ts (11 tests)
 ✓ src/components/AppShell.test.ts (12 tests)
 ✓ src/types/glossary.test.ts (3 tests)
 ✓ src/components/EmptyState.test.ts (2 tests)
 ✓ src/main.test.ts (3 tests)
 Test Files  10 passed (10)
      Tests  63 passed (63)
> test:build (verify-build.test.ts): 2 passed, 0 failed
```
Combined: **65 passed / 0 failed**. `npx tsc --noEmit` — no errors.

This matches work-log.md's final claim ("65 passed, 0 failed ... zero regressions") exactly, and matches the earlier per-group interim counts (e.g. Group 3's "3 expected-red, resolved by Group 5" narrative checks out — nothing was swept under the rug; it was sequencing, not a bug, and the final state is fully green).

## End-to-End Trace (read, not assumed)

I read `src/components/AppShell.ts`, `src/components/LearnMode.ts`, `src/components/BrowseGrid.ts`, `src/components/FilterBar.ts`, `src/lib/storage.ts`, `src/components/EmptyState.ts`, and `src/lib/filters.ts` in full (not excerpts). The chain genuinely holds together:

1. **Browse filter selection → persisted to localStorage**: `FilterBar`'s `onChange` fires on every chip/level/search change → `BrowseGrid`'s handler updates its local `filterState`, re-renders, and calls `options.onFilterChange?.(state)` (`BrowseGrid.ts:66-70`) → `AppShell` wired this as `handleFilterChange` (`AppShell.ts:92`) → `handleFilterChange` calls `writeFilterState({selectedCategories, selectedLevel})` (`AppShell.ts:71-74`), an object literal, not a spread of the full state.
2. **Read back on reload**: `AppShell.ts:54` — `const filterState: BrowseFilterState = { ...readFilterState(), searchQuery: '' }` runs at construction time, every time. `AppShell.test.ts` has an actual "simulate reload" test that constructs a *second* `createAppShell` instance against the same `localStorage` with zero interaction and asserts Learn Mode already shows the filtered subset — this is a real regression-proof test, not a unit-test-only illusion.
3. **Passed into Learn Mode**: `AppShell.ts:82-86` constructs `LearnMode` with `entries: applyFilters(entries, filterState)` and a `filterState` summary for the chip. Every subsequent change calls `learnMode.updateFilter(applyFilters(entries, newState), {...})` (`AppShell.ts:76-79`).
4. **Learn Mode draws only from that subset**: `LearnMode.ts` converts the former `const { entries }` into `let currentEntries` (line 97) exactly as both spec and gap-analysis flagged was mechanically required; `drawNextCard(currentEntries, ...)` is called from `renderFromCurrentState()` (line 290), which both construction and `updateFilter` funnel through — there is no code path that falls back to a wider pool.
5. **Stats scoped to subset**: `renderProgressStats(progressStats, currentEntries)` is called at all 3 relevant sites (lines 262, 275, 295) — verified these are the mutable binding, not the original `options.entries`. `LearnMode.test.ts` has a direct test asserting stats read `2 new`/`0 shaky` on a 2-item subset, not the full 3-entry fixture.
6. **Chip lets user clear filter**: `.filter-chip` click handler calls `options.onClearFilter?.()` only (`LearnMode.ts:122`) — no direct state mutation, matching the "AppShell is sole mediator" design decision. `AppShell.ts:84` wires `onClearFilter` to `handleFilterChange` with a fully-cleared state. Tested directly (`LearnMode.test.ts`: "clicking .filter-chip invokes onClearFilter exactly once with no other direct side effect").
7. **Empty-subset state handled**: `updateFilter([], ...)` in `LearnMode.ts` never calls `drawNextCard` — `renderFromCurrentState()` branches to `showEmptyState()` when `currentEntries.length === 0` (line 286-287), which removes any existing card/mark-row and mounts the shared `createEmptyState(...)` with Learn-Mode-specific copy. Directly tested and confirmed passing.

I did not find a single place where the chain is faked, stubbed, or silently reverts to the full glossary. `git diff --stat` shows a genuinely substantial, non-trivial change footprint (642 insertions / 73 deletions across 10 files), consistent with the claimed scope — this isn't a few cosmetic lines dressed up as a feature.

## Search Query Exclusion — Verified Structurally, Not Just Claimed

This was the most safety-critical explicit requirement, so I checked it at every layer independently (source inspection, not just trusting the test):

- `PersistedFilterState` (`storage.ts:40-43`) is declared as a standalone 2-field interface (`selectedCategories`, `selectedLevel`) — it does **not** extend or derive from `BrowseFilterState`, so `searchQuery` cannot structurally appear on it.
- `writeFilterState` (`storage.ts:102-109`) builds the persisted JSON as an explicit object literal (`{ selectedCategories: state.selectedCategories, selectedLevel: state.selectedLevel }`), not a spread — even if a future caller mistakenly passed a `BrowseFilterState` superset with a `searchQuery` field, it would be silently dropped, not persisted.
- `AppShell.handleFilterChange` (`AppShell.ts:71-74`) independently re-constructs the same 2-field literal at the call site before invoking `writeFilterState` — belt-and-suspenders, not relying solely on the storage layer's discipline.
- On hydration, `AppShell.ts:54` explicitly sets `searchQuery: ''` after spreading `readFilterState()` — so even the in-memory `BrowseFilterState` never carries a stale search string forward across a reload.
- `storage.test.ts` has a structural assertion (not just a round-trip check): `Object.keys(JSON.parse(raw)).sort()` must equal exactly `['selectedCategories', 'selectedLevel']` — this would fail if any extra key leaked in, including `searchQuery`.

Verdict: search text exclusion is real and enforced at three independent points, not just documented as an intention.

## Claims vs. Reality — No Gap Found

I compared work-log.md/implementation-plan.md's narrative against the live code rather than trusting the checkmarks:

- The plan's "3 expected-red tests in Group 3, resolved by Group 5" story is internally consistent and verifiable: `AppShell.ts`'s `handleFilterChange` genuinely does call `learnMode.updateFilter(...)`, which genuinely didn't exist until `LearnMode.ts` was extended — this is normal incremental-build sequencing, not a hidden defect being explained away.
- The claimed "post-completion fix: added the mockup's trailing ✕ glyph" — verified: `formatFilterLabel` (`LearnMode.ts:66`) does append `'  ✕'`, and the mockup HTML does contain `&#10005;` (✕) after two `&nbsp;`. Matches.
- The claimed test counts per file (storage 6, AppShell 12, BrowseGrid 11, LearnMode 11, EmptyState 2 = 42 feature tests; 63 total vitest + 2 build = 65) were independently re-counted by reading the actual test files and re-running the suite — exact match, not just the claimed number trusted at face value.
- `spec-audit.md` (an independent audit already run before implementation) rated the dev spec "pass" with zero Critical/High findings, only two Low-severity documentation-precision nitpicks (neither about correctness) — consistent with what I found in the finished code.
- No evidence of tests being weakened to pass (e.g. no `.skip`, no over-broad `expect(...).toBeTruthy()` standing in for a real assertion in the filter-related tests I read). The reload-simulation, empty-subset, and structural-key-exclusion tests in particular are the kind of test that would actually catch a regression, not merely exercise the happy path once.

## Minor, Non-Blocking Observations (not gaps against the stated requirements)

- `readFilterState()`'s defensive parsing only checks `typeof parsed === 'object'`, one level shallower than the upstream product-design spec's suggested per-field `Array.isArray`/`typeof` validation (already flagged as Low in `spec-audit.md`, Finding 1). A hand-edited malformed `localStorage` value with the right shape but wrong field types (e.g. `selectedCategories: "oops"`) would pass through un-validated and could throw downstream in `applyFilters`. Not a realistic user-facing scenario (the only writer is `writeFilterState` itself), so this is a defensive-depth nit, not a functional gap.
- `storage.test.ts` carries a documented jsdom/Node `localStorage`-shadowing workaround (`beforeAll` re-pointing `window.localStorage`) — flagged by the team itself as a pre-existing environment quirk, out of this feature's scope, not masking a real code issue (confirmed: production code never touches this workaround).
- Chip label rendering uses literal `' '` characters where the mockup uses `&nbsp;&nbsp;` — cosmetically identical in a monospace font, not a functional deviation.

None of these block deployment or contradict the feature's success criteria.

## Confidence Assessment

**High confidence this solves the actual user problem.** The original ask — pick a Browse subset, have it remembered across sessions, have Learn Mode draw only from it, without re-setting up filters daily — is implemented as a real, testable, end-to-end data flow, not a partial or cosmetic implementation. The reload-simulation test in `AppShell.test.ts` is the single strongest piece of evidence: it doesn't just check that a function was called, it constructs a second independent `AppShell` instance against the same `localStorage` and confirms Learn Mode shows the correct subset with zero user interaction — which is exactly the "so I don't have to re-select it every session" requirement from the product brief, verified functionally rather than by inspection alone.

## Deployment Decision: GO

No critical or high-severity gaps found. Recommend proceeding to code review / merge. The two Low-severity items above (shallower validation than upstream suggested; cosmetic nbsp vs space) are optional polish, not blockers.
