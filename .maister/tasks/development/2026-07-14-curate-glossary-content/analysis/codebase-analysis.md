# Codebase Analysis Report

**Date**: 2026-07-14
**Task**: Execute the 3-batch content curation plan (feature-spec.md Section 5) to author glossary entries for "Software Architecture" and "Microservices & Distributed Systems"
**Description**: Execute the 3-batch content curation plan from `.maister/tasks/product-design/2026-07-13-add-new-categories-terms/analysis/feature-spec.md` Section 5 — author glossary entries into `data/glossary.json` for the "Software Architecture" and "Microservices & Distributed Systems" categories (currently 0 entries each out of 159 total, 14 categories).
**Analyzer**: codebase-analyzer skill (3 Explore agents: File Discovery + Code Analysis, Context Discovery, Pattern Mining)

---

## TL;DR

This is a content-authoring task, not a code change: the taxonomy, UI (FilterBar/BrowseGrid), and validator already support all 14 categories and were updated in a prior task (commit `495ff65`). No test reads the real `data/glossary.json` or asserts entry counts, and CI only gates `npm run validate-glossary` + `npm run build` — so appending entries is purely additive and low-risk to existing code. A complete design spec already exists (`feature-spec.md` Section 5) defining 3 sequential batches sourced from `microservice-patterns.md`, `system-design terms.md`, and `dna-mapa.md` (Polish), each run through the existing `content-pipeline/prompt-template.md` + `rubric.md` process and validated before appending. The real content volume is larger than the spec's illustrative estimates (~109-128 actual curatable concepts vs. spec's "~90-110"), and 7 additional cross-reference pairs with existing `Software Engineering` entries were found that the spec's own audit table didn't capture.

## Key Decisions

- **`id` slug for `&` in "Microservices & Distributed Systems"** — no existing precedent in `data/glossary.json` for an ampersand in a category name. The one analogous case (`Spring/JEE` → `spring-jee`, dropping `/`) suggests dropping `&` the same way (`microservices-distributed-systems-...`), but this must be applied consistently across the entire batch and is a judgment call, not a documented rule.
- **Use `context/` source files, not `content-pipeline/source/`** — the task's literal source-directory convention (`content-pipeline/source/`) only contains `engineering-ladder.md`, which has zero Software Architecture/Microservices content (confirmed by full read). The actual curation sources are `microservice-patterns.md`, `system-design terms.md`, and `dna-mapa.md` in `.maister/tasks/product-design/2026-07-13-add-new-categories-terms/context/`.
- **Cross-references stay as plain-text "See also" sentences, no schema change** — per feature-spec Section 2, overlapping concepts (CQRS, Circuit Breaker, Service Discovery, Distributed Tracing, Event Sourcing, Service Mesh/Sidecar) become separate entries in their respective categories, linked via a sentence appended to `description`/`descriptionPl`, not merged or cross-linked structurally.

## Open Questions / Risks

- **Feature-spec concept-count estimates undercount the actual source material**, most notably Batch 1: spec says "~35 patterns," actual raw count in `microservice-patterns.md` is ~49 distinct concepts. Total across all 3 files is ~109-128 curatable concepts vs. the spec's own "~90-110" estimate — worth flagging to the user/orchestrator before committing to batch scope or entry-count targets.
- **7 additional cross-reference candidates were found that feature-spec Section 2.3's audit table doesn't list**: `Monolithic Architecture` (`software-engineering-monolith`), `Microservices Architecture` (`software-engineering-microservices`), `Domain Events`/`Integration Events`, `Retry Pattern`, `Transactional Outbox Pattern`, `Event Storming`, and `Richardson Maturity Model` all have pre-existing near-namesake entries in `Software Engineering` that the new dna-mapa/microservice-patterns content will overlap with. These should get the same "See also" treatment as the spec's 6 flagged overlaps, but weren't validated against the spec's dangling-reference audit process.
- **No conflicting or blocking technical risk found** — this section is otherwise clean; the append is structurally safe (see Test Coverage and Impact Assessment below).

---

## Summary

