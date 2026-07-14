# Feature Specification: New Taxonomy Categories, FilterBar Redesign & Curation Plan

## TL;DR
Expands Skill Flip's taxonomy from 12 to 14 categories ("Software Architecture", "Microservices & Distributed Systems"), with a full source-to-category mapping for all 3 raw context files, a "keep separate with cross-references" dedup policy, a FilterBar chip UX redesign (symmetric collapse + raised visible count), and a batch-by-source-file curation plan. Implementation-ready: dependency-ordered code changes are specified for handoff to `/maister:development`. Full entry curation (~90-110 concepts) is explicitly out of scope — this spec produces the plan, not the finished entries.

## Key Decisions
- 2 new categories, not 6 or 11 — Alternative A from `design-decisions.md`, prioritizing FilterBar simplicity over drill precision.
- Overlapping concepts across sources become separate, cross-referenced entries — no merging.
- Three-layer architecture is categorized under "Software Architecture" (not Data Storage) despite dna-mapa filing it under "Persystencja" — it's an architecture pattern, not persistence-specific.
- Performance/chaos/load testing content is categorized under existing "Testing" (not DevOps) — it's a testing methodology.

## Open Questions / Risks
- Dangling cross-reference risk (see Section 2) — mitigation defined below, not yet validated against actual curated content.
- No UI affordance exists today for surfacing cross-references on a card — Section 2 defines the minimum viable treatment.
- "Microservices & Distributed Systems" will likely be the largest category in the app (~35-45 concepts) — accepted trade-off, not a defect.

---

## Section 1: Category Taxonomy Structure

### 1.1 New Categories

| Category | Scope |
|---|---|
| `Software Architecture` | Domain modeling (DDD building blocks, model styles), architecture styles (Microkernel, Modularization, Hexagonal, Pipes & Filters, three-layer), architecture decision-making (ADR, decision process), modeling/visualization (UML, BPMN, C4), DDD strategic patterns (Event Storming, Bounded Contexts, Ubiquitous Language, Subdomains) |
| `Microservices & Distributed Systems` | All `microservice-patterns.md` patterns (decomposition, data consistency, testing, UI composition, observability, cross-cutting concerns, security, communication, discovery, deployment), distributed-systems theory (fallacies, ESB, monolith/microservices trade-offs), communication patterns (REST maturity, sync/async, service discovery, load balancing, the polling/SSE/WebSocket/WebRTC decision tree) |

Both are appended at the end of the existing 12-category list, in this order: `..., 'Software Architecture', 'Microservices & Distributed Systems'`. This order (not alphabetical, not reverse) is chosen so the two thematically-related new categories sit adjacent to each other in the chip list.

### 1.2 Existing-Category Enrichment

