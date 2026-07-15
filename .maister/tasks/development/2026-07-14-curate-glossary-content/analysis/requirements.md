# Requirements

## TL;DR
Content-only task: author ~130+ new `GlossaryEntry` JSON records into `data/glossary.json` across 3 sequenced batches (English patterns → English terms → Polish mind-map), plus append "See also" cross-reference notes to ~21 existing entries. No new code, UI, or tooling — reuses the existing `content-pipeline/` process and existing Browse/Learn Mode discovery UI unchanged.

## Key Decisions
- No new user-facing entry points, pipeline tooling, or visual assets — confirmed via 3 confirmable-assumption questions, all answered "correct."
- Curation process, cross-reference scope, existing-entry edit authorization, decision-tree splitting, and batch checkpointing were all resolved in Phase 1/2 (see `clarifications.md` / `scope-clarifications.md`) and carry forward as binding requirements here.

## Open Questions / Risks
- None outstanding.

---

## Initial Description
Execute the 3-batch content curation plan from the approved product-design feature spec (`feature-spec.md` Section 5): author glossary entries into `data/glossary.json` for "Software Architecture" and "Microservices & Distributed Systems" (currently 0 entries each), sourced from `microservice-patterns.md`, `system-design terms.md`, and `dna-mapa.md`.

## Q&A Summary (all phases)

| Phase | Question | Answer |
|---|---|---|
| 1 | Concept coverage: cap to spec's ~90-110 estimate, or curate everything found (~109-128)? | Curate everything found |
| 1 | Include 7 additional cross-reference pairs beyond spec's table? | Yes, same policy |
| 1 | Id slug convention for `&` in category name? | Drop it: `microservices-distributed-systems-...` |
| 1 | Fix pre-existing stale docs ("12-value enum", "159 entries")? | Leave out of scope (fix once at task end) |
| 2 | Cross-reference audit scope (8 more pairs found, Batch 3 unchecked)? | Expand list to 21 pairs + systematic term-diff per batch |
| 2 | Resolve spec contradiction (Section 1.4 vs Section 2 on existing-entry edits)? | Section 2/clarifications wins — edits authorized |
| 2 | Batch 2 decision-tree granularity? | Split into 4 entries |
| 2 | Execution checkpoint structure? | Pause for spot-check after Batch 1 |
| 5 | New user-facing entry points needed? | No — existing Browse/Learn Mode filtering suffices |
| 5 | New pipeline tooling/automation needed? | No — reuse existing manual/AI-assisted process |
| 5 | New visual assets needed? | No — content-only |

## Similar Features / Reusability
- **Existing curation process** (`content-pipeline/prompt-template.md`, `content-pipeline/rubric.md`) — reused unchanged as the authoring/review workflow.
- **Existing validator** (`content-pipeline/validate-glossary.ts`, run via `npm run validate-glossary`) — reused unchanged as the schema/uniqueness gate; already recognizes both target categories.
- **159 existing entries in `data/glossary.json`** — style/quality template (term phrasing, 1-3 sentence descriptions, natural PL translation, level assignment) mined in Phase 1 (see `codebase-analysis.md` Pattern Mining section for 5 full examples).
- **Existing consumption code** (`FilterBar.ts`, `BrowseGrid.ts`, `LearnMode.ts`) — fully generic, zero changes needed; new entries surface automatically once appended.

## Visual Assets
None required. `analysis/design-context/` holds a reference-only ingestion from the prior product-design task (the FilterBar mockup, already shipped) — informational only, not a binding input to this task's work.

## Functional Requirements Summary
1. Author new `GlossaryEntry` records for all curatable concepts found in the 3 source files (~109-128, exact count depends on compound-bullet splitting during curation), following `prompt-template.md` + `rubric.md`.
2. Sequence: Batch 1 (`microservice-patterns.md`, ~49-57 entries after splitting) → checkpoint/spot-check → Batch 2 (`system-design terms.md`, including the 4-way-split communication-strategy tree) → Batch 3 (`dna-mapa.md`, Polish, largest, ~55-70 concepts).
3. Apply the expanded 21-pair cross-reference policy: append a plain-text "See also" sentence to both sides of each pair's `description`/`descriptionPl` (new entry ↔ existing entry, or new entry ↔ new entry for same-batch overlaps like Aggregate).
4. Run a systematic term-list diff (new source terms vs. all existing `data/glossary.json` terms) before/during each batch to catch any cross-reference pairs beyond the 21 already identified — especially for Batch 3, not yet checked.
5. New `id`s follow `<category-slug>-<term-slug>` lowercase-kebab-case; `Microservices & Distributed Systems` slugs drop the `&` (`microservices-distributed-systems-...`).
6. Validate after each batch via `npm run validate-glossary`; all entries must pass before the next batch starts.
7. After Batch 3, run the one-time cross-reference audit (verify all 21+ pairs resolve bidirectionally, no dangling references).
8. At task end: update the stale "159 entries" mentions and "12-value enum" test title to reflect the new state (deferred from Phase 1 scope, now folded into final cleanup).

## Scope Boundaries
**In scope**: new `GlossaryEntry` JSON records for the 2 target categories + enrichment entries for existing categories per spec Section 1.2 (Data Storage, Cloud Engineering, DevOps, Testing) where source content fits better there; cross-reference edits to ~21 existing entries; final doc/count cleanup.
**Out of scope**: any source code, test code, UI, or build tooling changes (none needed — confirmed in Phase 1); new pipeline automation/scripts; any category taxonomy changes (already shipped in the prior task); recategorizing or otherwise changing the meaning of existing entries beyond appending a See-also sentence.

## Technical Considerations
- CI gate is `npm run validate-glossary` + `npm run build` only (`npm test`/vitest is not CI-enforced, though should still be run locally for good practice).
- All curation is plain JSON text editing — no build step required to preview; `npm run dev` serves `data/glossary.json` live.
- Polish-source curation discipline (`rubric.md` Section 4) governs the majority of the work since Batch 3 is the largest.
