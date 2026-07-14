# Codebase Analysis Report

**Date**: 2026-07-13
**Task**: Add new taxonomy categories and terms to the Skill Flip glossary
**Description**: Add new categories beyond the current fixed 12-category "Engineering Ladder" taxonomy, sourced from 3 raw personal notes files (software architecture mind-map, microservices patterns, system-design infrastructure terms).
**Analyzer**: codebase-analyzer skill (2 Explore agents: File Discovery + Code Analysis, Context Discovery)

---

## TL;DR

The `Category` taxonomy is a flat, hand-maintained TypeScript union type with **three unsynced copies** (`src/types/glossary.ts`, `src/components/FilterBar.ts`, `content-pipeline/validate-glossary.ts`) and no automated exhaustiveness check — adding categories is mechanically cheap (rendering, badges, and validation are already data-driven) but structurally fragile (nothing forces the three copies to agree, and one test hard-codes both a count of 12 and a specific ordering). The real cost of this task is not code, it's **content curation**: the three source notes contain roughly 90-110 raw candidate concepts, are heterogeneous in language and format (one is a dense 585-line Polish mind-map, the other two are bare English term lists with no definitions), and overlap both with each other (CQRS, circuit breaker, service discovery, distributed tracing appear in 2+ sources) and with existing thin categories (DevOps: 4 entries, Management: 4, Problem Solving: 4, Mentoring: 2). This is a moderate-complexity, medium-risk enhancement to an existing, well-isolated subsystem.

## Key Decisions

- **Extend the existing flat `Category` union / array pattern rather than introducing a hierarchical taxonomy** — `FilterBar.ts` renders chips generically off `ALL_CATEGORIES`, `Card.ts`'s `categoryBadgeClass()` slugifies any string automatically, and `content-pipeline/validate-glossary.ts` checks membership in an array. None of these require new branching logic for new category values; the mechanism already scales to N categories.
- **The content-pipeline validator, not the shipped app, is the load-bearing technical gate** — `src/` code needs zero category-specific logic changes beyond adding literals to two arrays/unions; the actual risk surface is `data/glossary.json` entries using a category string that doesn't exist in one of the three hand-synced lists.
- **`microservice-patterns.md`'s own bracket tags (`#Application patterns`, `#Application Infrastructure patterns`, `#Infrastructure patterns`) are a candidate ready-made category split** for that source's content — worth surfacing to the design/spec phase rather than re-deriving category names from scratch.

## Open Questions / Risks

- How many new categories, and what are they named? Source 2 (`microservice-patterns.md`) already tags its own entries into 3 groups; source 1 (`dna-mapa.md`) spans DDD, distributed systems, cloud/K8s/IaC, and decision-making/visualization — plausibly 2-4 more groupings on its own; source 3 (`system-design terms.md`) is small enough it may not need a dedicated category at all. This taxonomy design decision belongs to the product-design phases downstream, not to this analysis.
- Overlapping concepts across the 3 raw files (CQRS, circuit breaker, service discovery, distributed tracing) need dedup before curation — curating them as separate entries per source file would create near-duplicate glossary entries.
- `dna-mapa.md` is entirely in Polish; the existing curation workflow is EN-primary-with-PL-translation (`description` written first, `descriptionPl` is a full translation of it, not a copy of source wording). Curating from a Polish source inverts this — curators must synthesize an English term/description from Polish notes, then independently produce `descriptionPl` per the rubric's "not a copy/near-copy of the source" rule, which is easy to violate by accident when the source is already in the target output language.
- `FilterBar`'s "5 visible + overflow, no re-collapse" chip UX (`VISIBLE_CATEGORY_CHIP_COUNT = 5`) was designed for 12 categories (7 in overflow); growing to 16-20 categories pushes 11-15 into the overflow chip with no way to shrink back — a UX question worth flagging to the design phase, not a blocker.
- `BrowseGrid.test.ts` has order-dependent assertions (expects "Software Engineering" as the 12th/last category, "Cloud Engineering" within the first 5 visible) — new categories must be appended at the end of `ALL_CATEGORIES`/`Category`, or these tests need rewriting, not just extending.
- `npm test` does not run `validate-glossary`; only the GitHub Actions deploy workflow (`.github/workflows/deploy.yml:33-34`, gated on push to `main`) catches a category mismatch between `src/types/glossary.ts`, `FilterBar.ts`, and `content-pipeline/validate-glossary.ts`. Local pre-merge feedback relies on remembering to run `npm run validate-glossary` manually.