Skill Flip's glossary is a flat, category-grouped JSON array (`data/glossary.json`, 159 entries, 12 populated categories) validated by a hand-written schema checker (`content-pipeline/validate-glossary.ts`) that is the actual CI gate. Two categories in the 14-value taxonomy — "Software Architecture" and "Microservices & Distributed Systems" — were added to the type system and UI in a prior task (commit `495ff65`) but have zero entries. A complete design spec (`feature-spec.md`, product-design task `2026-07-13-add-new-categories-terms`) already defines the curation plan for this exact task: 3 sequential batches sourced from three context files, following the existing `prompt-template.md` + `rubric.md` authoring process, each independently validated and human-reviewed before appending.

---

## Files Identified

### Primary Files

**`data/glossary.json`** (1433 lines, 159 entries)
- The target file: flat top-level JSON array of `GlossaryEntry` objects, grouped contiguously by category (12 existing contiguous runs, no interleaving).
- New entries for the two empty categories should be appended as new contiguous blocks, most naturally at the end.
- Per-category counts: Java 20, Soft Skills 5, Management 4, Mentoring 2, Problem Solving 4, API Development 26, Cloud Engineering 8, Data Storage 22, DevOps 4, Software Engineering 32, Spring/JEE 17, Testing 15, Software Architecture 0, Microservices & Distributed Systems 0.

**`src/types/glossary.ts`**
- Canonical `GlossaryEntry`/`Category`/`Level` type definitions. `Category` union already includes both new categories (14 total). JSDoc explicitly documents that these 2 categories "currently have zero entries... pending a future content-curation pass" — i.e., this file already anticipates this exact task.

**`.maister/tasks/product-design/2026-07-13-add-new-categories-terms/analysis/feature-spec.md`** (227 lines)
- The authoritative curation plan referenced by the task description. Section 1: source-to-category mapping table. Section 2: cross-source dedup/cross-reference policy. Section 5: the 3-batch content curation plan this task executes.

**`content-pipeline/prompt-template.md`**
- Defines the exact authoring rules for generating `GlossaryEntry` drafts (term = concept name not bullet transcript, description rewritten not copied, id format, splitting compound bullets, workflow: draft → rubric check → hand-edit → append → validate).

**`content-pipeline/rubric.md`**
- 8-section quality checklist every generated entry must pass before being committed, including a permanent Section 4 "Curating from a Polish source" subsection (already exists, governs the dna-mapa.md batch).

**`content-pipeline/validate-glossary.ts`**
- The actual CI-gating schema validator, run via `npm run validate-glossary`. Hand-mirrors `GlossaryEntry`/`Category`/`Level` from `src/types/glossary.ts` (explicitly documented hand-sync risk in its own header comment).

### Related Files

**`.maister/tasks/product-design/2026-07-13-add-new-categories-terms/context/microservice-patterns.md`** (68 lines, English)
- Batch 1 source. Flat bulleted pattern-name list grouped under section headers (Decomposition, Data patterns, Testing, UI, Observability, Cross-cutting concerns, Security, Communication patterns), no descriptions provided — descriptions must be authored from the curator's own knowledge per rubric rule 2. ~49 distinct concepts (spec's own estimate of "~35" undercounts this).

**`.maister/tasks/product-design/2026-07-13-add-new-categories-terms/context/system-design terms.md`** (27 lines, English)
- Batch 2 source. Short flat list of named technologies (Kafka, Redis, Elasticsearch/OpenSearch, Zookeeper, CDN) plus one nested communication-strategy decision tree. Mostly enriches existing categories (Data Storage, Cloud Engineering); one item routes to Microservices & Distributed Systems. ~5-9 concepts depending on whether the decision tree is split.

**`.maister/tasks/product-design/2026-07-13-add-new-categories-terms/context/dna-mapa.md`** (584 lines, Polish)
- Batch 3 source, largest and most compound-bullet-heavy. Deeply nested Markdown outline (4 top-level H1 sections: Architektura, Rozwiązania, Infrastruktury) with numerous preserved typos. Mostly routes to Software Architecture. ~55-70 distinct concepts after splitting compound bullets.

**`src/components/FilterBar.ts`**
- Renders all 14 category filter chips via a hardcoded `ALL_CATEGORIES` array (already includes both new categories) and computes per-category counts dynamically from live entry data (`counts.get(category) ?? 0`) — no code change needed when entries are added.

