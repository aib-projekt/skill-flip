# Design Context

## TL;DR
Skill Flip's 12-category taxonomy is a flat, hand-maintained TypeScript union duplicated in 3 places, with fully data-driven rendering — adding categories is mechanically cheap in code, but the real work is curating ~90-110 raw, undefined, overlapping concepts from 3 heterogeneous source files (one 585-line Polish architecture mind-map, two bare English term lists) into properly defined, bilingual, deduped glossary entries per the existing curation rubric. Category naming/grouping and source-to-category mapping are open design decisions, not yet resolved.

## Key Decisions
- Extend the existing flat `Category` union/array pattern rather than introducing a hierarchical taxonomy — the rendering, badging, and validation mechanisms already scale to N categories with zero new branching logic.
- New categories must be appended at the end of `ALL_CATEGORIES`/`Category` (not inserted mid-list) to avoid breaking `BrowseGrid.test.ts`'s order-dependent chip-overflow assertions.

## Open Questions / Risks
- How many new categories, and what are they named/scoped? (See Cross-Reference Insights below for candidate groupings.)
- Overlapping concepts across the 3 source files (CQRS, circuit breaker, service discovery, distributed tracing) need dedup before curation.
- `dna-mapa.md` is entirely in Polish, inverting the app's EN-primary curation direction — risk of `descriptionPl` becoming too close a paraphrase of source notes.
- `FilterBar`'s "5 visible + overflow, no re-collapse" chip UX was designed for 12 categories; growing to 16-20 pushes more into the ever-open overflow chip — a UX question for the design phase.
- Some new-source content (CI/CD, IaC, monitoring, cloud) could enrich existing thin categories (DevOps: 4 entries, Data Storage: 22, Management: 4, Problem Solving: 4) instead of spawning overlapping new ones.

---

## Project Documentation Summary

