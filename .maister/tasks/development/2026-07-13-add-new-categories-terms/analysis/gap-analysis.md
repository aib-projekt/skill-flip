# Gap Analysis: Add New Taxonomy Categories, FilterBar Redesign & Rubric Update

## TL;DR
Current state verified against the approved spec: all 3 code taxonomy mirrors + 2 test files + FilterBar + rubric.md are exactly where `codebase-analysis.md` said they'd be, all still at 12 values, all in sync. Every required change is mechanical and already fully specified (append 2 literals in 4 places, add a real collapse branch to `renderChips()`, insert one rubric subsection) — no design ambiguity remains for the in-scope work. One genuine scope-boundary gap surfaced beyond the task description's explicit file list: the authoritative `feature-spec.md` (Section 3.7) and this task's own `project_doc_paths` context both point at stale "12 categories" prose in `vision.md`, `roadmap.md`, `architecture.md`, and `content-pipeline/source/engineering-ladder.md` that the task description never names — flagged below for a scope decision.

## Key Decisions
- `creates_new_entities` is set `true`: the 2 new `Category` literal values are new taxonomy entities requiring integration across 4 hand-mirrored locations, even though zero new files/components are created — the "New Capability" module (integration points, patterns-to-follow) applies even though this is simultaneously a `modifies_existing_code` task.
- `involves_data_operations` is set `false`: verified the task touches no `data/glossary.json` content — the two new categories will render as legitimate, already-tested 0-count chips (same code path as the existing "Cloud Engineering" 0-count fixture case in `BrowseGrid.test.ts`) until the separate follow-up curation pass adds entries. This is a pre-approved, accepted interim state from the product-design brief, not an orphaned-operation defect to gate on here.
- Found one additional stale "12-value enum" reference not listed in either `codebase-analysis.md` or `feature-spec.md`'s file lists: `content-pipeline/validate-glossary.test.ts:38`'s test-description comment. Purely cosmetic (the test asserts an invalid category `'Rust'`, which fails regardless of enum size) — treated as document-only, not escalated to a decision.

## Open Questions / Risks
- All FilterBar category chips (including the new collapse/expand affordance) are rendered as `<span class="chip">` with click listeners, not `<button>` elements — no keyboard access, no focus indicator, no ARIA state (`aria-expanded`) for the expand/collapse toggle. This conflicts with `.maister/docs/standards/frontend/accessibility.md`'s "Semantic HTML" and "Keyboard Navigation" rules, but it's a pre-existing, codebase-wide pattern (every chip, not just the one this task touches) that the already-approved mockup deliberately preserved for visual/behavioral consistency. Not a new gap this task introduces — flagged for awareness, not scope expansion; worth a `/maister:standards-update` follow-up conversation, not a blocker here.
- Implementation-order note (evaluated, not escalated): `feature-spec.md` Section 3 point 5 already directs that the taxonomy count change and the FilterBar visible-count change land together (both touch the same `BrowseGrid.test.ts` assertions and would leave tests broken if split). `rubric.md`'s new subsection has no test coupling and could technically be a separate commit, but this is ordinary commit-granularity judgment for the implementation-planner phase, not a scope-boundary ambiguity — no decision gate needed.

## Summary
- **Risk Level**: Low
- **Estimated Effort**: Low
- **Detected Characteristics**: modifies_existing_code, creates_new_entities, ui_heavy

## Task Characteristics
- Has reproducible defect: no
- Modifies existing code: yes
- Creates new entities: yes
- Involves data operations: no
- UI heavy: yes

## Gaps Identified

### Missing Features
- **2 new `Category` union values** — `src/types/glossary.ts:10-22` currently ends at 12 values (`... | 'Software Engineering'`), confirmed via direct read. Needs `'Software Architecture'` and `'Microservices & Distributed Systems'` appended, in that order, per `feature-spec.md` Section 3.1.
- **Same 2 values in `ALL_CATEGORIES`** — `src/components/FilterBar.ts:13-26`, confirmed currently 12 entries ending `'Software Engineering'`.
- **Same 2 values in `VALID_CATEGORIES`** — `content-pipeline/validate-glossary.ts:20-33`, confirmed currently 12 entries, `as const` array.
- **Bidirectional collapse logic** — confirmed by direct read of `FilterBar.ts:100-125`: the overflow chip's only handler (lines ~119-121) is `showAllCategories = true; renderChips();` with no symmetric `false` path anywhere in the file. This is genuinely new code, not present in any form today.
- **`content-pipeline/rubric.md` "Curating from a Polish source" subsection** — confirmed absent; current file has exactly 7 numbered sections (`## 1` through `## 7`, lines 8-82), no Polish-source-specific guidance exists anywhere in the file.

