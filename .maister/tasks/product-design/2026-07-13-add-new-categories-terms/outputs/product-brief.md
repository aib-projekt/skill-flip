# Product Brief: New Taxonomy Categories, FilterBar Redesign & Curation Plan

## TL;DR
Expands Skill Flip's glossary taxonomy from 12 to 14 categories — adding "Software Architecture" and "Microservices & Distributed Systems" — to cover architecture/microservices/system-design notes the user has accumulated for senior/staff interview prep. Deliverable is the taxonomy structure, a source-to-category curation plan for 3 raw context files, and a FilterBar chip UX redesign (symmetric expand/collapse, visible count raised to 7). Full entry curation (~90-110 concepts) is explicitly a follow-up implementation pass, not part of this design output.

## Key Decisions
- 2 new categories (not 6 or 11 alternatives considered) — prioritizes FilterBar simplicity and lower ongoing hand-sync risk over maximum drill precision.
- Overlapping concepts across the 3 sources become separate, cross-referenced entries (plain-text "See also" notes) rather than merged single-source-of-truth entries.
- FilterBar gets a symmetric "show less" collapse plus a visible-chip-count bump (5→7) — the minimum fix for the already-identified "no way to shrink back" problem.
- Curation is sequenced batch-by-source-file (English sources first, the 585-line Polish `dna-mapa.md` last), with a permanent Polish-source curation discipline added to `content-pipeline/rubric.md`.

## Open Questions / Risks
- Cross-references written during earlier batches may point at not-yet-curated `dna-mapa.md` entries — mitigated by a one-time audit pass after all 3 batches complete, not yet validated against real content.
- "Microservices & Distributed Systems" will likely be the single largest category in the app (~35-45 illustrative entries) — an accepted trade-off of the minimal-taxonomy choice, not a defect.
- All entry-count estimates throughout this brief are illustrative, not commitments — actual counts depend on the follow-up curation pass.

---

## Layer 0: Core Brief

### Problem Statement
Skill Flip's glossary taxonomy is a closed, 12-category list sourced from the "Engineering Ladder" skills framework (159 entries). The user has accumulated personal study notes on software architecture, microservices patterns, and system-design infrastructure — 3 raw files with no curated definitions — that fall outside this original taxonomy and are needed for senior/staff-level interview preparation. This task resolves both a taxonomy-design problem (what new categories, and what enriches existing ones) and a UX problem (the FilterBar's chip UI was built for 12 categories and needs to stay usable at 14).

Full detail: [`analysis/problem-statement.md`](../analysis/problem-statement.md)

### Target Users
- **Interview-Prep Curator** (primary) — the app's owner/author, preparing for senior/staff engineering interviews. Needs new categories drillable in isolation — already solved by Learn Mode's existing filter-scoping (shipped commit `7dbb9af`), no new feature needed there.
- **Portfolio Visitor** (secondary) — a recruiter or senior engineer skimming the deployed demo. Cares that category names read as industry-recognizable and that the filter bar stays scannable.

Full detail: [`analysis/personas.md`](../analysis/personas.md)

### Feature Overview
1. **Taxonomy expansion**: 2 new categories — "Software Architecture" (DDD, architecture styles, decision-making, modeling) and "Microservices & Distributed Systems" (all microservices.io-style patterns + distributed-systems theory + communication patterns) — appended to the existing 12, with a full source-to-category mapping for all 3 context files and existing-category enrichment (Data Storage, Cloud Engineering, DevOps, Testing) where content fits better there.
2. **Dedup policy**: known cross-source overlaps (CQRS, circuit breaker, service discovery, distributed tracing, Event Sourcing, service mesh/sidecar) become separate entries with plain-text cross-reference notes, not merged.
3. **FilterBar redesign**: `VISIBLE_CATEGORY_CHIP_COUNT` raised from 5 to 7; the existing one-way "+N more" overflow becomes a genuine bidirectional expand/collapse.
4. **Curation plan**: a 3-batch sequence (microservice-patterns.md → system-design terms.md → dna-mapa.md) using the existing `content-pipeline/` process, plus a permanent Polish-source curation discipline addition to `rubric.md`.

Full detail: [`analysis/feature-spec.md`](../analysis/feature-spec.md) ([HTML](../analysis/feature-spec.html))

