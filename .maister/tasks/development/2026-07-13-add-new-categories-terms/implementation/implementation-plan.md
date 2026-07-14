# Implementation Plan: Add New Taxonomy Categories & FilterBar Overflow Redesign

## TL;DR
4 task groups, organized by concern rather than by layer/specialty (this is a single-repo, low-risk, mechanical change with no new files or components). Group 1 (Taxonomy Mechanism) lands first; Group 2 (FilterBar UX + its BrowseGrid tests) depends on it; Group 3 (Documentation Sweep) is fully independent and can run in parallel with 1-2; Group 4 (Test Review & Gap Analysis) depends on all three and closes one coverage gap the spec's Core Requirements leave untested. 30 steps total, 5 tests total (4 spec-minimum + 1 planner-added gap fix).

## Key Decisions
- Task groups organized by concern, not role/specialty (Taxonomy Mechanism / FilterBar UX / Documentation Sweep / Test Review), per the low-risk single-repo scope — a database/API/frontend split would be artificial here.
- Group 3 (Documentation Sweep) declared with **no dependency** on Groups 1-2: all 7 files it touches are prose-only, every replacement is either a literal number swap or (for `architecture.md:30`) fully specified by the spec's own CR6 description — nothing in Group 3 requires reading Groups 1-2's actual landed code. It shares no files with Groups 1-2, so it is safe to execute concurrently with them.
- `FilterBar.ts` is edited in both Group 1 (taxonomy literals + line-12 comment) and Group 2 (chip-count constant, `renderChips()`, `reset()`) — declared in both groups' Files to Modify per the executor-scheduling contract, and Group 2 depends on Group 1 anyway (its rewritten test targets `'Microservices & Distributed Systems'`, which must exist first).
- `BrowseGrid.test.ts`'s taxonomy-count-driven and FilterBar-visible-count-driven test edits (Test A comment fix, Test B rewrite, new collapse test) are kept together in **one group (Group 2)**, per the spec's Technical Approach — splitting them across groups would leave an intermediate broken-test state.
- Group 1's direct test footprint is intentionally 1 test (not padded to the 2-8 range): it is a mechanical literal-list/comment update with exactly one direct unit-test touchpoint (`glossary.test.ts`'s exhaustiveness test); broader correctness is verified via non-unit-test checks (`tsc -b`, `npm run validate-glossary`) rather than manufacturing synthetic tests, per `.maister/docs/standards/global/minimal-implementation.md`.
- Group 4 adds **1 test beyond the spec's named minimum**: the Success Criteria bullet "'Clear filters' (`reset()`) collapses an expanded chip list back to the compact 7-visible state" (Core Requirement 8) has no CR10-12-assigned automated check — none of the 3 FilterBar/BrowseGrid tests added in Group 2 expand the chip list and then call `reset()`. This is the same shape of traceability gap `verification/spec-audit.md` Finding 4 already caught (and the spec fixed) for "selection survives collapse" — this one slipped through the same audit. Closing it in Group 4 (the designated gap-analysis group, budget: up to 10 additional tests) rather than folding it into Group 2 keeps Group 2's test list matching the spec's explicit "minimum required test changes" 1:1, and makes the gap-closing addition traceable as a planner decision, not silent scope creep.
- Group 4's final verification step re-greps all 10 files named in the spec's Success Criteria "zero remaining stale-count prose" bullet (not just Group 3's 7 doc files) — this is the only point in the plan where all taxonomy-count and doc-prose edits have landed simultaneously, so it's the correct place for the exhaustive cross-file check.

## Open Questions / Risks
- Shared-file contention: `FilterBar.ts` (Groups 1→2) and `BrowseGrid.test.ts` (Groups 2→4) must be edited in dependency order, not concurrently, despite the overall low risk level — the executor should not parallelize these two pairs even if it parallelizes Group 3 against Groups 1-2.
- Core Requirement 15's "drop/soften" instruction for `glossary.ts`'s doc-comment (lines 1-8) intentionally has no exact target text (per `verification/spec-audit.md` Finding 3, Low severity, no Success Criterion checks the qualitative wording) — Group 1 step 1.2 gives the implementer discretion here by design; do not treat the lack of exact wording as a plan gap.
- The reset()-collapse test added in Group 4 (see Key Decisions) is planner-sourced, not spec-CR-sourced — flagged here so it isn't mistaken for scope creep; it directly closes an existing, already-approved Success Criteria bullet (Core Requirement 8 / spec.md Success Criteria).

## Overview
Total Steps: 30
Task Groups: 4
Expected Tests: 5 (1 in `src/types/glossary.test.ts`, 4 in `src/components/BrowseGrid.test.ts`)

## Implementation Steps

### Task Group 1: Taxonomy Mechanism
**Dependencies:** None
**Files to Modify:** `src/types/glossary.ts`, `src/components/FilterBar.ts`, `content-pipeline/validate-glossary.ts`, `src/types/glossary.test.ts`
**Estimated Steps:** 6

- [x] 1.0 Complete the taxonomy addition across all 4 hand-mirrored locations in one pass
  - [x] 1.1 Update `src/types/glossary.test.ts`'s exhaustiveness test first (TDD): append `'Software Architecture'` and `'Microservices & Distributed Systems'`, in that order, after `'Software Engineering'` in the hardcoded fixture array (lines ~61-74); bump `expect(categories).toHaveLength(12)` → `14` and `expect(new Set(categories).size).toBe(12)` → `14` (Core Requirement 4). This test will fail against the current 12-value `Category` type until step 1.2 lands.
  - [x] 1.2 Append the same 2 literals, same order, to the `Category` union in `src/types/glossary.ts` (lines 10-22) (Core Requirement 1). Update the doc-comment (lines 1-8, Core Requirement 15): "12-value taxonomy" → "14-value taxonomy"; "must still treat all 12 values as first-class" → "all 14 values"; soften "carries the full 12-value taxonomy from `Engineering Ladder.md`" to note 2 values extend beyond the original Engineering Ladder source. Exact phrasing is implementer discretion (spec-audit Finding 3, Low) — no Success Criterion checks the wording, only the "14" count.
  - [x] 1.3 Append the same 2 literals, same order, to `ALL_CATEGORIES` in `src/components/FilterBar.ts` (lines 13-26) (Core Requirement 2). Fix the stale comment directly above it at line 12 — "Full 12-value category taxonomy" → "Full 14-value category taxonomy" (Core Requirement 18).
  - [x] 1.4 Append the same 2 literals, same order, to `VALID_CATEGORIES` in `content-pipeline/validate-glossary.ts` (lines 20-33) (Core Requirement 3). Fix the comment at line 19 — "Mirrors `Category`... (12-value taxonomy)" → "14-value taxonomy" (Core Requirement 16).
  - [x] 1.5 Cross-check all 4 lists (the 3 non-test locations from 1.2-1.4 plus the test fixture from 1.1) contain byte-identical spelling/casing/order for the 2 new literals — a mismatch (e.g. en-dash vs. ampersand) would pass TypeScript but fail `validate-glossary` silently.
  - [x] 1.6 Ensure taxonomy tests pass: run only `src/types/glossary.test.ts` (`npx vitest run src/types/glossary.test.ts`). Also run `tsc -b` (clean type-check, additive union widening) and `npm run validate-glossary` (confirm the existing 159 `data/glossary.json` entries still validate against the now-14-value `VALID_CATEGORIES`). Do not run the full suite yet.

**Acceptance Criteria:**
- `glossary.test.ts`'s exhaustiveness test passes with 14 categories and both count assertions updated.
- `Category` in `glossary.ts`, `ALL_CATEGORIES` in `FilterBar.ts`, and `VALID_CATEGORIES` in `validate-glossary.ts` are identical 14-value lists in identical order, ending `..., 'Software Architecture', 'Microservices & Distributed Systems'`.
- `tsc -b` type-checks cleanly; `npm run validate-glossary` passes against the existing 159 entries.
- Both taxonomy-count doc-comments (`glossary.ts:1-8`, `validate-glossary.ts:19`) and the `FilterBar.ts:12` comment read "14", not "12".

---

### Task Group 2: FilterBar Bidirectional Collapse + BrowseGrid Integration Tests
**Dependencies:** Task Group 1 (needs the 14-value taxonomy and `'Microservices & Distributed Systems'` to exist before targeting it in tests)
**Files to Modify:** `src/components/FilterBar.ts`, `src/components/BrowseGrid.test.ts`
**Visual References:**
- mockup: analysis/design-context/mockups/browse-filterbar-at-14-categories.html
  element: screen:browse-filterbar
  locator: `.cat-chips` / `#toggleChip` markup (lines 394-414) and its toggle script (lines 448-465)
  acceptance: 7 chips visible by default with the trailing chip reading exactly `"+7 more"`; clicking it reveals all 14 chips and relabels the *same* trailing element to exactly `"Show less"`; clicking `"Show less"` collapses back to the 7-visible state and relabels back to `"+7 more"`; a category selected while expanded remains `active` after collapsing and re-expanding. DOM/markup fidelity (the mockup's `<button data-category>`/`<span class="chip-overflow">`) is explicitly **not** binding — implementation follows `FilterBar.ts`'s existing `<span class="chip">` full-teardown-and-rebuild convention instead (spec.md "Visual Design" section).
**Estimated Steps:** 8

- [x] 2.0 Complete the FilterBar overflow redesign and its BrowseGrid-integration test coverage
  - [x] 2.1 Fix `BrowseGrid.test.ts` Test A's comment only (0-count-chip test, current lines ~144-161, "Group 9 gap"): "all other 10 taxonomy categories" → "12"; confirm (no assertion change) that "Cloud Engineering" (index 4) is still within the new 7-visible chips (Core Requirement 11). No behavioral assertion changes — this test is mechanically robust to the count change.
  - [x] 2.2 Rewrite `BrowseGrid.test.ts` Test B (current lines ~163-192): retarget from `'Software Engineering'` to `'Microservices & Distributed Systems'` as the new last/14th category; update comments "12th (last)" → "14th (last)", "all 12" → "all 14" (Core Requirement 10). Important behavioral note for this rewrite: after expansion, the trailing chip element is **not removed** — it persists, relabeled `"Show less"` (Core Requirement 6). Update the current `expect(grid.element.querySelector('.chip.more')).toBeNull()` assertion accordingly (it must now assert the relabeled chip's text, not its absence).
  - [x] 2.3 Add a new collapse-interaction test to the same `'BrowseGrid / FilterBar integration'` describe block (Core Requirement 12): expand via `"+7 more"` → select a category chip that is only visible in the expanded state → click the same (now `"Show less"`-labeled) chip → assert the chip set and count return to the original 7-visible/`"+7 more"` state AND the selected category's chip is still `active` after re-expanding. Follow the existing re-query-after-click convention (chips are destroyed and rebuilt via `innerHTML = ''` on every render; never reuse a pre-click element reference).
  - [x] 2.4 Change `VISIBLE_CATEGORY_CHIP_COUNT` from `5` to `7` in `src/components/FilterBar.ts:31` (Core Requirement 5).
  - [x] 2.5 Add a mirrored collapse branch to `renderChips()` (lines 100-125): when `showAllCategories` is `true` and `ALL_CATEGORIES.length > VISIBLE_CATEGORY_CHIP_COUNT`, still render the trailing chip — reuse the same `.chip.more` element (do not introduce a second element), label it `"Show less"`, and give it a click handler that sets `showAllCategories = false; renderChips();`. This mirrors the existing `if (overflow.length > 0)` expand branch (Core Requirement 6). Reuse: `FilterBar.ts:100-125`'s existing full-teardown-and-rebuild pattern — no diffing/pooling.
  - [x] 2.6 Confirm by inspection (no code edit expected) that `toggleCategory()` (lines 127-136) and `state.selectedCategories` need zero changes — selection is already independent of the visible/overflow split, satisfying Core Requirement 7.
  - [x] 2.7 Add `showAllCategories = false` to `reset()`'s body (lines 166-176) so "Clear filters" also collapses the chip list (Core Requirement 8). Confirm by inspection (no code change needed) that expand/collapse state is not persisted anywhere — it stays a closure-local boolean outside `BrowseFilterState`/`localStorage`, so a fresh `FilterBar` instance always starts collapsed (Core Requirement 9).
  - [x] 2.8 Ensure FilterBar/BrowseGrid tests pass: run only the 3 touched/added tests in `src/components/BrowseGrid.test.ts` (`npx vitest run src/components/BrowseGrid.test.ts`). Then smoke-check `src/components/AppShell.test.ts` (no `showAllCategories`/`reset()`-specific coverage exists there; confirms no incidental breakage since `AppShell` is an indirect `FilterBar` consumer via `BrowseGrid`). No code changes expected in `AppShell.ts`/`AppShell.test.ts`.

**Acceptance Criteria:**
- The 3 tests (Test A comment fix, rewritten Test B, new collapse test) pass.
- `AppShell.test.ts` passes unmodified (smoke-check only).
- With 14 categories and `VISIBLE_CATEGORY_CHIP_COUNT = 7`: exactly 7 chips visible by default plus one `"+7 more"` trailing chip; clicking it reveals all 14 and relabels to `"Show less"`; clicking `"Show less"` re-collapses to 7 visible and relabels back to `"+7 more"`.
- Category selection survives expand/collapse in both directions.
- `reset()` also collapses an expanded chip list.
- Implementation matches each `acceptance` criterion declared in Visual References above.

---

### Task Group 3: Documentation Sweep
**Dependencies:** None (no file overlap with Groups 1-2; every replacement is either a literal number swap or fully specified by the spec's own CR6 description — safe to run in parallel with Groups 1-2)
**Files to Modify:** `content-pipeline/rubric.md`, `.maister/docs/project/vision.md`, `.maister/docs/project/roadmap.md`, `.maister/docs/project/architecture.md`, `content-pipeline/source/engineering-ladder.md`, `content-pipeline/prompt-template.md`, `README.md`
**Estimated Steps:** 10

- [x] 3.0 Complete the rubric.md subsection insertion and the 12→14 doc-prose sweep across 7 files
  - [x] 3.1 Insert a new "## 4. Curating from a Polish source" subsection into `content-pipeline/rubric.md` immediately after the current Section 3 (`translationPl`/`descriptionPl` scope, ends line 42) and before the current Section 4 (line 44) (Core Requirement 13). Content: state the discipline that the curator drafts the English `description` first — synthesized from understanding the Polish source, not translated word-for-word — then independently translates the finished English text into `descriptionPl`; note that the existing anti-transcription check ("would the source bullet's wording be findable inside the description") applies to `descriptionPl` against the Polish source too, not only to `description` against an English source.
  - [x] 3.2 Renumber `rubric.md`'s subsequent sections: current "4. Level assignment..." → 5, current "5. Splitting compound bullets" → 6, current "6. Schema mechanics" → 7, current "7. Final gut check" → 8. Verify no broken internal cross-references remain.
  - [x] 3.3 Fix the stale "12" in `rubric.md`'s schema-mechanics section (now Section 7, was line 68): "`category` is exactly one of the 12 `Category` values" → 14 (Core Requirement 14).
  - [x] 3.4 Fix `.maister/docs/project/vision.md:5`: "12-category 'Engineering Ladder' skills taxonomy" → "14-category" (word-swap only; do not alter surrounding sentence structure).
  - [x] 3.5 Fix `.maister/docs/project/roadmap.md:11,14,15`: "Full 12-category taxonomy coverage" → "14-category"; "across all 12 categories" → "14 categories"; "7 of 12 categories" → "7 of 14 categories" (word-swaps only — these describe historical git-log events and counts, not entry-curation status; do not alter the surrounding feature descriptions).
  - [x] 3.6 Fix `.maister/docs/project/architecture.md` in 3 places: line 19 "the 12-value `Category` union" → "14-value" (word-swap; closes the self-contradiction with this spec's own Success Criteria, per `verification/spec-audit.md` Finding 1); line 49 "159 glossary entries across 12 categories" → "14 categories" (word-swap); line 30 "category chips (5 visible + expandable overflow)" → rewritten (not a number swap) to reflect the new behavior from Core Requirement 6, e.g. "category chips (7 visible + symmetric expand/collapse overflow)" — describe the actual new interaction (7 visible, click-to-expand-all, click-to-collapse-back), not just a bumped number.
  - [x] 3.7 Fix `content-pipeline/source/engineering-ladder.md:31,36,40`: "remaining 11 categories" (×2, lines 31 and 36) → "remaining 13 categories"; "full coverage of all 12 categories" (line 40) → "full coverage of all 14 categories" (word-swaps only, per spec.md Core Requirement 17's explicit instruction — do not alter the surrounding historical-narrative sentences).
  - [x] 3.8 Fix `content-pipeline/prompt-template.md:18,39`: "one of the 12 `Category` enum values" → 14; "one of the 12 valid Category values" → 14.
  - [x] 3.9 Fix `README.md:80`: "one of 12 fixed categories" → "one of 14 fixed categories".
  - [x] 3.10 Verify zero remaining stale-count matches in this group's 7 files: `grep -rn "12 categor\|12-categor\|12-value\|remaining 11" content-pipeline/rubric.md .maister/docs/project/vision.md .maister/docs/project/roadmap.md .maister/docs/project/architecture.md content-pipeline/source/engineering-ladder.md content-pipeline/prompt-template.md README.md` returns no matches (the full 10-file cross-check, including the files Groups 1-2 own, runs in Group 4 once everything has landed).

**Acceptance Criteria:**
- `content-pipeline/rubric.md` contains the new "Curating from a Polish source" subsection positioned after the `translationPl`/`descriptionPl` scope section, with sections 4-7 correctly renumbered to 5-8 and no broken internal references.
- `architecture.md:30` describes the new 7-visible + symmetric collapse behavior, not just a bumped number.
- Grep for the group's own 7 files (step 3.10) returns zero stale-count matches.
- No entry counts, feature descriptions, or other content in these 7 files changed beyond the named count/behavior fixes.

---

### Task Group 4: Test Review & Gap Analysis
**Dependencies:** Task Groups 1, 2, 3 (all)
**Files to Modify:** `src/components/BrowseGrid.test.ts`
**Estimated Steps:** 6

- [x] 4.0 Review test coverage against the spec's Success Criteria and close the one traceability gap
  - [x] 4.1 Review the 4 tests from previous groups (1 in `glossary.test.ts`, 3 in `BrowseGrid.test.ts`: Test A, rewritten Test B, new collapse test) against every bullet in spec.md's Success Criteria.
  - [x] 4.2 Confirm the identified gap: the Success Criteria bullet "'Clear filters' (`reset()`) collapses an expanded chip list back to the compact 7-visible state" (Core Requirement 8) has no automated check — none of the 3 FilterBar/BrowseGrid tests from Group 2 expand the chip list and then call `reset()`/click "Clear filters"; the pre-existing "Clear filters" test (`BrowseGrid.test.ts` ~line 246) only covers search-query reset, never touches `showAllCategories`.
  - [x] 4.3 Add 1 new test to `BrowseGrid.test.ts`'s `'BrowseGrid / FilterBar integration'` describe block: expand via `"+7 more"` → click `.clear-btn` ("Clear filters") → assert the chip list is back to the collapsed 7-visible/`"+7 more"` state (not just that search/category filter state cleared). Follow the existing re-query-after-click convention.
  - [x] 4.4 Run the 5 feature-specific tests only: `glossary.test.ts`'s exhaustiveness test + `BrowseGrid.test.ts`'s 4 FilterBar-integration tests (Test A, Test B, collapse test, new reset-collapse test). Re-run `AppShell.test.ts` as a smoke re-check.
  - [x] 4.5 Run full final verification per spec.md's Testing Approach: `npm test` (`vitest run` + `npm run test:build`), `npm run validate-glossary`, and `tsc -b` — all three must pass cleanly.
  - [x] 4.6 Run the exhaustive cross-file grep across all 10 files named in spec.md's Success Criteria "zero remaining stale-count prose" bullet: `grep -rn "12 categor\|12-categor\|12-value\|remaining 11\|5 visible" src/types/glossary.ts content-pipeline/validate-glossary.ts content-pipeline/rubric.md .maister/docs/project/vision.md .maister/docs/project/roadmap.md .maister/docs/project/architecture.md content-pipeline/source/engineering-ladder.md src/components/FilterBar.ts content-pipeline/prompt-template.md README.md` returns no matches.

**Acceptance Criteria:**
- All 5 feature-specific tests pass (1 in `glossary.test.ts`, 4 in `BrowseGrid.test.ts`).
- Exactly 1 additional test added (well within the 10-test budget).
- `npm test`, `npm run validate-glossary`, and `tsc -b` all pass cleanly.
- The 10-file cross-check (step 4.6) returns zero stale-count matches, satisfying spec.md's Success Criteria bullet exhaustively.

## Execution Order

1. Task Group 1 — Taxonomy Mechanism (6 steps)
2. Task Group 3 — Documentation Sweep (10 steps, no dependency — may run in parallel with Group 1)
3. Task Group 2 — FilterBar Bidirectional Collapse + BrowseGrid Integration Tests (8 steps, depends on 1)
4. Task Group 4 — Test Review & Gap Analysis (6 steps, depends on 1, 2, 3)

Groups 1 and 3 have no shared files and no dependency between them — an executor that supports parallel groups may run them concurrently. Group 2 must wait for Group 1 (shares `FilterBar.ts`; its rewritten test targets a category that only exists after Group 1 lands). Group 4 must wait for all three (its final grep check spans files from every group).

## Standards Compliance

Follow standards from `.maister/docs/standards/`:
- `global/minimal-implementation.md` — no new files, components, or speculative abstractions anywhere in this plan; every step is a literal-list append, a mirrored branch in an already-understood function, or a prose fix. Group 1's low test count and Group 4's single added test both follow this standard directly (no padding).
- `global/coding-style.md` — new literals and the collapse branch follow existing naming/formatting conventions exactly (SCREAMING_SNAKE_CASE constants, camelCase functions, same array-literal style).
- `testing/test-writing.md` — new/updated tests focus on behavior (chip visibility, labels, selection persistence across toggle) not implementation details; names stay descriptive, matching `BrowseGrid.test.ts`'s existing style.
- `frontend/accessibility.md` — the pre-existing gap (chips as `<span>` with click listeners, no keyboard access/ARIA state) is not addressed by any group in this plan; it is a codebase-wide, pre-existing pattern the approved mockup deliberately preserves, flagged in `analysis/gap-analysis.md` as a candidate for a separate follow-up, not this task.
- `global/conventions.md` ("Keep documentation up to date") — Group 3 directly satisfies this: stale taxonomy-count prose is corrected in the same change that causes it to go stale.

## Notes

- Test-Driven: Group 1 and Group 2 each start with test writes/updates before the corresponding implementation edits (steps 1.1 and 2.1-2.3 precede their implementation steps).
- Run Incrementally: Each group runs only its own new/modified tests (steps 1.6, 2.8) — the full `npm test` + `npm run validate-glossary` + `tsc -b` run happens once, in Group 4 (step 4.5), as final verification.
- Mark Progress: Check off steps as completed.
- Reuse First: `renderChips()`'s existing teardown-and-rebuild pattern, `toggleCategory()`, and the taxonomy literal-list pattern are all reused unchanged — see spec.md's Reusable Components section.