### Incomplete Features
- **`src/types/glossary.test.ts:60-82`** — hardcoded 12-item fixture array plus `toHaveLength(12)` and `Set.size` → `12` assertions (confirmed via read); needs both the 2 new literals and both count literals bumped to 14.
- **`src/components/BrowseGrid.test.ts` Test A (lines 144-161)** — confirmed mechanically robust (asserts "Cloud Engineering" renders at count 0 and a `.chip.more` element exists matching `/^\+\d+ more$/`; both hold true at 14 categories / 7 visible). Only its comment text ("all other 10 taxonomy categories", "within the first 5") goes stale.
- **`src/components/BrowseGrid.test.ts` Test B (lines 163-192)** — confirmed via read: hardcodes `'Software Engineering'` as "the 12th (last)" category and asserts it's absent before expansion / present after. Since both new categories append *after* `'Software Engineering'`, it is no longer last and this test's core premise is now false — requires the minimal retarget already resolved in `clarifications.md` Q2 (swap to `'Microservices & Distributed Systems'`), plus a "reveals all 14" update.
- **`content-pipeline/rubric.md` Section 6 (old numbering), line 68** — confirmed: `"category" is exactly one of the 12 Category values`. Goes stale the moment the taxonomy grows; needs the wording fix in the same change, at whatever its new section number becomes after the Section 4 insertion (old 4→5, 5→6, 6→7, 7→8).

### Behavioral Changes Needed
- **`VISIBLE_CATEGORY_CHIP_COUNT`**: 5 → 7 (`FilterBar.ts:31`, confirmed current value `5`). This also changes which of the *original* 12 categories are visible-by-default (Testing and Soft Skills become visible without a click) — a positive side effect for existing categories, not just the 2 new ones.
- **`showAllCategories` semantics**: from write-once (`false → true`, never reset) to genuinely bidirectional, with the trailing chip's label toggling `"+7 more"` ↔ `"Show less"` on the same reused DOM element (feature-spec Section 4.2 — already resolved, no ambiguity).
- **`reset()` (`FilterBar.ts`, confirmed current body does not reference `showAllCategories` at all)**: per `clarifications.md` Q1, must now also set `showAllCategories = false` so "Clear filters" fully returns to the compact default view.

## User Journey Impact Assessment