**`src/components/BrowseGrid.ts`** / **`BrowseGrid.test.ts`**
- `BrowseGrid.ts` is fully generic (no category-specific logic). Its test file uses a hand-rolled 4-entry local fixture, never the real `data/glossary.json` — immune to this content change. Order-dependent chip assertions were already updated in the prior taxonomy-expansion task to reference `Microservices & Distributed Systems` as "the 14th (last)" category, and remain valid since this task adds no new categories or reordering.

**`src/types/glossary.test.ts`**
- Hardcodes the 14-value category list and asserts `toHaveLength(14)` / `Set.size === 14`. Pure type-fixture test, not sensitive to `data/glossary.json` entry counts.

**`content-pipeline/validate-glossary.test.ts`**
- Exercises `validateGlossary` only against small in-file fixtures, never the real data file. One test title has stale "12-value enum" wording (cosmetic only, unrelated to this task, already stale today).

**`.github/workflows/deploy.yml`**
- CI gate: `npm ci` → `npm run validate-glossary` → `npm run build` → deploy. `npm test` (Vitest suite) is not part of this pipeline — it's a local/manual check only, not a merge/deploy blocker.

**`.maister/tasks/development/2026-07-14-curate-glossary-content/orchestrator-state.yml`**
- The in-progress orchestrator state for this exact task (status: in_progress, created today), confirming this analysis is being generated as part of that flow.

---

## Current Functionality

### Data Flow

`data/glossary.json` is fetched at runtime (mocked in `main.test.ts`, real fetch in production) and consumed by `BrowseGrid` (filtering/search/rendering) and `FilterBar` (category chip rendering with dynamic counts) and `LearnMode` (weighted drill algorithm). All three consume the array generically — none hardcode category names, indices, or counts tied to specific categories, so growing the array is safe by construction.

### Key Components/Functions

- **`GlossaryEntry`** (`src/types/glossary.ts`): the schema every new entry must satisfy — 7 required string fields (`id`, `term`, `description`, `translationPl`, `descriptionPl`, `category`, `level`).
- **`validateGlossary()`** (`content-pipeline/validate-glossary.ts`): schema/enum/uniqueness validator; never throws, returns an error-message array; CLI wrapper exits 1/0 accordingly. Checks: array shape, required non-empty string fields, `category` ∈ 14 valid values, `level` ∈ 3 valid values, no duplicate `id`, no duplicate `(term, category)` pair.
- **`categoryCounts()`** (`src/components/FilterBar.ts`): builds per-category counts dynamically from the live dataset — generic, count-agnostic.
- **Content-pipeline authoring process** (`prompt-template.md` + `rubric.md`): draft → rubric self-check → hand-edit → append → `npm run validate-glossary`. This is an AI-assisted, human-reviewed process, not automated generation.

### Style/Quality Reference (5 example entries pulled from the live data)

Representative existing entries most relevant to the new categories (both flagged as cross-source overlaps):

```json
{
  "id": "software-engineering-cqrs",
  "term": "CQRS (Command Query Responsibility Segregation)",
  "description": "An architectural pattern that separates the model used to write data (commands) from the model used to read it (queries), allowing each side to be optimized, scaled, or evolved independently.",
  "translationPl": "CQRS (rozdzielenie odpowiedzialności komend i zapytań)",
  "descriptionPl": "Wzorzec architektoniczny rozdzielający model używany do zapisu danych (komendy) od modelu używanego do ich odczytu (zapytania), co pozwala optymalizować, skalować i rozwijać obie strony niezależnie od siebie.",
  "category": "Software Engineering",
  "level": "Regular"
}
```

Style takeaways confirmed across all 5 pulled examples: `term` is a bare concept name (often with acronym expansion or parenthetical examples); `description` is 1-3 sentences defining mechanism + purpose, never a bullet transcript; `descriptionPl` is a full natural-Polish translation at matching density; `level` skews Senior for architecture/resilience/distributed-system patterns.

---

## Dependencies

### Imports (What This Depends On)

- `content-pipeline/prompt-template.md` — authoring rules (term/description/id conventions, splitting rules, workflow).
- `content-pipeline/rubric.md` — 8-point quality checklist, including the Polish-source discipline (Section 4) required for the dna-mapa.md batch.
- `content-pipeline/validate-glossary.ts` — schema validator, the actual gate before/at CI.
- 3 raw source context files (`microservice-patterns.md`, `system-design terms.md`, `dna-mapa.md`) — the material being curated from.
- `feature-spec.md` Sections 1, 2, 5 — category-mapping table, cross-reference policy, and batch plan.

