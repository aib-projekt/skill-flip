# Requirements

## TL;DR
Implementation follows exactly the authoritative `feature-spec.md` (from the approved product-design task) — no deviation, no new files/components. The ingested FilterBar mockup is the sole binding visual reference. This document exists to record the confirmation, not to introduce new requirements.

## Key Decisions
- No requirements deviate from `feature-spec.md` — confirmed by the user.
- No additional visual assets beyond the ingested mockup — confirmed by the user.

## Open Questions / Risks
None.

---

## Initial Description
Implement the approved product-design brief: add 2 new categories ('Software Architecture', 'Microservices & Distributed Systems') to the Category taxonomy across 3 hand-synced code locations plus 2 test files, redesign FilterBar's chip overflow UX (visible count 5→7, genuine bidirectional expand/collapse), add a permanent "Curating from a Polish source" subsection to `content-pipeline/rubric.md`, and fix stale "12 categories" prose in 4 additional documentation files. Entry curation (writing actual `glossary.json` content) is explicitly out of scope.

## Q&A

**Q1: Implementation follows exactly feature-spec.md Sections 3-4, no new components/files?**
A: Yes, exactly as specified.

**Q2: The ingested FilterBar mockup is the sole binding visual reference?**
A: Correct, sufficient as-is.

## Similar Features / Patterns to Reference
- Taxonomy literal-list pattern: identical flat-array, append-only pattern already used at all 4 existing mirror locations — no new pattern to invent (per `codebase-analysis.md`).
- `renderChips()`'s existing `if (overflow.length > 0)` expand-chip branch is the direct template for the new collapse branch — same file, same function, mirrored logic.
- `BrowseGrid.test.ts`'s existing chip query/re-query-after-click test convention is the template for the new collapse test.

## Visual Assets
- `analysis/design-context/mockups/browse-filterbar-at-14-categories.html` — interactive, built with the app's actual theme tokens; demonstrates symmetric collapse (7 visible ↔ 14 total) and the 2 new category badges. Confirmed sufficient, no additional assets.

## Functional Requirements Summary
See `.maister/tasks/product-design/2026-07-13-add-new-categories-terms/analysis/feature-spec.md` Sections 1-4 (authoritative) for full detail. Condensed:
1. Append 2 `Category` literals to `glossary.ts`, `FilterBar.ts`'s `ALL_CATEGORIES`, `validate-glossary.ts`'s `VALID_CATEGORIES`, and `glossary.test.ts`'s fixture — same order, same 2 names.
2. `VISIBLE_CATEGORY_CHIP_COUNT`: 5 → 7. Add genuine bidirectional `showAllCategories` toggle (mirrored collapse branch in `renderChips()`); `reset()` also collapses (per `clarifications.md`).
3. Rewrite `BrowseGrid.test.ts` Test B (minimal retarget to new last category, per `clarifications.md`); add new collapse-interaction test.
4. Insert "Curating from a Polish source" subsection into `rubric.md` after Section 3; renumber subsequent sections; fix stale "12" references.
5. Fix stale "12 categories" prose in `vision.md`, `roadmap.md`, `architecture.md`, `content-pipeline/source/engineering-ladder.md` (per `scope-clarifications.md`).

## Reusability Opportunities
- No new components, files, or patterns — 100% extension of existing mechanisms (per `codebase-analysis.md` "Opportunities").

## Scope Boundaries
**In scope**: taxonomy mechanism (4 code/test locations), FilterBar UX redesign, rubric.md documentation, 4 additional stale-doc-prose fixes (per `scope-clarifications.md`).
**Out of scope**: entry curation (writing `data/glossary.json` content) — explicitly deferred to a follow-up content-pipeline pass per the product-design brief.

## Technical Considerations
- All 4 taxonomy locations must be edited in the same pass to avoid drift (no shared source of truth, by design).
- `BrowseGrid.test.ts`'s taxonomy-count and FilterBar visible-count changes must land together — both touch the same assertions and would leave tests broken if split.
- `content-pipeline/validate-glossary.test.ts` should be spot-checked to confirm it doesn't also hardcode the category list (unconfirmed by prior analysis passes).
