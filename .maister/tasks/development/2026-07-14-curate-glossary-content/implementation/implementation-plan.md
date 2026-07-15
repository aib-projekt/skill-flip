# Implementation Plan: Curate Glossary Content (Software Architecture / Microservices & Distributed Systems)

## TL;DR
6 task groups execute spec.md's 3 batches sequentially, each batch split into 2 source-subsection sub-groups: Group 1-2 (Batch 1, `microservice-patterns.md`, ~49 entries, ends with the mandatory user checkpoint), Group 3 (Batch 2, `system-design terms.md`, ~9 entries), Group 4-5 (Batch 3, `dna-mapa.md`, ~55-70 entries), Group 6 (final cross-reference audit + 5-file stale-doc cleanup). All 6 groups write the same file (`data/glossary.json`) and are strictly sequential — no parallelism is possible or desired here. "Tests" are replaced by `npm run validate-glossary` runs (one per group, 6 total) plus per-entry rubric self-review.

## Key Decisions
- **Corrected two misplaced rows in spec.md's Execution Sequence**: rows 16 (Retry Pattern) and 19 (Richardson Maturity Model) are listed under "Batch 1" in spec.md's step 1, but both concepts' only new-entry side is sourced from `dna-mapa.md` (Batch 3) — `microservice-patterns.md` contains neither "retry" nor REST maturity content. Applying their "See also" note during Batch 1 would create a dangling reference (the target entry wouldn't exist yet). This plan applies both rows during Group 4 (Batch 3a) instead. See the Cross-Reference Resolution Schedule below.
- **Identified 6 cross-batch concept-groups requiring a two-pass write**, not caught explicitly in spec.md's Execution Sequence: rows 1 (CQRS), 2 (Circuit Breaker), 5 (Event Sourcing) are 3-way groups whose Software Architecture side isn't created until Batch 3 — Batch 1 can only write the existing-entry pointer, not the new↔new pointer. Rows 4 (Distributed Tracing) and 9 (Aggregate) have both new-entry sides split across Batch 1 and Batch 3 with no existing entry at all — Batch 1 writes nothing for these, Batch 3 writes both sides. Row 6 (Service Mesh/Sidecar) lets Batch 1 link mesh↔sidecar immediately but defers the Cloud Engineering (dna-mapa) side to Batch 3. Each is scheduled explicitly below so no group attempts to reference an entry that doesn't exist yet.
- **Batch 1 and Batch 3 each split into 2 sub-groups by source subsection** (per orchestrator guidance), keeping each sub-group's closing steps (cross-reference application + `npm run validate-glossary`) at the sub-group level rather than only once per full batch — stricter than spec.md's stated minimum ("after each batch"), not a deviation, and catches schema errors earlier.
- **No separate "Test Review & Gap Analysis" group added** despite 6 groups total — Group 6 (final cross-reference audit + stale-doc cleanup) is spec.md's own Requirement 7/8 and Execution Sequence step 4, and structurally fills the same role (final verification pass) adapted for content curation. Adding a second generic testing group would duplicate this work.
- Task-item creation (Phase 4.5) was skipped: `TaskCreate`/`TaskUpdate` tools are not available in this environment. Group-level tracking exists only via this plan's checkboxes.

## Open Questions / Risks
- **Exact per-section entry counts are estimates, not targets.** Spec.md's own audit (Finding 5) already flags its ranges as loose (Batch 1 is exactly 49, but Batch 3's "~55-70" depends entirely on curator splitting judgment calls under rubric.md Section 6). This plan's sub-group entry counts are for pacing only — actual splits happen at curation time.
- **Batch 3's term-list diff is the first check of that material against the full corpus** (spec.md Requirement 4) — it may surface cross-reference pairs beyond the 19 in the table + the 2 relocated rows. Group 4 and Group 5 must both run it and fold in anything found, using the same "See also" mechanism.
- **Existing entries accumulate multiple "See also" appends across groups** (e.g. `software-engineering-cqrs` gets one append in Group 2 and a second in Group 4). Group 6's audit must confirm both appends survived and read coherently together, not just that each one individually is well-formed.
- All groups write `data/glossary.json` — inherently serial. This plan does not propose any parallel execution.