### Consumers (What Depends On This)

- **`src/components/FilterBar.ts`**: renders chips and counts per category, dynamically — no change needed.
- **`src/components/BrowseGrid.ts`**: filters/renders/searches entries generically — no change needed.
- **`src/lib/learn` (weighted drill algorithm)**: consumes entries generically by category/level — no change needed.
- **`content-pipeline/validate-glossary.ts` / CI (`deploy.yml`)**: validates the appended entries structurally before build/deploy.

**Consumer Count**: 3-4 files reference the data generically; 0 files have category-specific or count-specific logic that would break.
**Impact Scope**: Low — this is a pure data-file append; no source-code changes are anticipated. The taxonomy, UI, and validator already support both target categories.

---

## Test Coverage

### Test Files

- **`src/types/glossary.test.ts`**: type-fixture test, hardcodes and asserts the 14-value category union (already includes both new categories). Not sensitive to `data/glossary.json` contents.
- **`content-pipeline/validate-glossary.test.ts`**: 5 tests against small in-file fixtures only; never loads the real data file. One stale test-title string ("12-value enum," cosmetic only).
- **`src/components/BrowseGrid.test.ts`**: 14 tests against a hand-rolled 4-entry local fixture; never loads the real data file. Order-dependent chip-overflow assertions already reference the current 14-category/7-visible-chip state (updated in the prior taxonomy task) and are unaffected by entry-count changes within existing categories.
- **`src/main.test.ts`**: mocks `global.fetch` entirely rather than loading the real file.

### Coverage Assessment

- **Test count**: no dedicated tests target `data/glossary.json`'s actual contents; all glossary-consuming components are tested against local fixtures.
- **Gaps**: no automated test asserts total entry count or per-category counts against the real data file — this is by design (tests are decoupled from live content) and means this task carries no test-writing burden, but also means malformed content would only be caught by `validate-glossary` (schema-level) or manual review (semantic-level), not by the unit-test suite.
- **CI gate**: `npm run validate-glossary` is the only content-level automated check wired into `deploy.yml`; `npm test` is not part of the deploy pipeline.

---

## Coding Patterns

### Naming Conventions

- **`id`**: `<category-slug>-<term-slug>`, lowercase-kebab-case. Category slug strips/collapses punctuation the same way multi-word or slash-containing category names are handled (e.g., `Spring/JEE` → `spring-jee`). No existing precedent for `&`; recommend collapsing it the same way (drop it), consistent with the `/`-dropping precedent — see Key Decisions.
- **`term`**: concept name only, never an ability-statement or bullet transcript.

### Architecture Patterns

- **Content pipeline**: fully decoupled from `src/` runtime code — AI-assisted drafting, rubric-gated human review, schema-validated append. No framework, no build-time content generation.
- **Category taxonomy**: hand-synced across 4 locations (`src/types/glossary.ts` canonical, `content-pipeline/validate-glossary.ts`, `src/components/FilterBar.ts`, `src/types/glossary.test.ts`) — already in sync at 14 values; this task does not need to touch any of them since both target categories already exist everywhere.

---

## Complexity Assessment

This task is content authoring, not code modification — the standard file/dependency/consumer complexity table applies loosely, so it's adapted below.

| Factor | Value | Level |
|--------|-------|-------|
| Code files touched | 0 expected (data-only append) | Low |
| Source material volume | ~109-128 curatable concepts across 3 files | High |
| Consumers (generic, count-agnostic) | 3-4 files, none require changes | Low |
| Test coverage impact | 0 tests touch real data file | N/A / Low risk |
| Cross-reference bookkeeping | 6 spec-flagged + 7 newly-found overlap pairs | Medium-High |

### Overall: Moderate

Zero code risk and zero test risk, but substantial content-authoring volume (~109-128 concepts, one Polish-sourced batch of ~584 lines) and nontrivial cross-reference bookkeeping (13 total overlap pairs to manage via "See also" sentences) make this a content-heavy, judgment-intensive task rather than a mechanically simple one.

---

## Key Findings

