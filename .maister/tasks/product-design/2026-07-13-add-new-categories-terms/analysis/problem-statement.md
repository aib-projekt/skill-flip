# Problem Statement

## TL;DR
Skill Flip's fixed 12-category taxonomy needs to expand to cover architecture/microservices/system-design notes the user has accumulated outside the app's original "Engineering Ladder" scope. This design task produces the new-category structure, a source-to-category curation plan, and a FilterBar chip UX redesign — not the ~90-110 finished glossary entries themselves, which are a follow-up implementation pass.

## Key Decisions
- Derive new category boundaries from the source material's own structure (microservice-patterns.md's 3-way tag split, dna-mapa.md's natural sections) rather than imposing a predefined scheme or a single catch-all category — rationale: the source authors already grouped this content meaningfully.
- Content that clearly fits an existing category (DevOps, Data Storage, Cloud Engineering, etc.) enriches that category instead of spawning an overlapping new one — rationale: avoids redundant near-duplicate categories and strengthens currently-thin categories.
- This task's deliverable is the taxonomy design + curation plan + FilterBar redesign, not full entry curation — rationale: curating ~90-110 raw concepts into bilingual entries is substantial content work that shouldn't block or bloat the design decision itself.
- No fixed ceiling on new-category count — rationale: let category count fall out of natural source groupings rather than an arbitrary target.
- `is_ui_focused` flipped to `true` mid-exploration (Phase 7 visual prototyping activated) — rationale: user explicitly chose to address FilterBar chip/overflow UX as part of this task rather than deferring it.

## Open Questions / Risks
- Exact new category names/boundaries are not yet decided — that's the subject of Phase 4 (Idea Generation) and Phase 5 (Convergence).
- Overlapping concepts across the 3 source files (CQRS, circuit breaker, service discovery, distributed tracing, etc.) still need an explicit per-concept dedup decision.
- Curating from the Polish `dna-mapa.md` source requires curators to draft English first, then independently translate to Polish — a process discipline that must be documented clearly in the curation plan so it isn't skipped in the follow-up implementation pass.

---

## Full Problem Statement

Skill Flip's glossary taxonomy is a closed, 12-category list sourced from the "Engineering Ladder" skills framework (159 entries total). The user — the app's primary study-tool user and curator — has accumulated substantial personal study notes covering software architecture (DDD, CQRS, hexagonal/microkernel architecture, modularization), distributed systems and microservices patterns, and system-design infrastructure (Kafka, Redis, CDN, communication strategies) that fall outside this original taxonomy. These notes exist as 3 raw files (one 585-line Polish mind-map, two bare English term/pattern lists) with no curated definitions, significant overlap both across the 3 files and with existing thin categories, and no assigned category structure.

The problem is twofold:
1. **Taxonomy design**: decide what new categories these notes should become (or which existing categories they should enrich instead), following the source material's own natural groupings rather than an imposed scheme.
2. **UX accommodation**: the app's `FilterBar` chip UI (5 visible + an ever-growing, non-collapsible overflow chip) was designed for exactly 12 categories and needs an explicit redesign decision now that the category count is intentionally growing beyond that.

This design task resolves both problems at the specification level — producing an approved category structure, a source-to-category curation plan (including dedup decisions), and a prototyped FilterBar redesign — and hands off a dependency-ordered implementation plan. It does **not** produce the ~90-110 finished bilingual glossary entries; that curation work follows in a separate implementation pass using the app's existing `content-pipeline/prompt-template.md` + `rubric.md` process.

## Constraints

1. **Taxonomy mechanism stays flat.** No hierarchical/nested category structure — new categories are additional values in the same flat `Category` union/array pattern already in use (`src/types/glossary.ts`, `src/components/FilterBar.ts`, `content-pipeline/validate-glossary.ts`).
2. **Append-only ordering.** New categories must be added at the end of the existing 12-item list, never inserted mid-list, to avoid breaking `src/components/BrowseGrid.test.ts`'s order-dependent chip-overflow assertions (which currently assume "Software Engineering" is last).
3. **Existing-category enrichment takes priority over new-category proliferation.** Source content that clearly belongs to an existing category (e.g. CI/CD/IaC/monitoring content → DevOps; Kafka/Redis/Elasticsearch → Data Storage or Cloud Engineering) enriches that category rather than becoming part of a new, overlapping one.
4. **Scope boundary: design + plan, not full curation.** The deliverable is the taxonomy structure, source-to-category mapping with dedup decisions, a written curation plan, and the FilterBar redesign — not the finished glossary entries. Entry curation is explicitly out of scope for this workflow's output.
5. **Bilingual curation discipline for the Polish source.** Any curation guidance produced for `dna-mapa.md` content must specify: draft the English `description` first (synthesized understanding of the Polish notes, not a translation), then independently write `descriptionPl` as a natural translation of the English text — preserving the existing rubric's anti-transcription rule.
6. **No category-count ceiling**, but the FilterBar redesign must remain usable at whatever count the taxonomy design lands on.

## Success Criteria

1. An approved list of new category names, each with a clear boundary/rationale, derived from the source material's natural structure.
2. A complete source-to-category mapping covering all 3 context files — every raw concept assigned to either a new category or an existing one, with explicit resolution for concepts that appear in multiple sources (dedup decisions, not silent duplication).
3. A written curation plan referencing the existing `content-pipeline/prompt-template.md`/`rubric.md` process, scoped and ready to hand off to a follow-up implementation/content pass — including explicit Polish-source handling guidance.
4. A prototyped, user-approved FilterBar chip/overflow redesign (Phase 7) that remains usable at the new, larger category count.
5. A dependency-ordered list of concrete code changes (`Category` union → `ALL_CATEGORIES` → `VALID_CATEGORIES` → affected tests → FilterBar redesign) ready to hand off via `/maister:development`.

## Key Assumptions

- The 3 files already dropped into `context/` are the complete source material for this round of taxonomy expansion — no additional sources are expected mid-workflow.
- New categories are not required to stay within the original "Engineering Ladder" framing — they can represent genuinely new knowledge domains (e.g. DDD, microservices patterns) as long as they fit the app's overall Java/Backend engineering scope.
- The existing `content-pipeline/` curation process (prompt template + rubric + validator) remains the mechanism for producing entries in the follow-up implementation pass — this task is not redesigning that pipeline, only feeding it a clear plan.