| Existing Category | New content enriching it | Current count → illustrative post-enrichment |
|---|---|---|
| `Data Storage` | ACID/BASE, RDBMS/NewSQL/NoSQL types, ORM approaches (dna-mapa Persystencja, excl. three-layer); Redis, Elasticsearch/OpenSearch (system-design terms.md) | 22 → ~28-32 |
| `Cloud Engineering` | Cloud models/capabilities/vendor strategy, Containers, Kubernetes, Service Mesh *(enrichment-angle entry, distinct from the Microservices category's mesh/sidecar deployment-pattern entries)*; Kafka, Zookeeper, CDN (system-design terms.md) | 8 → ~16-20 |
| `DevOps` | Continuous Delivery (deployment vs. release, DORA metrics, trunk-based dev, git flow), Infrastructure as Code, Monitoring (centralized logging, post-mortems) | 4 → ~10-14 |
| `Testing` | Testing-infrastructure content: chaos engineering, performance/load/stress testing | 15 → ~18-20 |

### 1.3 Full Source-to-Category Mapping

**From `dna-mapa.md`** (Polish, 585 lines):

| Source section | Destination |
|---|---|
| Aplikacyjna > Model Domenowy (building blocks, aggregates) | Software Architecture |
| Aplikacyjna > Transaction Script / Model bogaty / Model anemiczny | Software Architecture |
| Aplikacyjna > Wzorce (event transport/publication, CQRS) | Software Architecture *(CQRS here is a separate entry from microservice-patterns.md's CQRS — see Section 2)* |
| Aplikacyjna > Mikrojądro | Software Architecture |
| Aplikacyjna > Modularyzacja | Software Architecture |
| Aplikacyjna > Heksagonalna | Software Architecture |
| Aplikacyjna > Pipes & Filters | Software Architecture |
| Aplikacyjna > Persystencja > Klasyczne trzy warstwy | Software Architecture *(judgment call, approved)* |
| Aplikacyjna > Persystencja (all else: ACID/BASE/DB types/ORM) | Data Storage (enrichment) |
| Systemowa > System rozproszony (fallacies, costs/reasons, ESB, Mikroserwisy/Monolit/Modularny monolit trade-offs) | Microservices & Distributed Systems |
| Systemowa > Komunikacja | Microservices & Distributed Systems |
| Systemowa > Infrastruktury > Chmura / Kontenery / Kubernetes / Service Mesh | Cloud Engineering (enrichment) |
| Systemowa > Infrastruktury > Deployment Pipeline > Testowanie infrastruktury (chaos, performance/load/stress) | Testing (enrichment) |
| Systemowa > Infrastruktury > Deployment Pipeline > Continuous Delivery | DevOps (enrichment) |
| Systemowa > Infrastruktury > Deployment Pipeline > Monitorowanie | DevOps (enrichment) |
| Systemowa > Infrastruktury > Inftastructure as Code | DevOps (enrichment) |
| Rzwiązania > Decyzje (ADR, Podejmowanie) | Software Architecture |
| Rzwiązania > Wizualizacja (UML/BPMN/C4) | Software Architecture |
| Rzwiązania > Przestrzeń rozwiązania (Event Storming, Bounded Contexts) | Software Architecture |
| Rzwiązania > Przestrzeń problemu (Domena, Subdomeny, Big Picture Event Storming) | Software Architecture |

**From `microservice-patterns.md`** (English, all ~35 patterns): every pattern → `Microservices & Distributed Systems`, regardless of its original `#Application patterns` / `#Application Infrastructure patterns` / `#Infrastructure patterns` tag (those tags are collapsed under Alternative A, not preserved as sub-groupings).

**From `system-design terms.md`** (English):

| Item | Destination |
|---|---|
| Kafka | Cloud Engineering (enrichment) |
| Redis | Data Storage (enrichment) |
| Elasticsearch (AWS OpenSearch) | Data Storage (enrichment) |
| Zookeeper | Cloud Engineering (enrichment) |
| CDN | Cloud Engineering (enrichment) |
| Communication-strategy decision tree (polling/SSE/WebSocket/WebRTC) | Microservices & Distributed Systems |

### 1.4 Acceptance Criteria
- [ ] `Category` type in `src/types/glossary.ts` includes exactly 14 values, with `'Software Architecture'` and `'Microservices & Distributed Systems'` appended after `'Software Engineering'` (the current last value).
- [ ] Every raw concept from the 3 context files is assigned to exactly one destination per the tables above (or, for dedup'd concepts, to multiple destinations per Section 2's resolution).
- [ ] No existing category's entries are modified or recategorized — this is purely additive.

---

## Section 2: Cross-Source Dedup & Cross-Reference Handling

### 2.1 Cross-Reference Mechanism

Since the `GlossaryEntry` schema stays unchanged (no new fields, no ID-linking system) and no new UI component was chosen in Phase 5, cross-references are implemented as a **plain-text sentence appended to `description`/`descriptionPl`** (e.g., "See also: 'Circuit Breaker' in Microservices & Distributed Systems.") — not a clickable link, a wayfinding note for the reader. This is a deliberate minimum-viable choice consistent with the "design + plan, not full curation" scope boundary; it requires zero code changes.

### 2.2 Dangling-Reference Mitigation

Because these are plain-text notes (not IDs), a "dangling" reference isn't a technical break — it just means the note points at a term that doesn't exist yet mid-sequence (a real risk given Section 5's batch-by-source-file, Polish-last curation order). Mitigation: a **cross-reference audit pass** happens once, after all 3 curation batches complete — every "See also" note is checked against the final term list for exact-name match and corrected if the referenced term's final wording differs. This is a lightweight editorial pass, not new tooling, and is a required step in Section 5's sequence (not optional).

### 2.3 Known Overlaps and Resolution

| Concept | Entry 1 | Entry 2 | Note direction |
|---|---|---|---|
| CQRS | Software Architecture (domain-modeling framing, dna-mapa) | Microservices & Distributed Systems (data-consistency-pattern framing, microservice-patterns.md) | Bidirectional |
| Circuit Breaker | Microservices & Distributed Systems (dna-mapa's Design-for-Failure framing) | Microservices & Distributed Systems (microservice-patterns.md's Reliability framing) | Bidirectional, same-category (see 2.4) |
| Service Discovery | Microservices & Distributed Systems (dna-mapa's 1-concept framing) | Microservices & Distributed Systems (microservice-patterns.md's 5 named patterns: client-side discovery, server-side discovery, self-registration, 3rd-party registration, service registry) | dna-mapa's framing folded into each of the 5 as shared context, not a 6th entry (see 2.4) |
| Distributed Tracing | Microservices & Distributed Systems (dna-mapa's Komunikacja) | Microservices & Distributed Systems (microservice-patterns.md's Observability) | Bidirectional, same-category (see 2.4) |
| Event Sourcing | Software Architecture (dna-mapa's event-publication framing) | Microservices & Distributed Systems (microservice-patterns.md's explicit pattern) | Bidirectional |
| Service Mesh / Sidecar | Cloud Engineering (dna-mapa's dedicated subsection, infra-enrichment framing) | Microservices & Distributed Systems (microservice-patterns.md's `mesh`/`sidecar` deployment patterns) | Bidirectional |

### 2.4 Same-Category Overlap Resolution

For Circuit Breaker, Service Discovery, and Distributed Tracing — both sources' treatments land in the *same* new category (Microservices & Distributed Systems). Curators still keep them as separate entries per the Phase 5 decision, but the "See also" note becomes a same-category pointer naming the specific angle covered by the other entry, rather than a cross-category pointer. For Service Discovery specifically: follow the more granular source (5 separate pattern entries: client-side discovery, server-side discovery, self-registration, 3rd-party registration, service registry), with dna-mapa's single-concept framing folded into each of the 5 as shared "why this matters" context — not written as its own 6th entry.

### Acceptance Criteria
- [ ] Every overlap in the table above produces the specified number of entries (2 for most rows, 5 for Service Discovery), never silently deduplicated to 1.
- [ ] Every entry with a "See also" note names the target entry's exact term text.
- [ ] A cross-reference audit is performed once, after all 3 curation batches (Section 5) complete, before this task is considered done.

---

## Section 3: Code Changes — Taxonomy Mechanism

Dependency-ordered, per `codebase-analysis.md`'s findings on the 3 hand-synced taxonomy copies:

1. **`src/types/glossary.ts:10-22`** (canonical source) — append `'Software Architecture'` and `'Microservices & Distributed Systems'` to the `Category` union, in that order, after `'Software Engineering'`. Update the file's doc-comment (currently states the taxonomy is a "12-value... must still treat all 12 values as first-class" closed set) to reflect 14 values and drop the "closed taxonomy" framing.
2. **`src/components/FilterBar.ts:13-26`** — append the same 2 values, same order, to `ALL_CATEGORIES`. (The chip-rendering/count logic itself needs no changes here — it's already generic; Section 4 covers the separate UX redesign of the overflow/collapse behavior.)
3. **`content-pipeline/validate-glossary.ts:20-33`** — append the same 2 values, same order, to `VALID_CATEGORIES`, keeping the file's existing hand-mirror comment accurate.
4. **`src/types/glossary.test.ts:61-77`** — update the hardcoded 12-item fixture array to 14 items (add both new categories) and update both count assertions (`toHaveLength(12)` → `toHaveLength(14)`, `Set.size` check → `14`).
5. **`src/components/BrowseGrid.test.ts:143-191`** — update order-dependent assertions: `'Microservices & Distributed Systems'` (not `'Software Engineering'`) is now the last category in `ALL_CATEGORIES`. These assertions will additionally need updating for Section 4's visible-count change (5→7-8) regardless of taxonomy — both changes should land in the same commit/PR to avoid an intermediate broken state.
6. **`data/glossary.json`** — no schema/shape change. New entries are added over the Section 5 curation batches; this spec doesn't add entries itself.
7. **Non-blocking documentation updates** (stale prose, no functional impact): `.maister/docs/project/roadmap.md` (lines mentioning "12 categories"), `content-pipeline/source/engineering-ladder.md` (lines 36-39's "remaining 11 categories" enumeration) — update to mention the taxonomy now has 14 categories, 2 beyond the original Engineering Ladder source.

### Acceptance Criteria
- [ ] `npm run validate-glossary` passes with the updated `VALID_CATEGORIES`.
- [ ] `npm test` (vitest) passes with updated `glossary.test.ts` and `BrowseGrid.test.ts`.
- [ ] `tsc -b` type-checks cleanly (additive union change, no exhaustiveness checks exist to break per `codebase-analysis.md`).
- [ ] The 3 taxonomy copies (`glossary.ts`, `FilterBar.ts`, `validate-glossary.ts`) contain identical 14-value lists in identical order.

---

## Section 4: FilterBar Chip/Overflow UX Redesign

### 4.1 Visible Count

`VISIBLE_CATEGORY_CHIP_COUNT` changes from `5` to **`7`** — with 14 total categories, 7 visible / 7 in overflow is an even split, and avoids the overflow chip ever collapsing just 1-2 items.

### 4.2 Symmetric Collapse Behavior

The existing `showAllCategories` boolean (currently write-once, `false → true`) becomes genuinely bidirectional:
- Collapsed state (`showAllCategories = false`): first 7 chips visible + a trailing chip reading `+7 more`.
- Clicking `+7 more` sets `showAllCategories = true`, re-renders all 14 chips, and the trailing chip's label changes to `Show less`.
- Clicking `Show less` sets `showAllCategories = false`, re-renders back to the 7-visible state.
- The same DOM element is reused for both states (relabeled), not two separate elements — minimal change to `renderChips()`'s existing structure (`src/components/FilterBar.ts:100-125`).

### 4.3 Selection State Independence

Collapsing/expanding never changes which categories are selected as filters — a category selected while expanded stays selected (and still contributes to the active-filter count) even if its chip scrolls out of the visible-7 after collapsing.

### 4.4 Persistence

The expand/collapse UI state does **not** persist across sessions (resets to collapsed on page load) — this is a presentational convenience, not a filter selection, so it's out of scope for the existing `localStorage`-persisted filter state (category/level selections, per commit `7dbb9af`). Keeping this distinction avoids conflating two different kinds of state.

### Acceptance Criteria
- [ ] With 14 categories and `VISIBLE_CATEGORY_CHIP_COUNT = 7`, exactly 7 chips are visible by default plus one `+7 more` trailing chip.
- [ ] Clicking `+7 more` reveals all 14 chips and relabels the trailing chip to `Show less`.
- [ ] Clicking `Show less` re-collapses to the 7-visible state and relabels back to `+7 more`.
- [ ] Category selection state survives expand/collapse toggling in both directions.
- [ ] Expand/collapse state resets to collapsed on page reload (not persisted).
- [ ] New test coverage for the collapse interaction; `BrowseGrid.test.ts`'s positional assertions updated for the new visible-count and category order (Section 3).

---

## Section 5: Content Curation Plan

### 5.1 Sequencing

| Batch | Source | Illustrative volume | Target categories |
|---|---|---|---|
| 1 | `microservice-patterns.md` | ~35 patterns | Microservices & Distributed Systems (all), plus 3 dedup'd concepts shared with Batch 3 (CQRS, Event Sourcing, Service Mesh — written now, cross-reference added/verified in the final audit) |
| 2 | `system-design terms.md` | ~10-12 concepts | Cloud Engineering, Data Storage (enrichment); Microservices & Distributed Systems (communication decision tree) |
| 3 | `dna-mapa.md` | ~45-65 concepts (largest, most compound bullets to split) | Software Architecture (majority), Data Storage/Cloud Engineering/DevOps/Testing (enrichment) |

Each batch follows the existing `content-pipeline/prompt-template.md` + `rubric.md` process unchanged: draft `term`/`description` from scratch, translate to `descriptionPl`, assign `id` as `<category-slug>-<term-slug>`, validate via `npm run validate-glossary`, human review before appending to `data/glossary.json`.

### 5.2 Polish-Source Discipline

Permanent addition to `content-pipeline/rubric.md` (not a one-off note — applies to Batch 3 and any future Polish-sourced content): a new subsection stating — draft the English `description` first, synthesized from understanding the Polish notes (not translated word-for-word), then independently write `descriptionPl` as a natural translation of the finished English text. The rubric's existing anti-transcription "test" (would the source bullet's wording be findable inside the description) applies to `descriptionPl` against the *Polish source*, not just to `description` against a (nonexistent) English source — this is the specific failure mode this discipline prevents.

### 5.3 Compound-Bullet Splitting

`dna-mapa.md`'s outline format has many multi-concept bullets (e.g. "Cechy" lists under each pattern often bundle 3-5 distinct sub-ideas) — apply the existing rubric guidance on splitting compound bullets into one `GlossaryEntry` per distinct concept, using judgment consistent with existing entries' granularity.

### 5.4 Level Assignment

Per existing rubric guidance — default to source placement (e.g., foundational DDD building blocks → Regular; advanced distributed-systems trade-offs and ADR process → Senior), sanity-checked against sibling terms already in `data/glossary.json`, with `Junior`-level entries expected to be rare (matches the existing 6-entry Junior count across all 159 current entries).

### 5.5 Final Step

The Section 2.2 cross-reference audit runs once, after Batch 3 completes — this is the last step of the curation plan, not a separate follow-up task.

### Acceptance Criteria
- [ ] Batches are curated and shipped in the stated order; each batch's entries pass `npm run validate-glossary` before the next batch begins.
- [ ] `content-pipeline/rubric.md` gains a permanent "Curating from a Polish source" subsection before Batch 3 starts.
- [ ] Cross-reference audit is performed and documented as complete after Batch 3.

---

## Section 6: Acceptance Criteria & Success Metrics (Overall)

Ties back to `problem-statement.md`'s success criteria — this section is the design task's overall "definition of done," distinct from each section's own acceptance criteria above.

**Design-task deliverables (this workflow's output)**:
- [ ] Approved 14-category taxonomy with full source-to-category mapping (Section 1).
- [ ] Dedup/cross-reference policy resolved for all known overlaps (Section 2).
- [ ] Dependency-ordered code change list (Section 3).
- [ ] FilterBar redesign specified and prototyped (Section 4 + Phase 7 mockups).
- [ ] Curation plan with sequencing and Polish-source discipline (Section 5).
- [ ] Product brief assembled and approved (Phase 8), ready for `/maister:development` handoff.

**Follow-up implementation-pass success metrics** (out of scope for this workflow, tracked for the next phase):
- All 3 curation batches complete, `npm run validate-glossary` and `npm test` passing throughout.
- Zero silent taxonomy drift between the 3 hand-synced copies at any point (verified per-batch, not just at the end).
- Cross-reference audit completed with zero unresolved "See also" mismatches.
- `content-pipeline/rubric.md`'s Polish-source subsection exists and is referenced during Batch 3.

**Non-goals** (explicitly out of scope, per `problem-statement.md`'s constraints):
- Full curation of all ~90-110 entries as part of this design workflow.
- Any hierarchical/nested taxonomy restructuring.
- Collapsing the 3 hand-synced taxonomy copies into one shared source of truth (flagged in `codebase-analysis.md` as a valid future refactor, deliberately deferred).
- Per-category color/icon differentiation in the UI.
