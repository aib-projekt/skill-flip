# Gap Analysis: Curate Glossary Content (Software Architecture / Microservices & Distributed Systems)

## TL;DR

Current state: 0/159 entries in the two target categories; all supporting code/schema/UI already shipped; a fully-approved spec (Section 5) and mature tooling (`prompt-template.md`, `rubric.md`, `validate-glossary.ts`) exist. This gap analysis found **two concrete, unresolved problems in the approved plan itself** that neither the spec nor Phase 1 clarifications caught: (1) the "known cross-reference overlaps" list is materially incomplete — at least 8 additional overlap pairs exist beyond the 13 already documented, found by spot-checking just Batch 1/2 against the live `data/glossary.json`; Batch 3 (Polish, 584 lines, the largest batch) hasn't been checked at all; and (2) the spec **contradicts itself**: Section 1.4's acceptance criterion says existing entries are never modified, while Section 2's cross-reference mechanism (as extended by Phase 1 clarifications) requires editing ~15-18 existing entries' text. Both need an explicit decision before Batch 1 starts, not mid-batch.

## Key Decisions
- `involves_data_operations` and `creates_new_entities` set to **true** — this is CRUD authoring of ~109-128 new `GlossaryEntry` JSON records (CREATE) plus edits to ~15-18 existing records' `description`/`descriptionPl` fields for cross-references (UPDATE) — not a code or UI change.
- `modifies_existing_code` set to **true**, but scoped narrowly to *data*, not source code — existing `data/glossary.json` records will need text edits (see Issues below), a real (if low-blast-radius) form of "existing implementation changes."
- `ui_heavy` set to **false** — confirmed no UI/template/component files are in scope; FilterBar/BrowseGrid/LearnMode already consume the dataset generically.

## Open Questions / Risks
- With `VISIBLE_CATEGORY_CHIP_COUNT = 7` and the 2 new categories sitting at positions 13-14 of 14 in `FilterBar.ts`'s `ALL_CATEGORIES`, both target categories will render inside the collapsed "+7 more" chip by default even after curation — meaning "Microservices & Distributed Systems," likely to become the single largest category in the app once populated, stays one click away from discovery. This is an already-shipped, already-accepted design trade-off from the prior product-design task (Section 4.4), not a new defect — flagging for awareness only.
- Batch 3 (`dna-mapa.md`, Polish, 584 lines, ~55-70 concepts) has not been cross-checked against the existing 159 entries or against Batches 1-2's new content at all.