---

## Summary

Skill Flip's category taxonomy is implemented as a hardcoded, closed 12-value TypeScript string-literal union (`src/types/glossary.ts`), duplicated by hand in two other places (`FilterBar.ts` for chip rendering, `content-pipeline/validate-glossary.ts` for data validation) with no shared source of truth and no compiler-enforced sync. The rendering and badge-coloring code is generic/data-driven, so mechanically adding categories requires touching only 2-3 small array/union literals plus a couple of tests — a small, low-risk code change. The task's actual weight is in the accompanying content: three heterogeneous raw notes files (a 585-line Polish architecture mind-map, an English microservices-pattern list, and a short English infrastructure-terms list) containing roughly 90-110 raw, undefined candidate concepts that must be curated (deduplicated, defined from scratch in both languages, categorized) per the existing `prompt-template.md`/`rubric.md` process before they become `data/glossary.json` entries.

---

## Files Identified

### Primary Files

**`src/types/glossary.ts`** (42 lines)
- Canonical source of truth for the `Category` union type (lines 10-22, currently 12 literals) and the `GlossaryEntry`/`Glossary`/`Level` shapes.
- File's own doc-comment explicitly frames the taxonomy as fixed/closed ("carries the full 12-value taxonomy... must still treat all 12 values as first-class") — this comment itself will need updating as part of the change, since it currently documents the taxonomy as closed.
- No `switch`/exhaustiveness check anywhere in `src/` references `Category`, so extending the union is a pure additive, non-breaking TypeScript change.

**`src/components/FilterBar.ts`** (187 lines)
- `ALL_CATEGORIES: Category[]` (lines 13-26) — second hand-maintained copy of the taxonomy list, drives which chips render, in what order, and where the "5 visible / +N overflow" split (line 31: `VISIBLE_CATEGORY_CHIP_COUNT = 5`) falls.
- `renderChips()` (lines 100-125) and `categoryCounts()` (lines 92-98) are fully data-driven off `ALL_CATEGORIES` — adding a category here is sufficient to make it render as a chip with a live count; no per-category branching exists.
- Chip text is the raw `Category` string (line 110: `` `${category} (${count})` ``) — there is no separate display-label layer to update.

