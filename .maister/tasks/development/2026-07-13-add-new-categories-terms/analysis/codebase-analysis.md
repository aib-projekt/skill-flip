# Codebase Analysis Report

**Date**: 2026-07-13
**Task**: Add 2 new categories to the taxonomy, redesign FilterBar overflow into bidirectional expand/collapse, add a Polish-source curation subsection to the rubric
**Description**: Implement the approved product-design brief: add 2 new categories ('Software Architecture', 'Microservices & Distributed Systems') to the Category taxonomy across 3 hand-synced code locations plus 2 test files, redesign FilterBar's chip overflow UX to add genuine bidirectional expand/collapse, and add a permanent "Curating from a Polish source" subsection to content-pipeline/rubric.md. Entry curation (writing actual glossary.json content) is explicitly out of scope for this development task.
**Analyzer**: codebase-analyzer skill (2 Explore agents: File Discovery + Code Analysis, Context Discovery)

---

## TL;DR

The taxonomy is hand-mirrored across 4 independent source-of-truth-free locations (no shared constant), all currently at 12 values, all confirmed still in sync as of this analysis. `FilterBar.ts`'s overflow chip is a one-way `showAllCategories` boolean with no collapse path anywhere in the codebase to copy from — the bidirectional toggle is new logic, though it fits cleanly into the existing tear-down-and-rebuild `renderChips()` pattern. One existing test (`BrowseGrid.test.ts` lines 163-192) hardcodes "Software Engineering" as the last/12th category and **will break**, not just need count updates, once the 2 new categories are appended after it per the approved brief. `rubric.md`'s Section 6 also contains a stale "12" reference that needs a wording pass. All edits are small, mechanical, and low-risk; the only genuinely new implementation work is the collapse-chip UX.

## Key Decisions

- Extend the existing `if (overflow.length > 0)` branch pattern in `FilterBar.ts` with a mirrored `if (showAllCategories && ...)` collapse branch, rather than introducing chip diffing/pooling — `renderChips()` already fully tears down (`innerHTML = ''`) and rebuilds on every call, so no reuse mechanism needs to be built.
- Rewrite (not just relax) `BrowseGrid.test.ts`'s second overflow test (lines 163-192): it hardcodes `'Software Engineering'` as "the 12th (last)" category; since the brief appends both new categories after it, this premise becomes false and the test would fail against correct new behavior unless rewritten to target the actual new last category (`'Microservices & Distributed Systems'`) or resolved programmatically from the categories array.
- Treat the 4 taxonomy locations (`glossary.ts`, `glossary.test.ts`, `FilterBar.ts`, `validate-glossary.ts`) as independent hand-edits — there is no shared constant/import to update once and propagate; each must be edited separately and will silently drift if one is missed (this is the existing, intentional design per `validate-glossary.ts`'s header comment, not a defect to fix in this task).

## Open Questions / Risks

- `rubric.md` Section 6 (line 68) says category "is exactly one of the **12** `Category` values" — this prose goes stale the moment the taxonomy grows to 14 and should be updated in the same change, even though it's outside the rubric's new subsection scope.
- `BrowseGrid.test.ts`'s first overflow test (line 147-149 comment) hardcodes "all other **10** taxonomy categories" (12 total − 2 fixture categories) — this comment goes stale (10 → 12) but the test's actual assertions are robust to the count change and won't fail mechanically; still worth a pass for accuracy.
- No existing bidirectional expand/collapse UI pattern exists anywhere in the codebase to copy from — this is genuinely new interaction logic, not a refactor of an existing pattern, so it carries slightly more implementation risk than the mechanical taxonomy edits despite being scoped to one file.

---

## Summary

This is a small, well-bounded change touching 4 taxonomy-defining locations, 2 test files, one component's overflow UX, and one documentation file. The taxonomy has no single source of truth by design (confirmed via `validate-glossary.ts`'s own header comment, which explicitly documents itself as a hand-mirrored, zero-dependency duplicate of `src/types/glossary.ts`), so this task's "3 code locations + 2 test files" scope is exactly the full set of places the taxonomy is encoded. The FilterBar redesign is additive new logic with no precedent pattern to reuse, built on top of a codebase convention (full re-render via `innerHTML = ''`) that makes the addition straightforward. The main landmine is a test that hardcodes a category's ordinal position and will need a genuine rewrite rather than a mechanical count bump.

