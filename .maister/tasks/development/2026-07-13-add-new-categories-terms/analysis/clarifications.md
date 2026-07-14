# Clarifications

## TL;DR
Two clarifications resolved beyond the approved product-design brief: `reset()` (Clear filters) will also collapse the chip list back to compact view, and `BrowseGrid.test.ts`'s ordinal-hardcoded test gets a minimal retarget fix (not a programmatic-resolution refactor).

## Key Decisions
- `FilterBar.reset()` now also sets `showAllCategories = false` — rationale: "Clear filters" should return the whole component to its default compact state, not leave the chip list expanded.
- `BrowseGrid.test.ts` Test B gets a minimal retarget (hardcoded name swapped to the new last category) rather than a programmatic-resolution refactor — rationale: matches the approved spec's minimal-implementation scope; the more robust fix is a valid future improvement but not required by this task.

## Open Questions / Risks
None — both clarifications resolved a genuine gap surfaced during codebase analysis, not covered by the product-design brief.

---

## Q&A

**Q1: Should 'Clear filters' (FilterBar.reset()) also collapse the chip list back to the compact 7-visible view if it was expanded?**
A: Yes, reset() also collapses the chip list.

**Q2: BrowseGrid.test.ts's Test B hardcodes 'Software Engineering' as the last category by name — fix scope for this test rewrite?**
A: Minimal — retarget the hardcoded name to the new last category ('Microservices & Distributed Systems'), not a programmatic-resolution refactor.