**`content-pipeline/validate-glossary.ts`** (validation logic ~ lines 1-100)
- `VALID_CATEGORIES` (lines 19-33) — third hand-maintained copy, deliberately not imported from `src/types/glossary.ts` (stated in the file's own header comment, lines 4-9) to keep `content-pipeline/` a zero-dependency tool excluded from the Vite bundle.
- Per-entry check at lines 86-91 rejects any `data/glossary.json` entry whose `category` isn't in this array — this is the actual gate that will reject new content if this file isn't updated in lockstep with `src/types/glossary.ts`.

**`data/glossary.json`** (159 entries)
- Flat array of `GlossaryEntry` objects (`id`, `term`, `description`, `translationPl`, `descriptionPl`, `category`, `level`); no schema/shape changes needed to add new categories or entries, only new objects using the new `category` string values.
- Current per-category distribution shows several already-thin categories (DevOps: 4, Management: 4, Problem Solving: 4, Mentoring: 2) alongside large ones (Software Engineering: 32, API Development: 26, Data Storage: 22) — relevant context for whether some new source content should enrich an existing thin category instead of spawning a brand-new one.

**`src/types/glossary.test.ts`** (test file, ~lines 60-82 relevant)
- Hardcodes the full 12-category array a second time as a test fixture and asserts `toHaveLength(12)` / `Set.size === 12` (lines 76-77). This assertion is **not derived from the `Category` type** — it is a plain string array, so it will not fail automatically when `Category` gains new members; it will simply go stale (silently wrong) unless updated as part of this change.

**`src/components/BrowseGrid.test.ts`** (test file, ~lines 143-191 relevant)
- Order- and count-sensitive assertions: expects exactly 10 zero-count categories to render a particular way, expects "Cloud Engineering" among the first 5 visible chips, and expects "Software Engineering" as the 12th/last entry in `ALL_CATEGORIES` (the one that stays collapsed under "+N more"). New categories must be appended strictly after the current last category, or these assertions need rewriting rather than just relaxing a count.

### Related Files

**`src/components/Card.ts`** (category badge rendering, lines 54-56, 97, 200)
- `categoryBadgeClass()` is a generic slugifier (`cat-${slug}`) with no per-category branching — new categories get a CSS class automatically, no code change needed here.
- Imported/used by `src/components/BrowseGrid.ts:1,119` for the same purpose.

**`src/styles/theme.css`** (line 25, 202)
- All category badges share one flat color via `--bg-badge-category: var(--color-steel)`. No per-category color/icon differentiation exists anywhere in the stylesheet, so no CSS changes are required by adding categories — but also no visual distinction between old and new categories will exist unless explicitly designed.

**`content-pipeline/prompt-template.md`** and **`content-pipeline/rubric.md`**
- Both reference "`category` is exactly one of the 12 `Category` values in `src/types/glossary.ts`" as prose pointing back to the canonical type, rather than enumerating the 12 names themselves. No edits needed for a taxonomy rename/add (only if curation guidance itself changes, e.g. new rules for Polish-source curation).

**`.maister/docs/project/roadmap.md`** (lines 8, 11, 14) and **`content-pipeline/source/engineering-ladder.md`** (lines 28-29, 36-39)
- Prose enumerations of "the 12 categories" that will go stale (non-functional, documentation-only) once new categories exist.

**Context source files (read directly for this analysis, not covered by either Explore agent)**:
- **`.maister/tasks/product-design/2026-07-13-add-new-categories-terms/context/dna-mapa.md`** (585 lines, Polish) — dense architecture mind-map: DDD building blocks (aggregates, domain model styles), CQRS/Event Sourcing patterns, Hexagonal/Microkernel/Pipes-and-Filters architecture styles, modularization (coupling/cohesion), distributed systems (fallacies of distributed computing, ESB, microservices vs. monolith vs. modular monolith trade-offs), communication patterns (REST maturity, sync/async, service discovery, load balancing), decision-making (ADR, metrics, drivers), visualization (UML/BPMN/C4), Event Storming/Bounded Contexts/DDD strategic patterns, and infrastructure (cloud models, containers, Kubernetes, Service Mesh, CI/CD, IaC, monitoring/observability, post-mortems). This is outline-only — headers and bullet fragments, not curated definitions — and overlaps substantially with the existing DevOps, Cloud Engineering, and Software Engineering categories as well as opening genuinely new territory (DDD, distributed-systems theory, architecture decision-making).
- **`.maister/tasks/product-design/2026-07-13-add-new-categories-terms/context/microservice-patterns.md`** (68 lines, English) — a microservices.io-style pattern catalog, already bracket-tagged by the source author into 3 groups: `#Application patterns` (decomposition, data consistency, testing, UI composition), `#Application Infrastructure patterns` (observability, cross-cutting concerns, transactional messaging, communication style, reliability, discovery), `#Infrastructure patterns` (service registry, API gateway, deployment strategies). Bare pattern names, no definitions — every entry needs a from-scratch EN+PL definition.
- **`.maister/tasks/product-design/2026-07-13-add-new-categories-terms/context/system-design terms.md`** (27 lines, English) — short list: Kafka, Redis, Elasticsearch/OpenSearch, Zookeeper, CDN, plus an informal communication-strategy decision tree (polling/SSE/WebSocket/WebRTC). Smallest of the 3 sources; content plausibly fits into existing "Data Storage"/"Cloud Engineering" categories or a new lightweight "System Design" category rather than needing its own dedicated taxonomy branch.
- **`.maister/tasks/product-design/2026-07-13-add-new-categories-terms/orchestrator-state.yml`** — confirms this codebase analysis sits inside an active `maister:product-design` workflow (phase-0 context synthesis already completed); `design_context.design_characteristics` already flags `is_enhancement: true`, `is_complex: true`.

---

## Current Functionality

### Key Components/Functions

- **`Category` (type)** — `src/types/glossary.ts:10-22`: closed 12-value string-literal union, the canonical taxonomy definition.
- **`ALL_CATEGORIES` (const array)** — `src/components/FilterBar.ts:13-26`: drives chip rendering order and the visible/overflow split.
- **`renderChips()` / `categoryCounts()`** — `src/components/FilterBar.ts:100-125, 92-98`: generic, data-driven rendering; zero-count categories still render (a deliberate design choice per the doc-comment in `glossary.ts`).
- **`categoryBadgeClass()`** — `src/components/Card.ts:54-56`: generic slug function for CSS class names, no hardcoded per-category map.
- **`VALID_CATEGORIES` (const array)** — `content-pipeline/validate-glossary.ts:19-33`: gate for `data/glossary.json` entries at validation time; hand-mirrored, not imported.

### Data Flow

1. Curator writes raw draft entries (AI-assisted, human-reviewed) per `content-pipeline/prompt-template.md`, checked against `content-pipeline/rubric.md`.
2. Entries appended to `data/glossary.json` with a `category` value that must match `content-pipeline/validate-glossary.ts`'s `VALID_CATEGORIES`.
3. `npm run validate-glossary` (manual, and re-run in CI at `.github/workflows/deploy.yml:33-34` before deploy) checks shape + category membership.
4. At runtime, `FilterBar.ts` reads the full `Glossary` array, tallies counts per `ALL_CATEGORIES` entry, and renders chips; `BrowseGrid.ts`/`Card.ts` render each entry's category as a badge via the generic slugifier.

There is no build-time or type-level connection enforcing that `Category` (the type), `ALL_CATEGORIES` (the array), and `VALID_CATEGORIES` (the pipeline's array) agree — all three are hand-maintained and can silently drift.

---

## Dependencies

### Imports (What This Depends On)

- `FilterBar.ts` imports `Category` from `src/types/glossary.ts` (type-only) but re-declares its own literal array rather than deriving it from the type.
- `content-pipeline/validate-glossary.ts` intentionally does **not** import from `src/types/glossary.ts` (by design, to keep the pipeline decoupled from the Vite-bundled app).
- `Card.ts` / `BrowseGrid.ts` depend on `GlossaryEntry['category']` structurally (via the generic slugifier), not on the literal list of values — no update needed there.

### Consumers (What Depends On This)

- **`src/components/FilterBar.ts`**: chip rendering, order, and 5-visible/overflow split.
- **`content-pipeline/validate-glossary.ts`**: rejects/accepts `data/glossary.json` entries.
- **`src/types/glossary.test.ts`**: hardcoded count/list assertion (lines 60-82), goes stale silently if not updated.
- **`src/components/BrowseGrid.test.ts`**: order-dependent assertions (lines 143-191) about which category is 12th/last and which fall in the first 5 visible chips.
- **Documentation**: `roadmap.md`, `content-pipeline/source/engineering-ladder.md` — non-functional prose enumerations.

**Consumer Count**: 3 code locations requiring literal updates (`glossary.ts`, `FilterBar.ts`, `validate-glossary.ts`) + 2 test files with content/order assumptions + 2 documentation files.
**Impact Scope**: Low-Medium — the consumer set is small, well-known, and entirely internal to this repo (no external API, no other services depend on this taxonomy). The risk is drift between hand-synced copies, not breadth of blast radius.

---

## Test Coverage

### Test Files

- **`src/types/glossary.test.ts`** (lines 60-82): asserts the `Category` taxonomy has exactly 12 values, and lists them by name.
- **`src/components/BrowseGrid.test.ts`** (lines 143-191): asserts chip-overflow behavior tied to the specific 12-category order (10 zero-count categories, "Cloud Engineering" in the visible 5, "Software Engineering" as the last/overflow-collapsing one).
- **`content-pipeline/validate-glossary.test.ts`** (lines 38-46): asserts an invalid category string is rejected; no count/order assumption, unaffected by additions.
- Other test files (`AppShell.test.ts`, `LearnMode.test.ts`, `filters.test.ts`, `storage.test.ts`, `Card.test.ts`, `learnAlgorithm.test.ts`) reference category names only as incidental fixture data, not as taxonomy-exhaustiveness checks.

### Coverage Assessment

- **Test count**: 44 unit/component tests total (per roadmap.md); a handful directly touch the category taxonomy's shape/order.
- **Gaps**: No test enforces that `Category` (type), `ALL_CATEGORIES` (array), and `VALID_CATEGORIES` (pipeline array) stay in sync — this is an acknowledged, undetected coupling risk (called out in `validate-glossary.ts`'s own header comment). No E2E coverage exists at all (documented technical debt in `roadmap.md`).
- **Stale-not-broken risk**: the `toHaveLength(12)` assertion in `glossary.test.ts` will not fail from adding categories to the `Category` type alone (it's a hand-typed array, not derived from the type) — it must be proactively updated, not just fixed reactively when it breaks.

---

## Coding Patterns

### Naming Conventions

- **Categories**: Title Case, sometimes with `/` for compound domains (e.g. `Spring/JEE`) — no separate display-label layer, the raw string is both the code identifier and the UI text.
- **Files**: PascalCase for components (`FilterBar.ts`, `BrowseGrid.ts`), camelCase for lib/logic (`filters.ts`, `learnAlgorithm.ts`).
- **Glossary entry IDs**: `<category-slug>-<term-slug>`, lowercase-kebab-case, stable (never renamed once assigned), per `prompt-template.md`.

### Architecture Patterns

- **Style**: Component-factory pattern, no framework; DOM-owning components in `src/components/`, pure logic in `src/lib/`.
- **State Management**: Local component state + `localStorage` persistence (Learn Mode progress); no global store.
- **Data-driven rendering**: `FilterBar`'s chip rendering is a genuine array-driven loop, not a hardcoded per-value switch — this is the key property that makes this task mechanically cheap on the UI side.
- **Hand-mirrored types over shared imports**: `content-pipeline/` deliberately duplicates types/constants from `src/` rather than importing them, to preserve a zero-dependency build boundary — an intentional, documented trade-off, not an oversight, but one that requires discipline to keep in sync.

---

## Complexity Assessment

| Factor | Value | Level |
|--------|-------|-------|
| File count (code changes) | ~3 core files (`glossary.ts`, `FilterBar.ts`, `validate-glossary.ts`) + 2 tests + `data/glossary.json` | Medium |
| Dependencies (hand-synced copies) | 3 unsynced copies of the taxonomy list, 0 shared import | Medium (drift risk, not import volume) |
| Consumers | 2 order/count-sensitive test files + CI validate step | Medium |
| Test coverage | Existing but fragile (stale-not-broken pattern, order-dependent) | Medium |
| Content curation scope | ~90-110 raw candidate concepts across 3 heterogeneous sources, one in Polish, none pre-defined | High |

### Overall: Moderate

The taxonomy-mechanism change itself (type union + 2 array literals + test updates) is small and low-risk — the rendering/badge/validation code was already built generically enough to absorb new categories without new branching logic. What pushes this to "Moderate" rather than "Simple" is (1) the three-way hand-sync risk with no compiler enforcement, (2) order-dependent tests that will break unless new categories are appended at the very end, and (3) a content curation workload that is substantially larger and more heterogeneous than a typical "add a few entries" task — three source files of different languages/formats/densities, overlapping concepts needing dedup, and an inverted (Polish-source-to-English-canonical) translation direction for one of them.

---

## Key Findings

### Strengths
- Chip rendering, count computation, and badge CSS classing are already fully data-driven — no per-category branching exists anywhere in `src/`, so the UI absorbs new categories with zero new logic.
- `data/glossary.json`'s schema needs no changes; new categories are just new string values on an existing field.
- The content-pipeline curation process (`prompt-template.md` + `rubric.md`) already exists, is documented, and references `src/types/glossary.ts` as the single canonical taxonomy source rather than hardcoding category names itself — so curation guidance needs no edits for a taxonomy change.

### Concerns
- Three hand-maintained, unsynced copies of the category list (`glossary.ts`, `FilterBar.ts`, `validate-glossary.ts`) with no shared import and no automated drift detection; `content-pipeline/validate-glossary.ts`'s own header comment acknowledges this as a manual-sync risk.
- `src/types/glossary.test.ts`'s 12-count assertion is a hand-typed fixture, not derived from the `Category` type — it will go silently stale rather than fail loudly when categories are added, unless proactively updated.
- `BrowseGrid.test.ts` bakes in the exact position of "Software Engineering" as the last category and "Cloud Engineering" as within the first 5 visible — these tests are coupled to insertion order, not just count.
- `npm test` does not include `validate-glossary`; the only automated check that would catch a `data/glossary.json` entry using an undefined category is the GitHub Actions deploy workflow, which only runs on push to `main` — no local pre-commit or PR-time signal.
- The 3 raw source files overlap each other on several concepts (CQRS, circuit breaker, service discovery, distributed tracing) and partially overlap existing thin categories (DevOps: 4 entries, Data Storage: 22 entries already covers some infra/DB ground) — curation will require deliberate dedup and category-boundary decisions that this analysis surfaces but does not resolve.
- `dna-mapa.md` is entirely in Polish, inverting the existing EN-primary curation direction and creating a real risk of `descriptionPl` becoming a too-close paraphrase of source notes (the rubric's explicit "not a copy/near-copy" test is easier to fail when source and target language match).

### Opportunities
- `microservice-patterns.md`'s own `#Application patterns` / `#Application Infrastructure patterns` / `#Infrastructure patterns` tags are a ready-made, author-intended category split for that source's ~35 pattern names — worth carrying into the design phase rather than re-deriving groupings from scratch.
- Several existing categories are thin (Mentoring: 2, DevOps: 4, Management: 4, Problem Solving: 4) — the design phase should explicitly decide whether any new-source content (e.g. CI/CD, IaC, monitoring from `dna-mapa.md`) enriches an existing thin category like DevOps rather than spawning an overlapping new one.
- This would be a natural point to collapse the three hand-synced category lists into one shared source (e.g. have `FilterBar.ts` derive `ALL_CATEGORIES` from a single exported const, and have `content-pipeline` import — or codegen-check against — the same list) to close the drift risk permanently, though that is a refactor beyond this task's literal scope and should be raised as a separate suggestion rather than bundled silently into a content-addition task.

---

## Impact Assessment

- **Primary changes**: `src/types/glossary.ts` (Category union), `src/components/FilterBar.ts` (ALL_CATEGORIES array), `content-pipeline/validate-glossary.ts` (VALID_CATEGORIES array), `data/glossary.json` (new entries).
- **Related changes**: `src/types/glossary.test.ts` (count/list assertion), `src/components/BrowseGrid.test.ts` (order-dependent chip assertions), `.maister/docs/project/roadmap.md` and `content-pipeline/source/engineering-ladder.md` (stale prose, non-functional).
- **Test updates**: Required (not optional) for `glossary.test.ts` and likely `BrowseGrid.test.ts`; both currently encode the "exactly 12, in this order" assumption directly rather than deriving it from the source-of-truth type.

### Risk Level: Medium

Code-mechanism risk is low (generic, data-driven, additive change with no exhaustiveness checks to break). Process risk is medium: three unsynced taxonomy copies, order-sensitive tests, and a CI gate (`validate-glossary`) that only runs at deploy time rather than at test/PR time. Content risk is medium-to-high given the volume (~90-110 raw candidates), heterogeneity (2 languages, 3 formats), and cross-source overlap requiring dedup judgment calls that are inherently subjective and belong to the design/curation phase, not to this code analysis.

---

## Recommendations

This is an **enhancement to existing, well-isolated infrastructure** (modifying-existing-code scenario), not a defect fix or greenfield build.

**Implementation strategy**:
1. Decide new category names/groupings first (design decision, downstream of this report) — candidates include reusing `microservice-patterns.md`'s own 3-way tag split, folding `system-design terms.md` into an existing or single new lightweight category, and deciding how much of `dna-mapa.md`'s DDD/distributed-systems/architecture-decision content becomes new categories vs. enrichment of existing thin ones (DevOps, Data Storage).
2. Update the taxonomy in dependency order: `src/types/glossary.ts` (canonical) → `src/components/FilterBar.ts` (`ALL_CATEGORIES`, appended at the end to avoid reordering existing chips/tests) → `content-pipeline/validate-glossary.ts` (`VALID_CATEGORIES`).
3. Update `src/types/glossary.test.ts`'s hardcoded list/count and re-check `src/components/BrowseGrid.test.ts`'s order-dependent assertions before adding data.
4. Curate content from the 3 source files per the existing `prompt-template.md`/`rubric.md` process: dedup overlapping concepts across sources first, then draft EN term/description, then PL translation (paying particular attention to `dna-mapa.md`'s already-Polish source not leaking verbatim into `descriptionPl`).
5. Run `npm run validate-glossary` locally before relying on CI to catch category/data mismatches, since it is not part of `npm test`.

**Backward compatibility**: No compatibility concerns — this is a purely additive change to a closed-world static dataset with no external consumers or versioned API.

**Testing requirements**: Update the two test files identified above as part of the same change (not a follow-up), since they will not fail automatically and will otherwise silently misrepresent the taxonomy's actual state.

---

## Next Steps

This report characterizes the current-state taxonomy mechanism and content-source scope. Since this task is running inside an active `maister:product-design` workflow (context synthesis / phase-0 already complete per `orchestrator-state.yml`), the natural next step is to feed these findings into the workflow's subsequent design phases (problem exploration / idea generation / specification) so that category naming, grouping, and scope-per-source decisions are made deliberately rather than incidentally during implementation. If this analysis is instead being consumed by a `gap-analyzer` step, the key gap to resolve is: **no current-vs-desired taxonomy exists yet** — this report establishes the current state and source material inventory; the next step must produce the desired category list and a per-source curation plan before any code or data changes begin.
