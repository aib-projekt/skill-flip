# Specification: Add New Taxonomy Categories & FilterBar Overflow Redesign

## TL;DR
Append 2 new `Category` values (`Software Architecture`, `Microservices & Distributed Systems`) across the 4 hand-mirrored taxonomy locations (3 source + 1 exhaustiveness test), rewrite `BrowseGrid.test.ts`'s ordinal-hardcoded overflow test and add a collapse test, make `FilterBar`'s chip overflow genuinely bidirectional (visible count 5→7, symmetric expand/collapse, `reset()` also collapses), add a permanent "Curating from a Polish source" subsection to `content-pipeline/rubric.md`, and fix stale "12 categories"/"5 visible chips" prose across 7 documentation files plus one in-code comment (`FilterBar.ts:12`) — expanded from 5 to 7 files post-audit to close a self-contradiction and cover locations the original planning chain missed (`verification/spec-audit.md` Findings 1-2). Everything is additive/mechanical against an already-approved, already-prototyped design — no new files, components, or patterns. Entry curation (`data/glossary.json` content) is explicitly out of scope.

## Key Decisions
- Taxonomy edits land in all 4 hand-mirrored locations in one pass — there is no shared source of truth by design (`content-pipeline/validate-glossary.ts`'s own header documents this), so partial application would silently desync the mirrors.
- `FilterBar.ts`'s collapse branch mirrors the existing `if (overflow.length > 0)` expand branch and reuses the same `.chip.more` DOM element (relabeled `"+7 more"` ↔ `"Show less"`), per the approved mockup — no new element, no diffing/pooling introduced.
- `reset()` also sets `showAllCategories = false` (per `analysis/clarifications.md` Q1) — "Clear filters" returns the component fully to its default compact state.
- `BrowseGrid.test.ts` Test B gets a minimal retarget (hardcoded `'Software Engineering'` → `'Microservices & Distributed Systems'` as the new last category), not a programmatic-resolution refactor (per `analysis/clarifications.md` Q2) — matches this task's minimal-implementation scope.
- Scope expanded to include stale "12 categories" prose fixes in `vision.md`, `roadmap.md`, `architecture.md`, and `content-pipeline/source/engineering-ladder.md`, alongside the already-named `rubric.md` fix (per `analysis/scope-clarifications.md`) — all 5 are trivial word-swaps with zero design ambiguity, explicitly named as non-blocking updates in the authoritative `feature-spec.md`.

## Open Questions / Risks
None. `analysis/gap-analysis.md` confirms no critical decisions remain — every in-scope change is fully specified with no design ambiguity. The pre-existing accessibility gap (chips are `<span>` with click listeners, no keyboard access/ARIA state) is a known, codebase-wide, out-of-scope condition the approved mockup deliberately preserves; not addressed by this task.

**Post-audit update**: `verification/spec-audit.md` (pass-with-concerns: 0 Critical/High, 2 Medium, 2 Low) found the original doc-prose sweep (Core Requirement 17) missed 5 stale references, one creating a self-contradiction with this spec's own Success Criteria. User approved expanding the sweep; Core Requirements 17-18 and the Success Criteria were updated accordingly (see inline audit-reference notes). CR15's wording was tightened and CR12's test was extended to close two Low-severity gaps. No re-audit needed — fixes applied verbatim per the auditor's own recommendations.

## Goal
Expand Skill Flip's category taxonomy from 12 to 14 values and fix the FilterBar's one-way overflow chip so users can collapse an expanded category list back down — both changes already designed and approved in the product-design phase; this task implements them.

## User Stories
- As the app's curator/owner, I want the taxonomy to include "Software Architecture" and "Microservices & Distributed Systems" categories so I can later curate and filter my accumulated system-design/microservices study notes alongside the existing 12 categories.
- As a Browse user (owner or portfolio visitor), I want to expand the category chip list to see all categories and then collapse it back down, so the filter bar doesn't stay permanently expanded and cluttered after one click.
- As a Browse user, I want "Clear filters" to also collapse an expanded chip list, so clearing filters returns the whole filter bar to its default compact appearance.

## Core Requirements

1. Append `'Software Architecture'` and `'Microservices & Distributed Systems'`, in that exact order, after `'Software Engineering'`, to the `Category` union in `src/types/glossary.ts`.
2. Append the same 2 values, same order, to `ALL_CATEGORIES` in `src/components/FilterBar.ts`.
3. Append the same 2 values, same order, to `VALID_CATEGORIES` in `content-pipeline/validate-glossary.ts`.
4. Append the same 2 values, same order, to the hardcoded fixture array in `src/types/glossary.test.ts`; bump both count assertions from 12 to 14.
5. Change `VISIBLE_CATEGORY_CHIP_COUNT` in `src/components/FilterBar.ts` from `5` to `7`.
6. Make `showAllCategories` genuinely bidirectional in `renderChips()`: collapsed state shows 7 chips + a `"+7 more"` trailing chip; clicking it expands to all 14 chips and relabels the trailing chip to `"Show less"`; clicking `"Show less"` collapses back to 7 chips and relabels to `"+7 more"`. The same DOM element is reused for both labels (not two separate elements).
7. Category selection state (`state.selectedCategories`) must be unaffected by expand/collapse — a category selected while expanded stays selected and still counts toward the active-filter count even after its chip scrolls back into overflow on collapse.
8. `reset()` in `FilterBar.ts` must also set `showAllCategories = false`, so "Clear filters" fully returns the chip list to its collapsed default.
9. Expand/collapse UI state is not persisted — it always starts collapsed on a fresh `FilterBar` instance (page load), consistent with the existing behavior of not routing this through `BrowseFilterState`/`localStorage`.
10. Rewrite `BrowseGrid.test.ts`'s existing overflow-expansion test (current lines ~163-192): retarget from `'Software Engineering'` (no longer last) to `'Microservices & Distributed Systems'` (the new last category), updating both assertions and explanatory comments ("12th (last)" → "14th (last)", "all 12" → "all 14").
11. Fix the stale count in `BrowseGrid.test.ts`'s adjacent 0-count-chip test (current lines ~144-161): comment referencing "all other 10 taxonomy categories" and "first 5" needs updating to reflect the new totals (12 other categories at 14 total; "Cloud Engineering" is still within the now-7 visible chips).
12. Add a new test to `BrowseGrid.test.ts`'s `'BrowseGrid / FilterBar integration'` block asserting the collapse interaction: expand via `"+7 more"` → select a category chip that's only visible in the expanded state → click the same (now `"Show less"`-labeled) chip → assert the chip set and count return to the original 7-visible/`"+7 more"` state AND that the selected category's chip remains `active` (i.e. still selected) after re-expanding — this closes the traceability gap between the Success Criteria's "selection survives collapse" bullet and an actual automated check (per `verification/spec-audit.md` Finding 4). Follow the existing re-query-after-click convention (chips are destroyed and rebuilt on every click; stale element references must not be reused across clicks).
13. Insert a new "Curating from a Polish source" subsection into `content-pipeline/rubric.md` immediately after the existing Section 3 (`translationPl`/`descriptionPl` scope) and before the current Section 4, renumbering the subsequent sections (4→5, 5→6, 6→7, 7→8). State the discipline: draft the English `description` first, synthesized from understanding the Polish source (not translated word-for-word), then independently translate the finished English text into `descriptionPl`; the rubric's existing anti-transcription check ("would the source bullet's wording be findable inside the description") applies to `descriptionPl` against the Polish source too, not only to `description` against an English source.
14. Fix the stale "12" reference in `rubric.md`'s schema-mechanics section (current line 68, section number shifts to 7 after renumbering) to reflect 14 categories.
15. Update the taxonomy-count doc-comment in `src/types/glossary.ts` (lines 1-8): "12-value taxonomy" → 14. Replace "must still treat all 12 values as first-class" with "must still treat all 14 values as first-class" and soften "carries the full 12-value taxonomy from `Engineering Ladder.md`" to note that 2 values extend beyond the original Engineering Ladder source (per `verification/spec-audit.md` Finding 3 — exact wording, not left to implementer discretion).
16. Update the taxonomy-count comment in `content-pipeline/validate-glossary.ts` (line 19: "Mirrors `Category`... (12-value taxonomy)") to 14.
17. Fix stale "12 categories" prose in documentation files (per `analysis/scope-clarifications.md` and `verification/spec-audit.md` Findings 1-2):
    - `.maister/docs/project/vision.md` (line 5: "12-category 'Engineering Ladder' skills taxonomy")
    - `.maister/docs/project/roadmap.md` (lines 11, 14, 15: "Full 12-category taxonomy coverage", "across all 12 categories", "7 of 12 categories")
    - `.maister/docs/project/architecture.md` (line 49: "159 glossary entries across 12 categories"; **line 19: "the 12-value `Category` union" — required to avoid contradicting this spec's own Success Criteria**; line 30: "category chips (5 visible + expandable overflow)" → update to reflect the new 7-visible + symmetric collapse behavior from Core Requirement 6, not just a number swap)
    - `content-pipeline/source/engineering-ladder.md` (lines 31, 36, 40: "remaining 11 categories" ×2, "full coverage of all 12 categories")
    - `content-pipeline/prompt-template.md` (lines 18, 39: "one of the 12 `Category` enum values", "one of the 12 valid Category values")
    - `README.md` (line 80: "one of 12 fixed categories")

    These are prose/count accuracy fixes only — describe the taxonomy as now having 14 categories (12 original + 2 new). Do not alter entry counts, feature descriptions, or any other content in these files. `architecture.md:30` is the one exception requiring more than a number swap (see above).

18. Fix the stale "12-value category taxonomy" comment directly above `ALL_CATEGORIES` in `src/components/FilterBar.ts:12` (per `verification/spec-audit.md` Finding 2) — update alongside Core Requirement 2's edit to the same file, since it sits immediately above the array being changed.

## Visual Design

`analysis/design-context/INDEX.md` lists one binding mockup: `screen:browse-filterbar` → `analysis/design-context/mockups/browse-filterbar-at-14-categories.html`. This is the authoritative visual/behavioral reference for Core Requirements 5-9 (the FilterBar redesign). It is interactive (real JS toggle), built with the app's actual theme tokens, and was verified programmatically and approved after live browser review during the product-design phase.

Key behavior demonstrated by the mockup, binding for implementation:
- 7 chips visible by default, trailing chip reads `"+7 more"`.
- Clicking the trailing chip reveals all 14 chips (including the 2 new categories, visually flagged in the mockup only for review purposes) and relabels the same trailing chip to `"Show less"`.
- Clicking `"Show less"` collapses back to the 7-visible state and relabels back to `"+7 more"`.
- The 2 new category chips require zero new rendering/badge logic — they flow through the existing generic category-badge slugifier and `renderChips()` loop unchanged.

Note: the mockup's markup uses `<button data-category="...">` elements and a wrapper `<span class="chip-overflow" hidden>` purely for its own standalone demonstration purposes. The actual implementation follows `FilterBar.ts`'s existing, established rendering convention instead (full `innerHTML = ''` teardown-and-rebuild of `<span class="chip">` elements on every state change, per Core Requirement 6) — this is a pre-existing, codebase-wide pattern the mockup does not override; only the collapse *behavior* (symmetric relabeling, state independence) is binding, not the mockup's specific DOM structure.

Fidelity level: behavioral fidelity is binding (exact collapse/expand semantics, exact label text `"+7 more"` / `"Show less"`, exact visible count of 7); DOM/markup fidelity is not (the implementation reuses existing `<span class="chip">` conventions rather than the mockup's `<button>`/`data-category` markup).

## Reusable Components

### Existing Code to Leverage
- **`src/components/FilterBar.ts:100-125` (`renderChips()`)** — the existing full-teardown-and-rebuild render function is extended with a mirrored collapse branch alongside its existing `if (overflow.length > 0)` expand branch; no new rendering mechanism needed.
- **`src/components/FilterBar.ts:127-136` (`toggleCategory()`)** — untouched; category-selection logic is already independent of the visible/overflow split, satisfying Core Requirement 7 with zero changes.
- **Taxonomy literal-list pattern** — identical flat-array, append-only pattern already used at all 4 existing mirror locations (`glossary.ts`, `FilterBar.ts`, `validate-glossary.ts`, `glossary.test.ts`); no new pattern invented.
- **`BrowseGrid.test.ts`'s existing chip query/re-query-after-click convention** (`.chip` + `textContent?.startsWith(...)`, `.chip.more`, `dispatchEvent(new MouseEvent('click', { bubbles: true }))`, mandatory re-query after every click due to full teardown) — the template for the new collapse test (Core Requirement 12) and the retargeted Test B (Core Requirement 10).
- **`src/lib/filters.ts`, `src/lib/storage.ts`, `src/components/LearnMode.ts`** — all consume `Category` via `import type` only; the taxonomy widening flows through structurally with zero changes required in these 3 files.
- **`categoryBadgeClass()` generic slugifier** (referenced by the mockup's annotations, consumed by `Card`/`BrowseGrid` tile rendering) — already generic; the 2 new category badges render correctly with no code change.

### New Components Required
- **Bidirectional collapse branch in `renderChips()`** — genuinely new logic (a mirrored `if (showAllCategories && ALL_CATEGORIES.length > VISIBLE_CATEGORY_CHIP_COUNT)` branch with a `showAllCategories = false; renderChips();` handler). No existing pattern exists anywhere in the codebase to copy from, because the current implementation is write-once by design defect (confirmed via direct read: `overflow` is forced to `[]` once `showAllCategories` is `true`, with zero code path back). This is the one piece of genuinely new implementation work in this task; everything else is either a literal-list append or a doc-prose fix.
- **New collapse-interaction test** (Core Requirement 12) — no existing test asserts a "collapse back" behavior, because the feature doesn't exist yet.

No new files, components, services, or architectural patterns are introduced anywhere in this task.

## Technical Approach

**Taxonomy mechanism (Core Requirements 1-4, 15-16):** The 4 taxonomy locations have no shared source of truth by design — this is documented as intentional in `validate-glossary.ts`'s own header comment, not tech debt to fix here. Each location is edited independently, in the same pass, appending the identical 2 literals in the identical order (`'Software Architecture'`, `'Microservices & Distributed Systems'`) to avoid drift. `src/lib/filters.ts`, `src/lib/storage.ts`, and `src/components/LearnMode.ts` consume `Category` only as a type (`import type`), so the union-widening change requires zero edits there — TypeScript structural typing passes new literal values through automatically.

**FilterBar redesign (Core Requirements 5-9):** `renderChips()` already fully tears down (`catChips.innerHTML = ''`) and rebuilds all chips on every call — this is the established codebase convention (no DOM diffing/pooling anywhere in the component layer) and the collapse addition follows it rather than introducing new rendering machinery. The visible/overflow split (`ALL_CATEGORIES.slice(0, VISIBLE_CATEGORY_CHIP_COUNT)` / `.slice(VISIBLE_CATEGORY_CHIP_COUNT)`) already exists; only the trailing chip's click handler and the count constant change. `toggleCategory()` and `state.selectedCategories` are untouched, which is what already guarantees Core Requirement 7 (selection independent of expand/collapse) without additional work. `reset()`'s `Object.assign(state, defaultState())` call is unrelated to `showAllCategories` (a closure variable outside `state`), so `reset()` needs one explicit added line to also collapse the chip list.

**Test updates (Core Requirements 10-12):** `BrowseGrid.test.ts` is the sole test coverage for `FilterBar` (no standalone `FilterBar.test.ts` exists — `FilterBar` is only ever mounted inside `BrowseGrid` in both production and tests). The 0-count-chip test (Test A) is mechanically robust to the count change and only needs comment-text accuracy fixes. The expansion test (Test B) hardcodes an ordinal assumption (`'Software Engineering'` as last) that becomes false under this exact change and requires retargeting to the new actual-last category, per the resolved clarification. The new collapse test is added to the same `describe` block, following the same query conventions, and should assert: expand → collapse returns to exactly the original 7-visible/`"+7 more"` chip set (guarding against an asymmetric implementation that expands correctly but collapses to the wrong count or leaves the wrong chip labeled).

**Documentation (Core Requirements 13-14, 17):** All doc edits are prose/count-accuracy fixes only — no structural or content changes beyond what's needed to make the stated category count correct. The `rubric.md` insertion is the one substantive documentation addition (a new curation-discipline subsection); its exact content and insertion point are already fully specified in `feature-spec.md` Section 5.2 with no ambiguity.

## Implementation Guidance

### Testing Approach
- 2-8 focused tests per implementation step group, consistent with existing test file conventions (raw DOM APIs, no testing-library, `querySelector`/`dispatchEvent`, mandatory re-query after any click that triggers `innerHTML = ''` re-render).
- Test verification runs only new/modified tests during implementation, not the entire suite; run the full `npm test` (vitest + `test:build`) and `npm run validate-glossary` once at the end as final verification, per `feature-spec.md` Section 3's acceptance criteria.
- Minimum required test changes: `src/types/glossary.test.ts` (1 existing test updated), `src/components/BrowseGrid.test.ts` (1 test updated for comment accuracy, 1 test rewritten/retargeted, 1 new test added for collapse behavior).
- Spot-check (no code change expected, verification only): `content-pipeline/validate-glossary.test.ts` does not hardcode the category list or count beyond the cosmetic comment at line 38 ("outside the 12-value enum") — that comment is cosmetic (the test asserts an invalid category `'Rust'`, which fails regardless of enum size) and is out of this task's named scope; leave it as-is unless trivially bundled with an adjacent named-file edit.
- Smoke-check `AppShell.test.ts` after implementation (no `showAllCategories`/`reset()`-specific coverage exists there) to confirm no incidental breakage, since `AppShell` is an indirect `FilterBar` consumer via `BrowseGrid`.

### Standards Compliance
- **`.maister/docs/standards/global/minimal-implementation.md`**: no new files, components, abstractions, or speculative stubs — every change is either a literal-list append, a mirrored branch in an already-understood function, or a prose fix. The collapse branch has an immediate caller (the trailing chip's click handler) and no speculative "future extensibility."
- **`.maister/docs/standards/global/coding-style.md`**: new literals and the collapse branch follow existing naming/formatting conventions exactly (SCREAMING_SNAKE_CASE constants, camelCase functions, same array-literal style).
- **`.maister/docs/standards/testing/test-writing.md`**: new/updated tests focus on behavior (chip visibility, labels, selection persistence across toggle) not implementation details; test names stay descriptive of what's tested and expected, matching the existing file's naming style.
- **`.maister/docs/standards/frontend/accessibility.md`**: the pre-existing gap (chips as `<span>` with click listeners, no keyboard access, no `aria-expanded` on the toggle) is not addressed by this task — it is a codebase-wide, pre-existing pattern that the approved mockup deliberately preserves for consistency, not a regression introduced here. Flagged in `analysis/gap-analysis.md` as a candidate for a separate `/maister:standards-update` or follow-up task, not this one.
- **`.maister/docs/standards/global/conventions.md`** ("Keep documentation up to date"): the 5-file documentation sweep (Core Requirements 13-17) directly satisfies this — stale taxonomy-count prose is corrected in the same change that causes it to go stale, rather than deferred.

## Out of Scope

- **Entry curation** — writing actual `GlossaryEntry` content into `data/glossary.json` for the 2 new categories (or enriching existing categories) is explicitly deferred to a separate follow-up content-pipeline pass, per the approved product-design brief. The 2 new categories will render as legitimate, already-tested 0-count chips until that follow-up pass runs — this is a pre-approved interim state, not a defect.
- **Cross-source dedup/cross-reference resolution** (`feature-spec.md` Section 2) — content-curation scope, not this dev task.
- **Source-to-category mapping execution** (`feature-spec.md` Section 1.3's per-bullet mapping table) — informs the *future* curation pass; this task only creates the 2 destination categories, it does not perform any mapping/curation.
- **Consolidating the 4 hand-mirrored taxonomy locations into one shared source of truth** — a valid future refactor, explicitly flagged and deliberately deferred in both `codebase-analysis.md` and the product-design brief's non-goals.
- **Accessibility remediation of chip markup** (`<span>` → `<button>`, ARIA state) — pre-existing, codebase-wide condition; not introduced or worsened by this task, not addressed by it either.
- **`content-pipeline/validate-glossary.test.ts:38`'s cosmetic "12-value enum" comment** — not named in the task description's scope; purely cosmetic (test logic is unaffected by enum size).
- **Any hierarchical/nested taxonomy restructuring, per-category color/icon differentiation** — explicit non-goals per `feature-spec.md` Section 6.

## Success Criteria

- `Category` type in `src/types/glossary.ts` includes exactly 14 values, in the specified order, with `'Software Architecture'` and `'Microservices & Distributed Systems'` appended after `'Software Engineering'`.
- All 3 non-test taxonomy copies (`glossary.ts`, `FilterBar.ts`'s `ALL_CATEGORIES`, `validate-glossary.ts`'s `VALID_CATEGORIES`) contain identical 14-value lists in identical order.
- `npm run validate-glossary` passes against the existing `data/glossary.json` (purely additive taxonomy change; existing 159 entries remain valid).
- `npm test` (vitest + `test:build`) passes, including: updated `glossary.test.ts` exhaustiveness assertions (14), retargeted `BrowseGrid.test.ts` expansion test, updated 0-count-chip test comments, and the new collapse-interaction test.
- `tsc -b` type-checks cleanly (additive union widening; no exhaustive `switch` statements exist over `Category` to break, per `codebase-analysis.md`).
- With 14 categories and `VISIBLE_CATEGORY_CHIP_COUNT = 7`: exactly 7 chips visible by default plus one `"+7 more"` trailing chip; clicking it reveals all 14 chips and relabels to `"Show less"`; clicking `"Show less"` re-collapses to 7 visible and relabels back to `"+7 more"`.
- Category selection state survives expand/collapse toggling in both directions (a chip selected while expanded stays selected/counted after collapsing).
- "Clear filters" (`reset()`) collapses an expanded chip list back to the compact 7-visible state.
- Expand/collapse UI state resets to collapsed on a fresh page load (not persisted).
- `content-pipeline/rubric.md` contains a permanent "Curating from a Polish source" subsection positioned after the `translationPl`/`descriptionPl` scope section, with subsequent sections correctly renumbered and no broken internal references.
- Zero remaining "12 categories" / "12-value" / "remaining 11 categories" / "5 visible" stale-count prose in `glossary.ts`, `validate-glossary.ts`, `rubric.md`, `vision.md`, `roadmap.md`, `architecture.md`, `engineering-ladder.md`, `FilterBar.ts`, `prompt-template.md`, or `README.md` (expanded per `verification/spec-audit.md` Findings 1-2 — every location in this list is named by an explicit Core Requirement, so this bullet is exhaustively covered rather than aspirational).