### Constraints
- Taxonomy mechanism stays flat — no hierarchy, same `Category` union/array pattern.
- New categories append at the end only, never inserted mid-list (breaks order-dependent tests otherwise).
- Existing-category enrichment takes priority over new-category proliferation.
- This design task's scope is the plan, not full entry curation.
- Bilingual curation discipline: English `description` drafted first, Polish `descriptionPl` translated independently.
- No fixed category-count ceiling, but the FilterBar redesign must stay usable at whatever count results.

### Success Criteria
- Approved 14-category taxonomy with full source-to-category mapping.
- Complete dedup/cross-reference resolution for all known overlaps.
- Written, sequenced curation plan referencing the existing curation process.
- Prototyped, approved FilterBar redesign.
- Dependency-ordered code change list ready for `/maister:development`.

### Acceptance Criteria
See `analysis/feature-spec.md` Section 6 for the full breakdown; summarized:
- [ ] `Category` type includes exactly 14 values in the specified order.
- [ ] All 3 taxonomy copies (`glossary.ts`, `FilterBar.ts`, `validate-glossary.ts`) stay in sync.
- [ ] `npm run validate-glossary` and `npm test` pass after implementation.
- [ ] FilterBar's collapse/expand behaves symmetrically at the new 7-visible/14-total count.
- [ ] Curation batches ship in order with the cross-reference audit as the final step.

---

## Layer 1: Persona Cards

**Interview-Prep Curator** (primary) — app owner/curator, preparing for senior/staff interviews. Goals: consolidate scattered notes into the existing spaced-review system; drill new categories in isolation (already possible via Learn Mode's filter-scoping). Pain points: raw/overlapping/partly-Polish source notes; FilterBar already near visual capacity.

**Portfolio Visitor** (secondary) — recruiter/senior engineer skimming the live demo. Goals: quickly gauge breadth/seniority of knowledge via a polished, uncluttered app. Pain points: won't invest time in a confusing filter UI; doesn't read Polish.

Full detail: [`analysis/personas.md`](../analysis/personas.md)

---

## Layer 2: Design Decisions

| Area | Decision | Rejected Alternatives |
|---|---|---|
| Taxonomy structure | 2 new categories (14 total) | 6 new (source-derived, brainstormer's recommendation), 10-11 new (maximal) |
| Cross-source dedup | Keep separate with cross-references | First-source-wins, merge-into-richest (recommended) |
| FilterBar UX | Symmetric collapse + raise count to 7 | Theme clusters, pinned+dropdown, search-within-filter |
| Curation sequencing | Batch by source file, Polish last | Category-at-a-time, all-decisions-first (hybrid recommended) |

Full detail and trade-off analysis: [`analysis/design-decisions.md`](../analysis/design-decisions.md) ([HTML](../analysis/design-decisions.html)) — alternatives considered: [`analysis/alternatives.md`](../analysis/alternatives.md) ([HTML](../analysis/alternatives.html))

---

## Layer 3: Mockup References

**Browse — FilterBar at 14 Categories**: interactive mockup built with Skill Flip's actual theme tokens (navy topbar, ice/steel chips, JetBrains Mono stats). Demonstrates the symmetric collapse behavior (7 visible ↔ all 14, relabeling "+7 more"/"Show less") and the 2 new category badges rendering via the existing generic slugifier with zero new code. Verified programmatically (click-and-check DOM test) and approved after live browser review.

[`analysis/mockups/browse-filterbar-at-14-categories.html`](../analysis/mockups/browse-filterbar-at-14-categories.html)

---

## References

- [`analysis/design-context.md`](../analysis/design-context.md) — unified synthesis of project docs, codebase analysis, and the 3 source files
- [`analysis/codebase-analysis.md`](../analysis/codebase-analysis.md) — current-state taxonomy mechanism analysis
- [`analysis/problem-statement.md`](../analysis/problem-statement.md) — full problem exploration
- [`analysis/personas.md`](../analysis/personas.md) — persona cards and journeys
- [`analysis/alternatives.md`](../analysis/alternatives.md) ([HTML](../analysis/alternatives.html)) — full alternatives with trade-off analysis
- [`analysis/design-decisions.md`](../analysis/design-decisions.md) ([HTML](../analysis/design-decisions.html)) — selected direction and rationale
- [`analysis/feature-spec.md`](../analysis/feature-spec.md) ([HTML](../analysis/feature-spec.html)) — full 6-section implementation-ready specification
- [`analysis/mockups/browse-filterbar-at-14-categories.html`](../analysis/mockups/browse-filterbar-at-14-categories.html) — approved FilterBar mockup
- Source context files: `context/dna-mapa.md`, `context/microservice-patterns.md`, `context/system-design terms.md`