---

## Files Identified

### Primary Files

**src/types/glossary.ts** (41 lines)
- Defines the canonical `Category` union type (lines 10-22, 12 literal members) and the `GlossaryEntry`/`Glossary` shapes that consume it.
- The doc comment (lines 1-8) explicitly frames the taxonomy as fixed ("carries the full 12-value taxonomy... Filtering and chip-rendering logic must still treat all 12 values as first-class") — this comment's "12" needs updating to reflect the new count, and its framing should be checked against whether it should still describe the taxonomy as sourced from `Engineering Ladder.md` once non-ladder categories are added.
- This is the TypeScript compile-time source of truth; the other 3 locations are runtime/tooling mirrors of it.

**src/components/FilterBar.ts** (186 lines)
- `ALL_CATEGORIES` runtime array (lines 13-26) — the runtime mirror of `Category` used to drive chip rendering and per-category counts.
- `VISIBLE_CATEGORY_CHIP_COUNT = 5` (line 31) — chips beyond this count collapse into overflow.
- `showAllCategories` (line 63) — a write-once boolean (`false → true` only, at line 120 inside the overflow chip's click handler); no code path ever resets it to `false`. This is the exact defect the "genuine bidirectional expand/collapse" requirement targets.
- `renderChips()` (lines 100-125) — the function to modify. It opens with `catChips.innerHTML = ''` (full DOM teardown, not diffing), computes `visible`/`overflow` splits (lines 103-104: `overflow` is forced to `[]` whenever `showAllCategories` is `true`, with no way back), and only ever builds an "expand" affordance (lines 115-124, `if (overflow.length > 0)`) — never a "collapse" one.
- Owns only its own DOM + `BrowseFilterState`; `applyFilters` itself lives in `src/lib/filters.ts`.

**content-pipeline/validate-glossary.ts** (163 lines)
- `VALID_CATEGORIES` (lines 20-33, `as const` array) — the standalone content-pipeline mirror of `Category`, used at line 87 to validate each glossary entry's `category` field.
- File header (lines 1-14) explicitly documents this decoupling as intentional: "does not import anything from `src/types/glossary.ts`... but it mirrors that file's... shapes by hand. If the canonical types... change, update the constants below to match." This is a confirmed, deliberate design choice, not tech debt to fix as part of this task.
- Run via `npm run validate-glossary` (Node native, `--experimental-strip-types`), not part of the Vitest suite.

**content-pipeline/rubric.md** (82 lines)
- Curation quality-bar document with 7 numbered `##` sections plus a header.
- Section 3, "`translationPl` and `descriptionPl` cover the right scope" (lines 31-42), is the existing bilingual/translation guidance most adjacent to the new subsection's concern (it defines the normal EN-primary → PL-translation direction that the Polish-source case inverts).
- Section 6, "Schema mechanics" (lines 65-75), line 68 states category "is exactly one of the 12 `Category` values in `src/types/glossary.ts`" — this line's "12" is stale prose once categories are added and should be corrected in the same change (not a functional edit, just accuracy).
- Insertion point for the new subsection: immediately after Section 3 ends (line 42) and before Section 4 (currently starts line 44), as a new "## 4. Curating from a Polish source," renumbering the current Sections 4-7 to 5-8.

### Related Files

**src/types/glossary.test.ts** (83 lines)
- Lines 60-82: `'Category enum includes exactly the 12 taxonomy values...'` test — a hardcoded 12-item literal array (lines 61-74) asserted via `expect(categories).toHaveLength(12)` and a `Set`-based uniqueness check (`expect(new Set(categories).size).toBe(12)`, line 77). Both the array contents and the `12` literal (→14) need updating. Order doesn't matter here (pure count/uniqueness check), unlike the BrowseGrid overflow test below.

**src/components/BrowseGrid.test.ts** (304 lines total; relevant block lines 144-192)
- No dedicated `FilterBar.test.ts` exists (confirmed absent via directory listing and repo-wide search) — all FilterBar chip/overflow behavior is tested indirectly here, under a `describe('BrowseGrid / FilterBar integration', ...)` block, because `FilterBar` is only ever mounted inside `BrowseGrid` in tests.
- **Test A** (lines 144-161, "renders a 0-count chip... Group 9 gap"): asserts "Cloud Engineering" (index 4, within the first 5 visible chips) renders at count 0, and that a `.chip.more` overflow chip exists matching `/^\+\d+ more$/`. Robust to the count change mechanically; only its comment ("all other 10 taxonomy categories") goes stale to "12".
- **Test B** (lines 163-192, "clicking the '+N more'... reveals... last category"): hardcodes `'Software Engineering'` as "the 12th (last) taxonomy category." Per the approved brief, both new categories are appended *after* `'Software Engineering'` in `ALL_CATEGORIES`, so `'Software Engineering'` will no longer be last/collapsed-and-then-first-to-appear in the same way this test currently asserts — **this test requires an actual rewrite** (retarget to `'Microservices & Distributed Systems'` as the new last category, or resolve the target category programmatically from the array) rather than a mechanical count bump.

**src/components/AppShell.test.ts** (338 lines)
- References FilterBar behavior at a higher integration level (persistence/cross-tab sync) — no isolated FilterBar unit coverage, but confirms FilterBar state changes propagate through `AppShell`. Likely unaffected by the taxonomy/overflow changes but worth a smoke-check after implementation since it is a `FilterBar` consumer.

**content-pipeline/validate-glossary.test.ts** (84 lines)
- Not detailed in the raw findings beyond size; tests `validateGlossary()` from `validate-glossary.ts`. Given `VALID_CATEGORIES` changes, worth a quick check that this file doesn't also hardcode the taxonomy list or count (not confirmed either way — flagged as a gap below).

---

## Current Functionality

### Taxonomy encoding (4 independent hand-mirrors, by design)

There is no single source of truth for the category taxonomy — this is confirmed as an intentional, documented design choice (see `validate-glossary.ts` header, lines 1-14), not an oversight. The 12 values are currently hand-duplicated, in the same order, in:

1. `src/types/glossary.ts:10-22` — the `Category` TypeScript union (compile-time authority)
2. `src/types/glossary.test.ts:61-74` — hardcoded array in an exhaustiveness test
3. `src/components/FilterBar.ts:13-26` — `ALL_CATEGORIES` runtime array (drives chip rendering)
4. `content-pipeline/validate-glossary.ts:20-33` — `VALID_CATEGORIES` (drives content-pipeline JSON validation, standalone Node tool, deliberately zero-dependency on `src/`)

All 4 were re-verified at current HEAD and are in sync (all list the same 12 values in the same order, ending in `'Software Engineering'`). `git status` confirms none of the 4 files (nor `rubric.md`) have pending changes — the working tree's only modifications are unrelated task-metadata files (`.maister/tasks/dna-mapa.md`, `.maister/tasks/system design.md`, a rename of `microservice-architecture.md`).

### FilterBar overflow chip (current one-way behavior)

`renderChips()` (`FilterBar.ts:100-125`) splits `ALL_CATEGORIES` into `visible` (first `VISIBLE_CATEGORY_CHIP_COUNT = 5`, or all of them once expanded) and `overflow` (the rest, or none once expanded), per lines 103-104:

```ts
const visible = showAllCategories ? ALL_CATEGORIES : ALL_CATEGORIES.slice(0, VISIBLE_CATEGORY_CHIP_COUNT);
const overflow = showAllCategories ? [] : ALL_CATEGORIES.slice(VISIBLE_CATEGORY_CHIP_COUNT);
```

The overflow ("+N more") chip is only ever created (lines 115-124) when `overflow.length > 0`; its click handler is a one-way flip: `showAllCategories = true; renderChips();` (lines 119-121). Because `overflow` is forced to `[]` once `showAllCategories` is `true`, there is no code path — anywhere in the component — that can set it back to `false`, so once expanded, a filter bar with more than 5 categories stays expanded for the rest of its lifecycle (until the whole `FilterBar` instance is recreated, e.g. via `reset()`, which calls `Object.assign(state, defaultState())` but does **not** touch `showAllCategories` at all — `reset()` at lines 166-176 leaves `showAllCategories` untouched, so even "Clear filters" doesn't collapse it back).

Every render fully tears down the chip container (`catChips.innerHTML = ''`, line 101) and rebuilds all chips with fresh event-listener closures — there is no element reuse/diffing to preserve across the fix.

### Data Flow

`FilterBar` is constructed by `BrowseGrid.ts` (its only production mount point) with the full `Glossary` dataset; `categoryCounts()` (lines 92-98) computes live per-category counts from `options.entries` on every `renderChips()` call. Chip clicks call `toggleCategory()` (lines 127-136), which mutates `state.selectedCategories`, re-renders chips, and fires `options.onChange({ ...state })` — consumed upstream by `BrowseGrid` to re-filter the grid via `applyFilters` in `src/lib/filters.ts`. `Category` as a type also flows into `src/lib/storage.ts` (persisted filter state, line 41) and `src/components/LearnMode.ts` (line 36, category-scoped learn-mode selection) — both via `import type`, so a taxonomy value addition requires no code changes there, only literal-list changes at the 4 mirror locations.

### Key Components/Functions

- **`Category` (glossary.ts:10-22)**: canonical TypeScript union type, compile-time taxonomy authority.
- **`ALL_CATEGORIES` (FilterBar.ts:13-26)**: runtime array driving chip render order and counts.
- **`renderChips()` (FilterBar.ts:100-125)**: builds visible + overflow chip DOM; target of the bidirectional-toggle change.
- **`showAllCategories` (FilterBar.ts:63)**: the one-way expand flag to be made bidirectional.
- **`VALID_CATEGORIES` (validate-glossary.ts:20-33)**: content-pipeline JSON schema validation list.

---

## Dependencies

### Imports (What Category/FilterBar Depend On / Are Depended On By)

- `src/lib/filters.ts` imports `Category` (`import type { Category, Glossary, Level } from '../types/glossary'`, line 8) — `BrowseFilterState.selectedCategories: Category[]` (line 14).
- `src/lib/storage.ts` imports `Category` (line 14) — same shape, persisted filter state (line 41).
- `src/components/LearnMode.ts` imports `Category` (line 8) — `selectedCategories: Category[]` (line 36), category-scoped Learn Mode filtering.
- `src/components/FilterBar.ts` imports `Category` from `../types/glossary` (line 2) and `BrowseFilterState` from `../lib/filters` (line 1).

### Consumers (What Depends On FilterBar / Category)

- **`src/components/BrowseGrid.ts`**: mounts `FilterBar` (its only production integration point), consumes `onChange` to re-filter the grid.
- **`src/components/AppShell.ts`**: consumes FilterBar behavior indirectly through `BrowseGrid`, for persistence/cross-tab filter-state sync (tested in `AppShell.test.ts`).
- **`src/lib/filters.ts`, `src/lib/storage.ts`, `src/components/LearnMode.ts`**: all type-only consumers of `Category` (no code changes required for a taxonomy addition — new literal values pass through structurally).

**Consumer Count**: ~5 files reference `Category` as a type; 1 production mount point for `FilterBar` (`BrowseGrid.ts`), with 1 additional indirect integration consumer (`AppShell.ts`).
**Impact Scope**: Low-Medium — the taxonomy addition is purely additive at the type level (no consumer needs code changes, only the 4 hand-mirrored literal lists), and the FilterBar redesign is scoped to one file/one function. The risk is concentrated in test correctness (ordinal hardcoding), not in runtime consumer breakage.

---

## Test Coverage

### Test Files

- **`src/types/glossary.test.ts`** (lines 60-82): taxonomy exhaustiveness (count + uniqueness) — needs literal-array and count update (12→14).
- **`src/components/BrowseGrid.test.ts`** (lines 144-192): FilterBar overflow-chip behavior, tested via `BrowseGrid` integration (no standalone `FilterBar.test.ts` exists). Test A (0-count/overflow-chip-exists) is mechanically robust; Test B (expand reveals last category) hardcodes `'Software Engineering'` as last and requires a genuine rewrite, not just a number bump.
- **`src/components/AppShell.test.ts`**: higher-level FilterBar integration (persistence/cross-tab), not enumerated in detail by the raw findings — likely unaffected but should be smoke-checked.
- **`content-pipeline/validate-glossary.test.ts`** (84 lines): tests `validateGlossary()`; not confirmed whether it hardcodes the category list — flagged as a coverage gap below.

### Coverage Assessment

- **Test count**: at minimum 3 relevant `it()` blocks confirmed in detail (1 in `glossary.test.ts`, 2 in `BrowseGrid.test.ts`), plus unconfirmed coverage in `validate-glossary.test.ts` and `AppShell.test.ts`.
- **Gaps**:
  - No dedicated `FilterBar.test.ts` — all coverage is indirect via `BrowseGrid.test.ts`, which is a pre-existing condition, not something this task needs to fix, but it does mean the new collapse behavior's most natural test home is a third `it()` in the same `describe('BrowseGrid / FilterBar integration', ...)` block, following the existing query/re-query-after-click convention.
  - No existing test asserts a "collapse back" behavior anywhere (expected — the feature doesn't exist yet).
  - `content-pipeline/validate-glossary.test.ts` content not verified in this analysis pass — worth a quick check before editing `VALID_CATEGORIES` to confirm it doesn't also hardcode category literals.

### Test Conventions (for writing the new collapse test)

No testing-library, no `fireEvent`. Raw DOM APIs throughout: `querySelector`/`querySelectorAll` + `element.dispatchEvent(new MouseEvent('click', { bubbles: true }))` (chips/buttons) or `new Event('input', { bubbles: true })` (search input). Category chips are located via `.chip` class + `textContent?.startsWith(categoryName)` (text format is `"${category} (${count})"`); the overflow chip via `.chip.more`. A recurring, explicitly-commented gotcha: because every chip click triggers a full `innerHTML = ''` re-render, **tests must re-query the chip element after every click** rather than reuse the pre-click `HTMLElement` reference (stale-node trap) — this convention will apply directly to any new collapse-chip test.

Test runner: `npm test` → `vitest run` (single-shot) then `npm run test:build` (separate Node-native test). `npm run test:watch` → `vitest` watch mode. Vitest config (`vite.config.ts:48-52`): `environment: 'jsdom'`, `include: ['src/**/*.test.ts']`. Single-file run: `npx vitest run src/components/BrowseGrid.test.ts`. `content-pipeline/validate-glossary.test.ts` and `scripts/verify-build.test.ts` are deliberately outside Vitest's include glob, run via Node's native `--experimental-strip-types --test` instead.

---

## Coding Patterns

### Naming Conventions

- **Types**: PascalCase (`Category`, `GlossaryEntry`, `Level`).
- **Constants**: SCREAMING_SNAKE_CASE for module-level fixed arrays/values (`ALL_CATEGORIES`, `VALID_CATEGORIES`, `VISIBLE_CATEGORY_CHIP_COUNT`, `SEARCH_DEBOUNCE_MS`).
- **Functions**: camelCase, verb-first (`renderChips`, `toggleCategory`, `categoryCounts`, `defaultState`).
- **Files**: PascalCase for components (`FilterBar.ts`), camelCase for lib modules (`filters.ts`, `storage.ts`).

### Architecture Patterns

- **Style**: Component-factory pattern, no framework — `createFilterBar(options)` returns a plain object (`FilterBarInstance`) exposing `element`, `getState`, `reset`, `setSearchValue`, `destroy`. DOM-owning components live in `src/components/`; pure logic in `src/lib/`.
- **Rendering**: Full teardown-and-rebuild on state change (`innerHTML = ''` then re-append), not incremental DOM diffing — this is the established convention `renderChips()` already follows and the collapse addition should follow too.
- **State management**: Local, closure-captured mutable state (`state`, `showAllCategories`, `debounceTimer`) inside the factory function; no external store.

---

## Complexity Assessment

| Factor | Value | Level |
|--------|-------|-------|
| File Size (largest touched file) | 186 lines (`FilterBar.ts`) | Low |
| Files touched (taxonomy + overflow + rubric) | 3 code files + 2 test files + 1 doc = 6 | Medium |
| Dependencies (Category type consumers) | ~5 files (type-only, no changes needed) | Low |
| Test coverage of touched behavior | Direct coverage exists but 1 test needs rewrite, not just update | Medium |

### Overall: Simple-to-Moderate

The taxonomy addition itself is simple (4 mechanical literal-list edits with no shared source of truth to worry about breaking). The FilterBar redesign is a small, contained addition (new state-mutation branch in one function) but is genuinely new logic with no existing pattern to copy, and it has a downstream test that requires an actual rewrite (ordinal hardcoding), which is the one piece of hidden complexity in an otherwise low-risk task.

---

## Key Findings

### Strengths
- The taxonomy's hand-mirrored design, while lacking a single source of truth, is explicitly documented as intentional (`validate-glossary.ts` header) — so this task's "3 code locations + 2 test files" scope is the complete, known set; there's no risk of missing an undocumented 5th location.
- `renderChips()`'s existing full-teardown-and-rebuild pattern means adding a collapse branch is additive (a mirrored `if` branch), not a structural rewrite — no DOM diffing/pooling needs to be introduced.
- Test conventions are consistent and well-commented (the stale-node re-query gotcha is explicitly called out in existing tests), making it straightforward to write a correctly-structured new collapse test.

### Concerns
- `BrowseGrid.test.ts`'s Test B (lines 163-192) hardcodes `'Software Engineering'` as "the 12th (last)" category by name — this is a fragile pattern (ordinal/positional assumption baked into a string literal) that breaks under the exact kind of change this task makes. Consider resolving the target category programmatically (`ALL_CATEGORIES[ALL_CATEGORIES.length - 1]`-equivalent, or exporting `ALL_CATEGORIES` for test import) to prevent recurrence next time the taxonomy grows.
- `reset()` in `FilterBar.ts` (lines 166-176) does not reset `showAllCategories` — worth deciding, as part of the collapse-UX design, whether "Clear filters" should also re-collapse the chip list (currently it silently doesn't touch the expand state at all).
- No taxonomy source of truth means every future addition repeats this same 4-location hand-edit risk — out of scope to fix here, but worth flagging as a standards/architecture observation for the team.

### Opportunities
- Since a collapse affordance is being added, this is also a natural point to decide whether the collapse chip reuses the same `.chip.more` element/class (toggling label between "+N more" / "Show less") or introduces a new distinct class — worth confirming against the approved product-design brief/mockups before implementing.

---

## Impact Assessment

- **Primary changes**:
  - `src/types/glossary.ts` (lines 10-22, plus doc comment lines 1-8) — add 2 `Category` literals, update "12" references.
  - `src/components/FilterBar.ts` (lines 13-26 `ALL_CATEGORIES`; lines 63, 100-125, 166-176 for the bidirectional toggle logic).
  - `content-pipeline/validate-glossary.ts` (lines 20-33 `VALID_CATEGORIES`).
  - `content-pipeline/rubric.md` (new section after line 42; renumber current Sections 4-7 to 5-8; fix stale "12" at line 68).
- **Related changes**:
  - `src/types/glossary.test.ts` (lines 60-82) — update literal array + count.
  - `src/components/BrowseGrid.test.ts` (lines 144-192) — Test A: minor comment fix; Test B: genuine rewrite (retarget from `'Software Engineering'` to the new last category or resolve programmatically).
- **Test updates**: new `it()` for collapse behavior, most naturally added to `BrowseGrid.test.ts`'s `'BrowseGrid / FilterBar integration'` block, following existing query/re-query-after-click conventions. Recommend also verifying `content-pipeline/validate-glossary.test.ts` doesn't hardcode categories, and smoke-checking `AppShell.test.ts` after the change.

### Risk Level: Low-Medium

Low because: no shared source of truth to accidentally break structurally, all consumers of `Category` are type-only (no runtime code changes needed), and the redesign is additive to an existing, well-understood render function. Medium because: one existing test's premise (ordinal hardcoding) becomes actively false under this exact change and must be caught and rewritten rather than mechanically bumped — missing this would produce a false-negative test failure that looks unrelated to the taxonomy change at first glance.

---

## Recommendations

**Modifying existing code / additive feature — implementation strategy:**

1. **Taxonomy addition** (mechanical, do first, all 4 locations in one pass to avoid drift):
   - `src/types/glossary.ts`: append the 2 new `Category` literals after `'Software Engineering'` (per the approved brief's ordering); update the doc-comment's "12" → "14" and reconsider whether "carries the full 12-value taxonomy from `Engineering Ladder.md`" still reads correctly once non-ladder categories exist.
   - `src/components/FilterBar.ts`: append the same 2 literals to `ALL_CATEGORIES` in the same order.
   - `content-pipeline/validate-glossary.ts`: append the same 2 literals to `VALID_CATEGORIES`, same order.
   - `src/types/glossary.test.ts`: append the 2 literals to the test's array, bump `toHaveLength(12)` → `toHaveLength(14)` and `.toBe(12)` → `.toBe(14)`.
   - Cross-check all 4 lists list the 2 new names with byte-identical spelling/casing ('Software Architecture', 'Microservices & Distributed Systems') — a mismatch here (e.g. an em-dash vs. ampersand) would pass TypeScript but fail `validate-glossary` silently until content is curated.

2. **`BrowseGrid.test.ts` Test B rewrite**: replace the hardcoded `'Software Engineering'` references (lines 166-190) with the new actual-last category, `'Microservices & Distributed Systems'`, updating both the assertions and the explanatory comments ("12th (last)" → "14th (last)"). Consider whether to also add an assertion that `'Software Engineering'` (now not-last) still renders correctly post-expansion, to guard against an off-by-one in the new taxonomy ordering.

3. **FilterBar bidirectional collapse** (`renderChips()`, lines 100-125):
   - Mirror the existing `if (overflow.length > 0)` expand-chip branch with a collapse branch, e.g. `if (showAllCategories && ALL_CATEGORIES.length > VISIBLE_CATEGORY_CHIP_COUNT)`, whose click handler sets `showAllCategories = false; renderChips();`.
   - Decide (per the approved product-design brief/mockups) whether this reuses the `.chip.more` element with a toggled label ("+N more" ↔ "Show less") or is a visually distinct new chip — check the brief before implementing since this affects both markup and the CSS class the new test will query.
   - Decide whether `reset()` (lines 166-176) should also collapse `showAllCategories` back to `false` — currently it doesn't touch this flag at all, which will become more noticeable once collapse exists as a concept.
   - Add a new `it()` in `BrowseGrid.test.ts`'s FilterBar-integration block asserting: expand → collapse → the collapsed state's chip set matches the original pre-expand state, following the existing re-query-after-click convention.

4. **`content-pipeline/rubric.md`**: insert new `## 4. Curating from a Polish source` immediately after line 42 (end of Section 3), renumber existing Sections 4→5, 5→6, 6→7, 7→8. Per the approved brief, state explicitly that the curator must draft an independent English `description` first even when the source bullet is already in Polish (not translate the Polish source directly into `descriptionPl`), then translate that English draft into `descriptionPl` per the normal Section 3 (now Section 3, unchanged position) rule. Also fix the now-renumbered Section 6/7's stale "12" reference at (old) line 68 to reflect the new count.

5. **Verification**: run `npm test` (covers `vitest run` + `test:build`) and `npm run validate-glossary` after all edits — the latter will currently fail or be a no-op against `data/glossary.json` since entry curation is out of scope, so confirm expected behavior (it validates existing entries against the new, larger `VALID_CATEGORIES` list; existing entries should still pass since the change is purely additive).

---

## Next Steps

Proceed to gap analysis to confirm this current-state picture against the approved product-design brief's exact requirements (exact category name spellings/ordering, the collapse-chip's intended visual/interaction spec, and the rubric subsection's exact required content) before moving into specification/planning.
