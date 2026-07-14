# Design Decisions

## TL;DR
Selected direction: 2 new categories (14 total) — "Software Architecture" and "Microservices & Distributed Systems" — sourced from the 3 context files, with overlapping concepts kept as separate cross-referenced entries (not merged), a symmetric expand/collapse FilterBar redesign (visible count raised to 7-8), and a batch-by-source-file curation sequence (microservice-patterns.md → system-design terms.md → dna-mapa.md last).

## Key Decisions
- **Taxonomy structure — Alternative A (minimal/consolidated)**: 2 new categories rather than the recommended 6 (Alternative B) or maximal 10-11 (Alternative C) — user prioritized FilterBar simplicity and lower hand-sync/boundary-judgment overhead over maximum drill precision.
- **Dedup strategy — Alternative 3 (keep separate with cross-references)**: overlapping concepts (CQRS, circuit breaker, service discovery, distributed tracing, Event Sourcing, service mesh/sidecar) become separate entries per source/category with "see also" notes, rather than merged single-source-of-truth entries — user prioritized preserving each source's distinct framing over Learn Mode drill-weighting purity.
- **FilterBar UX — UX-2 + UX-1 (symmetric collapse + raised count)**: add a genuine "show less" control and raise `VISIBLE_CATEGORY_CHIP_COUNT` from 5 to 7-8 — cheapest fix that resolves the already-flagged "no way to shrink back" pain point, proportionate to the 14-category outcome.
- **Curation sequencing — Alt Seq-3 (batch by source file)**: curate `microservice-patterns.md` first, `system-design terms.md` second, `dna-mapa.md` last — sequences from clearest/lowest-risk source to hardest (largest, Polish, highest translation-discipline risk).

## Open Questions / Risks
- **Dangling cross-reference risk**: combining "keep separate with cross-references" (dedup) with "batch by source file, Polish last" (sequencing) means a cross-reference written during the microservice-patterns.md batch may point at a dna-mapa-sourced entry that doesn't exist until the final batch. The feature spec (Phase 6) must define how this is handled (e.g., a follow-up cross-reference pass after all 3 batches land, or entries shipped without the cross-reference note until the referenced entry exists).
- No UI affordance exists today for surfacing a "see also" cross-reference on a card — it would live only in prose `description` text unless the spec adds something. Phase 6 must decide whether this is acceptable or needs a lightweight UI treatment.
- "Microservices & Distributed Systems" is likely to become the single largest category in the entire taxonomy (illustratively ~35-45 concepts, rivaling or exceeding today's largest category, Software Engineering at 32) — accepted trade-off of the minimal/consolidated choice, worth confirming entry-count expectations don't surprise the user during curation.
- Exact category boundaries within the 2 new categories (e.g. which dna-mapa subsections land in which of the 2) still need to be finalized in the feature spec.

---

## Selected Approach

Expand Skill Flip's taxonomy from 12 to 14 categories by adding two new, broad categories — "Software Architecture" and "Microservices & Distributed Systems" — that absorb the genuinely-new-territory content from the 3 source files, while folding infrastructure/data-storage-adjacent content (CI/CD, IaC, monitoring, Kafka, Redis, Elasticsearch, CDN, etc.) into the existing DevOps and Cloud Engineering categories. Overlapping concepts across sources are preserved as separate, cross-referenced entries rather than merged. The FilterBar chip UI gets a modest redesign (symmetric collapse + raised visible count) to stay usable at the new category count. Curation of the ~90-110 raw concepts into finished bilingual entries proceeds as a follow-up implementation pass, sequenced source-file by source-file with the Polish-language `dna-mapa.md` curated last.

## Rationale

The user explicitly weighed FilterBar simplicity, lower ongoing hand-sync risk (fewer new literals across the 3 unsynced taxonomy copies identified in `codebase-analysis.md`), and preserving each source's own framing above maximum topical drill-precision and Learn Mode's weighted-drill purity. This is a coherent, internally consistent set of choices: a simpler taxonomy needs fewer boundary decisions, and preserving source framing is naturally paired with not merging sources into single definitions.

## Alternatives Considered

Full detail with pros/cons/trade-off tables: [`analysis/alternatives.md`](alternatives.md) ([HTML](alternatives.html))

- **Taxonomy structure**: Alternative B (source-structure-derived, 6 new/18 total, brainstormer's recommendation) and Alternative C (maximal, 10-11 new/22-23 total) were considered and rejected in favor of Alternative A.
- **Dedup**: Alternative 1 (first-source-wins) and Alternative 2 (merge into richest definition, brainstormer's recommendation) were considered and rejected in favor of Alternative 3.
- **FilterBar UX**: UX-3 (theme clusters), UX-4 (pinned + dropdown), and UX-5 (search-within-filter) were considered; UX-2+UX-1 chosen as proportionate to the 14-category outcome.
- **Curation sequencing**: Seq-1 (category-at-a-time) and Seq-2 (all-decisions-first) were considered; Seq-3 chosen for its easy-to-hard source ordering.

## Trade-Offs Accepted

- **Drill precision for simplicity**: the Curator persona's "drill just this area" need is served less precisely by 2 broad categories than it would be by 6 or 11 narrower ones — a themed pre-interview session on, say, just DDD tactical patterns will require scanning past ADR/modeling content within the same "Software Architecture" category.
- **Entry redundancy for framing fidelity**: choosing not to dedup means the glossary will contain 2 (or more) entries for concepts like CQRS or circuit breaker — acceptable per the user's explicit choice, but a real departure from the "single source of truth" principle the codebase analysis flagged as important for Learn Mode's weighted algorithm.
- **Temporary cross-reference gaps**: the sequencing choice means some cross-references will be incomplete until the final (dna-mapa) curation batch lands — the spec must define an explicit mitigation.

## Key Decisions Per Area

| Area | Decision | Rejected Alternatives |
|---|---|---|
| Taxonomy structure | Alternative A — 2 new categories (14 total) | B (6 new, recommended), C (10-11 new) |
| Cross-source dedup | Alternative 3 — keep separate with cross-references | 1 (first-source-wins), 2 (merge, recommended) |
| FilterBar UX | UX-2 + UX-1 — symmetric collapse + raise count to 7-8 | UX-3 (clusters), UX-4 (dropdown), UX-5 (search) |
| Curation sequencing | Alt Seq-3 — batch by source file, Polish last | Seq-1 (category-at-a-time), Seq-2 (all-decisions-first, hybrid recommended) |