| Dimension | Current | After | Assessment |
|-----------|---------|-------|------------|
| Reachability (original 12 categories) | First 5 visible without a click; 7 require expand | First 7 visible without a click; 5 require expand | ✅ improved |
| Reachability (2 new categories) | N/A (don't exist) | Always land in overflow (positions 13-14 of 14); one click to reach | ✅ as designed — thematically adjacent placement was an explicit, approved trade-off (feature-spec 1.1), not accidental |
| Discoverability of "collapse back" | 1/10 — no path exists once expanded (confirmed: `overflow` is forced to `[]` once `showAllCategories` is true, with zero code path back) | 8/10 — standard, symmetric "Show less" pattern on the same familiar chip | ✅ +7, fixes a real pre-existing usability dead-end |
| Flow integration ("Clear filters") | Silently leaves chip list expanded if it was expanded (confirmed: `reset()` never touches `showAllCategories`) | Also collapses chip list (per resolved clarification) | ✅ resolved, consistent "clear means clear" behavior |
| Multi-persona | N/A — no role differences in this app | N/A | ✅ no impact (single-user client-side app, no auth/roles) |

## New Capability Analysis (2 new taxonomy entities)

- **Integration points** (all 4 confirmed by direct read, all currently in sync at 12 values, same order, ending `'Software Engineering'`):
  1. `src/types/glossary.ts:10-22` — canonical compile-time `Category` union.
  2. `src/components/FilterBar.ts:13-26` — `ALL_CATEGORIES` runtime array.
  3. `content-pipeline/validate-glossary.ts:20-33` — `VALID_CATEGORIES` standalone mirror.
  4. Two test mirrors: `src/types/glossary.test.ts:61-74` (exhaustiveness fixture) and `src/components/BrowseGrid.test.ts:163-192` (ordinal-dependent integration test).
- **Patterns to follow**: identical to the existing 12-value pattern — flat literal array, same order across all 4 non-test locations, append-only (never insert mid-list, per feature-spec Constraints). No new pattern needs to be invented.
- **Architectural impact**: Low. No new files, no new components, no new consumers to wire up — `src/lib/filters.ts`, `src/lib/storage.ts`, and `src/components/LearnMode.ts` all consume `Category` via `import type` only, so the 2 new literal values flow through structurally with zero code changes required in those 3 files (confirmed via `codebase-analysis.md`'s dependency mapping, not re-verified independently here but consistent with the `import type` pattern which cannot break on a union widening).

## Documentation / Prose Gaps (beyond the task description's explicit file list)

Verified by direct search (`grep -rn "12 categor..." .maister/docs/ content-pipeline/source/`):

| File | Line(s) | Stale text | In task description's scope? |
|---|---|---|---|
| `content-pipeline/rubric.md` | 68 | "exactly one of the 12 `Category` values" | Yes — file explicitly named |
| `src/types/glossary.ts` | 3, 6 (doc comment) | "full 12-value taxonomy", "all 12 values as first-class" | Yes — file explicitly named |
| `content-pipeline/validate-glossary.ts` | 19 | "Mirrors `Category`... (12-value taxonomy)" | Yes — file explicitly named |
| `content-pipeline/validate-glossary.test.ts` | 38 | "outside the 12-value enum" (comment only, test logic unaffected) | Not named, but trivial/cosmetic — treated as document-only |
| `.maister/docs/project/vision.md` | 5 | "12-category 'Engineering Ladder' skills taxonomy" | **No** — not in task description |
| `.maister/docs/project/roadmap.md` | 11, 14, 15 | "Full 12-category taxonomy coverage", "across all 12 categories", "7 of 12 categories" | **No** — not in task description |
| `.maister/docs/project/architecture.md` | 49 | "159 glossary entries across 12 categories" | **No** — not in task description |
| `content-pipeline/source/engineering-ladder.md` | 31, 36, 40 | "remaining 11 categories" (×2), "full coverage of all 12 categories" | **No** — not in task description |

The last 4 rows are exactly the files `feature-spec.md` Section 3, point 7 calls out as "Non-blocking documentation updates" — and this dev task's own `project_doc_paths` (set by the orchestrator) includes 3 of those 4 files (`vision.md`, `roadmap.md`, `architecture.md`), which is a signal they were considered relevant context. This is a genuine scope-boundary gap between the task description (silent on these files) and the authoritative spec (names them, as non-blocking). See **Issues Requiring Decisions** below.

## Issues Requiring Decisions

### Critical (Must Decide Before Proceeding)
None. The approved product-design brief and `clarifications.md` already resolve every ambiguity in the in-scope code/test/rubric changes — nothing here blocks starting implementation.

### Important (Should Decide)
1. **Stale "12 categories" prose outside the task description's named files**: `vision.md:5`, `roadmap.md:11,14,15`, `architecture.md:49`, and `content-pipeline/source/engineering-ladder.md:31,36,40` all describe the taxonomy as having 12 categories and will be inaccurate once this task ships, but none of these 4 files are named in the task description's scope (only `rubric.md` is named among docs).
   - Options: (A) Include these 4 files' text fixes in this dev task, alongside the already-in-scope `rubric.md` edit — small, low-risk, word-swap-only changes with no design ambiguity. (B) Leave them out of scope; file a separate follow-up task purely for stale-prose cleanup.
   - Recommendation: (A) Include. Rationale: `feature-spec.md` (the authoritative desired-state spec for this task) explicitly names 2 of these 4 files as required non-blocking updates; the orchestrator already surfaced all but one of them via `project_doc_paths`; the edits are trivial (single number/phrase swaps) with zero risk of scope creep into curation or design work; and per this project's own `CLAUDE.md` standard ("Keep Updated: Update documentation when goals, tech stack, or architecture changes"), letting known-stale prose ship deliberately runs counter to project convention. Default if no response: proceed with (A).

## Recommendations
- Do the 4 taxonomy-literal locations (`glossary.ts`, `FilterBar.ts`, `validate-glossary.ts`, `glossary.test.ts`) in one pass — they're mechanically identical edits and the highest-risk failure mode is silent drift from missing one, not any individual edit's difficulty.
- Implement `BrowseGrid.test.ts`'s taxonomy-count and FilterBar visible-count updates together (both land in the same file, both were already identified in `feature-spec.md` as needing to ship in the same commit/PR to avoid an intermediate broken-test state).
- Resolve the Important decision above (doc-scope) before or during specification creation, not after — it changes the file list Phase 5-7 will plan against.
- No action needed on the accessibility (`<span>` vs `<button>`, no ARIA) observation for this task — it's pre-existing, codebase-wide, and the approved mockup deliberately matches the existing pattern; raise it separately via `/maister:standards-update` or a dedicated follow-up if the team wants to address it.

## Risk Assessment
- **Complexity Risk**: Low. Every code change is either a mechanical literal-list append (4 locations) or a small, mirrored `if`-branch addition to an already-well-understood render function; the interaction design itself was already prototyped and approved as a working mockup, not designed from scratch here.
- **Integration Risk**: Low. All consumers of `Category` outside the 4 taxonomy locations are `import type`-only (`filters.ts`, `storage.ts`, `LearnMode.ts`) and cannot break on a union-widening change; `FilterBar`'s only production mount point is `BrowseGrid.ts`, and `AppShell.test.ts` has no direct `showAllCategories`/`reset()` coverage to worry about (confirmed via search) though a smoke-check post-implementation is still worthwhile since it is a `FilterBar` consumer.
- **Regression Risk**: Medium-Low, concentrated entirely in one place: `BrowseGrid.test.ts` Test B's ordinal hardcoding. This is already identified and its fix already resolved in `clarifications.md` — the risk is process (forgetting to apply the already-agreed fix), not design ambiguity.