## Overview
Total Steps: 42
Task Groups: 6
Expected Validation Runs: 6 (`npm run validate-glossary`, one per group)
Expected New Entries: ~109-128 (exact count is a curation-time outcome, not a pre-set target)
Expected Existing-Entry Edits: 15 distinct entries, up to 2 appends each for the 3 cross-batch 3-way groups

## Cross-Reference Resolution Schedule

Restates spec.md's 19-row Cross-Reference Compilation table, but grouped by **which task group can correctly resolve it**, so no group writes a "See also" note pointing at an entry that doesn't exist yet. Full row detail (exact existing-entry ids/terms) stays in `spec.md`; this table only adds the resolution schedule.

| Row | Concept | Resolved fully in | Why |
|---|---|---|---|
| 1 | CQRS | Group 2 (partial: existing SE entry only) → **Group 4 completes** (adds new↔new SA↔MS note, backfills Group 2's entry) | 3-way; SA side is Batch 3 |
| 2 | Circuit Breaker | Group 2 (partial: existing SE entry only) → **Group 4 completes** (adds new↔new, backfills Group 2's entry) | 3-way; one MS side is Batch 3 |
| 3 | Service Discovery fold-in | Group 2 | No separate entry created; dna-mapa's framing is folded as context into the 5 Batch-1 discovery entries — informational only |
| 4 | Distributed Tracing | **Group 4 only** (both new sides — Batch 1's and Batch 3's — get their reciprocal note written when the Batch-3 side is created; Group 2 writes the Batch-1 entry with no note since nothing exists yet to point at) | New↔new, cross-batch, no existing entry |
| 5 | Event Sourcing | Group 2 (partial: existing SE entry only) → **Group 4 completes** | 3-way; SA side is Batch 3 |
| 6 | Service Mesh / Sidecar | Group 2 (partial: mesh↔sidecar note each other, both Batch 1) → **Group 5 completes** (adds Cloud Engineering/dna-mapa side, backfills Group 2's 2 entries) | 3 entries total, 1 is Batch 3 |
| 7 | Saga | Group 2 | Single-batch |
| 8 | API Gateway | Group 2 | Single-batch |
| 9 | Aggregate | **Group 4 only** (same pattern as row 4) | New↔new, cross-batch, no existing entry |
| 10 | Consumer-Driven / Consumer-Side Contract Test | Group 2 | Single-batch |
| 11 | Externalized Configuration | Group 2 | Single-batch |
| 12 | Monolithic Architecture | Group 4 | Single-batch (dna-mapa only) |
| 13 | Microservices Architecture | Group 4 | Single-batch (dna-mapa only) |
| 14 | Domain Events | Group 4 | Single-batch (dna-mapa only) |
| 15 | Integration Events | Group 4 | Single-batch (dna-mapa only) |
| 16 | Retry Pattern | **Group 4** (relocated — see Key Decisions) | Single-batch (dna-mapa only); spec.md misfiled this under Batch 1 |
| 17 | Transactional Outbox Pattern | Group 2 | Single-batch |
| 18 | Event Storming | Group 5 | Single-batch (dna-mapa only, both variants in Rzwiązania) |
| 19 | Richardson Maturity Model | **Group 4** (relocated — see Key Decisions) | Single-batch (dna-mapa only); spec.md misfiled this under Batch 1 |

Group 6's final audit re-verifies every row above (all 19 + the 2 relocations) plus anything the Batch 2/3 term-list diffs found, confirming zero dangling references per spec.md Requirement 7.

## Implementation Steps

### Task Group 1: Batch 1a — microservice-patterns.md (Decomposition → Security)
**Dependencies:** None
**Files to Modify:** `data/glossary.json`
**Estimated Steps:** 6

- [x] 1.0 Complete Batch 1a curation
  - [x] 1.1 Re-read `.maister/tasks/product-design/2026-07-13-add-new-categories-terms/context/microservice-patterns.md` lines 1-38 (Decomposition, Data patterns, Testing, UI, Observability, Cross-cutting concerns, Security) alongside `content-pipeline/prompt-template.md` and `content-pipeline/rubric.md`
  - [x] 1.2 Curate Decomposition (4) + Data patterns: consistency/architecture/querying (7: Saga, Event Sourcing, CQRS, Aggregate, shared database, database per service, API composition) — 11 entries, `category: "Microservices & Distributed Systems"`, `id: microservices-distributed-systems-<term-slug>`
  - [x] 1.3 Curate Testing (3: consumer-driven contract test, consumer-side contract test, service component test — apply rubric's "don't over-split" judgment to the first two) + UI (2: server-side page fragment composition, client-side UI composition) — 5 entries
  - [x] 1.4 Curate Observability (7: audit logging, application metrics, distributed tracing, health checks API, exception tracking API, log aggregation, log deployments and changes) + Cross-cutting concerns (3: service templates, microservice chassis, externalized configuration) + Security (1: access token) — 11 entries
  - [x] 1.5 Self-review all ~27 entries against `rubric.md`'s 8-point checklist (term is a concept name not a bullet transcript; description authored from own knowledge, not the source bullet, since this source has no prose to transcribe from; `level` skews Senior per the project's existing convention; schema mechanics)
  - [x] 1.6 Run `npm run validate-glossary`, fix any reported schema/uniqueness errors before proceeding

**Acceptance Criteria:**
- ~27 new entries added, all `category: "Microservices & Distributed Systems"`, all ids `microservices-distributed-systems-<term-slug>`
- Every entry passes rubric.md's 8-point checklist
- `npm run validate-glossary` exits with zero errors
- No cross-reference notes written yet in this group (deferred to Group 2's closing steps, per spec.md's per-batch cross-reference sequencing)

---

### Task Group 2: Batch 1b — microservice-patterns.md (Communication Patterns) + Batch 1 close-out
**Dependencies:** Group 1
**Files to Modify:** `data/glossary.json`
**Estimated Steps:** 8

- [x] 2.0 Complete Batch 1b curation and close out Batch 1
  - [x] 2.1 Curate Communication patterns > Transactional messaging (3: transactional messaging, transactional log tailing, polling publisher) + Communication style (3: messaging, remote procedure invocation, domain specific) + Reliability (1: circuit breaker) — 7 entries
  - [x] 2.2 Curate Discovery (5: client-side discovery, self-registration, service registry, server-side discovery, 3rd party registration) + External API (2: API gateway, backends for frontends) — 7 entries
  - [x] 2.3 Curate Deployment (8: multiple services per host, single service per host, serverless deployment, service deployment platform, service per container, service per VM, mesh, sidecar) — 8 entries
  - [x] 2.4 Run the term-list diff: compare all ~49 Batch-1 terms (1a + 1b) against all 159 pre-existing entries' terms; confirm the Cross-Reference Resolution Schedule rows below are complete and flag any additional overlaps found
  - [x] 2.5 Apply "See also" notes per the Cross-Reference Resolution Schedule, Batch-1-resolvable rows only: full resolution for rows 7 (Saga), 8 (API Gateway), 10 (Contract Test), 11 (Externalized Configuration), 17 (Transactional Outbox) — append to both the new entry and the named existing entry; partial resolution (existing-entry pointer only) for rows 1 (CQRS), 2 (Circuit Breaker), 5 (Event Sourcing) — the new↔new SA-side pointer is added later by Group 4; partial resolution (mesh↔sidecar only) for row 6 — the Cloud Engineering pointer is added later by Group 5; row 3 is informational only, no entry edit; rows 4 and 9 get **no** cross-reference note yet (nothing exists to point at until Group 4)
  - [x] 2.6 Self-review all Batch-1b entries and all cross-reference edits against `rubric.md`'s checklist
  - [x] 2.7 Run `npm run validate-glossary`, fix any errors
  - [x] 2.8 STOP — present a spot-check summary (total Batch-1 entry count, 3-5 sample entries across different sections, list of cross-reference edits made to existing entries) and wait for explicit user confirmation before Group 3 starts, per spec.md Core Requirement 2's mandatory Batch-1 checkpoint

**Acceptance Criteria:**
- ~22 new entries added in this group (~49 total across Group 1 + Group 2), all in "Microservices & Distributed Systems"
- Rows 7, 8, 10, 11, 17 fully resolved bidirectionally; rows 1, 2, 5, 6 correctly show only their Batch-1-resolvable half; rows 4, 9 show no premature note
- `npm run validate-glossary` exits with zero errors
- User has explicitly confirmed the checkpoint before any Group 3 work begins — this is a hard gate, not a formality

---

### Task Group 3: Batch 2 — system-design terms.md
**Dependencies:** Group 2 (post-checkpoint confirmation)
**Files to Modify:** `data/glossary.json`
**Estimated Steps:** 5

- [x] 3.0 Complete Batch 2 curation
  - [x] 3.1 Curate the 5 named-technology enrichment entries: Kafka → Cloud Engineering, Redis → Data Storage, Elasticsearch (AWS OpenSearch) → Data Storage, Zookeeper → Cloud Engineering, CDN (Content Delivery Network) → Cloud Engineering — using the established id convention for each target category (`cloud-engineering-<slug>`, `data-storage-<slug>`)
  - [x] 3.2 Curate the communication-strategy decision tree as 4 independent entries per spec.md Key Decision: Simple Polling, Server-Sent Events (SSE), WebSocket, WebRTC — all `category: "Microservices & Distributed Systems"`, capturing each branch's latency/bidirectionality/peer-to-peer trade-off in its own description
  - [x] 3.3 Run the term-list diff for these 9 terms against all 159 pre-existing + ~49 Batch-1 entries — no known cross-reference rows target Batch 2 content, but confirm nothing new surfaced (found+resolved 1 new pair: Kafka ↔ Kafka Protocol)
  - [x] 3.4 Self-review all 9 entries against `rubric.md`'s checklist
  - [x] 3.5 Run `npm run validate-glossary`, fix any errors

**Acceptance Criteria:**
- 9 new entries added: 5 enrichment entries in their existing target categories, 4 communication-strategy entries in "Microservices & Distributed Systems"
- `npm run validate-glossary` exits with zero errors
- No entry silently bundles the 4-way communication-strategy tree into fewer than 4 entries

---

### Task Group 4: Batch 3a — dna-mapa.md (Aplikacyjna + Systemowa)
**Dependencies:** Group 3
**Files to Modify:** `data/glossary.json`
**Estimated Steps:** 9

- [x] 4.0 Complete Batch 3a curation
  - [x] 4.1 Curate Aplikacyjna > Model Domenowy (Elementy konstrukcyjne: Polityki, Widoki, Zdarzenia, Komendy, Reguły, Aktorzy, Agregaty) + Transaction Script / Model bogaty / Model anemiczny — all → Software Architecture; apply rubric Section 4's Polish-source discipline (draft English `description` first, then translate) throughout this and every remaining Batch-3 step
  - [x] 4.2 Curate Aplikacyjna > Wzorce (Transport zdarzeń: After commit, Store and forward; Publikacja zdarzeń; Command Query Responsibility Segregation) + Mikrojądro / Modularyzacja / Heksagonalna (porty i adaptery) / Pipes & Filters — all → Software Architecture
  - [x] 4.3 Curate Aplikacyjna > Persystencja: Klasyczne trzy warstwy → Software Architecture (judgment call per spec.md, already approved); ACID, BASE, Bazy danych (RDBMS/NewSQL/NoSQL types), Object-Relational Mapping → Data Storage (enrichment) — only ACID/BASE/NewSQL added as genuinely new; RDBMS/NoSQL-types/ORM correctly left unduplicated (already covered by pre-existing Data Storage entries)
  - [x] 4.4 Curate Systemowa > System rozproszony (Błędne założenia, Koszty, Cechy, Enterprise Service Bus, Powody rozproszenia) + Mikroserwisy / Monolit / Modularny monolit trade-offs — all → Microservices & Distributed Systems
  - [x] 4.5 Curate Systemowa > Komunikacja (delivery semantics — fire and forget/at-most-once/at-least-once, publish-subscribe/point-to-point; Design-for-Failure — metrics/fallback/cache/rate limits/circuit breaker/retry; contract testing; REST maturity/Richardson levels; request-reply sync/async; distributed tracing; service discovery; load balancing) — all → Microservices & Distributed Systems
  - [x] 4.6 Apply "See also" notes per the Cross-Reference Resolution Schedule: **complete** rows 1 (CQRS), 2 (Circuit Breaker), 5 (Event Sourcing) by adding the new↔new SA↔MS pointer and backfilling Group 2's Batch-1 entries; **write both sides** of rows 4 (Distributed Tracing) and 9 (Aggregate) for the first time, linking this group's new entry to Group 1's/Group 2's corresponding entry; **author** rows 12 (Monolithic Architecture), 13 (Microservices Architecture), 14 (Domain Events), 15 (Integration Events), 16 (Retry Pattern), 19 (Richardson Maturity Model) against their named existing entries — row 4 resolved via fold-in (dna-mapa's "śledzenie" content merged into the existing Group-1 Distributed Tracing entry's descriptionPl rather than a duplicate entry, since it's the same concept)
  - [x] 4.7 Run the term-list diff against all 159 pre-existing + ~58 Batch-1/2 new entries; this is the first systematic check of any dna-mapa.md content per spec.md Requirement 4 — fold in any newly found overlaps using the same mechanism (orchestrator spot-checked SOLID/ESB/duplicate-pair safety independently after a session interruption — see work-log)
  - [x] 4.8 Self-review all Batch-3a entries and cross-reference edits against `rubric.md`'s checklist, Section 4 discipline mandatory
  - [x] 4.9 Run `npm run validate-glossary`, fix any errors

**Acceptance Criteria:**
- All Software Architecture and Microservices & Distributed Systems entries sourced from Aplikacyjna/Systemowa are added, plus Data Storage enrichment entries from Persystencja
- Rows 1, 2, 4, 5, 9, 12, 13, 14, 15, 16, 19 are all fully resolved bidirectionally with correct final term text; Group 1/2's earlier partial notes for rows 1, 2, 5 now have their second pointer
- Every entry (English or Polish-sourced) passes rubric.md's 8-point checklist, with Section 4's anti-transcription check specifically verified for every dna-mapa-sourced entry
- `npm run validate-glossary` exits with zero errors

---

### Task Group 5: Batch 3b — dna-mapa.md (Rzwiązania + Infrastruktury) + Batch 3 close-out
**Dependencies:** Group 4
**Files to Modify:** `data/glossary.json`
**Estimated Steps:** 8

- [x] 5.0 Complete Batch 3b curation and close out Batch 3
  - [x] 5.1 Curate Rzwiązania > Decyzje (ADR, Podejmowanie: Proces/Metryki/Drivery) + Wizualizacja (UML — sequence/deployment/activity/component diagrams; BPMN; C4 — landscape/context/container/component) — all → Software Architecture
  - [x] 5.2 Curate Rzwiązania > Przestrzeń rozwiązania (Proces Level Event Storming, Bounded Contexts, Ubiquitous Language) + Przestrzeń problemu (Domena, Subdomeny, Big Picture Event Storming) — all → Software Architecture
  - [x] 5.3 Curate Infrastruktury > Chmura (cloud service models/deployment models/vendor strategy) / Kontenery / Kubernetes / Service Mesh — all → Cloud Engineering (enrichment)
  - [x] 5.4 Curate Infrastruktury > Deployment Pipeline: Testowanie infrastruktury (chaos engineering, performance/load/stress testing) → Testing (enrichment); Continuous Delivery (deployment vs. release, software delivery performance, CI/CD tactics) + Monitorowanie (centralized logging, post-mortem) → DevOps (enrichment); Infrastructure as Code (immutable infrastructure, config testing, GitOps, secrets management) → DevOps (enrichment)
  - [x] 5.5 Apply "See also" notes per the Cross-Reference Resolution Schedule: **complete** row 6 (Service Mesh/Sidecar) by adding the Cloud Engineering side and backfilling Group 2's mesh/sidecar entries; **author** row 18 (Event Storming) linking the Process-Level and Big-Picture variants curated in 5.2 to `software-engineering-event-storming`
  - [x] 5.6 Run the term-list diff covering the remainder of dna-mapa.md against all 159 pre-existing + all Batch-1/2/3a entries; fold in any newly found overlaps (found+resolved 4 new pairs: Bounded Context↔Decompose-by-Subdomain, Bounded Context↔Service-per-Team, Subdomain↔Decompose-by-Subdomain, Kubernetes↔Service-Deployment-Platform)
  - [x] 5.7 Self-review all Batch-3b entries and cross-reference edits against `rubric.md`'s checklist, Section 4 discipline mandatory
  - [x] 5.8 Run `npm run validate-glossary`, fix any errors — this closes out all 3 batches (292 entries, zero errors)

**Acceptance Criteria:**
- All Software Architecture entries sourced from Rzwiązania are added, plus Cloud Engineering/Testing/DevOps enrichment entries from Infrastruktury
- Row 6 fully resolved bidirectionally (all 3 entries reference each other correctly); row 18 fully resolved
- Every entry passes rubric.md's 8-point checklist including Section 4 discipline
- `npm run validate-glossary` exits with zero errors
- All 3 batches' curation work is complete; `data/glossary.json` contains the full ~109-128 new entries plus all cross-reference edits to the 15 existing entries

---

### Task Group 6: Final Cross-Reference Audit & Stale-Doc Cleanup
**Dependencies:** Group 5 (all 3 batches complete)
**Files to Modify:** `data/glossary.json`, `content-pipeline/validate-glossary.test.ts`, `.maister/docs/project/vision.md`, `.maister/docs/project/roadmap.md`, `.maister/docs/project/tech-stack.md`, `.maister/docs/project/architecture.md`
**Estimated Steps:** 6

- [x] 6.0 Complete final audit and cleanup
  - [x] 6.1 Run the final cross-reference audit (spec.md Requirement 7): for all 19 Cross-Reference Compilation rows (including the 2 relocated rows 16/19) plus any rows added by the Batch 2/3 term-list diffs, verify every "See also" note's referenced term text exactly matches the target entry's final wording, with zero dangling references (66 EN + 66 PL individual references checked across the full file)
  - [x] 6.2 Fix any dangling or mismatched references found in 6.1 — 1 mismatch found and fixed (testing-contract-testing's Polish note quoted English terms instead of translationPl); 0 dangling references
  - [x] 6.3 Compute final totals directly from the completed `data/glossary.json`: overall entry count and per-category counts (Software Architecture: 34, Microservices & Distributed Systems: 70)
  - [x] 6.4 Update `content-pipeline/validate-glossary.test.ts:38` — change "...outside the 12-value enum" to "...outside the 14-value enum" (title-string only, no assertion/logic change, the sole exception to "no test file modified")
  - [x] 6.5 Update the 5 stale "159 entries" mentions with the final count (292): vision.md, roadmap.md (x2), tech-stack.md, architecture.md — "12 Engineering Ladder categories" phrase preserved untouched
  - [x] 6.6 Run `npm run validate-glossary` once more as the final full-file gate (292 entries, zero errors); also ran `npm test` (67/67 pass) and the retitled test file directly (5/5 pass)

**Acceptance Criteria:**
- Zero dangling "See also" references across the entire file
- `git diff --stat` shows only `data/glossary.json`, the 4 narrative docs, and `validate-glossary.test.ts`'s single title line touched — no `src/` file and no `content-pipeline/*.ts` file's logic modified
- All 5 stale-count mentions reflect the actual final count, not an estimate
- `npm run validate-glossary` passes with zero errors as the final gate

## Execution Order

1. Group 1 — Batch 1a (6 steps)
2. Group 2 — Batch 1b + checkpoint (8 steps, depends on 1) — **hard stop for user confirmation**
3. Group 3 — Batch 2 (5 steps, depends on 2, post-checkpoint)
4. Group 4 — Batch 3a (9 steps, depends on 3)
5. Group 5 — Batch 3b (8 steps, depends on 4)
6. Group 6 — Final audit + cleanup (6 steps, depends on 5)

Strictly sequential — every group writes `data/glossary.json`, and the cross-reference schedule requires each batch's entries to exist before later batches can complete their reciprocal notes. No group in this plan can run in parallel with another.

## Standards Compliance

Follow standards from `.maister/docs/standards/`:
- `global/minimal-implementation.md` — no speculative tooling, scripts, or schema additions; this task builds only the content itself using the process that already exists
- `global/coding-style.md` (DRY) — the cross-reference mechanism reuses the existing plain-text-sentence convention rather than introducing a new linking field or ID system
- `global/conventions.md` — the only doc updates are the deferred stale-reference corrections batched into Group 6, per spec.md's explicit decision
- No frontend/CSS/accessibility/responsive standards apply — no UI files are touched in this task

## Notes

- Content-Driven, Not Test-Driven: each group's "tests" are `npm run validate-glossary` (schema/uniqueness gate) plus manual rubric.md self-review per entry — no new automated tests are in scope (confirmed in codebase analysis: no test reads the real `data/glossary.json`)
- Run Incrementally: validate after every sub-group, not just once per full batch
- Follow the Cross-Reference Resolution Schedule exactly: writing a note before its target entry exists produces a dangling reference that Group 6 will have to catch and fix — better to defer correctly the first time
- Mark Progress: check off steps as completed
- Reuse First: `content-pipeline/prompt-template.md`, `content-pipeline/rubric.md`, and `content-pipeline/validate-glossary.ts` are reused completely unchanged across all 6 groups
