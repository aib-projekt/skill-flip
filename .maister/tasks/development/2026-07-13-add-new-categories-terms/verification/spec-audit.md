# Spec Audit: Add New Taxonomy Categories & FilterBar Overflow Redesign

## TL;DR
**Verdict: pass-with-concerns.** Every file:line reference and code claim in `implementation/spec.md` was independently re-verified against the actual current codebase and is byte-accurate — all 17 Core Requirements are implementable as stated, with no ambiguity in the taxonomy, FilterBar, or test-rewrite logic. The gaps are confined to the documentation-prose sweep (Core Requirement 17): one genuine internal contradiction (Success Criteria demands zero stale "12-category" text in `architecture.md`, but the Core Requirement only fixes one of that file's two stale lines) plus several stale-count references the whole planning chain (this spec, `feature-spec.md`, `gap-analysis.md`, `codebase-analysis.md`) missed entirely. No Critical or High findings. Issue counts: 0 Critical, 0 High, 2 Medium, 2 Low.

## Key Decisions
- Treated the documentation-prose sweep as in-scope for line-level accuracy checking (not just "does the named file get touched") because Core Requirement 17 and the Success Criteria make specific, falsifiable claims ("zero remaining stale-count prose") that a mechanical grep can directly test — this is exactly the kind of claim an audit should verify rather than take on faith.
- Did not escalate Core Requirement 15's "drop/soften" wording to a blocking ambiguity — it governs one internal doc-comment's prose, is bounded by clear intent (14 values, no longer a closed set), and no Success Criterion depends on exact wording, so implementer discretion here is low-risk.

## Open Questions / Risks
- Should `architecture.md:19` ("the 12-value `Category` union") be added to Core Requirement 17's file list, or should the Success Criteria's "zero remaining" bullet be scoped down to just the entry-count line (49)? Either resolves the contradiction; recommend the former since it's a one-line fix and keeps the Success Criteria bullet literally true.
- Should the doc-sweep be widened to also cover `src/components/FilterBar.ts:12`, `content-pipeline/prompt-template.md:18,39`, and `README.md:80` (all confirmed stale, none named anywhere in this spec or its upstream `feature-spec.md`)? This is a scope decision for the task owner, not something the auditor can resolve — flagged below with evidence either way.

---

## Scope of This Audit

Independently re-read and re-verified against current repo state (git-clean, no pending changes on any target file, confirmed via `git status --porcelain`):
- `src/types/glossary.ts`, `src/components/FilterBar.ts`, `content-pipeline/validate-glossary.ts`, `src/types/glossary.test.ts`, `src/components/BrowseGrid.test.ts`, `content-pipeline/rubric.md`
- `.maister/docs/project/vision.md`, `roadmap.md`, `architecture.md`, `content-pipeline/source/engineering-ladder.md`
- Cross-checked `implementation/spec.md` against the authoritative upstream `analysis/feature-spec.md` (Sections 1-6), plus the dev task's own `codebase-analysis.md`, `gap-analysis.md`, `clarifications.md`, `scope-clarifications.md`, `requirements.md`, and the ingested mockup (`analysis/design-context/mockups/browse-filterbar-at-14-categories.html`, confirmed byte-identical to the product-design source copy via `diff`).
- Confirmed `data/glossary.json` (159 entries) uses only the 12 existing categories today — the "purely additive, existing entries remain valid" claim is accurate.
- Confirmed `npm test` = `vitest run && npm run test:build` and `npm run validate-glossary` both exist in `package.json` exactly as the spec assumes.
- Confirmed no exhaustive `switch` statements over `Category` exist anywhere in `src/` or `content-pipeline/` (grep, zero hits) — the "no exhaustiveness checks to break" claim holds.
- Confirmed `src/lib/filters.ts:8`, `src/lib/storage.ts:14`, `src/components/LearnMode.ts:8` all consume `Category` via `import type` only, and `categoryBadgeClass()` (`src/components/Card.ts:54-56`) is a generic slugifier with no hardcoded category list — both "zero changes required" claims hold.

**Result: every file:line reference in the spec's Core Requirements, Reusable Components, and Technical Approach sections matches the actual current file content exactly** — including the more unusual, easy-to-get-wrong ones (`vision.md:5`, `roadmap.md:11,14,15`, `architecture.md:49`, `engineering-ladder.md:31,36,40`, `rubric.md:68`, `validate-glossary.ts:19`, `glossary.ts:1-8`). This is a well-grounded spec at the code level.

---

## Findings

### Finding 1 — Medium — `architecture.md` doc-sweep is internally contradictory

**Spec Reference**: Core Requirement 17 names exactly one stale line in `.maister/docs/project/architecture.md`: "line 49: '159 glossary entries across 12 categories'". The Success Criteria section states: "Zero remaining '12 categories' / '12-value' / 'remaining 11 categories' stale-count prose in ... `architecture.md`" (spec.md:128) — an unqualified, whole-file claim.

**Evidence**: `architecture.md` contains a **second**, independent stale reference that Core Requirement 17 does not name:
```
architecture.md:19: - **Purpose**: Core data model — `GlossaryEntry` (...), the 12-value `Category` union, and the 3-value `Level` union
```
This line is not touched by any of the 17 Core Requirements. If an implementer follows Core Requirement 17 literally (only editing line 49), a reviewer mechanically checking the Success Criteria bullet ("zero remaining ... in `architecture.md`") by grepping the file will still find "12-value" at line 19 and the criterion will fail as literally written.

**Category**: Ambiguous / Internally Contradictory (Core Requirement vs. its own Success Criteria)

**Severity**: Medium — no functional impact, but it is a genuine self-contradiction within the spec on a file that IS already in this task's edit scope, and it's cheap to miss precisely because the file is only opened for one specific line.

**Recommendation**: Add `architecture.md:19` to Core Requirement 17's bullet list (one more word-swap, same pattern as the other 6 fixes), or narrow the Success Criteria bullet to name the specific line/phrase rather than claiming the whole file.

---

### Finding 2 — Medium — Doc-prose sweep misses stale "12 categories" text outside the named files, including inside a file this task already edits

**Spec Reference**: Core Requirement 17's stated goal (also TL;DR: "fix stale '12 categories' prose in 5 documentation files") and the Success Criteria's "zero remaining stale-count prose" bullet.

**Evidence** (confirmed via repo-wide grep for `12 categor|12-categor|12-value|remaining 11`, cross-checked against every file named anywhere in this spec, `feature-spec.md`, `gap-analysis.md`, and `codebase-analysis.md`):

| File | Line | Stale text | Named anywhere in the spec chain? |
|---|---|---|---|
| `src/components/FilterBar.ts` | 12 | `/** Full 12-value category taxonomy — all chips always render, even at count 0. */` | **No** — sits directly above the `ALL_CATEGORIES` array Core Requirement 2 edits in this same file, yet no CR touches this comment |
| `content-pipeline/prompt-template.md` | 18 | `2. **Category** — one of the 12 \`Category\` enum values (see...)` | **No** — file never named |
| `content-pipeline/prompt-template.md` | 39 | `category: string;         // one of the 12 valid Category values (given below)` | **No** — file never named |
| `README.md` | 80 | `category: string;       // one of 12 fixed categories — see src/types/glossary.ts` | **No** — file never named |

Additionally, `.maister/docs/project/architecture.md:30` — `` `FilterBar.ts` — search input (200ms debounced) + category chips (5 visible + expandable overflow) + level segmented control`` — will misdescribe both the new visible count (Core Requirement 5 changes it to 7) and the new symmetric collapse behavior (Core Requirement 6) after this task ships. This is a different flavor of staleness (not a "12" count, so it wasn't caught by the "stale 12 categories" framing at all) but is a direct, mechanical consequence of this task's own changes and isn't mentioned anywhere in the spec chain.

**Category**: Missing (scope gap, not a spec ambiguity — the spec is clear about what it does cover, it simply doesn't cover these)

**Severity**: Medium — none of this breaks functionality or blocks implementation, and `content-pipeline/validate-glossary.test.ts:38`'s parallel case is already explicitly and correctly excluded by name in the spec's Implementation Guidance section, showing the authors know how to scope this deliberately. But the task's own stated rationale for the doc-sweep (`scope-clarifications.md`: "consistent with project doc-freshness convention"; spec.md Standards Compliance: "stale taxonomy-count prose is corrected in the same change that causes it to go stale, rather than deferred") applies with equal force to these four locations, and `FilterBar.ts:12` in particular is inside a file already open for editing in this exact task.

**Recommendation**: Either fold these 4 additional locations into Core Requirement 17 (cheap — all are single-line/phrase word-swaps identical in kind to the other 6 already-approved fixes), or explicitly add them to Out of Scope with the same "not named in task description's scope, purely cosmetic" reasoning already used for `validate-glossary.test.ts:38`, so a future reader doesn't mistake the omission for an oversight.

---

### Finding 3 — Low — Core Requirement 15's wording gives no exact target text

**Spec Reference**: Core Requirement 15: `"...drop/soften the 'closed taxonomy' framing ('must still treat all 12 values as first-class') since the source is no longer purely Engineering Ladder.md-derived."`

**Evidence**: Every other prose-editing requirement in this spec (13, 14, 16, 17) either quotes exact replacement text or gives an unambiguous mechanical instruction (word-swap a number). Core Requirement 15 is the one exception — "drop/soften" leaves the final wording of `glossary.ts`'s doc comment (lines 1-8) to implementer judgment, and no Success Criterion checks the qualitative outcome (only the "14"-count is mechanically verifiable).

**Category**: Ambiguous (minor)

**Severity**: Low — this is an internal, non-user-facing doc comment; any reasonable rewrite satisfies the intent, and the risk of a "wrong" implementation is negligible. Flagged for completeness, not as a blocker.

**Recommendation**: Optional — could tighten to a specific suggested sentence if the team wants zero implementer discretion, but not necessary to proceed.

---

### Finding 4 — Low — "Selection survives collapse" Success Criterion has no explicitly assigned test

**Spec Reference**: Success Criteria: "Category selection state survives expand/collapse toggling in both directions (a chip selected while expanded stays selected/counted after collapsing)." Core Requirement 7 states this as a behavioral requirement.

**Evidence**: Of the three test-related Core Requirements (10, 11, 12):
- CR10 (retargeted Test B) selects a category chip *while expanded* and verifies it's active — but the test doesn't then collapse and re-check.
- CR12 (new collapse test) verifies expand → collapse returns to the original 7-visible/`"+7 more"` chip *set* — but as specified, it doesn't select a category first, so it never exercises "a chip selected while expanded stays selected/counted after collapsing."

No Core Requirement explicitly assigns a test that selects a category while expanded, then collapses, then re-verifies the selection is still active/counted. The spec's Technical Approach section argues this is "trivially satisfied" because `toggleCategory()`/`state.selectedCategories` are architecturally untouched by the collapse branch — independently confirmed accurate by reading `FilterBar.ts:127-136` and `100-125` (the `active` class is reapplied per-render from `state.selectedCategories.includes(category)` regardless of visible/overflow membership). The risk of this actually breaking is therefore low, but the Success Criterion as written has no automated check verifying it, unlike every other Success Criteria bullet.

**Category**: Incomplete (test-coverage traceability gap)

**Severity**: Low — the underlying guarantee is structurally sound (independently verified, not just asserted), so this is a coverage/traceability gap rather than a functional risk.

**Recommendation**: Optionally extend CR12's new test (or add one more assertion within it) to select a chip while expanded, collapse, and assert the selection persists — closes the loop between the Success Criteria bullet and an actual automated check.

---

## Verification of Audit Points 3 and 5 (No Findings)

**Point 3 — Visual Design fidelity distinction**: Confirmed clear. The spec states the DOM/markup-fidelity exception twice (once in a "Note:" paragraph with rationale, once in the closing "Fidelity level:" sentence), and its factual claim about the mockup's markup was independently verified — the mockup does use `<button class="chip" data-category="...">` and `<span class="chip-overflow" id="overflowChips" hidden>` (confirmed via direct read of the mockup HTML), which the actual implementation is explicitly told to ignore in favor of `FilterBar.ts`'s existing `<span class="chip">` convention. No ambiguity found; an implementer would not mistakenly try to match the mockup's HTML structure.

**Point 5 — Out of Scope completeness**: Confirmed thorough. Out of Scope explicitly names both risk areas called out in the audit brief — entry curation (`data/glossary.json` content) and accessibility remediation (`<span>`→`<button>`, ARIA) — each with rationale for why they're excluded and why they were tempting to include (adjacent, closely-related work). No gap found here; this section actively pre-empts the two most likely scope-creep vectors rather than merely omitting them.

---

## Compliance Status

**⚠️ Mostly Compliant / Pass-with-concerns.** All code-level requirements (Core Requirements 1-12, 15-16) are precise, evidence-backed, and implementable without further clarification — verified byte-for-byte against the live codebase, not taken on faith. The only gaps are in the documentation-prose sweep (Core Requirement 17), where one file (`architecture.md`) has a genuine internal contradiction between what the requirement fixes and what the Success Criteria promises, and four additional stale-count locations across three files were missed by the entire planning chain (this spec, `feature-spec.md`, `gap-analysis.md`, `codebase-analysis.md`) despite being trivial, same-pattern fixes. None of these block starting implementation; all are cheap to resolve either by expanding CR17 or by explicitly re-scoping them as out-of-scope with the same reasoning already applied to `validate-glossary.test.ts:38`.

## Issue Counts by Severity
- Critical: 0
- High: 0
- Medium: 2 (Finding 1, Finding 2)
- Low: 2 (Finding 3, Finding 4)