### Strengths
- All prerequisite code/schema/UI work for the 2 new categories is already done (prior task, commit `495ff65`) — this task is purely additive content authoring.
- A complete, detailed design spec (`feature-spec.md`) already exists with source mapping, cross-reference policy, and a 3-batch plan.
- The authoring process (`prompt-template.md` + `rubric.md`) and validator (`validate-glossary.ts`) are mature and already include the Polish-source discipline needed for the dna-mapa.md batch.
- No test or CI risk: nothing reads/asserts against the real data file's size or shape; CI only validates structural schema correctness.

### Concerns
- The feature-spec's per-batch concept-count estimates are noticeably lower than the actual raw material (especially Batch 1: spec "~35," actual ~49), which could lead to under-scoping if the batches are planned strictly around the spec's numbers.
- 7 cross-reference pairs with existing `Software Engineering` entries were found that the spec's Section 2.3 audit table doesn't list, creating a risk of inconsistent "See also" treatment if not addressed before or during Batch 3.
- No precedent exists for handling `&` in id-slug generation for "Microservices & Distributed Systems" — needs a consistent judgment call up front, not decided ad hoc per entry.

### Opportunities
- Since this task requires no code changes, effort can go entirely into content quality and rubric compliance.
- The already-existing 4-location category-taxonomy hand-sync (flagged as a known risk in the prior task's own analysis doc) is out of scope here but worth keeping in mind for future taxonomy changes — not actionable in this task.

---

## Impact Assessment

- **Primary changes**: `data/glossary.json` — append ~109-128 new entries (subject to final curation/splitting decisions) across the two empty categories, plus enrichment additions to existing categories (Data Storage, Cloud Engineering, DevOps, Testing) per feature-spec Section 1's mapping table.
- **Related changes**: none anticipated in `src/` or `content-pipeline/` — all supporting code/schema already exists.
- **Test updates**: none required; existing tests are decoupled from the real data file by design.

### Risk Level: Low

The append is structurally additive, validated by existing tooling (`validate-glossary.ts`), and consumed only by generic, count-agnostic UI code. The only real risks are content-quality risks (rubric compliance, cross-reference completeness, Polish-translation discipline) rather than code/test/CI risks.

---

## Recommendations

This is a content-creation task building on an existing, well-specified plan (feature-spec.md Section 5) and mature tooling (prompt-template.md, rubric.md, validate-glossary.ts). Recommended approach:

1. **Follow the existing 3-batch sequence** from feature-spec.md Section 5 unchanged: Batch 1 (`microservice-patterns.md` → Microservices & Distributed Systems), Batch 2 (`system-design terms.md` → mixed enrichment + one Microservices item), Batch 3 (`dna-mapa.md`, Polish → mostly Software Architecture).
2. **Resolve the `&` id-slug judgment call before Batch 1** and apply it consistently across all entries in "Microservices & Distributed Systems" (recommend following the `/`-dropping precedent from `Spring/JEE` → `spring-jee`, giving `microservices-distributed-systems-...`).
3. **Re-baseline batch scope against actual concept counts** rather than the spec's illustrative estimates — expect closer to 49 (not ~35) for Batch 1, and confirm whether the Batch 2 communication-strategy decision tree should be 1 bundled entry or split into 4, before starting.
4. **Extend the cross-reference audit before Batch 3** to include the 7 additionally-found overlap pairs (Monolithic/Microservices Architecture, Domain/Integration Events, Retry Pattern, Transactional Outbox Pattern, Event Storming, Richardson Maturity Model) alongside the spec's original 6, so "See also" treatment is applied uniformly.
5. **Use the standard workflow per entry**: draft → run through rubric.md's 8-point checklist (especially Section 4's Polish-source discipline for dna-mapa.md content) → hand-edit → append to `data/glossary.json` → run `npm run validate-glossary` and fix any reported errors before moving to the next batch.
6. **No source-code or test-code changes are needed** — do not modify `src/types/glossary.ts`, `FilterBar.ts`, `BrowseGrid.ts`, or any test file as part of this task; they already fully support both target categories.

---

## Next Steps

Proceed to gap analysis (or directly to specification/planning, given a design spec already exists) to translate the batch plan and the two open judgment calls (id-slug convention, cross-reference scope) into a concrete execution checklist, then begin Batch 1 content authoring.