## Summary
- **Risk Level**: Medium (technical/CI risk is Low — confirmed no code/test changes needed and `npm run validate-glossary` passes cleanly today; but *content-completeness risk* is Medium-High because the plan's own acceptance criteria, as currently scoped, will likely be silently unmet).
- **Estimated Effort**: High (~109-128 new bilingual entries + edits to ~15-18 existing entries, one large Polish-sourced batch with heavy compound-bullet splitting, expanded cross-reference bookkeeping).

## Task Characteristics
- Has reproducible defect: no
- Modifies existing code: **yes** (data-record level only — ~15-18 existing `data/glossary.json` entries get text edits for cross-references; no source code/tests touched)
- Creates new entities: yes — ~109-128 new `GlossaryEntry` JSON records
- Involves data operations: yes — CREATE (new entries) + UPDATE (existing entries' `description`/`descriptionPl` for "See also" notes)
- UI heavy: no

## Gaps Identified

### Missing Features (confirmed, matches prior phases)
- Software Architecture: 0/159 entries — full curation from `dna-mapa.md` pending.
- Microservices & Distributed Systems: 0/159 entries — full curation from `microservice-patterns.md` + partial `system-design terms.md` pending.
- Enrichment additions to Data Storage, Cloud Engineering, DevOps, Testing per spec Section 1.2 — not yet started.

### New Gaps Found (not caught by feature-spec.md or Phase 1 clarifications)

**Gap A — The cross-reference "known overlaps" list undercounts real overlaps.** The spec's Section 2.3 lists 6 pairs; Phase 1 clarifications added 7 more (all against existing `Software Engineering` entries) = 13 total. Direct verification against the live `data/glossary.json` and the two English source files found at least 8 more:

| New content (source) | Destination | Existing entry it overlaps | Existing category | Status |
|---|---|---|---|---|
| CQRS (dna-mapa + microservice-patterns.md) | Software Architecture / Microservices | `software-engineering-cqrs` | Software Engineering | Spec's #1 only counted 2 entries — really a **3-way** overlap |
| Circuit Breaker (dna-mapa + microservice-patterns.md) | Microservices (both) | `software-engineering-circuit-breaker` | Software Engineering | Spec's #2 only counted 2 entries — **3-way** |
| Event Sourcing (dna-mapa + microservice-patterns.md) | Software Architecture / Microservices | `software-engineering-event-sourcing` | Software Engineering | Spec's #5 only counted 2 entries — **3-way** |
| Saga (microservice-patterns.md) | Microservices | `software-engineering-saga-pattern` | Software Engineering | Not listed anywhere |
| API Gateway (microservice-patterns.md) | Microservices | `api-development-gateway` | API Development | Not listed anywhere |
| Aggregate (microservice-patterns.md) / Agregaty (dna-mapa.md) | Microservices / Software Architecture | *(cross-category dedup within the 2 new categories, same pattern as spec's CQRS/Event Sourcing rows)* | — | Structurally identical to a spec-documented case but omitted |
| Consumer-driven/-side contract test (microservice-patterns.md) | Microservices | `testing-contract-testing` | Testing | Not listed anywhere |
| Externalized Configuration (microservice-patterns.md) | Microservices | `spring-jee-externalized-configuration` | Spring/JEE | Not listed anywhere |

Two weaker/judgment-call candidates also surfaced (Access Token vs. `api-development-oauth2`; Application Metrics vs. `api-development-observability`) — plausibly distinct enough not to need a note, but worth a conscious yes/no.

**Gap B — Spec self-contradiction on editing existing entries.** Section 1.4's acceptance criterion states existing entries are never modified — purely additive. But Section 2.3's cross-reference policy, as extended by Phase 1 clarifications, explicitly requires appending a "See also" sentence to existing entries' `description`/`descriptionPl` fields, extending to ~15-18 existing entries across 4 categories once Gap A is folded in. This is a direct textual conflict in the already-approved spec.

**Gap C — Batch 2 decision-tree granularity, unresolved.** Flagged by codebase-analysis but not addressed by any of Phase 1's 4 clarifying questions: should the "Network communication strategy" decision tree become 1 bundled entry or up to 4 separate entries?

**Gap D — Cross-reference process has no rubric checklist hook.** `content-pipeline/rubric.md` has no item covering "See also" note correctness/completeness — worth flagging as a future `/maister:standards-update` candidate once curation is complete, not fixed mid-task.

## Data Lifecycle Analysis

| Operation | Backend (schema/validator) | UI | Access | Status |
|---|---|---|---|---|
| CREATE (~109-128 new entries) | `validate-glossary.ts` already accepts both categories | `FilterBar`/`BrowseGrid`/`LearnMode` already generic | Chips render at zero-count already; will render populated once entries land | ✅ fully supported |
| READ | Same generic consumption | Same | Same (see collapsed "+7 more" note above) | ✅ |
| UPDATE (~15-18 existing entries get cross-ref text appended) | Schema unaffected | N/A | N/A | ⚠️ Conflicts with spec's Section 1.4 acceptance criterion (Gap B) |
| DELETE | N/A | N/A | N/A | Not applicable |

Structurally 100% complete (no orphaned CRUD layer). The real risk is content completeness against the spec's own audit acceptance criteria, not plumbing.

## Issues Requiring Decisions

### Critical
1. **Cross-reference audit scope is incomplete** — 8+ pairs missing beyond the 13 documented, Batch 3 unchecked.
   - Recommendation: expand the known-overlaps table now, and run a systematic term-list diff (new source terms vs. existing 159 entries' terms) before/during each batch, especially Batch 3.
2. **Spec self-contradiction**: Section 1.4 ("no existing entries modified") vs. Section 2 + clarifications (requires editing existing entries).
   - Recommendation: Section 2/clarifications wins — edit existing entries to append a "See also" sentence; treat Section 1.4 as scoped to "no recategorization/meaning changes," not "no touch at all."

### Important
3. **Batch 2 decision-tree granularity**: 1 bundled entry vs. up to 4 separate entries for the communication-strategy decision tree.
   - Default: split into 4 — each branch is independently flashcard-worthy.
4. **Session/execution checkpoint structure** for ~109-128+ new entries + ~15-18 existing-entry edits.
   - Default: pause for a lightweight spot-check after Batch 1 (~49-57 entries) before continuing to Batches 2-3.

## Recommendations
- Resolve Critical decisions 1-2 before starting Batch 1.
- Run Batch 1 (`microservice-patterns.md`, ~49 concepts) first as originally sequenced.
- Apply the same systematic term-diff check before Batch 3 specifically, given it's Polish, largest, and unchecked so far.
- Carry Gap D forward as a candidate for `/maister:standards-update` once curation is complete.

## Risk Assessment
- **Complexity Risk**: Medium-High — large volume, one Polish-sourced batch, heavy compound-bullet judgment calls, expanded cross-reference bookkeeping (≥21 pairs, not 13).
- **Integration Risk**: Low — zero code/UI/test changes required.
- **Regression Risk**: Low for code/CI; Medium for existing-entry edits — those edits must not alter existing meaning, only append a wayfinding sentence.
