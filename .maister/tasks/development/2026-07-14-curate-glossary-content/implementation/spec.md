# Specification: Curate Glossary Content (Software Architecture / Microservices & Distributed Systems)

## TL;DR
Author ~109-128 new bilingual `GlossaryEntry` records into `data/glossary.json` for the two currently-empty categories "Software Architecture" and "Microservices & Distributed Systems," sourced from 3 pre-approved context files, executed in 3 sequential batches (English patterns → English terms → Polish mind-map) with a checkpoint after Batch 1. Append "See also" cross-reference sentences to 15 existing entries (19 concept-groups total, some 3-way) so overlapping concepts stay discoverable without merging. Pure content authoring — no source code, tests, UI, or pipeline tooling changes; reuses the existing `content-pipeline/` process and validator unchanged.

## Key Decisions
- Curate every concept actually present in the 3 source files (~109-128), not capped to the originating feature-spec's illustrative ~90-110 estimate — confirmed in Phase 1.
- Existing-entry edits ARE authorized for cross-reference notes (append-only, text-field level) — resolves the originating feature-spec's internal contradiction between "purely additive" (Section 1.4) and its own cross-reference mechanism (Section 2); this spec follows Section 2.
- New `id`s in "Microservices & Distributed Systems" drop the `&`: `microservices-distributed-systems-<term-slug>`, matching the existing `Spring/JEE` → `spring-jee` precedent.
- Batch 2's communication-strategy decision tree becomes 4 independent entries (simple polling, SSE, WebSocket, WebRTC), not 1 bundled entry.
- The cross-reference table below compiles feature-spec.md Section 2.3 (6 groups) + Phase-1 clarifications (7 concepts, one of which — "Monolithic/Microservices Architecture" — resolves to 2 distinct existing entries) + gap-analysis.md's Gap A table (8 groups) into **19 deduplicated concept-groups touching 15 distinct existing entries**. This is a more precise restatement of the "~21 pairs" figure used in prior phases (which counted some 3-way overlaps and multi-entry folds as multiple "pairs"); it is not a scope change — every named concept from all three source documents is represented below.

## Open Questions / Risks
- The systematic term-list diff (new source terms vs. all 159 existing entries) required before/during each batch — especially Batch 3, not yet checked by any prior phase — may surface cross-reference pairs beyond the 19 below. Treat this table as the verified floor, not a ceiling; add rows during curation if the diff finds more, following the same "See also" mechanism.
- Two weaker candidates were surfaced in codebase analysis but deliberately excluded from the table (Access Token vs. `api-development-oauth2`; Application Metrics vs. `api-development-observability`) — distinct enough in context not to need a note. Re-flag during the Batch 1/2 diff only if curation reveals otherwise.

---

## Goal
Populate the two empty taxonomy categories with rubric-compliant, bilingual glossary content curated from `microservice-patterns.md`, `system-design terms.md`, and `dna-mapa.md`, and wire "See also" cross-references so readers can find related concepts split across categories or sources — without any code, schema, or UI change.

## User Stories
- As a Skill Flip learner browsing or drilling Learn Mode, I want the "Software Architecture" and "Microservices & Distributed Systems" categories to contain real, high-quality entries (not an empty chip) so I can study those topics like any other category.
- As a learner who lands on a concept covered from two angles (e.g., Circuit Breaker in both a distributed-systems framing and a general resilience framing), I want a "See also" pointer so I know a related entry exists elsewhere, without the two entries being silently merged or duplicated.

## Core Requirements

1. Author one `GlossaryEntry` per distinct curatable concept found in the 3 source files (~109-128 total, exact count depends on compound-bullet splitting judgment calls made during curation), following `content-pipeline/prompt-template.md` + `content-pipeline/rubric.md` unchanged.
2. Execute in 3 sequential batches, each independently validated before the next starts:
   - **Batch 1** — `microservice-patterns.md` (~49 concepts, all → Microservices & Distributed Systems) → **checkpoint: pause for spot-check** → proceed only after user confirms.
   - **Batch 2** — `system-design terms.md` (~9 concepts: 5 named technologies as enrichment to Data Storage/Cloud Engineering + the 4-way-split communication-strategy tree → Microservices & Distributed Systems).
   - **Batch 3** — `dna-mapa.md` (Polish, largest, ~55-70 concepts after splitting; majority → Software Architecture, remainder enriching Data Storage/Cloud Engineering/DevOps/Testing).
