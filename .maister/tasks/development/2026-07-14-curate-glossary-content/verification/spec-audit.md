# Specification Audit

## TL;DR
**Verdict: PASS WITH CONCERNS.** An unusually well fact-checked spec — dozens of concrete claims (concept counts, existing entry ids/terms/categories, source file structure, commit contents, rubric section numbers) were independently verified against the live repo and nearly all checked out exactly. The cross-reference table (19 groups / 15 existing entries) is accurate. The parent feature-spec's Section 1.4/Section 2 contradiction is resolved and applied consistently. Found 2 Medium-severity issues (a self-contradiction the spec introduces on its own about touching a test file, and a completeness gap in its own stale-doc cleanup list) and 4 Low-severity issues. None block execution.

## Key Decisions
- Treated the parent feature-spec's Section 1.4/Section 2 contradiction as correctly resolved — no leftover "purely additive" language found anywhere else in spec.md.
- Verified the cross-reference table by direct lookup against `data/glossary.json` rather than trusting the spec's prose.

## Open Questions / Risks
- Does the team want `content-pipeline/validate-glossary.test.ts`'s title fix to count as an exception to "no test file modified," or should Requirement 8 be reworded? (Finding 1 — fixed inline, see below.)
- Should `.maister/docs/project/architecture.md:49` be added to the Requirement 8 cleanup list? (Finding 2 — fixed inline, see below.)

---

## Detailed Findings

### Finding 1 (Medium) — Spec contradicts itself on whether a test file is modified
**Evidence**: `content-pipeline/validate-glossary.test.ts:38` reads "...outside the 12-value enum" (stale — the enum is 14-valued). Requirement 8 requires editing this file, but Out of Scope / Success Criteria said "any test file" is untouched.
**Resolution**: Fixed in `spec.md` — Out of Scope / Success Criteria now carve out this file's title string as the one explicit exception, matching Requirement 8.

### Finding 2 (Medium) — Requirement 8's stale-doc list omits `architecture.md`
**Evidence**: `.maister/docs/project/architecture.md:49` also says "all 159 glossary entries" and will go stale identically to the 3 docs the spec already lists.
**Resolution**: Fixed in `spec.md` — added to Requirement 8 / Success Criteria, count updated from 4 to 5 doc-cleanup files.

### Finding 3 (Low) — Batch 3 mapping table's path notation imprecise (inherited from parent spec)
`dna-mapa.md`'s actual heading hierarchy has `System rozproszony`/`Monolit`/`Modularny monolit` as siblings (not nested), and `Infrastruktury` as a top-level sibling of `Systemowa` (not nested under it). Destinations themselves are all correct — full `dna-mapa.md` coverage confirmed. Not fixed (navigation-aid only, doesn't change curation output); noted for the curator.

### Finding 4 (Low) — No canonical Polish template for "See also" notes
Only the English template is given verbatim; Polish side is "natural equivalent" with no fixed phrasing. Low risk with single-curator execution; not fixed.

### Finding 5 (Low) — Loose/inconsistent numeric ranges
Batch 1 is exactly 49 unique concepts (verified by hand); the "49-57" range and headline "~109-128" vs. summed batch ranges (113-136) are imprecise. Actual counts will be whatever curation + `validate-glossary.ts` produce; not fixed.

### Finding 6 (Low, informational) — Gap-analysis's "Gap D" (no rubric checklist item for cross-references) not mentioned in spec.md
Traceability gap between phases, not a functional issue. Already tracked in `analysis/gap-analysis.md` as a future `/maister:standards-update` candidate; not re-addressed here.

## What Was Verified Accurate
- All 15 existing entries in the cross-reference table (ids/terms/categories) exist exactly as claimed.
- Batch 1 (49) and Batch 2 (9) concept counts exact; Batch 3 full `dna-mapa.md` coverage confirmed.
- Already-shipped infrastructure (Category type, validate-glossary.ts, FilterBar.ts, commit `495ff65`) confirmed live and matching.
- Rubric/prompt-template claims (Section 4, Section 6, 8-point checklist) confirmed real.
- Stale-artifact claims (other than the Finding 2 omission) confirmed stale as claimed; Junior-level count exactly 6/159.
- Test isolation: `glossary.test.ts` and `BrowseGrid.test.ts` confirmed to not read `data/glossary.json`.
- Scope discipline: aside from Finding 1, correctly excludes all source/UI/tooling changes.

## Compliance Status: ⚠️ Mostly Compliant (Pass with Concerns)
No Critical or High findings. Both Medium findings fixed inline in `spec.md` before proceeding to implementation planning.