**Vision**: Skill Flip is a client-only bilingual (EN/PL) flashcard lexicon for Java/Backend engineering terms, serving equally as a personal study tool and a recruiter-facing portfolio piece. Content is curated (rewritten in the curator's own words via a documented AI-assisted pipeline), not transcribed verbatim from source material. Current direction (next 6-12 months) is primarily **content maintenance** — adding/refining entries as the source taxonomy evolves — which is exactly the shape of this task.

**Roadmap**: Current state is 159 entries across the full 12-category "Engineering Ladder" taxonomy, Learn Mode + Browse fully shipped, CI/CD to GitHub Pages working. "Ongoing glossary maintenance" is the #1 listed high-priority enhancement — but it was framed as adding entries within existing categories, not adding wholly new categories, so this task extends beyond what the roadmap explicitly anticipated.

**Tech Stack**: Vite + vanilla TypeScript (strict mode), zero runtime dependencies, no framework, no backend/database. Content lives in static `data/glossary.json`; validated by a standalone `content-pipeline/validate-glossary.ts` script deliberately decoupled from `src/` (zero shared imports, to keep it out of the Vite bundle).

**Architecture**: Component-factory pattern (no framework). UI in `src/components/` (DOM-owning), logic in `src/lib/` (pure, testable). `FilterBar` renders category chips generically off a data array. `content-pipeline/` is fully decoupled offline tooling for authoring glossary entries.

## Codebase Analysis Summary

Full report: [`analysis/codebase-analysis.md`](codebase-analysis.md)

- `Category` is a flat, hardcoded 12-value TypeScript string-literal union (`src/types/glossary.ts:10-22`), duplicated by hand in **three unsynced locations** with no shared source of truth: `src/types/glossary.ts` (canonical), `src/components/FilterBar.ts` (`ALL_CATEGORIES`, drives chip rendering/order), and `content-pipeline/validate-glossary.ts` (`VALID_CATEGORIES`, the actual data-validation gate).
- All rendering (chip generation, counts, badge CSS classing via a generic slugifier) is **fully data-driven** — no per-category branching exists anywhere in `src/`. Mechanically, adding a category means adding a literal to 2-3 arrays/unions plus updating 2 test files. This is a small, low-risk code change.
- No color/icon differentiation exists per category today (all badges share one flat color); no display-label layer exists (the raw `Category` string is shown verbatim in chips and badges).
- `src/types/glossary.test.ts` hard-codes a 12-item array and asserts `toHaveLength(12)` — this will **not** fail automatically when `Category` gains members; it goes silently stale.
- `src/components/BrowseGrid.test.ts` has **order-dependent** assertions (expects "Software Engineering" as the 12th/last category, "Cloud Engineering" within the first 5 visible chips) — new categories must be appended at the very end of the list.
- `npm test` does **not** run `validate-glossary`; only the GitHub Actions deploy workflow catches a category mismatch between the 3 hand-synced copies, and only on push to `main`.
- Current per-category entry counts (159 total): Software Engineering 32, API Development 26, Data Storage 22, Java 20, Spring/JEE 17, Testing 15, Cloud Engineering 8, Soft Skills 5, DevOps 4, Management 4, Problem Solving 4, Mentoring 2.
- The curation process (`content-pipeline/prompt-template.md` + `rubric.md`) already exists, is documented, and references `src/types/glossary.ts` as canonical — no edits needed to the curation *docs* themselves for a taxonomy change, only to the type/array literals.

## User-Supplied Context Summary

Three raw source files were dropped into `context/` — none are ready-made glossary entries; all require full curation (definitions written from scratch, bilingual translation, category assignment):

1. **`dna-mapa.md`** (585 lines, Polish) — a dense personal architecture mind-map: DDD building blocks (aggregates, domain model styles, CQRS/event sourcing), architecture styles (Hexagonal, Microkernel, Pipes & Filters, layered), modularization (coupling/cohesion), distributed systems (fallacies of distributed computing, ESB, microservices vs. monolith vs. modular monolith), communication patterns (REST maturity, sync/async, service discovery, load balancing), decision-making (ADR, metrics, drivers), modeling/visualization (UML, BPMN, C4, Event Storming, Bounded Contexts), and infrastructure (cloud models, containers, Kubernetes, Service Mesh, CI/CD, IaC, monitoring, post-mortems). Outline-only — headers and bullet fragments, no curated definitions. Substantially overlaps existing DevOps/Cloud Engineering/Software Engineering categories as well as opening genuinely new territory (DDD, distributed-systems theory, architecture decision-making).
2. **`microservice-patterns.md`** (68 lines, English) — a microservices.io-style pattern catalog, already **bracket-tagged by its own author into 3 groups**: `#Application patterns` (decomposition, data consistency, testing, UI composition), `#Application Infrastructure patterns` (observability, cross-cutting concerns, messaging, communication, discovery), `#Infrastructure patterns` (service registry, API gateway, deployment). Bare pattern names, no definitions.
3. **`system-design terms.md`** (27 lines, English) — a short list: Kafka, Redis, Elasticsearch/OpenSearch, Zookeeper, CDN, plus an informal communication-strategy decision tree (polling/SSE/WebSocket/WebRTC). Smallest source; plausibly fits into existing categories (Data Storage, Cloud Engineering) rather than needing its own dedicated category.

## Cross-Reference Insights

- **`microservice-patterns.md`'s own 3-way tag split is a ready-made candidate category grouping** for that source's ~35 pattern names — worth carrying into the idea-generation phase rather than re-deriving groupings from scratch.
- **`dna-mapa.md` and `microservice-patterns.md` overlap significantly** on microservices/distributed-systems content (CQRS, circuit breaker, service discovery, distributed tracing, Saga all appear in both) — these need deliberate dedup rather than becoming near-duplicate entries under two different categories.
- **`system-design terms.md` and parts of `dna-mapa.md`'s infrastructure section overlap existing thin categories** (DevOps: 4 entries, Data Storage: 22, Cloud Engineering: 8) — a live question for Phase 2 is whether some source content should enrich an existing category instead of creating a new one just for volume's sake.
- **`dna-mapa.md` is the only Polish-language source**, which inverts the app's existing EN-primary curation workflow (write `description` first, then translate to `descriptionPl`) — curators will need to synthesize an English definition from Polish notes first, then independently write `descriptionPl`, taking care not to let it become a too-close paraphrase of the original Polish bullet (which the rubric's anti-transcription rule would flag).

## Implications for Design

- **Category naming/grouping is the central open design decision** for this task — it should be resolved explicitly in Phase 2 (Problem Exploration) and Phase 5 (Idea Convergence), using `microservice-patterns.md`'s built-in 3-way split and `dna-mapa.md`'s natural section groupings (Application Architecture, Distributed Systems/Microservices, Decision-Making & Modeling, Infrastructure/Cloud) as raw material, while deciding what folds into existing categories vs. becomes new ones.
- **Content curation volume (~90-110 raw candidate concepts) is the dominant cost driver**, not code — the specification phase (Phase 6) should scope how much curation happens as part of this design task vs. being handed off as a separate content-pipeline execution pass.
- **New categories must be appended at the end of the taxonomy list** to avoid breaking existing order-dependent tests — a concrete constraint for the specification phase.
- **The chip-overflow UX (5 visible + growing overflow)** should be explicitly revisited if the new category count pushes total categories well past 12-14 — flagged as a UX question, not pre-decided here.