3. Apply the cross-reference policy from the table in "Cross-Reference Compilation" below: append a plain-text "See also: '\<Term\>' in \<Category\>." sentence (and its natural Polish equivalent) to both `description`/`descriptionPl` of every entry named in a concept-group, whether the counterpart is a new entry (new↔new) or an existing entry (new↔existing).
4. Run a systematic term-list diff (all new source terms vs. all 159 pre-existing entries' terms) before/during each batch, with particular attention to Batch 3 (Polish, unchecked by any prior phase) — fold any newly-found overlaps into the same "See also" mechanism using the table below as the template.
5. New `id`s follow `<category-slug>-<term-slug>`, lowercase-kebab-case:
   - `Software Architecture` → `software-architecture-<term-slug>`
   - `Microservices & Distributed Systems` → `microservices-distributed-systems-<term-slug>` (the `&` is dropped, not spelled out or hyphen-substituted)
   - Enrichment entries use the existing target category's established slug (`data-storage-`, `cloud-engineering-`, `devops-`, `testing-`).
6. Run `npm run validate-glossary` after each batch; all entries (new + edited) must pass before the next batch begins.
7. After Batch 3, run the cross-reference audit once: verify every "See also" note's referenced term text exactly matches the final wording of its target entry, with zero dangling references.
8. At task end, correct the pre-existing stale artifacts across 5 files (deferred from Phase 1 specifically so they're fixed against final, accurate numbers): the "12-value enum" test title in `content-pipeline/validate-glossary.test.ts` (title-string edit only — the one explicit exception to the "no test file modified" rule below, since it's a stale label, not test logic), and "159 entries" mentions in narrative docs (`.maister/docs/project/vision.md`, `.maister/docs/project/roadmap.md`, `.maister/docs/project/tech-stack.md`, `.maister/docs/project/architecture.md:49`).

## Reusable Components

### Existing Code to Leverage
- **`content-pipeline/prompt-template.md`** — the exact authoring prompt (term/description/id rules, splitting rule, workflow) reused unchanged for every entry across all 3 batches.
- **`content-pipeline/rubric.md`** — the 8-point quality checklist reused unchanged; Section 4 ("Curating from a Polish source") already exists and directly governs Batch 3's discipline (draft English `description` first from understanding the Polish bullet, then translate to `descriptionPl` — never transcribe/back-translate).
- **`content-pipeline/validate-glossary.ts`** (run via `npm run validate-glossary`) — the schema/uniqueness gate, already recognizes both target categories (`VALID_CATEGORIES` synced in commit `495ff65`); reused unchanged as the per-batch validation step.
- **`src/types/glossary.ts`** — canonical `GlossaryEntry`/`Category`/`Level` shape (see Technical Approach below); read-only reference, not modified by this task.
- **159 existing entries in `data/glossary.json`** — style/quality template. Representative example (`software-engineering-cqrs`):
  ```
  term: "CQRS (Command Query Responsibility Segregation)"
  description: "An architectural pattern that separates the model used to write data (commands) from the model used to read it (queries), allowing each side to be optimized, scaled, or evolved independently."
  descriptionPl: full natural-Polish translation at matching density
  level: "Regular"
  ```
  Confirmed conventions: `term` is a bare concept name (with acronym expansion where relevant); `description` is 1-3 sentences defining mechanism + purpose, never a bullet transcript; `level` skews Senior for architecture/resilience/distributed-system patterns, Junior is rare (6 of 159 today).
- **`FilterBar.ts` / `BrowseGrid.ts` / `LearnMode.ts` / `learnAlgorithm.ts`** — fully generic, category/count-agnostic consumers; new entries surface automatically once appended, zero changes needed.

### New Components Required
None. This task is pure JSON data authoring into an existing file using an existing, already-adequate process. No new script, template, validator rule, or UI affordance is justified — the two target categories and their id-slug conventions already exist in every hand-synced location (`glossary.ts`, `FilterBar.ts`, `validate-glossary.ts`), shipped in the prior taxonomy task (commit `495ff65`).

## Technical Approach

### Schema (unchanged, from `src/types/glossary.ts`)
```
interface GlossaryEntry {
  id: string;            // "<category-slug>-<term-slug>", lowercase-kebab-case, unique
  term: string;           // English concept name, not a bullet/ability-statement transcript
  description: string;    // 1-3 sentences, curator's own words, not source-derived phrasing
  translationPl: string;  // Polish translation of the TERM only
  descriptionPl: string;  // full natural Polish translation of `description`
  category: Category;     // one of 14 values, exact spelling/casing
  level: 'Junior' | 'Regular' | 'Senior';
}
```
Uniqueness constraints enforced by `validate-glossary.ts`: no duplicate `id`; no duplicate `(term, category)` pair (same term name may recur across different categories).

### Source-to-Category Mapping

**Batch 1 — `microservice-patterns.md`** (English, flat bulleted pattern list, no descriptions provided in source — every `description`/`descriptionPl` is authored from the curator's own domain knowledge per rubric rule 2). All ~49 concepts → `Microservices & Distributed Systems`, regardless of the source file's own `#Application patterns` / `#Application Infrastructure patterns` / `#Infrastructure patterns` tags (those tags are not preserved as sub-groupings). Covers: Decomposition (4), Data consistency (Saga, Event Sourcing, CQRS, Aggregate), Data architecture (2), Querying (API composition), Testing (3, includes the 2-bullet Consumer-Driven/-Side Contract Test group — curator judgment on 1 vs. 2 entries per rubric's "don't over-split" guidance), UI composition (2), Observability (7), Cross-cutting concerns (3), Security (Access Token), Communication patterns — transactional messaging (3), communication style (3), reliability (Circuit Breaker), discovery (5 patterns), external API (2), deployment (8, includes Mesh/Sidecar).

**Batch 2 — `system-design terms.md`** (English, short list + 1 decision tree):

| Item | Destination |
|---|---|
| Kafka | Cloud Engineering (enrichment) |
| Redis | Data Storage (enrichment) |
| Elasticsearch (AWS OpenSearch) | Data Storage (enrichment) |
| Zookeeper | Cloud Engineering (enrichment) |
| CDN | Cloud Engineering (enrichment) |
| Communication-strategy tree → Simple Polling, SSE, WebSocket, WebRTC (4 separate entries per binding decision) | Microservices & Distributed Systems |

**Batch 3 — `dna-mapa.md`** (Polish, 584 lines, largest and most compound-bullet-heavy — apply rubric Section 4's Polish-source discipline and Section 6's compound-bullet-splitting guidance throughout):

| Source section | Destination |
|---|---|
| Aplikacyjna > Model Domenowy (building blocks: Polityki, Widoki, Zdarzenia, Komendy, Reguły, Aktorzy, Agregaty) | Software Architecture |
| Aplikacyjna > Transaction Script / Model bogaty / Model anemiczny | Software Architecture |
| Aplikacyjna > Wzorce (event transport: After commit, Store and forward; event publication; CQRS) | Software Architecture |
| Aplikacyjna > Mikrojądro / Modularyzacja / Heksagonalna / Pipes & Filters | Software Architecture |
| Aplikacyjna > Persystencja > Klasyczne trzy warstwy | Software Architecture (judgment call, approved — architecture pattern, not persistence-specific) |
| Aplikacyjna > Persystencja (ACID, BASE, RDBMS/NewSQL/NoSQL types, ORM) | Data Storage (enrichment) |
| Systemowa > System rozproszony (fallacies, costs/reasons, ESB, Mikroserwisy/Monolit/Modularny monolit trade-offs) | Microservices & Distributed Systems |
| Systemowa > Komunikacja (delivery semantics, Design-for-Failure, contract testing, REST maturity/Richardson, request-reply, distributed tracing, service discovery, load balancing) | Microservices & Distributed Systems |
| Systemowa > Infrastruktury > Chmura / Kontenery / Kubernetes / Service Mesh | Cloud Engineering (enrichment) |
| Systemowa > Infrastruktury > Deployment Pipeline > Testowanie infrastruktury (chaos engineering, performance/load/stress testing) | Testing (enrichment) |
| Systemowa > Infrastruktury > Deployment Pipeline > Continuous Delivery / Monitorowanie | DevOps (enrichment) |
| Systemowa > Infrastruktury > Infrastructure as Code | DevOps (enrichment) |
| Rzwiązania > Decyzje (ADR, Podejmowanie) | Software Architecture |
| Rzwiązania > Wizualizacja (UML, BPMN, C4) | Software Architecture |
| Rzwiązania > Przestrzeń rozwiązania (Event Storming, Bounded Contexts, Ubiquitous Language) | Software Architecture |
| Rzwiązania > Przestrzeń problemu (Domena, Subdomeny, Big Picture Event Storming) | Software Architecture |

### Cross-Reference Compilation

**Mechanism**: append a plain-text sentence to both `description` and `descriptionPl` naming the counterpart entry's exact `term` text and `category` — e.g. `"See also: 'Circuit Breaker Pattern' in Software Engineering."` — no schema change, no clickable link. Every entry in a concept-group below gets a note pointing at every other member of its group.

**19 deduplicated concept-groups** (compiled from feature-spec.md Section 2.3, Phase-1 clarifications, and gap-analysis.md's Gap A, cross-verified against the live `data/glossary.json`):

| # | Concept | New entry/entries (category) | Existing entry touched (id — term — category) | Group type |
|---|---|---|---|---|
| 1 | CQRS | Software Architecture (dna-mapa) + Microservices & Distributed Systems (microservice-patterns) | `software-engineering-cqrs` — CQRS (Command Query Responsibility Segregation) — Software Engineering | 3-way |
| 2 | Circuit Breaker | Microservices & Distributed Systems ×2 (dna-mapa's Design-for-Failure framing + microservice-patterns' Reliability framing) | `software-engineering-circuit-breaker` — Circuit Breaker Pattern — Software Engineering | 3-way (2 same-category new + 1 existing) |
| 3 | Service Discovery | Microservices & Distributed Systems — dna-mapa's 1-concept framing folds as shared context into the 5 microservice-patterns entries (client-side discovery, server-side discovery, self-registration, 3rd-party registration, service registry) | none | Fold-in, not a 6th entry (per originating spec Section 2.4) |
| 4 | Distributed Tracing | Microservices & Distributed Systems ×2 (dna-mapa's Komunikacja + microservice-patterns' Observability) | none | Same-category, new↔new |
| 5 | Event Sourcing | Software Architecture (dna-mapa) + Microservices & Distributed Systems (microservice-patterns) | `software-engineering-event-sourcing` — Event Sourcing — Software Engineering | 3-way |
| 6 | Service Mesh / Sidecar | Cloud Engineering (dna-mapa, enrichment) + Microservices & Distributed Systems ×2 (microservice-patterns' `mesh`, `sidecar`) | none | New↔new, 3 entries |
| 7 | Saga | Microservices & Distributed Systems (microservice-patterns) | `software-engineering-saga-pattern` — Saga Pattern — Software Engineering | 2-way |
| 8 | API Gateway | Microservices & Distributed Systems (microservice-patterns) | `api-development-gateway` — API Gateway — API Development | 2-way |
| 9 | Aggregate | Microservices & Distributed Systems (microservice-patterns' "Aggregate") + Software Architecture (dna-mapa's "Agregaty") | none | New↔new |
| 10 | Consumer-Driven / Consumer-Side Contract Test | Microservices & Distributed Systems (microservice-patterns, 1-2 entries per curator's splitting judgment) | `testing-contract-testing` — Consumer-Driven Contract Testing (CDC/Pact) — Testing | 2-way (or 3-way if split into 2) |
| 11 | Externalized Configuration | Microservices & Distributed Systems (microservice-patterns) | `spring-jee-externalized-configuration` — Externalized Configuration (@Value / application.properties) — Spring/JEE | 2-way |
| 12 | Monolithic Architecture | Microservices & Distributed Systems (dna-mapa's "Monolit") | `software-engineering-monolith` — Monolithic Architecture — Software Engineering | 2-way |
| 13 | Microservices Architecture | Microservices & Distributed Systems (dna-mapa's "Mikroserwisy") | `software-engineering-microservices` — Microservices Architecture — Software Engineering | 2-way |
| 14 | Domain Events | Software Architecture (dna-mapa's event-publication framing) | `software-engineering-domain-events` — Domain Events — Software Engineering | 2-way |
| 15 | Integration Events | Software Architecture (dna-mapa's event-transport framing: After commit, Store and forward) | `software-engineering-integration-events` — Integration Events — Software Engineering | 2-way |
| 16 | Retry Pattern | Microservices & Distributed Systems (dna-mapa's Design-for-Failure "retry") | `software-engineering-retry-pattern` — Retry Pattern — Software Engineering | 2-way |
| 17 | Transactional Outbox Pattern | Microservices & Distributed Systems (microservice-patterns' transactional messaging / transactional log tailing / polling publisher) | `software-engineering-transactional-outbox` — Transactional Outbox Pattern — Software Engineering | 2-way |
| 18 | Event Storming | Software Architecture ×2 (dna-mapa's Process-Level + Big-Picture variants) | `software-engineering-event-storming` — Event Storming — Software Engineering | 3-way (2 same-category new + 1 existing) |
| 19 | Richardson Maturity Model | Microservices & Distributed Systems (dna-mapa's REST maturity levels) | `api-development-richardson-maturity-model` — Richardson Maturity Model (REST Maturity Levels) — API Development | 2-way |

15 distinct existing entries are touched (rows 1,2,5,7,8,10,11,12,13,14,15,16,17,18,19), each getting a "See also" sentence appended to `description` and `descriptionPl` only — no other change to their existing text or meaning. Rows 3, 4, 6, 9 are new-entry-only groups (no existing-entry edit).

### Execution Sequence
1. **Batch 1**: curate `microservice-patterns.md` (~49-57 entries after splitting) → run the term-list diff against all 159 existing entries → apply relevant Batch-1 cross-reference notes from the table above (rows 1,2,3,4,5,6,7,8,9,10,11,16,17,19 touch Batch-1 content) → `npm run validate-glossary` → **pause for user spot-check** before proceeding.
2. **Batch 2**: curate `system-design terms.md` (~9 entries, communication tree split 4 ways) → term-list diff → `npm run validate-glossary`.
3. **Batch 3**: curate `dna-mapa.md` (~55-70 entries) → term-list diff (first check of this batch — not covered by any prior phase) → apply remaining cross-reference rows (1,5,12,13,14,15,18) plus any newly-found pairs → `npm run validate-glossary`.
4. **Final audit**: verify every "See also" note across all touched entries (new and existing) names its target's exact final `term` text, zero dangling references → correct the stale "12-value enum" test title and "159 entries" doc mentions.

## Implementation Guidance

### Testing Approach
- No new automated tests are required or in scope — `src/types/glossary.test.ts`, `content-pipeline/validate-glossary.test.ts`, and `src/components/BrowseGrid.test.ts` all use hand-rolled fixtures decoupled from the real `data/glossary.json` (confirmed in codebase analysis) and need no changes.
- Verification is `npm run validate-glossary` (schema/uniqueness gate) run after each batch, plus manual rubric review per entry (2-8 entries reviewed per curation session/step group is a reasonable pacing checkpoint, matching this project's existing step-group-sized review cadence) and the final cross-reference audit pass.
- Optionally run `npm test` (Vitest) locally as a sanity check per project convention, though it is not CI-enforced for this content change.

### Standards Compliance
- **`standards/global/minimal-implementation.md`** — no speculative tooling, scripts, or schema additions; this task builds only the content itself using the process that already exists.
- **`standards/global/coding-style.md`** (DRY) — the cross-reference mechanism reuses the existing plain-text-sentence convention rather than introducing a new linking field or ID system.
- **`standards/global/conventions.md`** — content pipeline changes (rubric.md's Polish-source subsection) are already permanent/committed, not one-off; this task's only doc updates are the deferred stale-reference corrections at the end, batched into one final step per Phase-1's explicit decision.
- No frontend/CSS/accessibility/responsive standards apply — no UI files are touched.

## Out of Scope
- Any change to `src/types/glossary.ts`, `src/components/FilterBar.ts`, `content-pipeline/validate-glossary.ts`, or any test file's logic — all already support both target categories (shipped in commit `495ff65`). The sole exception is Requirement 8's one-line title-string fix in `content-pipeline/validate-glossary.test.ts` ("12-value" → "14-value"), which changes no test logic or assertions.
- New pipeline automation, scripts, or tooling — the existing manual/AI-assisted `prompt-template.md` + `rubric.md` workflow is reused unchanged.
- New visual assets, UI components, or clickable cross-reference links — "See also" stays plain text per the originating spec's deliberate minimum-viable choice.
- Any category taxonomy change, recategorization, or restructuring — the 14-category taxonomy is final and already shipped.
- Changing the meaning of any existing entry beyond appending the single "See also" sentence to `description`/`descriptionPl`.
- Mid-task fixes to the stale "12-value enum" test title or "159 entries" doc mentions — both deferred to the single final cleanup step (Requirement 8).

## Success Criteria
- `npm run validate-glossary` passes with zero errors after each batch and at task completion.
- Every curated concept from all 3 source files has exactly one corresponding `GlossaryEntry` (or, for cross-referenced concepts, the specific entry count defined in the table above — e.g., 2 for most rows, 5 for Service Discovery — never silently deduplicated to 1).
- Every entry passes the `content-pipeline/rubric.md` 8-point checklist, including Section 4's Polish-source discipline for all Batch 3 entries.
- All 19 cross-reference groups (plus any additional pairs found via the term-list diff) resolve bidirectionally with zero dangling "See also" references, verified in the final audit pass.
- New `id`s follow `<category-slug>-<term-slug>`; `Microservices & Distributed Systems` entries consistently use `microservices-distributed-systems-` with no exceptions.
- `data/glossary.json` contains no duplicate `id` and no duplicate `(term, category)` pair after all batches land.
- Final entry count and category counts are accurately reflected in the corrected `vision.md`/`roadmap.md`/`tech-stack.md`/`architecture.md` mentions and the `validate-glossary.test.ts` test title.
- No `src/` file, and no `content-pipeline/*.ts` file's logic, is modified — verified by `git diff --stat` showing only `data/glossary.json`, the 4 narrative-doc files, and `validate-glossary.test.ts`'s single title-string line touched.
